class TextToSpeechApp {
    constructor() {
        this.voices = [];
        this.isPlaying = false;
        this.isPaused = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadVoices();
        this.updateUI();
    }

    initializeElements() {
        this.textInput = document.getElementById('textInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.rateSlider = document.getElementById('rateRange');
        this.pitchSlider = document.getElementById('pitchRange');
        this.volumeSlider = document.getElementById('volumeRange');
        this.charCount = document.getElementById('charCount');
        this.rateValue = document.getElementById('rateValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.volumeValue = document.getElementById('volumeValue');
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.quickTestBtn = document.getElementById('quickTestBtn');
    }

    bindEvents() {
        // Text input events
        this.textInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateUI();
        });
        
        // Control events
        this.rateSlider.addEventListener('input', () => this.updateRateDisplay());
        this.pitchSlider.addEventListener('input', () => this.updatePitchDisplay());
        this.volumeSlider.addEventListener('input', () => this.updateVolumeDisplay());
        
        // Button events
        this.playBtn.addEventListener('click', () => this.speak());
        this.pauseBtn.addEventListener('click', () => this.togglePause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.quickTestBtn.addEventListener('click', () => this.quickTest());
        
        // Voice loading
        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // Load voices on user interaction (required by some browsers)
        document.addEventListener('click', this.loadVoices.bind(this), { once: true });
        document.addEventListener('touchstart', this.loadVoices.bind(this), { once: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        
        if (this.voices.length === 0) {
            // Wait and try again (some browsers need time to load voices)
            setTimeout(() => {
                this.voices = this.synth.getVoices();
                this.populateVoiceSelect();
            }, 100);
        } else {
            this.populateVoiceSelect();
        }
    }

    populateVoiceSelect() {
        this.voiceSelect.innerHTML = '';
        
        this.voices.forEach(voice => {
            const option = document.createElement('option');
            option.value = voice.name;
            option.textContent = `${voice.name} (${voice.lang})`;
            if (voice.default) {
                option.selected = true;
            }
            this.voiceSelect.appendChild(option);
        });
    }







    speak() {
        if (speechSynthesis.speaking) {
            speechSynthesis.cancel();
            return;
        }

        const text = this.textInput.value;
        if (text !== '') {
            const utterance = new SpeechSynthesisUtterance(text);
            
            const selectedVoice = this.voiceSelect.value;
            if (selectedVoice !== '') {
                const voice = this.voices.find(v => v.name === selectedVoice);
                if (voice) {
                    utterance.voice = voice;
                }
            }
            
            utterance.rate = this.rateSlider.value;
            utterance.pitch = this.pitchSlider.value;
            utterance.volume = this.volumeSlider.value;

            utterance.onstart = () => {
                this.isPlaying = true;
                this.updateUI();
            };

            utterance.onend = () => {
                this.isPlaying = false;
                this.updateUI();
            };

            speechSynthesis.speak(utterance);
        }
    }

    togglePause() {
        if (this.isPaused) {
            speechSynthesis.resume();
            this.isPaused = false;
        } else {
            speechSynthesis.pause();
            this.isPaused = true;
        }
        this.updateUI();
    }

    stop() {
        speechSynthesis.cancel();
        this.isPlaying = false;
        this.isPaused = false;
        this.updateUI();
    }

    quickTest() {
        const originalText = this.textInput.value;
        const testText = 'Hello! This is a quick test of the text-to-speech functionality.';
        
        this.textInput.value = testText;
        this.updateCharCount();
        this.updateUI();
        
        // Speak the test text
        this.speak();
        
        // Restore original text after speaking finishes
        if (this.currentUtterance) {
            this.currentUtterance.addEventListener('end', () => {
                setTimeout(() => {
                    this.textInput.value = originalText;
                    this.updateCharCount();
                    this.updateUI();
                }, 500);
            });
        }
    }

    updateCharCount() {
        const length = this.textInput.value.length;
        this.charCount.textContent = length;
        
        // Update color based on length
        if (length > 4500) {
            this.charCount.style.color = '#dc3545';
        } else if (length > 4000) {
            this.charCount.style.color = '#ffc107';
        } else {
            this.charCount.style.color = '#666';
        }
    }

    updateRateDisplay() {
        this.rateValue.textContent = this.rateSlider.value;
    }

    updatePitchDisplay() {
        this.pitchValue.textContent = this.pitchSlider.value;
    }

    updateVolumeDisplay() {
        const volume = Math.round(this.volumeSlider.value * 100);
        this.volumeValue.textContent = volume + '%';
    }

    updateUI() {
        const hasText = this.textInput.value.trim().length > 0;
        this.playBtn.disabled = !hasText || this.isPlaying;
        this.pauseBtn.disabled = !this.isPlaying;
        this.stopBtn.disabled = !this.isPlaying;
    }



    handleKeyboard(event) {
        // Spacebar to play/pause (when not in textarea)
        if (event.code === 'Space' && event.target !== this.textInput) {
            event.preventDefault();
            if (this.isPlaying) {
                this.togglePause();
            } else if (this.textInput.value.trim()) {
                this.speak();
            }
        }
        
        // Escape to stop
        if (event.code === 'Escape') {
            this.stop();
        }
        
        // Ctrl+Enter to speak
        if (event.ctrlKey && event.code === 'Enter') {
            event.preventDefault();
            if (this.textInput.value.trim()) {
                this.speak();
            }
        }
    }




}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new TextToSpeechApp();
});

// Clean up speech when leaving the page
window.addEventListener('beforeunload', () => {
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechSynthesis?.speaking) {
        window.speechSynthesis.pause();
    } else if (!document.hidden && window.speechSynthesis?.paused) {
        window.speechSynthesis.resume();
    }
});
