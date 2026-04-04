/**
 * Umar TTS — Voice Studio
 * 
 * Download strategy:
 * The Web Speech API (SpeechSynthesis) sends audio directly to the system
 * output and gives no access to raw audio data. To capture it:
 * 
 * 1. Create an AudioContext with a MediaStreamDestination node
 * 2. Wrap the default audio output with loopback via getUserMedia({audio: true})
 *    (only works in some browsers / needs system loopback — unreliable)
 * 
 * More reliable cross-browser approach used here:
 * - Use window.speechSynthesis for playback
 * - Simultaneously run a SpeechSynthesisUtterance with Web Audio API's
 *   createMediaStreamSource from a virtual loopback.
 * 
 * Fallback (most reliable, broadest support):
 * - Render text to SpeechSynthesis normally for playback
 * - When "Record & Speak" is clicked, capture the DEFAULT OUTPUT via
 *   AudioContext.createMediaStreamDestination + MediaRecorder on a
 *   silent oscillator, then grab system audio via getDisplayMedia() audio
 *   capture OR — most pragmatically — capture via getUserMedia with
 *   echoCancellation:false, noiseSuppression:false (loopback on desktop).
 * 
 * Simplest reliable approach (what we use):
 * - Play TTS normally
 * - Capture system mic/loopback for the duration of speech using MediaRecorder
 * - This works when user's system has loopback (e.g. on desktop, virtual cable)
 * 
 * Most reliable silent approach (no mic needed):
 * - Use getDisplayMedia({ audio: true, video: true }) to capture system audio
 * 
 * We implement the getDisplayMedia approach with a graceful fallback to mic.
 */

class TTSApp {
    constructor() {
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        this.mediaRecorder = null;
        this.recordedChunks = [];
        this.isRecording = false;
        this.audioBlob = null;
        this.animFrameId = null;
        this.vizCtx = null;
        this.analyser = null;
        this.audioCtx = null;
        this.currentUtterance = null;

        this.els = {};
        this.init();
    }

    init() {
        this.queryEls();
        this.setupViz();
        this.bindEvents();
        this.loadVoices();
    }

    queryEls() {
        const ids = [
            'textInput','voiceSelect','rateRange','pitchRange','volumeRange',
            'charCount','rateValue','pitchValue','volumeValue',
            'playBtn','pauseBtn','stopBtn','quickTestBtn',
            'recordBtn','downloadBtn','clearBtn',
            'statusPill','statusDot','statusText',
            'vizWrap','vizCanvas'
        ];
        ids.forEach(id => {
            this.els[id] = document.getElementById(id);
        });
    }

    setupViz() {
        const canvas = this.els.vizCanvas;
        this.vizCtx = canvas.getContext('2d');
        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio;
            canvas.height = canvas.offsetHeight * window.devicePixelRatio;
            this.vizCtx.scale(window.devicePixelRatio, window.devicePixelRatio);
        };
        resize();
        window.addEventListener('resize', resize);
    }

    bindEvents() {
        this.els.textInput.addEventListener('input', () => this.onTextChange());
        this.els.rateRange.addEventListener('input', () => {
            this.els.rateValue.textContent = parseFloat(this.els.rateRange.value).toFixed(1) + '×';
        });
        this.els.pitchRange.addEventListener('input', () => {
            this.els.pitchValue.textContent = parseFloat(this.els.pitchRange.value).toFixed(1);
        });
        this.els.volumeRange.addEventListener('input', () => {
            this.els.volumeValue.textContent = Math.round(parseFloat(this.els.volumeRange.value) * 100) + '%';
        });

        this.els.playBtn.addEventListener('click', () => this.speak());
        this.els.pauseBtn.addEventListener('click', () => this.togglePause());
        this.els.stopBtn.addEventListener('click', () => this.stop());
        this.els.quickTestBtn.addEventListener('click', () => this.quickTest());
        this.els.recordBtn.addEventListener('click', () => this.recordAndSpeak());
        this.els.downloadBtn.addEventListener('click', () => this.download());
        this.els.clearBtn.addEventListener('click', () => this.clearText());

        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        document.addEventListener('click', () => this.loadVoices(), { once: true });

        document.addEventListener('keydown', e => this.handleKeyboard(e));
    }

    loadVoices() {
        const v = speechSynthesis.getVoices();
        if (v.length === 0) {
            setTimeout(() => this.loadVoices(), 200);
            return;
        }
        this.voices = v;
        this.populateVoices();
        this.updateUI();
    }

    populateVoices() {
        const sel = this.els.voiceSelect;
        const prev = sel.value;
        sel.innerHTML = '';

        // Group by language
        const groups = {};
        this.voices.forEach(v => {
            const lang = v.lang.split('-')[0].toUpperCase();
            if (!groups[lang]) groups[lang] = [];
            groups[lang].push(v);
        });

        Object.keys(groups).sort().forEach(lang => {
            const og = document.createElement('optgroup');
            og.label = lang;
            groups[lang].forEach(v => {
                const o = document.createElement('option');
                o.value = v.name;
                o.textContent = v.name;
                if (v.default) o.selected = true;
                og.appendChild(o);
            });
            sel.appendChild(og);
        });

        if (prev && [...sel.options].some(o => o.value === prev)) {
            sel.value = prev;
        }

        this.els.recordBtn.disabled = !this.els.textInput.value.trim();
    }

    getUtterance(text) {
        const utt = new SpeechSynthesisUtterance(text);
        const v = this.voices.find(v => v.name === this.els.voiceSelect.value);
        if (v) utt.voice = v;
        utt.rate   = parseFloat(this.els.rateRange.value);
        utt.pitch  = parseFloat(this.els.pitchRange.value);
        utt.volume = parseFloat(this.els.volumeRange.value);
        return utt;
    }

    speak() {
        if (speechSynthesis.speaking) {
            this.stop();
            return;
        }
        const text = this.els.textInput.value.trim();
        if (!text) return;

        const utt = this.getUtterance(text);
        this.currentUtterance = utt;

        utt.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.setStatus('speaking', 'Speaking…');
            this.startIdleViz();
            this.updateUI();
        };
        utt.onpause = () => {
            this.isPaused = true;
            this.setStatus('', 'Paused');
            this.stopViz();
            this.updateUI();
        };
        utt.onresume = () => {
            this.isPaused = false;
            this.setStatus('speaking', 'Speaking…');
            this.startIdleViz();
            this.updateUI();
        };
        utt.onend = () => this.onSpeechEnd();
        utt.onerror = () => this.onSpeechEnd();

        speechSynthesis.speak(utt);
    }

    onSpeechEnd() {
        this.isPlaying = false;
        this.isPaused = false;
        this.setStatus('', 'Ready');
        this.stopViz();
        this.updateUI();

        if (this.isRecording) {
            this.stopRecording();
        }
    }

    togglePause() {
        if (this.isPaused) {
            speechSynthesis.resume();
        } else {
            speechSynthesis.pause();
        }
    }

    stop() {
        speechSynthesis.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.setStatus('', 'Stopped');
        this.stopViz();
        if (this.isRecording) this.stopRecording();
        this.updateUI();
        setTimeout(() => {
            if (!this.isPlaying) this.setStatus('', 'Ready');
        }, 1200);
    }

    quickTest() {
        if (speechSynthesis.speaking) return;
        const orig = this.els.textInput.value;
        const test = 'Hello! This is Umar TTS — a voice test. Everything sounds great.';
        this.els.textInput.value = test;
        this.onTextChange();
        this.speak();
        if (this.currentUtterance) {
            this.currentUtterance.onend = () => {
                this.isPlaying = false;
                this.isPaused = false;
                this.setStatus('', 'Ready');
                this.stopViz();
                this.updateUI();
                setTimeout(() => {
                    this.els.textInput.value = orig;
                    this.onTextChange();
                }, 400);
            };
        }
    }

    clearText() {
        this.els.textInput.value = '';
        this.onTextChange();
        this.els.textInput.focus();
    }

    /* ── Recording / Download ───────────────────── */

    async recordAndSpeak() {
        if (this.isRecording) return;
        if (speechSynthesis.speaking) this.stop();

        const text = this.els.textInput.value.trim();
        if (!text) return;

        // Attempt to capture system audio via getDisplayMedia
        // This asks the user to share their screen + audio, which gives us
        // the system audio stream — the most reliable cross-browser method.
        let stream = null;
        try {
            stream = await navigator.mediaDevices.getDisplayMedia({
                video: { width: 1, height: 1, frameRate: 1 },
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    sampleRate: 44100
                }
            });
            // Stop the video track immediately — we only need audio
            stream.getVideoTracks().forEach(t => t.stop());

            const audioTracks = stream.getAudioTracks();
            if (audioTracks.length === 0) {
                throw new Error('No audio track in stream — user may not have enabled audio sharing');
            }
        } catch (err) {
            // Fallback: try microphone (works if user has loopback / virtual cable)
            console.warn('getDisplayMedia failed or rejected, trying mic loopback:', err.message);
            try {
                stream = await navigator.mediaDevices.getUserMedia({
                    audio: {
                        echoCancellation: false,
                        noiseSuppression: false,
                        autoGainControl: false,
                        sampleRate: 44100
                    }
                });
            } catch (micErr) {
                this.setStatus('error', 'Mic access denied');
                this.showToast('❌ Could not capture audio. Allow mic access or use screen share with audio.');
                return;
            }
        }

        this.recordedChunks = [];
        this.audioBlob = null;
        this.els.downloadBtn.disabled = true;

        // Pick best supported format
        const mimeType = this.getBestMime();
        const options = mimeType ? { mimeType } : {};

        this.mediaRecorder = new MediaRecorder(stream, options);
        this.mediaRecorder.ondataavailable = e => {
            if (e.data.size > 0) this.recordedChunks.push(e.data);
        };
        this.mediaRecorder.onstop = () => {
            stream.getTracks().forEach(t => t.stop());
            this.audioBlob = new Blob(this.recordedChunks, { type: mimeType || 'audio/webm' });
            this.els.downloadBtn.disabled = false;
            this.isRecording = false;
            this.els.recordBtn.classList.remove('active');
            this.setStatus('', 'Ready — click Download');
            this.showToast('✅ Recording saved — click Download');
            this.updateUI();
        };

        this.mediaRecorder.start(100);
        this.isRecording = true;
        this.els.recordBtn.classList.add('active');
        this.setStatus('recording', 'Recording…');
        this.updateUI();

        // Start speech — onSpeechEnd will call stopRecording
        const utt = this.getUtterance(text);
        this.currentUtterance = utt;
        utt.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.startIdleViz();
            this.updateUI();
        };
        utt.onend = () => this.onSpeechEnd();
        utt.onerror = () => this.onSpeechEnd();
        speechSynthesis.speak(utt);
    }

    stopRecording() {
        if (this.mediaRecorder && this.mediaRecorder.state !== 'inactive') {
            setTimeout(() => {
                this.mediaRecorder.stop();
            }, 300); // slight delay to capture tail
        } else {
            this.isRecording = false;
        }
    }

    getBestMime() {
        const types = [
            'audio/webm;codecs=opus',
            'audio/webm',
            'audio/ogg;codecs=opus',
            'audio/ogg',
            'audio/mp4',
        ];
        return types.find(t => MediaRecorder.isTypeSupported(t)) || '';
    }

    download() {
        if (!this.audioBlob) return;
        const ext = this.audioBlob.type.includes('ogg') ? 'ogg'
                  : this.audioBlob.type.includes('mp4') ? 'mp4'
                  : 'webm';
        const url = URL.createObjectURL(this.audioBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `umar-tts-${Date.now()}.${ext}`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    }

    /* ── Visualizer ─────────────────────────────── */

    startIdleViz() {
        this.els.vizWrap.classList.add('active');
        cancelAnimationFrame(this.animFrameId);
        this.drawIdleWave();
    }

    drawIdleWave() {
        const canvas = this.els.vizCanvas;
        const ctx = this.vizCtx;
        const W = canvas.offsetWidth;
        const H = canvas.offsetHeight;
        let t = 0;

        const draw = () => {
            ctx.clearRect(0, 0, W, H);

            // Background
            ctx.fillStyle = getComputedStyle(document.documentElement)
                .getPropertyValue('--surface').trim() || '#161616';
            ctx.fillRect(0, 0, W, H);

            const accentColor = '#f0a500';
            const bars = 48;
            const barW = W / bars;

            for (let i = 0; i < bars; i++) {
                const phase = (i / bars) * Math.PI * 2;
                const wave1 = Math.sin(t * 2.1 + phase) * 0.5 + 0.5;
                const wave2 = Math.sin(t * 1.3 + phase * 1.7) * 0.3 + 0.3;
                const h = (wave1 * wave2 + 0.1) * H * 0.75;

                const alpha = 0.4 + wave1 * 0.6;
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = alpha * (this.isPaused ? 0.3 : 1);
                ctx.fillRect(
                    i * barW + barW * 0.15,
                    (H - h) / 2,
                    barW * 0.7,
                    h
                );
            }
            ctx.globalAlpha = 1;
            t += 0.03;
            this.animFrameId = requestAnimationFrame(draw);
        };

        draw();
    }

    stopViz() {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
        this.els.vizWrap.classList.remove('active');
        const ctx = this.vizCtx;
        const canvas = this.els.vizCanvas;
        ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight);
    }

    /* ── UI helpers ─────────────────────────────── */

    onTextChange() {
        const len = this.els.textInput.value.length;
        this.els.charCount.textContent = len;
        const cc = this.els.charCount.parentElement;
        cc.className = 'char-counter' + (len > 4500 ? ' danger' : len > 4000 ? ' warn' : '');
        this.updateUI();
    }

    setStatus(cls, text) {
        const pill = this.els.statusPill;
        pill.className = 'status-pill' + (cls ? ' ' + cls : '');
        this.els.statusText.textContent = text;
    }

    updateUI() {
        const hasText = this.els.textInput.value.trim().length > 0;
        const isSpeaking = speechSynthesis.speaking;
        const voicesReady = this.voices.length > 0;

        this.els.playBtn.disabled = !hasText || !voicesReady;
        this.els.pauseBtn.disabled = !this.isPlaying;
        this.els.stopBtn.disabled = !this.isPlaying;
        this.els.recordBtn.disabled = !hasText || !voicesReady || this.isRecording || this.isPlaying;
        this.els.quickTestBtn.disabled = this.isPlaying;

        // Pause label
        this.els.pauseBtn.querySelector('span').textContent = this.isPaused ? 'Resume' : 'Pause';

        // Play button state
        if (this.isPlaying && !this.isPaused) {
            this.els.playBtn.classList.add('speaking');
        } else {
            this.els.playBtn.classList.remove('speaking');
        }
    }

    showToast(msg) {
        // Simple status flash instead of a toast library
        const prev = this.els.statusText.textContent;
        this.els.statusText.textContent = msg;
        setTimeout(() => {
            if (!this.isPlaying && !this.isRecording) {
                this.els.statusText.textContent = prev || 'Ready';
            }
        }, 3500);
    }

    handleKeyboard(e) {
        if (e.target === this.els.textInput) return;
        if (e.code === 'Space') {
            e.preventDefault();
            if (this.isPlaying) this.togglePause();
            else if (this.els.textInput.value.trim()) this.speak();
        }
        if (e.code === 'Escape') this.stop();
        if (e.ctrlKey && e.code === 'Enter') {
            e.preventDefault();
            if (this.els.textInput.value.trim()) this.speak();
        }
    }
}

// ── Boot ─────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    if (!('speechSynthesis' in window)) {
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:monospace;color:#f0a500;text-align:center;padding:2rem;">
                <div>
                    <p style="font-size:2rem;margin-bottom:1rem;">⚠</p>
                    <p>Your browser does not support the Web Speech API.</p>
                    <p style="opacity:0.6;margin-top:0.5rem;">Try Chrome, Edge, or Safari.</p>
                </div>
            </div>`;
        return;
    }
    new TTSApp();
});

window.addEventListener('beforeunload', () => {
    speechSynthesis?.cancel();
});

document.addEventListener('visibilitychange', () => {
    if (document.hidden && speechSynthesis.speaking) {
        speechSynthesis.pause();
    } else if (!document.hidden && speechSynthesis.paused) {
        speechSynthesis.resume();
    }
});
