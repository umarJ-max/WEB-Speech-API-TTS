/**
 * Umar TTS — Voice Studio
 *
 * Playback  → Web Speech API (browser built-in, all voices, full controls)
 * Download  → Google Translate TTS endpoint (returns real MP3, no API key needed)
 *             Falls back to chunking for texts over 190 chars, then merges blobs.
 *
 * Flow: type text → pick voice → Speak to preview → Download MP3 to save
 */

class TTSApp {
    constructor() {
        this.voices      = [];
        this.isPlaying   = false;
        this.isPaused    = false;
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
        this.vizCtx = canvas.getContext('2d');
        const resize = () => {
            canvas.width  = canvas.offsetWidth  * devicePixelRatio;
            canvas.height = canvas.offsetHeight * devicePixelRatio;
            this.vizCtx.scale(devicePixelRatio, devicePixelRatio);
        };
        resize();
        window.addEventListener('resize', resize);
    }

    startViz() {
        this.els.vizWrap.classList.add('active');
        cancelAnimationFrame(this.animFrameId);
        let t = 0;
        const canvas = this.els.vizCanvas;
        const ctx    = this.vizCtx;
        const draw   = () => {
            const W = canvas.offsetWidth, H = canvas.offsetHeight;
            ctx.clearRect(0, 0, W, H);
            const bars = 52, barW = W / bars;
            for (let i = 0; i < bars; i++) {
                const phase = (i / bars) * Math.PI * 2;
                const w1 = Math.sin(t * 2.1 + phase) * 0.5 + 0.5;
                const w2 = Math.sin(t * 1.3 + phase * 1.7) * 0.3 + 0.3;
                const h  = (w1 * w2 + 0.08) * H * 0.78;
                ctx.globalAlpha = this.isPaused ? 0.2 : 0.35 + w1 * 0.65;
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
                o.value = v.name;
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

        const u = this.buildUtterance(text);
        u.onstart  = () => { this.isPlaying = true;  this.isPaused = false; this.startViz(); this.updateUI(); };
        u.onpause  = () => { this.isPaused = true;  this.updateUI(); };
        u.onresume = () => { this.isPaused = false; this.updateUI(); };
        u.onend    = () => this.onEnd();
        u.onerror  = () => this.onEnd();
        speechSynthesis.speak(u);
    }

    onEnd() {
        this.isPlaying = false;
        this.isPaused  = false;
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
        if (speechSynthesis.speaking) return;
        const orig = this.els.textInput.value;
        this.els.textInput.value = 'Hello! This is Umar TTS. Voice test complete.';
        this.onTextChange();
        const u = this.buildUtterance(this.els.textInput.value);
        u.onstart = () => { this.isPlaying = true; this.isPaused = false; this.startViz(); this.updateUI(); };
        u.onend   = () => {
            this.onEnd();
            setTimeout(() => { this.els.textInput.value = orig; this.onTextChange(); }, 300);
        };
        u.onerror = () => {
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

    /* ── Download via Google Translate TTS ──────── */
    async downloadAudio() {
        const text = this.els.textInput.value.trim();
        if (!text) return;

        const btn     = this.els.downloadBtn;
        const spanEl  = btn.querySelector('span');
        btn.disabled  = true;
        spanEl.textContent = 'Preparing…';

        try {
            const voice = this.voices.find(v => v.name === this.els.voiceSelect.value);
            const lang  = (voice && voice.lang) ? voice.lang : 'en-US';

            const chunks = this.splitText(text, 190);
            const blobs  = [];

            for (let i = 0; i < chunks.length; i++) {
                spanEl.textContent = chunks.length > 1
                    ? `Fetching ${i + 1} / ${chunks.length}…`
                    : 'Generating…';
                const blob = await this.fetchChunk(chunks[i], lang);
                blobs.push(blob);
            }

            const finalBlob = new Blob(blobs, { type: 'audio/mpeg' });
            const url  = URL.createObjectURL(finalBlob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = `umar-tts-${Date.now()}.mp3`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 8000);

            spanEl.textContent = '✓ Saved!';
            setTimeout(() => { spanEl.textContent = 'Download MP3'; btn.disabled = false; }, 2500);

        } catch (err) {
            console.error('TTS download error:', err);
            spanEl.textContent = 'Failed — try again';
            setTimeout(() => { spanEl.textContent = 'Download MP3'; btn.disabled = false; }, 3000);
        }
    }

    async fetchChunk(text, lang) {
        const url = `https://translate.google.com/translate_tts?ie=UTF-8&q=${encodeURIComponent(text)}&tl=${encodeURIComponent(lang)}&client=tw-ob`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
    }

    splitText(text, maxLen) {
        if (text.length <= maxLen) return [text];
        const chunks = [];
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

    /* ── UI ─────────────────────────────────────── */
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
        this.els.playBtn.addEventListener('click',      () => this.speak());
        this.els.pauseBtn.addEventListener('click',     () => this.togglePause());
        this.els.stopBtn.addEventListener('click',      () => this.stop());
        this.els.quickTestBtn.addEventListener('click', () => this.quickTest());
        this.els.downloadBtn.addEventListener('click',  () => this.downloadAudio());
        this.els.clearBtn.addEventListener('click',     () => this.clearText());

        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        document.addEventListener('click', () => this.loadVoices(), { once: true });
        document.addEventListener('keydown', e => this.handleKeyboard(e));
    }

    onTextChange() {
        const len = this.els.textInput.value.length;
        this.els.charCount.textContent = len;
        const cc = this.els.charCount.parentElement;
        cc.className = 'char-counter' + (len > 4500 ? ' danger' : len > 4000 ? ' warn' : '');
        this.updateUI();
    }

    updateUI() {
        const hasText     = this.els.textInput.value.trim().length > 0;
        const voicesReady = this.voices.length > 0;

        this.els.playBtn.disabled      = !hasText || !voicesReady;
        this.els.pauseBtn.disabled     = !this.isPlaying;
        this.els.stopBtn.disabled      = !this.isPlaying;
        this.els.quickTestBtn.disabled = this.isPlaying;
        this.els.downloadBtn.disabled  = !hasText || !voicesReady;

        this.els.pauseBtn.querySelector('span').textContent = this.isPaused ? 'Resume' : 'Pause';

        if (this.isPlaying && !this.isPaused) {
            this.els.playBtn.classList.add('speaking');
        } else {
            this.els.playBtn.classList.remove('speaking');
        }
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
