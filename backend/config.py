"""
Configuration Module
Loads all settings from .env file.

WHY .env FILES?
- Secrets (API keys, JWT secrets) should NEVER be in code
- Different environments (dev, staging, production) have different settings
- .gitignore excludes .env so secrets don't get pushed to GitHub

This is the same pattern used in Java's application.properties
or Spring Boot's @Value annotations.
"""

import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# === API Keys ===
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")

# === Authentication ===
JWT_SECRET = os.getenv("JWT_SECRET", "fallback-secret-not-for-production")
JWT_EXPIRATION_HOURS = 24  # Token expires after 24 hours

# === Database ===
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017/gg_nexus")

# === Validation ===
if not GEMINI_API_KEY:
    raise ValueError("GEMINI_API_KEY not found! Check your backend/.env file")