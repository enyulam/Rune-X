"""Configuration settings for the FastAPI backend."""
import os
from pathlib import Path

# Base directory
BASE_DIR = Path(__file__).parent.parent

# Directories
UPLOAD_DIR = BASE_DIR / "uploads"
RESULTS_DIR = BASE_DIR / "results"

# Create directories if they don't exist
UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
RESULTS_DIR.mkdir(parents=True, exist_ok=True)

# API settings
API_PREFIX = "/api/v1"

# Model settings
PADDLE_LANG = "ch"
MARIAN_MODEL = "Helsinki-NLP/opus-mt-zh-en"

# CEDICT dictionary path (will be downloaded if needed)
CEDICT_PATH = BASE_DIR / "data" / "cedict_ts.u8"

# File settings
ALLOWED_EXTENSIONS = {".png", ".jpg", ".jpeg", ".bmp", ".tiff", ".webp"}
MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB
