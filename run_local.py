#!/usr/bin/env python3
"""
Local development server for Edge TTS
Run this file to start the development server locally
"""

from api.app import app

if __name__ == '__main__':
    print("🎤 Starting Edge TTS Development Server...")
    print("📍 Server will be available at: http://localhost:5000")
    print("🛑 Press Ctrl+C to stop the server")
    print("-" * 50)
    
    app.run(
        debug=True,
        host='0.0.0.0',
        port=5000,
        use_reloader=True
    )
