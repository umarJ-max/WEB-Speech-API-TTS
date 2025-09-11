from flask import Flask, request, jsonify, send_file
from flask_cors import CORS
import edge_tts
import asyncio
import io

app = Flask(__name__)
CORS(app)

@app.route('/')
def home():
    return '''
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Edge TTS - Professional Text to Speech</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }
            
            body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                min-height: 100vh;
                display: flex;
                align-items: center;
                justify-content: center;
                padding: 20px;
                line-height: 1.6;
            }
            
            .container {
                background: white;
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0,0,0,0.15);
                padding: 40px;
                max-width: 700px;
                width: 100%;
                backdrop-filter: blur(10px);
            }
            
            .header {
                text-align: center;
                margin-bottom: 40px;
            }
            
            .header h1 {
                font-size: 2.8rem;
                margin-bottom: 15px;
                background: linear-gradient(45deg, #667eea, #764ba2);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
                background-clip: text;
                font-weight: 700;
            }
            
            .header p {
                color: #666;
                font-size: 1.2rem;
                font-weight: 300;
            }
            
            .form-group {
                margin-bottom: 25px;
            }
            
            label {
                display: block;
                margin-bottom: 10px;
                font-weight: 600;
                color: #333;
                font-size: 0.95rem;
            }
            
            textarea, select {
                width: 100%;
                padding: 16px;
                border: 2px solid #e1e5e9;
                border-radius: 12px;
                font-size: 16px;
                transition: all 0.3s ease;
                background: #f8f9fa;
                font-family: inherit;
            }
            
            textarea:focus, select:focus {
                outline: none;
                border-color: #667eea;
                background: white;
                box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
            }
            
            textarea {
                resize: vertical;
                min-height: 140px;
            }
            
            .controls {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 20px;
                margin-bottom: 30px;
            }
            
            @media (max-width: 600px) {
                .controls {
                    grid-template-columns: 1fr;
                }
                .container {
                    padding: 30px 20px;
                }
            }
            
            .btn {
                background: linear-gradient(45deg, #667eea, #764ba2);
                color: white;
                border: none;
                padding: 16px 32px;
                border-radius: 12px;
                font-size: 16px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                width: 100%;
                position: relative;
                overflow: hidden;
            }
            
            .btn:before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
                transition: left 0.5s;
            }
            
            .btn:hover:before {
                left: 100%;
            }
            
            .btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4);
            }
            
            .btn:disabled {
                opacity: 0.7;
                cursor: not-allowed;
                transform: none;
                box-shadow: none;
            }
            
            .loading {
                display: none;
                text-align: center;
                margin: 30px 0;
            }
            
            .spinner {
                width: 40px;
                height: 40px;
                border: 4px solid #f3f3f3;
                border-top: 4px solid #667eea;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin: 0 auto 15px;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
            
            .audio-container {
                margin-top: 30px;
                text-align: center;
                display: none;
                animation: fadeIn 0.5s ease-in;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; transform: translateY(20px); }
                to { opacity: 1; transform: translateY(0); }
            }
            
            audio {
                width: 100%;
                border-radius: 12px;
                box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            }
            
            .download-btn {
                display: inline-block;
                margin-top: 15px;
                padding: 10px 20px;
                background: #28a745;
                color: white;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 500;
                transition: all 0.3s ease;
            }
            
            .download-btn:hover {
                background: #218838;
                transform: translateY(-1px);
            }
            
            .message {
                padding: 16px;
                border-radius: 12px;
                margin: 20px 0;
                display: none;
                font-weight: 500;
            }
            
            .error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a5a);
                color: white;
            }
            
            .success {
                background: linear-gradient(135deg, #51cf66, #40c057);
                color: white;
            }
            
            .footer {
                text-align: center;
                margin-top: 40px;
                color: #888;
                font-size: 0.9rem;
            }
            
            .features {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }
            
            .feature {
                text-align: center;
                padding: 20px;
                background: linear-gradient(135deg, #f8f9fa, #e9ecef);
                border-radius: 12px;
                border: 1px solid #dee2e6;
            }
            
            .feature-icon {
                font-size: 2rem;
                margin-bottom: 10px;
            }
            
            .char-count {
                text-align: right;
                font-size: 0.85rem;
                color: #666;
                margin-top: 5px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🎤 Edge TTS</h1>
                <p>Professional Text-to-Speech Service</p>
            </div>
            
            <div class="features">
                <div class="feature">
                    <div class="feature-icon">🌍</div>
                    <strong>Multi-Language</strong>
                    <p>Support for 15+ languages</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">⚡</div>
                    <strong>Fast & Reliable</strong>
                    <p>Instant audio generation</p>
                </div>
                <div class="feature">
                    <div class="feature-icon">🎭</div>
                    <strong>Natural Voices</strong>
                    <p>High-quality neural voices</p>
                </div>
            </div>
            
            <form id="ttsForm">
                <div class="form-group">
                    <label for="text">Enter your text:</label>
                    <textarea id="text" name="text" placeholder="Type or paste your text here. You can enter up to 1000 characters..." maxlength="1000" required></textarea>
                    <div class="char-count">
                        <span id="charCount">0</span>/1000 characters
                    </div>
                </div>
                
                <div class="controls">
                    <div class="form-group">
                        <label for="voice">Voice:</label>
                        <select id="voice" name="voice">
                            <option value="en-US-AriaNeural">🇺🇸 Aria (US Female)</option>
                            <option value="en-US-DavisNeural">🇺🇸 Davis (US Male)</option>
                            <option value="en-US-JennyNeural">🇺🇸 Jenny (US Female)</option>
                            <option value="en-US-GuyNeural">🇺🇸 Guy (US Male)</option>
                            <option value="en-GB-SoniaNeural">🇬🇧 Sonia (UK Female)</option>
                            <option value="en-GB-RyanNeural">🇬🇧 Ryan (UK Male)</option>
                            <option value="en-AU-NatashaNeural">🇦🇺 Natasha (AU Female)</option>
                            <option value="en-AU-WilliamNeural">🇦🇺 William (AU Male)</option>
                            <option value="es-ES-ElviraNeural">🇪🇸 Elvira (Spanish Female)</option>
                            <option value="fr-FR-DeniseNeural">🇫🇷 Denise (French Female)</option>
                            <option value="de-DE-KatjaNeural">🇩🇪 Katja (German Female)</option>
                            <option value="ja-JP-NanamiNeural">🇯🇵 Nanami (Japanese Female)</option>
                            <option value="ko-KR-SunHiNeural">🇰🇷 SunHi (Korean Female)</option>
                            <option value="zh-CN-XiaoxiaoNeural">🇨🇳 Xiaoxiao (Chinese Female)</option>
                        </select>
                    </div>
                    
                    <div class="form-group">
                        <label for="rate">Speech Rate:</label>
                        <select id="rate" name="rate">
                            <option value="-50%">🐌 Very Slow</option>
                            <option value="-25%">🐢 Slow</option>
                            <option value="0%" selected>🚶 Normal</option>
                            <option value="+25%">🏃 Fast</option>
                            <option value="+50%">🚀 Very Fast</option>
                        </select>
                    </div>
                </div>
                
                <button type="submit" class="btn" id="generateBtn">
                    🎵 Generate Speech
                </button>
            </form>
            
            <div class="loading" id="loading">
                <div class="spinner"></div>
                <p>Generating your speech...</p>
            </div>
            
            <div class="message error" id="error"></div>
            <div class="message success" id="success">
                🎉 Speech generated successfully!
            </div>
            
            <div class="audio-container" id="audioContainer">
                <audio controls id="audioPlayer">
                    Your browser does not support the audio element.
                </audio>
                <br>
                <a href="#" class="download-btn" id="downloadBtn" download="speech.mp3">
                    📥 Download Audio
                </a>
            </div>
            
            <div class="footer">
                <p>Powered by Microsoft Edge TTS • Built with ❤️ for the community</p>
            </div>
        </div>
        
        <script>
            // Character counter
            const textArea = document.getElementById('text');
            const charCount = document.getElementById('charCount');
            
            textArea.addEventListener('input', function() {
                charCount.textContent = this.value.length;
            });
            
            // Default text
            document.addEventListener('DOMContentLoaded', function() {
                if (!textArea.value) {
                    textArea.value = "Welcome to Edge TTS! This is a professional text-to-speech service that converts your text into natural-sounding audio using Microsoft's advanced neural voice technology.";
                    charCount.textContent = textArea.value.length;
                }
            });
            
            document.getElementById('ttsForm').addEventListener('submit', async function(e) {
                e.preventDefault();
                
                const text = textArea.value.trim();
                const voice = document.getElementById('voice').value;
                const rate = document.getElementById('rate').value;
                
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
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to generate speech');
                    }
                    
                    const blob = await response.blob();
                    const audioUrl = URL.createObjectURL(blob);
                    
                    const audioPlayer = document.getElementById('audioPlayer');
                    const downloadBtn = document.getElementById('downloadBtn');
                    
                    audioPlayer.src = audioUrl;
                    downloadBtn.href = audioUrl;
                    
                    document.getElementById('audioContainer').style.display = 'block';
                    showSuccess();
                    
                } catch (error) {
                    console.error('Error:', error);
                    showError(error.message || 'An error occurred while generating speech.');
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
                    btn.textContent = 'Generating...';
                } else {
                    loading.style.display = 'none';
                    btn.disabled = false;
                    btn.textContent = '🎵 Generate Speech';
                }
            }
            
            function showError(message) {
                const errorDiv = document.getElementById('error');
                errorDiv.textContent = '❌ ' + message;
                errorDiv.style.display = 'block';
            }
            
            function showSuccess() {
                const successDiv = document.getElementById('success');
                successDiv.style.display = 'block';
            }
            
            function hideMessages() {
                document.getElementById('error').style.display = 'none';
                document.getElementById('success').style.display = 'none';
            }
        </script>
    </body>
    </html>
    '''

@app.route('/api/tts', methods=['POST'])
def text_to_speech():
    try:
        data = request.get_json()
        text = data.get('text', '')
        voice = data.get('voice', 'en-US-AriaNeural')
        rate = data.get('rate', '0%')
        
        if not text:
            return jsonify({'error': 'Text is required'}), 400
        
        if len(text) > 1000:
            return jsonify({'error': 'Text is too long. Maximum 1000 characters allowed.'}), 400
        
        # Generate speech using edge-tts
        audio_data = asyncio.run(generate_speech(text, voice, rate))
        
        # Return audio file
        return send_file(
            io.BytesIO(audio_data),
            mimetype='audio/mpeg',
            as_attachment=False,
            download_name='speech.mp3'
        )
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

async def generate_speech(text, voice, rate):
    communicate = edge_tts.Communicate(text, voice, rate=rate)
    audio_data = b""
    async for chunk in communicate.stream():
        if chunk["type"] == "audio":
            audio_data += chunk["data"]
    return audio_data

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
    return jsonify({
        'status': 'healthy',
        'service': 'Edge TTS API',
        'version': '1.0.0'
    })

# For development
if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)

# Vercel serverless function handler
app_handler = app
