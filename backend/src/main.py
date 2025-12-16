"""FastAPI main application with enhanced error handling and logging."""
import os
import logging
from pathlib import Path
from typing import Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, status, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import jieba

from src.config import UPLOAD_DIR, RESULTS_DIR, CEDICT_PATH, MAX_FILE_SIZE
from src.models import (
    ProcessResponse, ResultResponse, HealthResponse, CharacterData, ErrorResponse
)
from src.ocr import OCRProcessor
from src.translate import Translator
from src.utils import (
    load_cedict, get_pinyin, get_char_english, 
    generate_image_id, validate_image_file, validate_mime_type
)
import json

# Configure logging
LOG_LEVEL = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(
    level=getattr(logging, LOG_LEVEL, logging.INFO),
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger(__name__)

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

# Rate limiting placeholder (commented out - implement with slowapi or similar)
# from slowapi import Limiter, _rate_limit_exceeded_handler
# from slowapi.util import get_remote_address
# from slowapi.errors import RateLimitExceeded
# limiter = Limiter(key_func=get_remote_address)
# app.state.limiter = limiter
# app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
# @limiter.limit("10/minute")  # Example: 10 requests per minute

# Initialize processors (lazy loading)
ocr_processor: Optional[OCRProcessor] = None
translator: Optional[Translator] = None
cedict: dict = {}


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global exception handler for unhandled exceptions.
    
    Args:
        request: The request object
        exc: The exception that was raised
        
    Returns:
        JSONResponse with structured error information
    """
    logger.error(f"Unhandled exception: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred",
            "detail": str(exc) if os.getenv("LOG_LEVEL", "").upper() == "DEBUG" else None
        }
    )


@app.on_event("startup")
async def startup_event():
    """
    Initialize OCR processor, translator, and CEDICT on startup.
    
    Handles initialization errors gracefully and logs them appropriately.
    """
    global ocr_processor, translator, cedict
    
    # Initialize OCR processor with error handling
    try:
        ocr_processor = OCRProcessor()
        logger.info("OCR processor initialized successfully")
    except ImportError as e:
        logger.warning(f"PaddleOCR not available: {e}")
        ocr_processor = None
    except Exception as e:
        logger.error(f"Failed to initialize OCR processor: {e}", exc_info=True)
        ocr_processor = None
    
    # Initialize translator with error handling
    try:
        translator = Translator()
        logger.info("Translator initialized successfully")
    except ImportError as e:
        logger.warning(f"Transformers/MarianMT not available: {e}")
        translator = None
    except Exception as e:
        logger.error(f"Failed to initialize translator: {e}", exc_info=True)
        translator = None
    
    # Load CEDICT dictionary with error handling
    try:
        cedict = load_cedict(CEDICT_PATH)
        logger.info(f"CEDICT dictionary loaded successfully ({len(cedict)} entries)")
    except Exception as e:
        logger.error(f"Failed to load CEDICT dictionary: {e}", exc_info=True)
        cedict = {}


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """
    Health check endpoint to verify API status.
    
    Returns:
        HealthResponse: Status information about the API
    """
    return HealthResponse(
        status="healthy",
        message="OCR API is running"
    )


@app.post("/process", response_model=ProcessResponse, responses={
    400: {"model": ErrorResponse},
    503: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def process_image(file: UploadFile = File(...)):
    """
    Process uploaded image with OCR, segmentation, and translation.
    
    Steps:
    1. Validate file (size, extension, MIME type)
    2. Save image to uploads directory
    3. Run PaddleOCR for text extraction
    4. Segment text with jieba
    5. Generate pinyin and English translations for each character
    6. Translate full text using MarianMT
    7. Save results and return response
    
    Args:
        file: Uploaded image file (multipart/form-data)
        
    Returns:
        ProcessResponse: Processing results with OCR text, segmentation, characters, and translation
        
    Raises:
        HTTPException: 400 for validation errors, 503 for service unavailable, 500 for processing errors
    """
    image_id = None
    image_path = None
    
    try:
        # Check if OCR processor is available
        if ocr_processor is None:
            logger.error("OCR processor not available")
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail={
                    "error": "ServiceUnavailable",
                    "message": "OCR processor is not available",
                    "detail": "PaddleOCR is not installed or failed to initialize"
                }
            )
        
        # Read file content
        contents = await file.read()
        file_size = len(contents)
        
        # Validate file size
        if file_size > MAX_FILE_SIZE:
            logger.warning(f"File size {file_size} exceeds maximum {MAX_FILE_SIZE}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "FileTooLarge",
                    "message": f"File size exceeds maximum allowed size of {MAX_FILE_SIZE / (1024*1024):.1f} MB",
                    "detail": f"Received {file_size} bytes, maximum is {MAX_FILE_SIZE} bytes"
                }
            )
        
        # Validate file extension
        is_valid, error_msg = validate_image_file(file.filename, file_size)
        if not is_valid:
            logger.warning(f"File validation failed: {error_msg}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "InvalidFileType",
                    "message": error_msg,
                    "detail": f"Filename: {file.filename}"
                }
            )
        
        # Validate MIME type
        mime_valid, mime_error = validate_mime_type(contents, file.content_type)
        if not mime_valid:
            logger.warning(f"MIME type validation failed: {mime_error}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": "InvalidMimeType",
                    "message": mime_error,
                    "detail": f"Detected MIME type: {file.content_type}"
                }
            )
        
        # Generate image ID
        image_id = generate_image_id()
        logger.info(f"Processing image {image_id}")
        
        # Save uploaded image
        image_path = UPLOAD_DIR / f"{image_id}.png"
        with open(image_path, "wb") as f:
            f.write(contents)
        logger.debug(f"Image saved to {image_path}")
        
        # Run OCR with error handling
        try:
            original_text, char_confidence = ocr_processor.process_image(contents)
            logger.info(f"OCR completed for {image_id}, extracted {len(original_text)} characters")
        except Exception as e:
            logger.error(f"OCR processing failed for {image_id}: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail={
                    "error": "OCRProcessingError",
                    "message": "Failed to process image with OCR",
                    "detail": str(e)
                }
            )
        
        if not original_text:
            logger.info(f"No text detected in image {image_id}")
            return ProcessResponse(
                image_id=image_id,
                original_text="",
                segmented_text=[],
                characters=[],
                translation="",
                message="No text detected in image"
            )
        
        # Segment with jieba
        try:
            segmented_text = list(jieba.cut(original_text, cut_all=False))
            logger.debug(f"Text segmented into {len(segmented_text)} parts")
        except Exception as e:
            logger.error(f"Segmentation failed: {e}", exc_info=True)
            segmented_text = [original_text]  # Fallback to original text
        
        # Process each character
        characters = []
        for char, confidence in char_confidence:
            if char.strip():  # Skip whitespace
                try:
                    pinyin = get_pinyin(char)
                    english = get_char_english(char, cedict)
                    
                    characters.append(CharacterData(
                        char=char,
                        pinyin=pinyin,
                        english=english,
                        confidence=confidence
                    ))
                except Exception as e:
                    logger.warning(f"Failed to process character '{char}': {e}")
                    # Continue with other characters
        
        # Translate full text with error handling
        translation = ""
        if translator:
            try:
                translation = translator.translate(original_text)
                logger.info(f"Translation completed for {image_id}")
            except Exception as e:
                logger.error(f"Translation failed for {image_id}: {e}", exc_info=True)
                translation = "[Translation unavailable]"
        else:
            logger.warning("Translator not available")
            translation = "[Translation unavailable]"
        
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
        try:
            with open(result_path, "w", encoding="utf-8") as f:
                json.dump(result_data, f, ensure_ascii=False, indent=2)
            logger.info(f"Results saved for {image_id}")
        except Exception as e:
            logger.error(f"Failed to save results for {image_id}: {e}", exc_info=True)
            # Continue anyway - results are still returned
        
        return ProcessResponse(
            image_id=image_id,
            original_text=original_text,
            segmented_text=segmented_text,
            characters=characters,
            translation=translation,
            message="Image processed successfully"
        )
    
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except Exception as e:
        # Clean up uploaded file on error
        if image_path and image_path.exists():
            try:
                image_path.unlink()
                logger.debug(f"Cleaned up uploaded file: {image_path}")
            except Exception as cleanup_error:
                logger.error(f"Failed to clean up file {image_path}: {cleanup_error}")
        
        logger.error(f"Unexpected error processing image: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "ProcessingError",
                "message": "An error occurred while processing the image",
                "detail": str(e) if os.getenv("LOG_LEVEL", "").upper() == "DEBUG" else None
            }
        )


@app.get("/results/{image_id}", response_model=ResultResponse, responses={
    404: {"model": ErrorResponse},
    500: {"model": ErrorResponse}
})
async def get_results(image_id: str):
    """
    Retrieve stored processing results by image ID.
    
    Args:
        image_id: Unique identifier for the processed image
        
    Returns:
        ResultResponse: Stored processing results
        
    Raises:
        HTTPException: 404 if results not found, 500 for read errors
    """
    result_path = RESULTS_DIR / f"{image_id}.json"
    
    if not result_path.exists():
        logger.warning(f"Results not found for image_id: {image_id}")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail={
                "error": "NotFound",
                "message": f"Results not found for image_id: {image_id}",
                "detail": None
            }
        )
    
    try:
        with open(result_path, "r", encoding="utf-8") as f:
            result_data = json.load(f)
        
        # Convert character dicts back to CharacterData objects
        characters = [CharacterData(**char) for char in result_data["characters"]]
        
        logger.info(f"Retrieved results for {image_id}")
        return ResultResponse(
            image_id=result_data["image_id"],
            original_text=result_data["original_text"],
            segmented_text=result_data["segmented_text"],
            characters=characters,
            translation=result_data["translation"]
        )
    
    except json.JSONDecodeError as e:
        logger.error(f"Invalid JSON in results file for {image_id}: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "InvalidData",
                "message": "Results file contains invalid data",
                "detail": str(e)
            }
        )
    except Exception as e:
        logger.error(f"Error reading results for {image_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail={
                "error": "ReadError",
                "message": "Failed to read results",
                "detail": str(e)
            }
        )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
