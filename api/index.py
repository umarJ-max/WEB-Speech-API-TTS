# Vercel serverless function entry point
from app import app_handler as app

# For local development
if __name__ == '__main__':
    from app import app as flask_app
    flask_app.run(debug=True, host='0.0.0.0', port=5000)
