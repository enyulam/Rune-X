# Rune-X Backend

FastAPI backend for Chinese OCR and translation. Processes uploaded images to extract Chinese text, provides character-level meanings, and full sentence translations.

## Features

- **OCR:** EasyOCR for Chinese text recognition
- **Segmentation:** Jieba for word/phrase segmentation
- **Dictionary:** CC-CEDICT for character-level translations
- **Translation:** Helsinki-NLP MarianMT (Chinese → English)
- **File Validation:** Size limits, MIME type checking, extension validation
- **Error Handling:** Comprehensive error handling with structured error responses
- **Logging:** Configurable logging levels

## Requirements

- Python 3.11+ (tested with Python 3.13)
- See `requirements.txt` for all dependencies

## Installation

1. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env and set:
   # MODEL_CACHE_DIR=./backend/models
   # LOG_LEVEL=DEBUG
   ```

4. **Download CEDICT dictionary:**
   ```bash
   # The dictionary should be at backend/data/cedict_ts.u8
   # If missing, download from: https://www.mdbg.net/chinese/dictionary?page=cc-cedict
   ```

## Running the Server

```bash
cd backend
# Set PYTHONPATH if needed
export PYTHONPATH=$(pwd)  # On Windows: set PYTHONPATH=%cd%
uvicorn src.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`

## API Endpoints

### `POST /process`
Upload an image for OCR processing.

**Request:**
- Content-Type: `multipart/form-data`
- Field: `file` (image file, max 10MB, JPG/PNG)

**Response:**
```json
{
  "image_id": "uuid",
  "original_text": "extracted Chinese text",
  "segmented_text": ["word1", "word2"],
  "characters": [
    {
      "char": "字",
      "pinyin": "zì",
      "english": "character",
      "confidence": 0.95
    }
  ],
  "translation": "English translation",
  "message": "Processing completed"
}
```

### `GET /results/{image_id}`
Retrieve processing results for a specific image.

**Response:** Same structure as `/process` response

### `GET /health`
Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "message": "OCR API is running"
}
```

## Project Structure

```
backend/
├── src/
│   ├── main.py          # FastAPI app and endpoints
│   ├── ocr.py           # EasyOCR integration
│   ├── translate.py     # MarianMT translation
│   ├── utils.py         # CEDICT, pinyin, validation utilities
│   ├── models.py        # Pydantic models
│   └── config.py        # Configuration constants
├── data/
│   └── cedict_ts.u8     # CEDICT dictionary file
├── uploads/             # Uploaded images (created automatically)
├── results/             # JSON results (created automatically)
├── requirements.txt     # Python dependencies
└── Dockerfile          # Docker configuration
```

## Testing

Run tests with pytest:
```bash
pytest backend/tests/
```

## Environment Variables

- `MODEL_CACHE_DIR`: Directory for caching ML models (default: `./backend/models`)
- `LOG_LEVEL`: Logging level - DEBUG, INFO, WARNING, ERROR (default: INFO)

## Notes

- EasyOCR will download models on first run (may take a few minutes)
- MarianMT models are cached in `MODEL_CACHE_DIR`
- CEDICT dictionary is loaded once at startup
- Uploaded images and results are stored in local filesystem
