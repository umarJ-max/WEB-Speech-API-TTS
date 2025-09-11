from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import edge_tts
import asyncio
import io
import random
import string
import time
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Add timeout configuration
app.config['SEND_FILE_MAX_AGE_DEFAULT'] = 0

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edge TTS - AI Voice Generator by Umar</title>
        <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                min-height: 100vh;
                color: #333;
            }
            
            .header {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                padding: 20px 0;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
                position: sticky;
                top: 0;
                z-index: 100;
            }
            
            .header-content {
                max-width: 1200px;
                margin: 0 auto;
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0 20px;
            }
            
            .logo {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .logo h1 {
                font-size: 2rem;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                font-weight: 800;
            }
            
            .creator-info {
                display: flex;
                align-items: center;
                gap: 10px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                padding: 8px 16px;
                border-radius: 25px;
                font-weight: 600;
                font-size: 0.9rem;
            }
            
            .main-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
            }
            
            .hero-section {
                text-align: center;
                margin-bottom: 60px;
            }
            
            .hero-title {
                font-size: 3.5rem;
                font-weight: 900;
                background: linear-gradient(45deg, #667eea, #764ba2, #f093fb);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                margin-bottom: 20px;
                text-shadow: 0 4px 8px rgba(0,0,0,0.1);
            }
            
            .hero-subtitle {
                font-size: 1.4rem;
                color: rgba(255, 255, 255, 0.9);
                margin-bottom: 30px;
                font-weight: 300;
            }
            
            .app-container {
                background: rgba(255, 255, 255, 0.95);
                backdrop-filter: blur(20px);
                border-radius: 25px;
                padding: 40px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                margin-bottom: 40px;
            }
            
            .form-section {
                margin-bottom: 30px;
            }
            
            .form-group {
                margin-bottom: 25px;
            }
            
            label {
                display: block;
                margin-bottom: 8px;
                font-weight: 600;
                color: #333;
                font-size: 1rem;
            }
            
            textarea, select {
                width: 100%;
                padding: 16px;
                border: 2px solid #e1e5e9;
                border-radius: 15px;
                font-size: 16px;
                transition: all 0.3s ease;
                background: #f8f9fa;
                font-family: inherit;
            }
            
            textarea:focus, select:focus {
                outline: none;
                border-color: #667eea;
                background: white;
                box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
                transform: translateY(-2px);
            }
            
            textarea {
                resize: vertical;
                min-height: 150px;
                font-family: inherit;
                line-height: 1.6;
            }
            
            .controls-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 25px;
                margin-bottom: 30px;
            }
            
            .generate-btn {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 18px 40px;
                border-radius: 50px;
                font-size: 18px;
                font-weight: 700;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                position: relative;
                overflow: hidden;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .generate-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 20px 40px rgba(102, 126, 234, 0.4);
            }
            
            .generate-btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
            }
            
            .loading {
                display: none;
                text-align: center;
                margin: 30px 0;
            }
            
            .spinner {
                width: 50px;
                height: 50px;
                border: 5px solid #f3f3f3;
                border-top: 5px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 20px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .audio-section {
                margin-top: 40px;
                text-align: center;
                display: none;
                animation: slideUp 0.5s ease-out;
            }
            
            @keyframes slideUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            .audio-player {
                width: 100%;
                margin-bottom: 20px;
                border-radius: 15px;
                box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            }
            
            .download-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                padding: 12px 25px;
                background: linear-gradient(45deg, #28a745, #20c997);
                color: white;
                text-decoration: none;
                border-radius: 25px;
                font-weight: 600;
                transition: all 0.3s ease;
                box-shadow: 0 8px 25px rgba(40, 167, 69, 0.3);
            }
            
            .download-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 12px 35px rgba(40, 167, 69, 0.4);
            }
            
            .message {
                padding: 16px 20px;
                border-radius: 15px;
                margin: 20px 0;
                display: none;
                font-weight: 500;
                text-align: center;
            }
            
            .error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
                color: white;
            }
            
            .success {
                background: linear-gradient(135deg, #51cf66, #40c057);
                color: white;
            }
            
            .features-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
                gap: 25px;
                margin-bottom: 40px;
            }
            
            .feature-card {
                background: rgba(255, 255, 255, 0.9);
                backdrop-filter: blur(20px);
                padding: 30px;
                border-radius: 20px;
                text-align: center;
                border: 2px solid rgba(255, 255, 255, 0.2);
                transition: all 0.3s ease;
            }
            
            .feature-card:hover {
                transform: translateY(-10px);
                box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
                border-color: rgba(102, 126, 234, 0.3);
            }
            
            .feature-icon {
                font-size: 3rem;
                margin-bottom: 15px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            
            .feature-title {
                font-size: 1.3rem;
                font-weight: 700;
                margin-bottom: 10px;
                color: #333;
            }
            
            .feature-desc {
                color: #666;
                line-height: 1.6;
            }
            
            .char-counter {
                text-align: right;
                font-size: 0.9rem;
                color: #666;
                margin-top: 8px;
            }
            
            .footer {
                text-align: center;
                margin-top: 60px;
                padding: 30px;
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 20px;
                color: rgba(255, 255, 255, 0.8);
            }
            
            .social-links {
                display: flex;
                justify-content: center;
                gap: 20px;
                margin-top: 20px;
            }
            
            .social-link {
                color: rgba(255, 255, 255, 0.8);
                font-size: 1.5rem;
                transition: all 0.3s ease;
            }
            
            .social-link:hover {
                color: white;
                transform: translateY(-2px);
            }
            
            @media (max-width: 768px) {
                .controls-grid {
                    grid-template-columns: 1fr;
                }
                .header-content {
                    flex-direction: column;
                    gap: 15px;
                }
                .hero-title {
                    font-size: 2.5rem;
                }
                .app-container {
                    padding: 25px;
                    margin: 20px 10px;
                }
                .main-container {
                    padding: 20px 10px;
                }
            }
        </style>
    </head>
    <body>
        <header class="header">
            <div class="header-content">
                <div class="logo">
                    <i class="fas fa-microphone-alt" style="font-size: 2rem; color: #667eea;"></i>
                    <h1>Edge TTS</h1>
                </div>
                <div class="creator-info">
                    <i class="fas fa-user-circle"></i>
                    Created by Umar
                </div>
            </div>
        </header>

        <div class="main-container">
            <section class="hero-section">
                <h1 class="hero-title">AI Voice Generator</h1>
                <p class="hero-subtitle">Transform your text into natural, human-like speech using advanced AI technology</p>
            </section>

            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-globe"></i>
                    </div>
                    <div class="feature-title">Multi-Language Support</div>
                    <div class="feature-desc">Generate speech in 15+ languages with authentic accents and pronunciations</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-bolt"></i>
                    </div>
                    <div class="feature-title">Lightning Fast</div>
                    <div class="feature-desc">Instant audio generation with cloud-powered processing for immediate results</div>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">
                        <i class="fas fa-brain"></i>
                    </div>
                    <div class="feature-title">Neural Voices</div>
                    <div class="feature-desc">Premium AI voices that sound completely natural and human-like</div>
                </div>
            </div>

            <div class="app-container">
                <div class="form-section">
                    <form id="ttsForm">
                        <div class="form-group">
                            <label for="text">
                                <i class="fas fa-edit"></i> Enter your text
                            </label>
                            <textarea 
                                id="text" 
                                name="text" 
                                placeholder="Type or paste your text here. Create engaging content, voiceovers, or convert any text to speech..."
                                maxlength="1000" 
                                required
                            ></textarea>
                            <div class="char-counter">
                                <span id="charCount">0</span>/1000 characters
                            </div>
                        </div>
                        
                        <div class="controls-grid">
                            <div class="form-group">
                                <label for="voice">
                                    <i class="fas fa-user-astronaut"></i> Choose Voice
                                </label>
                                <select id="voice" name="voice">
                                    <option value="en-US-AriaNeural">🇺🇸 Aria (US Female)</option>
                                    <option value="en-US-DavisNeural">🇺🇸 Davis (US Male)</option>
                                    <option value="en-US-JennyNeural">🇺🇸 Jenny (US Female)</option>
                                    <option value="en-US-GuyNeural">🇺🇸 Guy (US Male)</option>
                                    <option value="en-GB-SoniaNeural">🇬🇧 Sonia (UK Female)</option>
                                    <option value="en-GB-RyanNeural">🇬🇧 Ryan (UK Male)</option>
                                    <option value="en-AU-NatashaNeural">🇦🇺 Natasha (AU Female)</option>
                                    <option value="en-AU-WilliamNeural">🇦🇺 William (AU Male)</option>
                                    <option value="es-ES-ElviraNeural">🇪🇸 Elvira (Spanish)</option>
                                    <option value="fr-FR-DeniseNeural">🇫🇷 Denise (French)</option>
                                    <option value="de-DE-KatjaNeural">🇩🇪 Katja (German)</option>
                                    <option value="ja-JP-NanamiNeural">🇯🇵 Nanami (Japanese)</option>
                                    <option value="ko-KR-SunHiNeural">🇰🇷 SunHi (Korean)</option>
                                    <option value="zh-CN-XiaoxiaoNeural">🇨🇳 Xiaoxiao (Chinese)</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="rate">
                                    <i class="fas fa-tachometer-alt"></i> Speech Speed
                                </label>
                                <select id="rate" name="rate">
                                    <option value="-50%">🐌 Very Slow</option>
                                    <option value="-25%">🐢 Slow</option>
                                    <option value="+0%" selected>🚶 Normal</option>
                                    <option value="+25%">🏃 Fast</option>
                                    <option value="+50%">🚀 Very Fast</option>
                                </select>
                            </div>
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 1fr auto; gap: 15px; align-items: center;">
                            <button type="submit" class="generate-btn" id="generateBtn">
                                <i class="fas fa-magic"></i> Generate Voice
                            </button>
                            
                            <button type="button" onclick="quickTest()" style="background: linear-gradient(45deg, #28a745, #20c997); color: white; border: none; padding: 18px 25px; border-radius: 50px; font-size: 14px; font-weight: 600; cursor: pointer; white-space: nowrap; min-width: 120px;">
                                <i class="fas fa-flask"></i> Quick Test
                            </button>
                        </div>
                    </form>
                </div>
                
                <div class="loading" id="loading">
                    <div class="spinner"></div>
                    <p><strong>Creating your voice...</strong></p>
                    <p>Please wait while we process your text</p>
                </div>
                
                <div class="message error" id="error"></div>
                <div class="message success" id="success">
                    <i class="fas fa-check-circle"></i> Voice generated successfully!
                </div>
                
                <div class="audio-section" id="audioContainer">
                    <audio controls class="audio-player" id="audioPlayer">
                        Your browser does not support audio playback.
                    </audio>
                    <a href="#" class="download-btn" id="downloadBtn" download="umar-voice-generation.mp3">
                        <i class="fas fa-download"></i>
                        Download MP3
                    </a>
                </div>
            </div>

            <div class="footer">
                <p><strong>Edge TTS - AI Voice Generator</strong></p>
                <p>Powered by Microsoft Edge TTS • Created with ❤️ by Umar</p>
                <div class="social-links">
                    <a href="#" class="social-link"><i class="fab fa-github"></i></a>
                    <a href="#" class="social-link"><i class="fab fa-linkedin"></i></a>
                    <a href="#" class="social-link"><i class="fab fa-twitter"></i></a>
                </div>
            </div>
        </div>
        
        <script>
            // Character counter
            const textArea = document.getElementById('text');
            const charCount = document.getElementById('charCount');
            
            textArea.addEventListener('input', function() {
                const count = this.value.length;
                charCount.textContent = count;
                
                // Change color based on character count
                if (count > 900) {
                    charCount.style.color = '#dc3545';
                } else if (count > 700) {
                    charCount.style.color = '#ffc107';
                } else {
                    charCount.style.color = '#666';
                }
            });
            
            // Default text
            document.addEventListener('DOMContentLoaded', function() {
                if (!textArea.value) {
                    textArea.value = "Welcome to Umar's Edge TTS! Transform your text into natural-sounding speech with advanced AI technology.";
                    charCount.textContent = textArea.value.length;
                }
                
                // Add service status check
                checkServiceHealth();
            });
            
            async function checkServiceHealth() {
                try {
                    const response = await fetch('/api/health');
                    const health = await response.json();
                    
                    if (health.status !== 'healthy') {
                        showServiceStatus('The text-to-speech service is experiencing high traffic. Generation may take longer than usual.');
                    }
                } catch (error) {
                    console.log('Health check failed:', error);
                }
            }
            
            function showServiceStatus(message) {
                const statusDiv = document.createElement('div');
                statusDiv.innerHTML = `
                    <div style="background: linear-gradient(45deg, #ffc107, #fd7e14); color: white; padding: 12px 20px; border-radius: 10px; margin: 20px 0; text-align: center; font-weight: 500;">
                        <i class="fas fa-info-circle"></i> ${message}
                    </div>
                `;
                document.querySelector('.app-container').insertBefore(statusDiv, document.querySelector('.form-section'));
            }
            
            document.getElementById('ttsForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const text = textArea.value.trim();
                const voice = document.getElementById('voice').value;
                let rate = document.getElementById('rate').value;
                
                if (!text) {
                    showError('Please enter some text to convert.');
                    return;
                }
                
                if (text.length > 1000) {
                    showError('Text is too long. Please limit to 1000 characters.');
                    return;
                }
                
                showLoading(true);
                hideMessages();
                
                let retryCount = 0;
                const maxRetries = 2;
                
                async function attemptGeneration() {
                    try {
                        const response = await fetch('/api/tts', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                text: text,
                                voice: voice,
                                rate: rate
                            })
                        });
                        
                        if (!response.ok) {
                            const contentType = response.headers.get('content-type');
                            let errorMessage = 'Failed to generate speech';
                            
                            if (contentType && contentType.includes('application/json')) {
                                const errorData = await response.json();
                                errorMessage = errorData.error || errorMessage;
                            } else {
                                errorMessage = `Server error (${response.status})`;
                            }
                            
                            throw new Error(errorMessage);
                        }
                        
                        const blob = await response.blob();
                        
                        // Check if we actually got audio data
                        if (blob.size === 0) {
                            throw new Error('No audio data received');
                        }
                        
                        const audioUrl = URL.createObjectURL(blob);
                        
                        const audioPlayer = document.getElementById('audioPlayer');
                        const downloadBtn = document.getElementById('downloadBtn');
                        
                        audioPlayer.src = audioUrl;
                        
                        // Generate filename with timestamp and voice
                        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
                        const voiceName = voice.split('-')[2] || 'voice';
                        const filename = `umar-tts-${voiceName}-${timestamp}.mp3`;
                        
                        downloadBtn.href = audioUrl;
                        downloadBtn.download = filename;
                        
                        document.getElementById('audioContainer').style.display = 'block';
                        showSuccess();
                        
                        // Auto-scroll to audio section
                        document.getElementById('audioContainer').scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'center' 
                        });
                        
                    } catch (error) {
                        console.error('Generation attempt failed:', error);
                        
                        // Check if we should retry
                        if (retryCount < maxRetries && (
                            error.message.includes('temporarily') || 
                            error.message.includes('busy') ||
                            error.message.includes('503') ||
                            error.message.includes('timeout')
                        )) {
                            retryCount++;
                            showRetrying(retryCount);
                            
                            // Wait before retrying (exponential backoff)
                            await new Promise(resolve => setTimeout(resolve, 2000 * retryCount));
                            return await attemptGeneration();
                        } else {
                            throw error;
                        }
                    }
                }
                
                try {
                    await attemptGeneration();
                } catch (error) {
                    console.error('Final error:', error);
                    let userMessage = error.message;
                    
                    // Provide helpful suggestions based on error type
                    if (error.message.includes('temporarily') || error.message.includes('busy')) {
                        userMessage += ' Try using a different voice or shortening your text.';
                    } else if (error.message.includes('timeout')) {
                        userMessage += ' Please try with shorter text.';
                    }
                    
                    showError(userMessage);
                } finally {
                    showLoading(false);
                }
            });
            
            function showLoading(show) {
                const loading = document.getElementById('loading');
                const btn = document.getElementById('generateBtn');
                
                if (show) {
                    loading.style.display = 'block';
                    btn.disabled = true;
                    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                } else {
                    loading.style.display = 'none';
                    btn.disabled = false;
                    btn.innerHTML = '<i class="fas fa-magic"></i> Generate Voice';
                }
            }
            
            function showRetrying(attempt) {
                const loading = document.getElementById('loading');
                const loadingText = loading.querySelector('p');
                if (loadingText) {
                    loadingText.innerHTML = `<strong>Retrying... (Attempt ${attempt + 1}/3)</strong><br>The service is busy, please wait...`;
                }
            }
            
            function showError(message) {
                const errorDiv = document.getElementById('error');
                let errorContent = '<i class="fas fa-exclamation-triangle"></i> ' + message;
                
                // Add helpful tips for common errors
                if (message.includes('busy') || message.includes('temporarily') || message.includes('overloaded')) {
                    errorContent += `
                        <div style="margin-top: 15px; padding: 15px; background: rgba(255,255,255,0.1); border-radius: 8px;">
                            <strong>💡 Quick Tips:</strong>
                            <ul style="margin: 8px 0 0 20px; text-align: left;">
                                <li>Try shortening your text (under 100 characters works best)</li>
                                <li>Use a different voice (try Aria or Jenny)</li>
                                <li>Wait 30-60 seconds before trying again</li>
                                <li>Avoid special characters or very long sentences</li>
                            </ul>
                        </div>
                    `;
                }
                
                errorDiv.innerHTML = errorContent;
                errorDiv.style.display = 'block';
                errorDiv.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            
            function showSuccess() {
                const successDiv = document.getElementById('success');
                successDiv.style.display = 'block';
            }
            
            function hideMessages() {
                document.getElementById('error').style.display = 'none';
                document.getElementById('success').style.display = 'none';
            }
            
            // Quick test function
            async function quickTest() {
                const originalText = textArea.value;
                textArea.value = "Hi";
                charCount.textContent = "2";
                
                // Trigger the form submission
                const form = document.getElementById('ttsForm');
                const event = new Event('submit');
                form.dispatchEvent(event);
                
                // Restore original text after a short delay
                setTimeout(() => {
                    textArea.value = originalText;
                    charCount.textContent = originalText.length;
                }, 1000);
            }
            
            // Add smooth animations
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        entry.target.style.opacity = '1';
                        entry.target.style.transform = 'translateY(0)';
                    }
                });
            });
            
            document.querySelectorAll('.feature-card').forEach(card => {
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                card.style.transition = 'all 0.6s ease';
                observer.observe(card);
            });
        </script>
    </body>
    </html>
    '''

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        text = data.get('text', '').strip()
        voice = data.get('voice', 'en-US-AriaNeural')
        rate = data.get('rate', '+0%')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 1000:
            return jsonify({'error': 'Text is too long. Maximum 1000 characters allowed.'}), 400
        
        # Validate voice parameter
        valid_voices = [
            'en-US-AriaNeural', 'en-US-DavisNeural', 'en-US-JennyNeural', 'en-US-GuyNeural',
            'en-GB-SoniaNeural', 'en-GB-RyanNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
            'es-ES-ElviraNeural', 'fr-FR-DeniseNeural', 'de-DE-KatjaNeural', 'ja-JP-NanamiNeural',
            'ko-KR-SunHiNeural', 'zh-CN-XiaoxiaoNeural'
        ]
        
        if voice not in valid_voices:
            voice = 'en-US-AriaNeural'  # Fallback to default
        
        # Generate speech using edge-tts with fallback strategies
        try:
            audio_data = asyncio.run(generate_speech(text, voice, rate))
        except asyncio.TimeoutError:
            return jsonify({'error': 'Request timed out. Please try with shorter text or try again later.'}), 504
        
        if not audio_data or len(audio_data) == 0:
            return jsonify({'error': 'No audio generated. Please try again with different settings.'}), 500
        
        # Return audio file
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        error_message = str(e)
        
        # Provide user-friendly error messages
        if "403" in error_message or "Invalid response status" in error_message:
            user_error = "The text-to-speech service is temporarily busy. Please try again in a few moments."
        elif "timeout" in error_message.lower():
            user_error = "Request timed out. Please try with shorter text or try again later."
        elif "connection" in error_message.lower():
            user_error = "Connection issue with the speech service. Please check your internet and try again."
        else:
            user_error = "Speech generation failed. Please try again with different text or voice."
        
        return jsonify({'error': user_error}), 500

async def generate_speech_with_fallback(text, voice, rate):
    """Generate speech with multiple fallback strategies"""
    
    # Strategy 1: Try with original parameters and optimized settings
    try:
        return await generate_speech_optimized(text, voice, rate)
    except Exception as e:
        logger.warning(f"Primary method failed: {str(e)}")
    
    # Strategy 2: Try with different voice from same language
    try:
        fallback_voice = get_fallback_voice(voice)
        if fallback_voice != voice:
            logger.info(f"Trying fallback voice: {fallback_voice}")
            return await generate_speech_optimized(text, fallback_voice, rate)
    except Exception as e:
        logger.warning(f"Fallback voice failed: {str(e)}")
    
    # Strategy 3: Try with default US voice and no rate
    try:
        logger.info("Trying with default voice and settings")
        return await generate_speech_optimized(text, "en-US-AriaNeural", "+0%")
    except Exception as e:
        logger.warning(f"Default voice failed: {str(e)}")
    
    # Strategy 4: Try splitting text if it's long
    if len(text) > 200:
        try:
            logger.info("Trying with shortened text")
            shortened_text = text[:200] + "..." if len(text) > 200 else text
            return await generate_speech_optimized(shortened_text, "en-US-AriaNeural", "+0%")
        except Exception as e:
            logger.warning(f"Shortened text failed: {str(e)}")
    
    # All strategies failed
    raise Exception("Speech service is currently overloaded. Please try again in 1-2 minutes with shorter text.")

def get_fallback_voice(original_voice):
    """Get a fallback voice for the same language"""
    fallbacks = {
        'en-US-AriaNeural': 'en-US-JennyNeural',
        'en-US-JennyNeural': 'en-US-AriaNeural', 
        'en-US-DavisNeural': 'en-US-GuyNeural',
        'en-US-GuyNeural': 'en-US-DavisNeural',
        'en-GB-SoniaNeural': 'en-GB-RyanNeural',
        'en-GB-RyanNeural': 'en-GB-SoniaNeural',
        'en-AU-NatashaNeural': 'en-AU-WilliamNeural',
        'en-AU-WilliamNeural': 'en-AU-NatashaNeural',
    }
    return fallbacks.get(original_voice, 'en-US-AriaNeural')

async def generate_speech_optimized(text, voice, rate):
    """Optimized speech generation with better connection handling"""
    
    # Clean and validate text
    text = text.strip()
    if len(text) == 0:
        raise Exception("Text cannot be empty")
    
    # Normalize rate format
    if rate in ["0%", "+0%", "normal"]:
        rate = "+0%"
    elif not rate.startswith(('+', '-')):
        rate = f"+{rate}"
    
    try:
        # Create communicate object with optimized settings
        communicate = edge_tts.Communicate(
            text=text,
            voice=voice,
            rate=rate
        )
        
        audio_data = b""
        chunk_count = 0
        
        # Stream with timeout handling
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                audio_data += chunk["data"]
                chunk_count += 1
                
                # Basic progress check
                if chunk_count > 1000:  # Prevent infinite loops
                    break
        
        if len(audio_data) == 0:
            raise Exception("No audio data received")
        
        logger.info(f"Successfully generated {len(audio_data)} bytes of audio")
        return audio_data
        
    except Exception as e:
        error_msg = str(e).lower()
        
        if any(keyword in error_msg for keyword in ['403', 'forbidden', 'invalid response']):
            raise Exception("Service temporarily overloaded")
        elif any(keyword in error_msg for keyword in ['timeout', 'connection']):
            raise Exception("Connection timeout")
        elif any(keyword in error_msg for keyword in ['rate', 'limit']):
            raise Exception("Rate limit exceeded")
        else:
            raise Exception(f"Generation failed: {str(e)}")

# Keep the old function name for compatibility
async def generate_speech(text, voice, rate):
    return await generate_speech_with_fallback(text, voice, rate)

@app.route('/api/voices', methods=['GET'])
def get_voices():
    """Get available voices"""
    try:
        voices = asyncio.run(edge_tts.list_voices())
        
        # Filter and format popular voices
        popular_voices = [
            'en-US-AriaNeural', 'en-US-DavisNeural', 'en-US-JennyNeural', 'en-US-GuyNeural',
            'en-GB-SoniaNeural', 'en-GB-RyanNeural', 'en-AU-NatashaNeural', 'en-AU-WilliamNeural',
            'es-ES-ElviraNeural', 'fr-FR-DeniseNeural', 'de-DE-KatjaNeural', 'ja-JP-NanamiNeural',
            'ko-KR-SunHiNeural', 'zh-CN-XiaoxiaoNeural'
        ]
        
        formatted_voices = []
        for voice in voices:
            if voice['Name'] in popular_voices:
                formatted_voices.append({
                    'name': voice['Name'],
                    'display': voice['FriendlyName'],
                    'gender': voice['Gender'],
                    'locale': voice['Locale']
                })
        
        return jsonify(formatted_voices)
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    try:
        # Test basic edge-tts availability
        test_result = asyncio.run(test_edge_tts_service())
        
        return jsonify({
            'status': 'healthy' if test_result else 'degraded',
            'service': 'Edge TTS API by Umar',
            'version': '1.0.0',
            'edge_tts_available': test_result,
            'timestamp': time.time()
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return jsonify({
            'status': 'unhealthy',
            'service': 'Edge TTS API by Umar',
            'version': '1.0.0',
            'error': str(e),
            'timestamp': time.time()
        }), 503

async def test_edge_tts_service():
    """Test if Edge TTS service is available"""
    try:
        # Quick test with minimal text
        communicate = edge_tts.Communicate("Hi", "en-US-AriaNeural")
        test_data = b""
        
        # Try to get at least some data
        async for chunk in communicate.stream():
            if chunk["type"] == "audio":
                test_data += chunk["data"]
                if len(test_data) > 1000:  # Just need some data to confirm it works
                    break
        
        return len(test_data) > 0
    except Exception as e:
        logger.warning(f"Edge TTS service test failed: {str(e)}")
        return False

# For development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Vercel serverless function handler
app_handler = app
