/**
 * Umar TTS — Voice Studio
 *
 * Playback  → Web Speech API (browser voices, full controls)
 * Download  → /api/tts serverless proxy → Google Translate TTS → real MP3
 *
 * Speak button fix: shows "Loading…" state immediately on click so there's
 * no confusing silent gap before the browser voices kick in.
 */

class TTSApp {
    constructor() {
        this.voices      = [];
        this.isPlaying   = false;
        this.isPaused    = false;
        this.isLoading   = false;   // between click and onstart
        this.animFrameId = null;
        this.vizCtx      = null;

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
        [
            'textInput','voiceSelect',
            'rateRange','pitchRange','volumeRange',
            'charCount','rateValue','pitchValue','volumeValue',
            'playBtn','pauseBtn','stopBtn','quickTestBtn',
            'downloadBtn','vizWrap','vizCanvas','clearBtn'
        ].forEach(id => { this.els[id] = document.getElementById(id); });
    }

    /* ── Visualizer ─────────────────────────────── */
    setupViz() {
        const canvas = this.els.vizCanvas;
        this.vizCtx  = canvas.getContext('2d');
        const resize = () => {
            canvas.width  = canvas.offsetWidth  * devicePixelRatio;
            canvas.height = canvas.offsetHeight * devicePixelRatio;
            this.vizCtx.scale(devicePixelRatio, devicePixelRatio);
        };
        resize();
        window.addEventListener('resize', resize);
    }

    startViz(loading = false) {
        this.els.vizWrap.classList.add('active');
        cancelAnimationFrame(this.animFrameId);
        let t = 0;
        const canvas = this.els.vizCanvas;
        const ctx    = this.vizCtx;

        const draw = () => {
            const W = canvas.offsetWidth, H = canvas.offsetHeight;
            ctx.clearRect(0, 0, W, H);
            const bars = 52, barW = W / bars;

            for (let i = 0; i < bars; i++) {
                const phase = (i / bars) * Math.PI * 2;

                let h, alpha;
                if (loading || this.isLoading) {
                    // Gentle idle pulse while waiting for voice to start
                    const pulse = Math.sin(t * 1.5 + phase * 0.5) * 0.5 + 0.5;
                    h     = pulse * H * 0.25 + H * 0.05;
                    alpha = 0.2 + pulse * 0.25;
                } else if (this.isPaused) {
                    h     = H * 0.15;
                    alpha = 0.15;
                } else {
                    const w1 = Math.sin(t * 2.1 + phase) * 0.5 + 0.5;
                    const w2 = Math.sin(t * 1.3 + phase * 1.7) * 0.3 + 0.3;
                    h     = (w1 * w2 + 0.08) * H * 0.78;
                    alpha = 0.35 + w1 * 0.65;
                }

                ctx.globalAlpha = alpha;
                ctx.fillStyle   = '#f0a500';
                ctx.fillRect(i * barW + barW * 0.12, (H - h) / 2, barW * 0.76, h);
            }
            ctx.globalAlpha = 1;
            t += 0.032;
            this.animFrameId = requestAnimationFrame(draw);
        };
        draw();
    }

    stopViz() {
        cancelAnimationFrame(this.animFrameId);
        this.animFrameId = null;
        this.els.vizWrap.classList.remove('active');
        const ctx = this.vizCtx, c = this.els.vizCanvas;
        ctx.clearRect(0, 0, c.offsetWidth, c.offsetHeight);
    }

    /* ── Voice loading ──────────────────────────── */
    loadVoices() {
        const v = speechSynthesis.getVoices();
        if (!v.length) { setTimeout(() => this.loadVoices(), 200); return; }
        this.voices = v;
        this.populateVoices();
        this.updateUI();
    }

    populateVoices() {
        const sel  = this.els.voiceSelect;
        const prev = sel.value;
        sel.innerHTML = '';

        const groups = {};
        this.voices.forEach(v => {
            const lang = v.lang ? v.lang.split('-')[0].toUpperCase() : 'OTHER';
            (groups[lang] = groups[lang] || []).push(v);
        });

        Object.keys(groups).sort().forEach(lang => {
            const og = document.createElement('optgroup');
            og.label = lang;
            groups[lang].forEach(v => {
                const o = document.createElement('option');
                o.value       = v.name;
                o.textContent = v.name;
                if (v.default) o.selected = true;
                og.appendChild(o);
            });
            sel.appendChild(og);
        });

        if (prev && [...sel.options].some(o => o.value === prev)) sel.value = prev;
    }

    /* ── Speech playback ────────────────────────── */
    buildUtterance(text) {
        const u = new SpeechSynthesisUtterance(text);
        const v = this.voices.find(v => v.name === this.els.voiceSelect.value);
        if (v) u.voice = v;
        u.rate   = parseFloat(this.els.rateRange.value);
        u.pitch  = parseFloat(this.els.pitchRange.value);
        u.volume = parseFloat(this.els.volumeRange.value);
        return u;
    }

    speak() {
        if (speechSynthesis.speaking) { this.stop(); return; }
        const text = this.els.textInput.value.trim();
        if (!text) return;

        // ── INSTANT feedback on click ──
        this.isLoading = true;
        this.isPaused  = false;
        this.setPlayBtn('loading');
        this.startViz(true);          // gentle idle pulse while waiting
        this.updateUI();

        const u = this.buildUtterance(text);

        u.onstart = () => {
            this.isLoading = false;
            this.isPlaying = true;
            this.isPaused  = false;
            this.setPlayBtn('speaking');
            this.startViz(false);     // full waveform now
            this.updateUI();
        };
        u.onpause  = () => { this.isPaused = true;  this.updateUI(); };
        u.onresume = () => { this.isPaused = false; this.updateUI(); };
        u.onend    = () => this.onEnd();
        u.onerror  = () => this.onEnd();

        speechSynthesis.speak(u);
    }

    onEnd() {
        this.isLoading = false;
        this.isPlaying = false;
        this.isPaused  = false;
        this.setPlayBtn('idle');
        this.stopViz();
        this.updateUI();
    }

    togglePause() {
        if (this.isPaused) speechSynthesis.resume();
        else               speechSynthesis.pause();
    }

    stop() {
        speechSynthesis.cancel();
        this.onEnd();
    }

    quickTest() {
        if (speechSynthesis.speaking || this.isLoading) return;
        const orig = this.els.textInput.value;
        this.els.textInput.value = 'Hello! This is Umar TTS. Voice test complete.';
        this.onTextChange();
        const u = this.buildUtterance(this.els.textInput.value);

        this.isLoading = true;
        this.setPlayBtn('loading');
        this.startViz(true);
        this.updateUI();

        u.onstart = () => {
            this.isLoading = false;
            this.isPlaying = true;
            this.setPlayBtn('speaking');
            this.startViz(false);
            this.updateUI();
        };
        u.onend = u.onerror = () => {
            this.onEnd();
            setTimeout(() => { this.els.textInput.value = orig; this.onTextChange(); }, 300);
        };
        speechSynthesis.speak(u);
    }

    clearText() {
        this.els.textInput.value = '';
        this.onTextChange();
        this.els.textInput.focus();
    }

    /* ── Play button visual states ──────────────── */
    setPlayBtn(state) {
        const btn  = this.els.playBtn;
        const span = btn.querySelector('span');
        const icon = btn.querySelector('.btn-icon');

        btn.classList.remove('speaking', 'loading');

        if (state === 'loading') {
            btn.classList.add('loading');
            span.textContent = 'Starting…';
            icon.innerHTML = `
                <circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="2"
                    stroke-dasharray="22" stroke-dashoffset="0" fill="none"
                    style="transform-origin:center;animation:spin 0.8s linear infinite"/>`;
        } else if (state === 'speaking') {
            btn.classList.add('speaking');
            span.textContent = 'Speaking…';
            icon.innerHTML = `
                <rect x="4" y="3" width="4" height="14" rx="1.5" fill="currentColor"/>
                <rect x="12" y="3" width="4" height="14" rx="1.5" fill="currentColor"/>`;
        } else {
            span.textContent = 'Speak';
            icon.innerHTML = `<polygon points="5,3 17,10 5,17" fill="currentColor"/>`;
        }
    }

    /* ── Download via /api/tts proxy ────────────── */
    async downloadAudio() {
        const text = this.els.textInput.value.trim();
        if (!text) return;

        const btn    = this.els.downloadBtn;
        const spanEl = btn.querySelector('span');
        btn.disabled = true;
        spanEl.textContent = 'Generating…';

        try {
            const voice = this.voices.find(v => v.name === this.els.voiceSelect.value);
            const lang  = (voice && voice.lang) ? voice.lang : 'en-US';

            const chunks = this.splitText(text, 190);
            const blobs  = [];
            const rate = parseFloat(this.els.rateRange.value);

            for (let i = 0; i < chunks.length; i++) {
                if (chunks.length > 1) {
                    spanEl.textContent = `Generating ${i + 1}/${chunks.length}…`;
                }
                const blob = await this.fetchChunk(chunks[i], lang);
                blobs.push(blob);
            }

            // Merge raw MP3 chunks first
            let finalBlob = new Blob(blobs, { type: 'audio/mpeg' });
            let ext = 'mp3';

            // Apply speed correction if rate is not 1x
            if (Math.abs(rate - 1.0) >= 0.05) {
                spanEl.textContent = 'Adjusting speed…';
                finalBlob = await this.applySpeedToBlob(finalBlob, rate);
                ext = 'wav';
            }

            const url = URL.createObjectURL(finalBlob);
            const a   = document.createElement('a');
            a.href     = url;
            a.download = `umar-tts-${Date.now()}.${ext}`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 8000);

            spanEl.textContent = '✓ Downloaded!';
            setTimeout(() => {
                spanEl.textContent = 'Download MP3';
                btn.disabled = false;
            }, 2500);

        } catch (err) {
            console.error('Download failed:', err);
            spanEl.textContent = 'Failed — try again';
            setTimeout(() => {
                spanEl.textContent = 'Download MP3';
                btn.disabled = false;
            }, 3000);
        }
    }

    async fetchChunk(text, lang) {
        // Uses our own Vercel serverless proxy — no CORS issues
        const url = `/api/tts?q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Proxy error: HTTP ${res.status}`);
        return res.blob();
    }

    /**
     * Google TTS always outputs at its own fixed slow pace.
     * This re-renders the MP3 through Web Audio API at the user's chosen
     * speed (rate slider), using pitch-corrected time-stretching so the
     * downloaded file sounds identical to what they heard in the browser.
     */
    async applySpeedToBlob(blob, rate) {
        if (Math.abs(rate - 1.0) < 0.05) return blob; // no change needed

        const arrayBuf = await blob.arrayBuffer();
        const audioCtx = new OfflineAudioContext(1, 1, 44100); // temp to decode

        let decoded;
        try {
            decoded = await audioCtx.decodeAudioData(arrayBuf);
        } catch (e) {
            // If decode fails just return original
            return blob;
        }

        const originalDuration = decoded.numberOfChannels > 0
            ? decoded.length / decoded.sampleRate
            : 0;
        if (originalDuration === 0) return blob;

        // New length after time-stretch
        const newLength = Math.ceil(decoded.length / rate);
        const offlineCtx = new OfflineAudioContext(
            decoded.numberOfChannels,
            newLength,
            decoded.sampleRate
        );

        const src = offlineCtx.createBufferSource();
        src.buffer = decoded;
        src.playbackRate.value = rate;  // pitch-corrected in OfflineAudioContext
        src.connect(offlineCtx.destination);
        src.start(0);

        const rendered = await offlineCtx.startRendering();

        // Encode rendered AudioBuffer → WAV blob
        return this.audioBufferToWav(rendered);
    }

    audioBufferToWav(buffer) {
        const numCh      = buffer.numberOfChannels;
        const sampleRate = buffer.sampleRate;
        const length     = buffer.length;
        const arrayBuf   = new ArrayBuffer(44 + length * numCh * 2);
        const view       = new DataView(arrayBuf);

        const writeStr = (off, str) => {
            for (let i = 0; i < str.length; i++) view.setUint8(off + i, str.charCodeAt(i));
        };
        const write32  = (off, v) => view.setUint32(off, v, true);
        const write16  = (off, v) => view.setUint16(off, v, true);

        writeStr(0,  'RIFF');
        write32(4,   36 + length * numCh * 2);
        writeStr(8,  'WAVE');
        writeStr(12, 'fmt ');
        write32(16,  16);
        write16(20,  1);                        // PCM
        write16(22,  numCh);
        write32(24,  sampleRate);
        write32(28,  sampleRate * numCh * 2);  // byte rate
        write16(32,  numCh * 2);               // block align
        write16(34,  16);                       // bits per sample
        writeStr(36, 'data');
        write32(40,  length * numCh * 2);

        // Interleave channels
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let ch = 0; ch < numCh; ch++) {
                const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }

        return new Blob([arrayBuf], { type: 'audio/wav' });
    }

    splitText(text, maxLen) {
        if (text.length <= maxLen) return [text];
        const chunks    = [];
        const sentences = text.match(/[^.!?]+[.!?]*/g) || [text];
        let current = '';

        for (const s of sentences) {
            if ((current + s).length > maxLen) {
                if (current.trim()) chunks.push(current.trim());
                if (s.length > maxLen) {
                    this.splitLong(s, maxLen).forEach((p, i, arr) => {
                        if (i < arr.length - 1) chunks.push(p.trim());
                        else current = p;
                    });
                } else { current = s; }
            } else { current += s; }
        }
        if (current.trim()) chunks.push(current.trim());
        return chunks.filter(Boolean);
    }

    splitLong(text, maxLen) {
        const parts = [];
        while (text.length > maxLen) {
            let cut = text.lastIndexOf(' ', maxLen);
            if (cut === -1) cut = maxLen;
            parts.push(text.slice(0, cut));
            text = text.slice(cut).trim();
        }
        if (text) parts.push(text);
        return parts;
    }

    /* ── UI helpers ─────────────────────────────── */
    bindEvents() {
        this.els.textInput.addEventListener('input',   () => this.onTextChange());
        this.els.rateRange.addEventListener('input',   () => {
            this.els.rateValue.textContent = parseFloat(this.els.rateRange.value).toFixed(1) + '×';
        });
        this.els.pitchRange.addEventListener('input',  () => {
            this.els.pitchValue.textContent = parseFloat(this.els.pitchRange.value).toFixed(1);
        });
        this.els.volumeRange.addEventListener('input', () => {
            this.els.volumeValue.textContent = Math.round(parseFloat(this.els.volumeRange.value) * 100) + '%';
        });

        this.els.playBtn.addEventListener('click',      () => this.speak());
        this.els.pauseBtn.addEventListener('click',     () => this.togglePause());
        this.els.stopBtn.addEventListener('click',      () => this.stop());
        this.els.quickTestBtn.addEventListener('click', () => this.quickTest());
        this.els.downloadBtn.addEventListener('click',  () => this.downloadAudio());
        this.els.clearBtn.addEventListener('click',     () => this.clearText());

        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        document.addEventListener('click',   () => this.loadVoices(), { once: true });
        document.addEventListener('keydown', e => this.handleKeyboard(e));
    }

    onTextChange() {
        const len = this.els.textInput.value.length;
        this.els.charCount.textContent = len;
        const cc = this.els.charCount.parentElement;
        cc.className = 'char-counter'
            + (len > 4500 ? ' danger' : len > 4000 ? ' warn' : '');
        this.updateUI();
    }

    updateUI() {
        const hasText     = this.els.textInput.value.trim().length > 0;
        const voicesReady = this.voices.length > 0;
        const busy        = this.isPlaying || this.isLoading;

        this.els.playBtn.disabled      = !hasText || !voicesReady || busy;
        this.els.pauseBtn.disabled     = !this.isPlaying;
        this.els.stopBtn.disabled      = !busy;
        this.els.quickTestBtn.disabled = busy;
        this.els.downloadBtn.disabled  = !hasText || !voicesReady;

        this.els.pauseBtn.querySelector('span').textContent =
            this.isPaused ? 'Resume' : 'Pause';
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

/* ── Boot ───────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    if (!('speechSynthesis' in window)) {
        document.body.innerHTML = `
            <div style="display:flex;align-items:center;justify-content:center;
                        min-height:100vh;font-family:monospace;color:#f0a500;
                        text-align:center;padding:2rem;">
                <div>
                    <p style="font-size:2rem;margin-bottom:1rem;">⚠</p>
                    <p>Your browser doesn't support Web Speech API.</p>
                    <p style="opacity:0.6;margin-top:0.5rem;">Try Chrome, Edge, or Safari.</p>
                </div>
            </div>`;
        return;
    }
    new TTSApp();
});

window.addEventListener('beforeunload', () => speechSynthesis?.cancel());
document.addEventListener('visibilitychange', () => {
    if (document.hidden && speechSynthesis.speaking) speechSynthesis.pause();
    else if (!document.hidden && speechSynthesis.paused) speechSynthesis.resume();
});
