"""FastAPI main application."""
import os
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import jieba

from src.config import UPLOAD_DIR, RESULTS_DIR, CEDICT_PATH
from src.models import ProcessResponse, ResultResponse, HealthResponse, CharacterData
from src.ocr import OCRProcessor
from src.translate import Translator
from src.utils import (
    load_cedict, get_pinyin, get_char_english, 
    generate_image_id, validate_image_file
)
import json

# Initialize FastAPI app
app = FastAPI(
    title="Rune-X OCR API",
    description="FastAPI backend for Chinese OCR with translation",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify actual origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize processors (lazy loading)
ocr_processor: Optional[OCRProcessor] = None
translator: Optional[Translator] = None
cedict: dict = {}

# Initialize on startup
@app.on_event("startup")
async def startup_event():
    """Initialize OCR processor, translator, and CEDICT on startup."""
    global ocr_processor, translator, cedict
    
    try:
        ocr_processor = OCRProcessor()
        print("✓ OCR processor initialized")
    except Exception as e:
        print(f"✗ Failed to initialize OCR processor: {e}")
        ocr_processor = None
    
    try:
        translator = Translator()
        print("✓ Translator initialized")
    except Exception as e:
        print(f"✗ Failed to initialize translator: {e}")
        translator = None
    
    try:
        cedict = load_cedict(CEDICT_PATH)
        print(f"✓ CEDICT dictionary loaded ({len(cedict)} entries)")
    except Exception as e:
        print(f"✗ Failed to load CEDICT: {e}")
        cedict = {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint."""
    return HealthResponse(
        status="healthy",
        message="OCR API is running"
    )


@app.post("/process", response_model=ProcessResponse)
async def process_image(file: UploadFile = File(...)):
    """
    Process uploaded image:
    1. Validate and save image
    2. Run PaddleOCR
    3. Segment with jieba
    4. Generate pinyin and English for each character
    5. Translate full text
    6. Save and return results
    """
    if ocr_processor is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="OCR processor is not available"
        )
    
    # Read file content
    contents = await file.read()
    file_size = len(contents)
    
    # Validate file
    is_valid, error_msg = validate_image_file(file.filename, file_size)
    if not is_valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=error_msg
        )
    
    # Generate image ID
    image_id = generate_image_id()
    
    # Save uploaded image
    image_path = UPLOAD_DIR / f"{image_id}.png"
    with open(image_path, "wb") as f:
        f.write(contents)
    
    try:
        # Run OCR
        original_text, char_confidence = ocr_processor.process_image(contents)
        
        if not original_text:
            return ProcessResponse(
                image_id=image_id,
                original_text="",
                segmented_text=[],
                characters=[],
                translation="",
                message="No text detected in image"
            )
        
        # Segment with jieba
        segmented_text = list(jieba.cut(original_text, cut_all=False))
        
        # Process each character
        characters = []
        for char, confidence in char_confidence:
            if char.strip():  # Skip whitespace
                pinyin = get_pinyin(char)
                english = get_char_english(char, cedict)
                
                characters.append(CharacterData(
                    char=char,
                    pinyin=pinyin,
                    english=english,
                    confidence=confidence
                ))
        
        # Translate full text
        translation = ""
        if translator:
            translation = translator.translate(original_text)
        
        # Prepare response
        result_data = {
            "image_id": image_id,
            "original_text": original_text,
            "segmented_text": segmented_text,
            "characters": [char.dict() for char in characters],
            "translation": translation
        }
        
        # Save result to JSON
        result_path = RESULTS_DIR / f"{image_id}.json"
        with open(result_path, "w", encoding="utf-8") as f:
            json.dump(result_data, f, ensure_ascii=False, indent=2)
        
        return ProcessResponse(
            image_id=image_id,
            original_text=original_text,
            segmented_text=segmented_text,
            characters=characters,
            translation=translation,
            message="Image processed successfully"
        )
    
    except Exception as e:
        # Clean up uploaded file on error
        if image_path.exists():
            image_path.unlink()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error processing image: {str(e)}"
        )


@app.get("/results/{image_id}", response_model=ResultResponse)
async def get_results(image_id: str):
    """Retrieve stored processing results by image ID."""
    result_path = RESULTS_DIR / f"{image_id}.json"
    
    if not result_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Results not found for image_id: {image_id}"
        )
    
    try:
        with open(result_path, "r", encoding="utf-8") as f:
            result_data = json.load(f)
        
        # Convert character dicts back to CharacterData objects
        characters = [CharacterData(**char) for char in result_data["characters"]]
        
        return ResultResponse(
            image_id=result_data["image_id"],
            original_text=result_data["original_text"],
            segmented_text=result_data["segmented_text"],
            characters=characters,
            translation=result_data["translation"]
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error reading results: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
