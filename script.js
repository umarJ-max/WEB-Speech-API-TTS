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
        
        // Voice loading - enhanced for mobile
        if ('onvoiceschanged' in speechSynthesis) {
            speechSynthesis.onvoiceschanged = () => this.loadVoices();
        }
        
        // Load voices on user interaction (required by mobile browsers)
        document.addEventListener('click', this.loadVoices.bind(this), { once: true });
        document.addEventListener('touchstart', this.loadVoices.bind(this), { once: true });
        
        // Force voice loading after a delay (mobile browsers need this)
        setTimeout(() => this.loadVoices(), 500);
        setTimeout(() => this.loadVoices(), 1000);
        setTimeout(() => this.loadVoices(), 2000);

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboard(e));

        // Mobile optimizations
        this.addMobileOptimizations();
    }

    loadVoices() {
        // Force cancel any pending speech to refresh voices
        this.synth.cancel();
        
        this.voices = this.synth.getVoices();
        
        if (this.voices.length === 0) {
            // Create a dummy utterance to trigger voice loading on mobile
            const dummy = new SpeechSynthesisUtterance('');
            this.synth.speak(dummy);
            this.synth.cancel();
            
            // Wait and try again (mobile browsers need more time)
            setTimeout(() => {
                this.voices = this.synth.getVoices();
                if (this.voices.length > 0) {
                    this.populateVoiceSelect();
                }
            }, 200);
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

        // Detect mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) || window.innerWidth <= 768;

        // Add default option
        const defaultOption = document.createElement('option');
        defaultOption.value = '';
        defaultOption.textContent = isMobile ? 'Device Default (Recommended)' : 'System Default';
        this.voiceSelect.appendChild(defaultOption);

        // Filter voices for mobile compatibility
        let voicesToShow = this.voices;
        if (isMobile) {
            // Test which voices actually work on mobile
            this.testMobileVoices();
            
            // For mobile, prioritize working voices
            const workingVoices = this.voices.filter(voice => {
                // Keep default voices and local voices
                if (voice.default || voice.localService) return true;
                
                // Keep commonly working voices on mobile
                const name = voice.name.toLowerCase();
                return name.includes('google') || 
                       name.includes('android') ||
                       name.includes('apple') ||
                       name.includes('samsung') ||
                       voice.lang.startsWith('en');
            });
            
            voicesToShow = workingVoices.length > 0 ? workingVoices : this.voices;
            console.log(`Mobile: Showing ${voicesToShow.length} out of ${this.voices.length} voices`);
        }

        // Add filtered voices
        voicesToShow.forEach((voice, index) => {
            const option = document.createElement('option');
            option.value = this.voices.indexOf(voice); // Use original index
            
            // Shorter names for mobile
            let displayName = voice.name;
            if (isMobile) {
                displayName = voice.name.length > 20 
                    ? voice.name.substring(0, 20) + '...' 
                    : voice.name;
                
                // Add indicators for mobile
                if (voice.localService) displayName += ' ✓';
                if (voice.default) displayName += ' (Default)';
            }
            
            option.textContent = `${displayName} (${voice.lang})`;
            
            // Mark default voice
            if (voice.default) {
                option.selected = true;
            }
            
            this.voiceSelect.appendChild(option);
        });
        
        // Add change listener for voice selection (without auto-testing)
        this.voiceSelect.addEventListener('change', () => {
            const selectedIndex = this.voiceSelect.value;
            if (selectedIndex !== '' && this.voices[selectedIndex]) {
                const selectedVoice = this.voices[selectedIndex];
                console.log('Voice changed to:', selectedVoice.name, selectedVoice.lang);
                
                // Just show status, don't auto-test to avoid sudden speech
                this.showStatus(`Voice selected: ${selectedVoice.name}`, 'ready');
            }
        });

        // Add mobile-specific tips and warnings
        if (isMobile) {
            if (voicesToShow.length <= 2) {
                const warningOption = document.createElement('option');
                warningOption.disabled = true;
                warningOption.textContent = '--- Limited voices on mobile ---';
                this.voiceSelect.appendChild(warningOption);
            }
            
            // Add mobile tips
            const tipsOption = document.createElement('option');
            tipsOption.disabled = true;
            tipsOption.textContent = '💡 Tip: Default voice works best on mobile';
            this.voiceSelect.appendChild(tipsOption);
            
            // Show initial status for mobile users
            setTimeout(() => {
                this.showStatus('Mobile: Use "Device Default" for best results', 'ready');
            }, 2000);
        }
        
        console.log(`Loaded ${this.voices.length} voices (Mobile: ${isMobile ? voicesToShow.length : 'N/A'} shown)`);
    }

    testSelectedVoice() {
        // Quick voice test for mobile debugging
        const selectedIndex = this.voiceSelect.value;
        if (selectedIndex !== '' && this.voices[selectedIndex]) {
            const testUtterance = new SpeechSynthesisUtterance('Test');
            testUtterance.voice = this.voices[selectedIndex];
            testUtterance.volume = 0.1; // Low volume for testing
            testUtterance.rate = 1.5; // Fast for quick test
            
            this.synth.cancel(); // Cancel any ongoing speech
            this.synth.speak(testUtterance);
        }
    }

    testMobileVoices() {
        // Test voices silently to see which ones actually work on mobile
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        if (!isMobile) return;
        
        console.log('Testing mobile voice compatibility...');
        
        this.workingVoices = new Set();
        
        // Test a few voices silently
        this.voices.slice(0, 5).forEach((voice, index) => {
            setTimeout(() => {
                const testUtterance = new SpeechSynthesisUtterance('');
                testUtterance.voice = voice;
                testUtterance.volume = 0; // Silent test
                testUtterance.rate = 10; // Very fast
                
                testUtterance.onstart = () => {
                    this.workingVoices.add(voice.name);
                    console.log('Working voice found:', voice.name);
                };
                
                testUtterance.onerror = () => {
                    console.log('Non-working voice:', voice.name);
                };
                
                this.synth.speak(testUtterance);
            }, index * 100);
        });
    }





    speak() {
        const text = this.textInput.value.trim();
        
        if (!text) {
            this.showStatus('Please enter some text to speak', 'error');
            return;
        }

        // Prevent multiple clicks
        if (this.isPlaying) {
            this.showStatus('Speech is already in progress, please wait...', 'error');
            return;
        }

        // Stop any current speech
        this.stop();

        try {
            // Create new utterance
            this.currentUtterance = new SpeechSynthesisUtterance(text);
            
            // Enhanced mobile voice handling
            const selectedVoiceIndex = this.voiceSelect.value;
            const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
            
            if (selectedVoiceIndex !== '' && this.voices[selectedVoiceIndex]) {
                const selectedVoice = this.voices[selectedVoiceIndex];
                
                // Mobile-specific voice setting with validation
                if (isMobile) {
                    // Check if voice is likely to work on mobile
                    const voiceName = selectedVoice.name.toLowerCase();
                    const isLikelyWorking = selectedVoice.localService || 
                                          selectedVoice.default ||
                                          voiceName.includes('google') ||
                                          voiceName.includes('android') ||
                                          voiceName.includes('apple') ||
                                          selectedVoice.lang.startsWith('en');
                    
                    if (isLikelyWorking) {
                        this.currentUtterance.voice = selectedVoice;
                        this.currentUtterance.lang = selectedVoice.lang;
                        this.currentUtterance.voiceURI = selectedVoice.voiceURI;
                        
                        // Force voice setting multiple times for mobile browsers
                        setTimeout(() => {
                            if (this.currentUtterance) {
                                this.currentUtterance.voice = selectedVoice;
                            }
                        }, 10);
                        
                        console.log('Mobile: Using voice:', selectedVoice.name);
                    } else {
                        // Fallback to default voice on mobile for problematic voices
                        console.log('Mobile: Falling back to default voice for:', selectedVoice.name);
                        this.showStatus('Using default voice for better mobile compatibility', 'ready');
                    }
                } else {
                    // Desktop - use voice normally
                    this.currentUtterance.voice = selectedVoice;
                    this.currentUtterance.lang = selectedVoice.lang;
                }
            }

            // Set parameters
            this.currentUtterance.rate = parseFloat(this.rateRange.value);
            this.currentUtterance.pitch = parseFloat(this.pitchRange.value);
            this.currentUtterance.volume = parseFloat(this.volumeRange.value);

            // Set event handlers
            this.currentUtterance.onstart = () => {
                this.isPlaying = true;
                this.isPaused = false;
                this.showStatus('Speaking... Please wait, do not press again!', 'speaking');
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
                
                // Handle mobile-specific voice errors
                if (isMobile && event.error === 'voice-unavailable') {
                    this.showStatus('Voice not available on mobile, trying default...', 'error');
                    
                    // Retry with default voice
                    setTimeout(() => {
                        const retryUtterance = new SpeechSynthesisUtterance(text);
                        retryUtterance.rate = parseFloat(this.rateRange.value);
                        retryUtterance.pitch = parseFloat(this.pitchRange.value);
                        retryUtterance.volume = parseFloat(this.volumeRange.value);
                        
                        this.synth.speak(retryUtterance);
                        console.log('Retrying with default voice');
                    }, 500);
                } else {
                    this.showStatus(`Speech error: ${event.error}`, 'error');
                }
                
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

            // Mobile-specific voice handling
            if (window.innerWidth <= 768 && selectedVoiceIndex !== '') {
                // Force voice setting again for mobile browsers
                const selectedVoice = this.voices[selectedVoiceIndex];
                if (selectedVoice) {
                    this.currentUtterance.voice = selectedVoice;
                    this.currentUtterance.voiceURI = selectedVoice.voiceURI;
                    this.currentUtterance.lang = selectedVoice.lang;
                    
                    console.log('Mobile: Using voice:', selectedVoice.name, selectedVoice.lang);
                }
            }

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
            this.playBtn.innerHTML = '<i class="fas fa-volume-up"></i>Speaking... Please Wait';
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>Pause';
            this.playBtn.style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
        } else if (this.isPaused) {
            this.playBtn.innerHTML = '<i class="fas fa-volume-up"></i>Paused';
            this.pauseBtn.innerHTML = '<i class="fas fa-play"></i>Resume';
            this.playBtn.style.background = 'linear-gradient(135deg, #f59e0b, #d97706)';
        } else {
            this.playBtn.innerHTML = '<i class="fas fa-play"></i>Speak';
            this.pauseBtn.innerHTML = '<i class="fas fa-pause"></i>Pause';
            this.playBtn.style.background = ''; // Reset to CSS default
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

        // Force voice loading on mobile with multiple attempts
        if (window.innerWidth <= 768) {
            // Mobile-specific voice loading
            const loadVoicesRepeatedly = () => {
                this.loadVoices();
                if (this.voices.length === 0) {
                    setTimeout(loadVoicesRepeatedly, 500);
                }
            };
            
            setTimeout(loadVoicesRepeatedly, 1000);
            
            // Log available voices for debugging
            setTimeout(() => {
                console.log('Available voices on mobile:', this.voices.map(v => ({
                    name: v.name,
                    lang: v.lang,
                    default: v.default
                })));
            }, 2000);
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
