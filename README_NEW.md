# 🎤 Edge TTS - Professional Text-to-Speech Service

A beautiful, fast, and reliable text-to-speech web application powered by Microsoft's Edge TTS technology. Convert any text into natural-sounding speech with high-quality neural voices in multiple languages.

![Edge TTS Demo](https://img.shields.io/badge/Demo-Live-brightgreen)
![Python](https://img.shields.io/badge/Python-3.8+-blue)
![Flask](https://img.shields.io/badge/Flask-3.0.0-red)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black)

## ✨ Features

- 🌍 **Multi-Language Support**: 15+ languages including English, Spanish, French, German, Japanese, Korean, Chinese
- 🎭 **Natural Voices**: High-quality neural voices (male and female options)
- ⚡ **Fast Processing**: Instant audio generation with optimized performance
- 📱 **Responsive Design**: Beautiful UI that works on desktop and mobile
- 🎚️ **Customizable**: Adjustable speech rate and voice selection
- 📥 **Download Support**: Save generated audio as MP3 files
- 🚀 **Serverless Ready**: Optimized for Vercel deployment

## 🌐 Available Voices

### English
- 🇺🇸 Aria, Davis, Jenny, Guy (US English)
- 🇬🇧 Sonia, Ryan (UK English)
- 🇦🇺 Natasha, William (Australian English)

### Other Languages
- 🇪🇸 Elvira (Spanish)
- 🇫🇷 Denise (French)
- 🇩🇪 Katja (German)
- 🇯🇵 Nanami (Japanese)
- 🇰🇷 SunHi (Korean)
- 🇨🇳 Xiaoxiao (Chinese)

## 🚀 Quick Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/edge-tts)

1. Click the "Deploy with Vercel" button above
2. Connect your GitHub account
3. Deploy the repository
4. Your Edge TTS service will be live in minutes!

## 🛠️ Local Development

### Prerequisites
- Python 3.8 or higher
- pip package manager

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/edge-tts.git
   cd edge-tts
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application**
   ```bash
   python api/app.py
   ```

4. **Open your browser**
   Navigate to `http://localhost:5000`

## 📋 API Endpoints

### GET `/`
Returns the main web interface

### POST `/api/tts`
Generate speech from text

**Request Body:**
```json
{
  "text": "Hello, world!",
  "voice": "en-US-AriaNeural",
  "rate": "0%"
}
```

**Response:**
- Content-Type: `audio/mpeg`
- Binary MP3 audio data

### GET `/api/voices`
Get list of available voices

**Response:**
```json
[
  {
    "name": "en-US-AriaNeural",
    "display": "Aria (US Female)",
    "gender": "Female",
    "locale": "en-US"
  }
]
```

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "healthy",
  "service": "Edge TTS API",
  "version": "1.0.0"
}
```

## 🎨 User Interface

The application features a modern, responsive design with:

- **Clean Interface**: Intuitive form with text input, voice selection, and rate control
- **Real-time Feedback**: Loading states and error handling
- **Audio Player**: Built-in player with download functionality
- **Character Counter**: Real-time character count (1000 character limit)
- **Mobile Responsive**: Optimized for all device sizes

## ⚙️ Configuration

### Speech Rate Options
- Very Slow (-50%)
- Slow (-25%)
- Normal (0%) - Default
- Fast (+25%)
- Very Fast (+50%)

### Voice Selection
Choose from high-quality neural voices across multiple languages and regions.

## 🔧 Technical Details

### Backend
- **Framework**: Flask 3.0.0
- **TTS Engine**: Microsoft Edge TTS (edge-tts 6.1.9)
- **CORS**: Enabled for cross-origin requests
- **Async Support**: Asynchronous audio generation

### Frontend
- **Vanilla JavaScript**: No external dependencies
- **CSS Grid/Flexbox**: Modern responsive layout
- **Progressive Enhancement**: Works without JavaScript for basic functionality

### Deployment
- **Platform**: Vercel Serverless Functions
- **Runtime**: Python 3.9+
- **Build System**: Automatic dependency detection
- **CDN**: Global edge network for fast delivery

## 📊 Performance

- **Response Time**: < 2 seconds for typical text
- **Concurrent Users**: Scales automatically with Vercel
- **Audio Quality**: 22kHz MP3 output
- **Text Limit**: 1000 characters per request

## 🔒 Security & Limits

- **Rate Limiting**: Handled by Vercel platform
- **Input Validation**: Text length and content validation
- **CORS Policy**: Configured for safe cross-origin requests
- **No Data Storage**: Text and audio are not stored

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Microsoft Edge TTS team for the excellent TTS technology
- Flask community for the robust web framework
- Vercel for the amazing serverless platform

## 📞 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/yourusername/edge-tts/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

---

**Made with ❤️ for the community**

*Happy voice generation! 🎉*
