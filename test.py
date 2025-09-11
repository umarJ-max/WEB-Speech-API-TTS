#!/usr/bin/env python3
"""
Test script for Edge-TTS application
"""

import requests
import json
import sys
import os

def test_local_server(base_url="http://localhost:5000"):
    """Test the local server endpoints"""
    
    print("🧪 Testing Edge-TTS Application...")
    print(f"📍 Base URL: {base_url}")
    
    # Test 1: Health check
    print("\n1️⃣ Testing health endpoint...")
    try:
        response = requests.get(f"{base_url}/api/health")
        if response.status_code == 200:
            print("✅ Health check passed")
            print(f"   Response: {response.json()}")
        else:
            print(f"❌ Health check failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Health check failed: {e}")
        return False
    
    # Test 2: Get voices
    print("\n2️⃣ Testing voices endpoint...")
    try:
        response = requests.get(f"{base_url}/api/voices")
        if response.status_code == 200:
            voices = response.json()
            print(f"✅ Voices endpoint passed - Found {len(voices)} voices")
            print(f"   Sample voices: {[v['Name'] for v in voices[:3]]}")
        else:
            print(f"❌ Voices endpoint failed: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Voices endpoint failed: {e}")
        return False
    
    # Test 3: Text-to-speech
    print("\n3️⃣ Testing TTS endpoint...")
    try:
        tts_data = {
            "text": "Hello, this is a test of Edge TTS!",
            "voice": "en-US-AriaNeural",
            "rate": "medium",
            "pitch": "medium"
        }
        
        response = requests.post(
            f"{base_url}/api/tts",
            headers={"Content-Type": "application/json"},
            json=tts_data
        )
        
        if response.status_code == 200:
            # Save the audio file
            with open("test_output.mp3", "wb") as f:
                f.write(response.content)
            
            file_size = len(response.content)
            print(f"✅ TTS endpoint passed - Generated {file_size} bytes audio")
            print("   📁 Audio saved as 'test_output.mp3'")
        else:
            print(f"❌ TTS endpoint failed: {response.status_code}")
            if response.headers.get('content-type') == 'application/json':
                print(f"   Error: {response.json()}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ TTS endpoint failed: {e}")
        return False
    
    print("\n🎉 All tests passed! The application is working correctly.")
    return True

def test_edge_tts_directly():
    """Test edge-tts library directly"""
    print("\n🔧 Testing edge-tts library directly...")
    
    try:
        import edge_tts
        import asyncio
        
        async def test_tts():
            # Test voice listing
            voices = await edge_tts.list_voices()
            print(f"✅ Found {len(voices)} voices available")
            
            # Test speech generation
            text = "Testing Edge TTS library directly"
            voice = "en-US-AriaNeural"
            
            communicate = edge_tts.Communicate(text, voice)
            await communicate.save("direct_test.mp3")
            
            if os.path.exists("direct_test.mp3"):
                file_size = os.path.getsize("direct_test.mp3")
                print(f"✅ Direct TTS test passed - Generated {file_size} bytes")
                print("   📁 Audio saved as 'direct_test.mp3'")
                return True
            else:
                print("❌ Direct TTS test failed - No audio file generated")
                return False
        
        return asyncio.run(test_tts())
        
    except ImportError:
        print("❌ edge-tts library not installed")
        return False
    except Exception as e:
        print(f"❌ Direct TTS test failed: {e}")
        return False

if __name__ == "__main__":
    print("🚀 Edge-TTS Application Test Suite")
    print("=" * 50)
    
    # Test edge-tts library first
    if not test_edge_tts_directly():
        print("\n⚠️  Please install dependencies: pip install -r requirements.txt")
        sys.exit(1)
    
    # Check if server is running
    if len(sys.argv) > 1:
        base_url = sys.argv[1]
    else:
        base_url = "http://localhost:5000"
    
    print(f"\n📡 Testing server at {base_url}")
    print("💡 Make sure the server is running: python api/index.py")
    
    if test_local_server(base_url):
        print("\n🎊 All tests completed successfully!")
        print("\n📋 Next steps:")
        print("   1. Test the web interface at http://localhost:5000")
        print("   2. Deploy to Vercel: vercel")
        print("   3. Check the generated audio files")
    else:
        print("\n❌ Some tests failed. Please check the server and try again.")
        sys.exit(1)
