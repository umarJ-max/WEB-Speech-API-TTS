class TextToSpeechApp {
    constructor() {
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.currentUtterance = null;
        this.isPlaying = false;
        this.isPaused = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadVoices();
        this.updateUI();
    }

    initializeElements() {
        // Input elements
        this.textInput = document.getElementById('textInput');
        this.voiceSelect = document.getElementById('voiceSelect');
        this.rateRange = document.getElementById('rateRange');
        this.pitchRange = document.getElementById('pitchRange');
        this.volumeRange = document.getElementById('volumeRange');
        
        // Display elements
        this.charCount = document.getElementById('charCount');
        this.rateValue = document.getElementById('rateValue');
        this.pitchValue = document.getElementById('pitchValue');
        this.volumeValue = document.getElementById('volumeValue');
        this.status = document.getElementById('status');
        
        // Button elements
        this.playBtn = document.getElementById('playBtn');
        this.pauseBtn = document.getElementById('pauseBtn');
        this.stopBtn = document.getElementById('stopBtn');
        this.quickTestBtn = document.getElementById('quickTestBtn');
        this.refreshVoicesBtn = document.getElementById('refreshVoices');
        this.clearBtn = document.getElementById('clearBtn');
        
        // Progress elements
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    bindEvents() {
        // Text input events
        this.textInput.addEventListener('input', () => this.updateCharCount());
        this.textInput.addEventListener('input', () => this.updateUI());
        
        // Control events
        this.rateRange.addEventListener('input', () => this.updateRateDisplay());
        this.pitchRange.addEventListener('input', () => this.updatePitchDisplay());
        this.volumeRange.addEventListener('input', () => this.updateVolumeDisplay());
        
        // Button events
        this.playBtn.addEventListener('click', () => this.speak());
        this.pauseBtn.addEventListener('click', () => this.pause());
        this.stopBtn.addEventListener('click', () => this.stop());
        this.quickTestBtn.addEventListener('click', () => this.quickTest());
        this.refreshVoicesBtn.addEventListener('click', () => this.forceRefreshVoices());
        this.clearBtn.addEventListener('click', () => this.clearText());
        
        // Voice loading with multiple attempts
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // Force voice loading on page interaction
        document.addEventListener('click', () => this.ensureVoicesLoaded(), { once: true });
        document.addEventListener('touchstart', () => this.ensureVoicesLoaded(), { once: true });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
        
        // If no voices loaded yet, try again after a short delay
        if (this.voices.length === 0) {
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
        
        if (this.voices.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'No voices available - Please refresh page';
            option.disabled = true;
            this.voiceSelect.appendChild(option);
            
            // Try to trigger voice loading
            console.log('Attempting to load voices...');
            if (this.synth.getVoices().length === 0) {
                // Force voice loading by creating a dummy utterance
                const dummy = new SpeechSynthesisUtterance('');
                this.synth.speak(dummy);
                this.synth.cancel();
            }
            return;
        }

        // Group voices by language
        const languageGroups = {};
        this.voices.forEach((voice, index) => {
            const lang = voice.lang.split('-')[0];
            if (!languageGroups[lang]) {
                languageGroups[lang] = [];
            }
            languageGroups[lang].push({ voice, index });
        });

        // Create optgroups
        Object.keys(languageGroups).sort().forEach(lang => {
            const optgroup = document.createElement('optgroup');
            optgroup.label = this.getLanguageName(lang);
            
            languageGroups[lang].forEach(({ voice, index }) => {
                const option = document.createElement('option');
                option.value = index;
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice.default) {
                    option.selected = true;
                }
                optgroup.appendChild(option);
            });
            
            this.voiceSelect.appendChild(optgroup);
        });
        
        console.log(`Loaded ${this.voices.length} voices`);
    }

    ensureVoicesLoaded() {
        if (this.voices.length === 0) {
            console.log('Force loading voices on user interaction...');
            this.loadVoices();
            
            // Try again after a delay if still no voices
            setTimeout(() => {
                if (this.voices.length === 0) {
                    this.loadVoices();
                }
            }, 500);
        }
    }

    forceRefreshVoices() {
        console.log('Manually refreshing voices...');
        
        // Animate refresh button
        this.refreshVoicesBtn.style.transform = 'rotate(360deg)';
        setTimeout(() => {
            this.refreshVoicesBtn.style.transform = '';
        }, 500);
        
        // Clear current voices
        this.voices = [];
        
        // Try multiple methods to load voices
        this.loadVoices();
        
        // Force trigger voices changed event
        if (window.speechSynthesis) {
            window.speechSynthesis.cancel();
            
            // Create a dummy utterance to trigger voice loading
            const dummy = new SpeechSynthesisUtterance('test');
            window.speechSynthesis.speak(dummy);
            window.speechSynthesis.cancel();
            
            // Try loading again after a short delay
            setTimeout(() => {
                this.loadVoices();
            }, 200);
        }
    }

    getLanguageName(code) {
        const languages = {
            'en': 'English',
            'es': 'Spanish',
            'fr': 'French',
            'de': 'German',
            'it': 'Italian',
            'pt': 'Portuguese',
            'ru': 'Russian',
            'ja': 'Japanese',
            'ko': 'Korean',
            'zh': 'Chinese',
            'ar': 'Arabic',
            'hi': 'Hindi',
            'nl': 'Dutch',
            'sv': 'Swedish',
            'no': 'Norwegian',
            'da': 'Danish',
            'fi': 'Finnish',
            'pl': 'Polish'
        };
        return languages[code] || code.toUpperCase();
    }

    speak() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to speak', 'error');
            return;
        }

        if (!this.synth) {
            this.showStatus('Speech synthesis not supported in this browser', 'error');
            return;
        }

        // Stop any current speech
        this.stop();

        // Create new utterance
        this.currentUtterance = new SpeechSynthesisUtterance(text);
        
        // Set voice
        const selectedVoiceIndex = this.voiceSelect.value;
        if (selectedVoiceIndex && this.voices[selectedVoiceIndex]) {
            this.currentUtterance.voice = this.voices[selectedVoiceIndex];
        }

        // Set parameters
        this.currentUtterance.rate = parseFloat(this.rateRange.value);
        this.currentUtterance.pitch = parseFloat(this.pitchRange.value);
        this.currentUtterance.volume = parseFloat(this.volumeRange.value);

        // Set event handlers
        this.currentUtterance.onstart = () => {
            this.isPlaying = true;
            this.isPaused = false;
            this.showStatus('Speaking...', 'speaking');
            this.showProgress();
            this.updateUI();
            document.body.classList.add('speaking');
        };

        this.currentUtterance.onend = () => {
            this.isPlaying = false;
            this.isPaused = false;
            this.status.className = 'floating-status'; // Hide status
            this.hideProgress();
            this.updateUI();
            document.body.classList.remove('speaking');
        };

        this.currentUtterance.onerror = (event) => {
            this.isPlaying = false;
            this.isPaused = false;
            this.showStatus(`Error: ${event.error}`, 'error');
            this.hideProgress();
            this.updateUI();
            document.body.classList.remove('speaking');
        };

        this.currentUtterance.onpause = () => {
            this.isPaused = true;
            this.showStatus('Paused', 'ready');
            this.updateUI();
        };

        this.currentUtterance.onresume = () => {
            this.isPaused = false;
            this.showStatus('Speaking...', 'speaking');
            this.updateUI();
        };

        // Start speaking
        this.synth.speak(this.currentUtterance);
    }

    pause() {
        if (this.isPlaying && !this.isPaused) {
            this.synth.pause();
        } else if (this.isPaused) {
            this.synth.resume();
        }
    }

    stop() {
        if (this.synth.speaking || this.synth.pending) {
            this.synth.cancel();
        }
        this.isPlaying = false;
        this.isPaused = false;
        this.status.className = 'floating-status'; // Hide status
        this.hideProgress();
        this.updateUI();
        document.body.classList.remove('speaking');
    }

    quickTest() {
        const originalText = this.textInput.value;
        this.textInput.value = 'Hello! This is a quick test of the text-to-speech functionality.';
        this.updateCharCount();
        
        // Speak the test text
        this.speak();
        
        // Restore original text after a delay
        setTimeout(() => {
            if (!this.isPlaying) {
                this.textInput.value = originalText;
                this.updateCharCount();
            }
        }, 2000);
    }

    clearText() {
        this.textInput.value = '';
        this.updateCharCount();
        this.textInput.focus();
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
        this.rateValue.textContent = this.rateRange.value;
    }

    updatePitchDisplay() {
        this.pitchValue.textContent = this.pitchRange.value;
    }

    updateVolumeDisplay() {
        const volume = Math.round(this.volumeRange.value * 100);
        this.volumeValue.textContent = volume + '%';
    }

    updateUI() {
        const hasText = this.textInput.value.trim().length > 0;
        const canSpeak = hasText && this.voices.length > 0;
        
        // Update button states
        this.playBtn.disabled = !canSpeak || this.isPlaying;
        this.pauseBtn.disabled = !this.isPlaying;
        this.stopBtn.disabled = !this.isPlaying && !this.isPaused;
        
        // Update button text
        if (this.isPaused) {
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i><span>Resume</span>';
        } else {
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i><span>Pause</span>';
        }
        
        // Update play button
        if (this.isPlaying) {
            this.playBtn.innerHTML = '<i class="fas fa-volume-up"></i><span>Speaking...</span>';
        } else {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i><span>Speak</span>';
        }
    }

    showStatus(message, type = 'ready') {
        // Only show important status messages (not "Ready" or "Finished speaking")
        if (message === 'Ready' || message === 'Finished speaking') {
            this.status.className = 'floating-status';
            return;
        }
        
        this.status.textContent = message;
        this.status.className = `floating-status show ${type}`;
        
        // Auto hide after 3 seconds for non-error messages
        if (type !== 'error' && type !== 'speaking') {
            setTimeout(() => {
                this.status.className = 'floating-status';
            }, 3000);
        }
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.progressText.textContent = 'Speaking...';
        
        // Simulate progress (since we can't track actual progress easily)
        let progress = 0;
        const interval = setInterval(() => {
            if (!this.isPlaying || this.isPaused) {
                clearInterval(interval);
                return;
            }
            
            progress += Math.random() * 2;
            if (progress > 95) progress = 95;
            
            this.progressFill.style.width = `${progress}%`;
        }, 100);
        
        // Complete progress when speech ends
        if (this.currentUtterance) {
            this.currentUtterance.addEventListener('end', () => {
                clearInterval(interval);
                this.progressFill.style.width = '100%';
                setTimeout(() => this.hideProgress(), 500);
            });
        }
    }

    hideProgress() {
        this.progressContainer.style.display = 'none';
        this.progressFill.style.width = '0%';
    }

    handleKeyboard(event) {
        // Spacebar to play/pause
        if (event.code === 'Space' && event.target !== this.textInput) {
            event.preventDefault();
            if (this.isPlaying) {
                this.pause();
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

    // Check browser support
    static checkSupport() {
        if (!('speechSynthesis' in window)) {
            return {
                supported: false,
                message: 'Speech Synthesis API is not supported in this browser. Please use a modern browser like Chrome, Firefox, or Safari.'
            };
        }
        
        return { supported: true };
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check browser support
    const support = TextToSpeechApp.checkSupport();
    
    if (!support.supported) {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; padding: 2rem;">
                <div>
                    <h2>Browser Not Supported</h2>
                    <p>${support.message}</p>
                    <p>Recommended browsers: Chrome 33+, Firefox 49+, Safari 7+, Edge 14+</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Initialize the app
    new TextToSpeechApp();
});

// Add some utility functions
window.addEventListener('beforeunload', () => {
    // Stop speech when leaving the page
    if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
    }
});

// Handle visibility change (pause when tab is hidden)
document.addEventListener('visibilitychange', () => {
    if (document.hidden && window.speechSynthesis && window.speechSynthesis.speaking) {
        window.speechSynthesis.pause();
    } else if (!document.hidden && window.speechSynthesis && window.speechSynthesis.paused) {
        window.speechSynthesis.resume();
    }
});
