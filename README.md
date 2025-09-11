# Edge-TTS Python Application for Vercel

A modern Text-to-Speech application using Microsoft Edge's TTS service, built with Python Flask and deployable on Vercel.

## 🚀 Features

- **High-Quality Speech Synthesis**: Uses Microsoft Edge's TTS engine
- **Multiple Voices**: Support for 100+ voices in different languages
- **Customizable Speech**: Adjust rate, pitch, and voice
- **Web Interface**: Beautiful, responsive web UI
- **REST API**: Easy-to-use JSON API endpoints
- **Vercel Ready**: Optimized for serverless deployment

## 🎯 Live Demo

Access the application at your Vercel deployment URL after deployment.

## 📋 API Endpoints

### 1. Web Interface
- **GET** `/` - Interactive web interface

### 2. Generate Speech
- **POST** `/api/tts`
- **Body**: 
```json
{
  "text": "Hello, world!",
  "voice": "en-US-AriaNeural",
  "rate": "medium",
  "pitch": "medium"
}
```
- **Response**: Audio file (MP3)

### 3. List Available Voices
- **GET** `/api/voices`
- **Response**: JSON array of available voices

### 4. Health Check
- **GET** `/api/health`
- **Response**: Service status

## 🛠️ Local Development

### Prerequisites
- Python 3.8+
- pip

### Setup
1. Clone or download the project
2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Run the application:
```bash
python api/index.py
```

4. Open http://localhost:5000 in your browser

## 🚀 Deploy to Vercel

### Method 1: Vercel CLI
1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Method 2: Git Integration
1. Push code to GitHub/GitLab/Bitbucket
2. Connect repository to Vercel
3. Deploy automatically

### Method 3: Drag & Drop
1. Zip the project folder
2. Go to [vercel.com](https://vercel.com)
3. Drag and drop the zip file

## 🎛️ Configuration

### Environment Variables (Optional)
You can set these in Vercel dashboard:
- `FLASK_ENV`: Set to `production` for production deployment

### Voice Options
Popular voices included:
- **English (US)**: Aria, Davis, Guy, Jenny
- **English (UK)**: Libby, Maisie
- **English (AU)**: Natasha
- **Spanish**: Elvira
- **French**: Denise
- **German**: Katja
- **Italian**: Elsa
- **Japanese**: Nanami
- **Korean**: SunHi
- **Chinese**: Xiaoxiao

### Speech Parameters
- **Rate**: x-slow, slow, medium, fast, x-fast
- **Pitch**: x-low, low, medium, high, x-high

## 📁 Project Structure

```
text-to-speech/
├── api/
│   └── index.py          # Main Flask application
├── requirements.txt      # Python dependencies
├── vercel.json          # Vercel configuration
└── README.md           # This file
```

## 🔧 Technical Details

- **Framework**: Flask (Python)
- **TTS Engine**: edge-tts (Microsoft Edge TTS)
- **Deployment**: Vercel Serverless Functions
- **Audio Format**: MP3
- **Frontend**: Vanilla HTML/CSS/JavaScript

## 🌟 Usage Examples

### cURL Examples

#### Generate Speech
```bash
curl -X POST \
  https://your-app.vercel.app/api/tts \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Hello from Edge TTS!",
    "voice": "en-US-AriaNeural",
    "rate": "medium",
    "pitch": "medium"
  }' \
  --output speech.mp3
```

#### Get Voices
```bash
curl https://your-app.vercel.app/api/voices
```

### JavaScript Example
```javascript
// Generate speech
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    text: 'Hello, world!',
    voice: 'en-US-AriaNeural',
    rate: 'medium',
    pitch: 'medium'
  })
});

const audioBlob = await response.blob();
const audioUrl = URL.createObjectURL(audioBlob);

// Play audio
const audio = new Audio(audioUrl);
audio.play();
```

### Python Example
```python
import requests

# Generate speech
response = requests.post('https://your-app.vercel.app/api/tts', 
  json={
    'text': 'Hello from Python!',
    'voice': 'en-US-AriaNeural',
    'rate': 'medium',
    'pitch': 'medium'
  }
)

# Save audio file
with open('speech.mp3', 'wb') as f:
    f.write(response.content)
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test locally
5. Submit a pull request

## 📝 License

This project is open source and available under the MIT License.

## 🆘 Support

- Create an issue for bugs or feature requests
- Check existing issues before creating new ones
- Provide detailed information for faster resolution

## 🔗 Links

- [Edge-TTS GitHub](https://github.com/rany2/edge-tts)
- [Vercel Documentation](https://vercel.com/docs)
- [Flask Documentation](https://flask.palletsprojects.com/)

---

**Happy Speech Synthesis! 🎤✨**
