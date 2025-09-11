class TextToSpeechApp {
    constructor() {
        // Check browser support first
        if (!window.speechSynthesis) {
            this.showUnsupportedMessage();
            return;
        }

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
        
        // Progress elements
        this.progressContainer = document.getElementById('progressContainer');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
    }

    bindEvents() {
        // Text input events
        this.textInput.addEventListener('input', () => {
            this.updateCharCount();
            this.updateUI();
        });
        
        // Control events
        this.rateRange.addEventListener('input', () => this.updateRateDisplay());
        this.pitchRange.addEventListener('input', () => this.updatePitchDisplay());
        this.volumeRange.addEventListener('input', () => this.updateVolumeDisplay());
        
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

        // Mobile optimizations
        this.addMobileOptimizations();
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
        
        if (this.voices.length === 0) {
            const option = document.createElement('option');
            option.textContent = 'Loading voices...';
            option.disabled = true;
            this.voiceSelect.appendChild(option);
            return;
        }

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = 'System Default';
        this.voiceSelect.appendChild(defaultOption);

        // Filter and add voices, prioritizing English voices
        const englishVoices = this.voices.filter(voice => voice.lang.startsWith('en'));
        const otherVoices = this.voices.filter(voice => !voice.lang.startsWith('en'));

        // Add English voices first
        if (englishVoices.length > 0) {
            englishVoices.forEach((voice, originalIndex) => {
                const option = document.createElement('option');
                option.value = this.voices.indexOf(voice);
                option.textContent = `${voice.name} (${voice.lang})`;
                if (voice.default) option.selected = true;
                this.voiceSelect.appendChild(option);
            });
        }

        // Add other voices
        otherVoices.forEach((voice, originalIndex) => {
            const option = document.createElement('option');
            option.value = this.voices.indexOf(voice);
            option.textContent = `${voice.name} (${voice.lang})`;
            this.voiceSelect.appendChild(option);
        });
        
        console.log(`Loaded ${this.voices.length} voices`);
    }





    speak() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to speak', 'error');
            return;
        }

        // Stop any current speech
        this.stop();

        try {
            // Create new utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Set voice if selected
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
            };

            this.currentUtterance.onend = () => {
                this.isPlaying = false;
                this.isPaused = false;
                this.hideStatus();
                this.hideProgress();
                this.updateUI();
            };

            this.currentUtterance.onerror = (event) => {
                this.isPlaying = false;
                this.isPaused = false;
                this.showStatus(`Speech error: ${event.error}`, 'error');
                this.hideProgress();
                this.updateUI();
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
            
        } catch (error) {
            this.showStatus('Failed to start speech', 'error');
            console.error('Speech error:', error);
        }
    }

    togglePause() {
        if (!this.isPlaying) return;
        
        if (this.isPaused) {
            this.synth.resume();
        } else {
            this.synth.pause();
        }
    }

    stop() {
        // Cancel any ongoing speech
        this.synth.cancel();
        
        this.isPlaying = false;
        this.isPaused = false;
        this.hideStatus();
        this.hideProgress();
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
        
        // Update button states
        this.playBtn.disabled = !hasText || this.isPlaying;
        this.pauseBtn.disabled = !this.isPlaying;
        this.stopBtn.disabled = !this.isPlaying && !this.isPaused;
        
        // Update button text based on state
        if (this.isPlaying && !this.isPaused) {
            this.playBtn.innerHTML = '<i class="fas fa-volume-up"></i>Speaking...';
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>Pause';
        } else if (this.isPaused) {
            this.playBtn.innerHTML = '<i class="fas fa-volume-up"></i>Speaking...';
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>Resume';
        } else {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>Speak';
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>Pause';
        }
    }

    showStatus(message, type = 'ready') {
        this.status.textContent = message;
        this.status.className = `floating-status show ${type}`;
        
        // Auto hide after 3 seconds for non-speaking messages
        if (type !== 'speaking') {
            setTimeout(() => {
                this.hideStatus();
            }, 3000);
        }
    }

    hideStatus() {
        this.status.className = 'floating-status';
    }

    showProgress() {
        this.progressContainer.style.display = 'block';
        this.progressText.textContent = 'Speaking...';
        this.progressFill.style.width = '0%';
        
        // Simple progress animation
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
        
        let progress = 0;
        this.progressInterval = setInterval(() => {
            if (!this.isPlaying || this.isPaused) {
                return;
            }
            
            progress += Math.random() * 3;
            if (progress > 90) progress = 90;
            
            this.progressFill.style.width = `${progress}%`;
        }, 200);
    }

    hideProgress() {
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
            this.progressInterval = null;
        }
        
        this.progressFill.style.width = '100%';
        setTimeout(() => {
            this.progressContainer.style.display = 'none';
            this.progressFill.style.width = '0%';
        }, 300);
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

    showUnsupportedMessage() {
        document.body.innerHTML = `
            <div style="display: flex; justify-content: center; align-items: center; height: 100vh; text-align: center; padding: 2rem; background: #0a0a0a; color: white;">
                <div>
                    <h2 style="color: #ef4444; margin-bottom: 1rem;">Browser Not Supported</h2>
                    <p style="margin-bottom: 1rem;">Speech Synthesis API is not supported in this browser.</p>
                    <p style="color: #888;">Please use a modern browser like Chrome, Firefox, or Safari.</p>
                </div>
            </div>
        `;
    }

    addMobileOptimizations() {
        // Prevent zoom on input focus for iOS
        const viewport = document.querySelector('meta[name="viewport"]');
        if (viewport) {
            viewport.setAttribute('content', 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no');
        } else {
            const newViewport = document.createElement('meta');
            newViewport.name = 'viewport';
            newViewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
            document.head.appendChild(newViewport);
        }

        // Add touch feedback for buttons
        const buttons = document.querySelectorAll('.action-btn');
        buttons.forEach(button => {
            button.addEventListener('touchstart', () => {
                button.style.transform = 'scale(0.95)';
            }, { passive: true });
            
            button.addEventListener('touchend', () => {
                setTimeout(() => {
                    button.style.transform = '';
                }, 100);
            }, { passive: true });
        });

        // Improve textarea experience on mobile
        this.textInput.addEventListener('focus', () => {
            // Scroll to textarea when focused on mobile
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    this.textInput.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'center' 
                    });
                }, 300);
            }
        });

        // Handle orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => {
                this.updateUI();
            }, 100);
        });
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
