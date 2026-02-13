import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Get API key from environment (never hardcode secrets!)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# Validate that the key exists
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found! Check your backend/.env file")