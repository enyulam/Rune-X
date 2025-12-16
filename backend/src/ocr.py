"""OCR functionality using PaddleOCR with enhanced error handling."""
from typing import List, Tuple, Optional
from PIL import Image
import io
import logging

logger = logging.getLogger(__name__)

try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None


class OCRProcessor:
    """
    Handles OCR processing using PaddleOCR.
    
    Provides error handling and logging for OCR operations.
    """
    
    def __init__(self, lang: str = "ch"):
        """
        Initialize PaddleOCR processor.
        
        Args:
            lang: Language code for OCR (default: "ch" for Chinese)
            
        Raises:
            ImportError: If PaddleOCR is not installed
            Exception: If initialization fails
        """
        if PaddleOCR is None:
            raise ImportError("PaddleOCR is not installed. Install it with: pip install paddleocr")
        
        try:
            self.ocr = PaddleOCR(use_textline_orientation=True, lang=lang)
            logger.info(f"PaddleOCR initialized for language: {lang}")
        except Exception as e:
            logger.error(f"Failed to initialize PaddleOCR: {e}", exc_info=True)
            raise
    
    def process_image(self, image_bytes: bytes) -> Tuple[str, List[Tuple[str, float]]]:
        """
        Process image and extract Chinese text with confidence scores.
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            Tuple of (full_text, list of (char, confidence) tuples)
            
        Raises:
            ValueError: If image cannot be processed
            Exception: For other OCR processing errors
        """
        try:
            # Convert bytes to PIL Image
            try:
                image = Image.open(io.BytesIO(image_bytes))
            except Exception as e:
                logger.error(f"Failed to open image: {e}")
                raise ValueError(f"Invalid image format: {e}")
            
            # Convert to RGB if necessary
            if image.mode != 'RGB':
                image = image.convert('RGB')
            
            # Convert PIL Image to numpy array for PaddleOCR
            import numpy as np
            img_array = np.array(image)
            
            # Perform OCR (PaddleOCR accepts numpy array or PIL Image)
            try:
                results = self.ocr.ocr(img_array, cls=True)
            except Exception as e:
                logger.error(f"PaddleOCR processing failed: {e}", exc_info=True)
                raise Exception(f"OCR processing error: {e}")
            
            # Extract text and confidence
            full_text = ""
            char_confidence = []
            
            if results and results[0]:
                for line in results[0]:
                    if line:
                        try:
                            text_info = line[1]
                            text = text_info[0]
                            confidence = text_info[1]
                            
                            full_text += text
                            
                            # Store character-level confidence (use line confidence for each char)
                            for char in text:
                                char_confidence.append((char, confidence))
                        except (IndexError, TypeError) as e:
                            logger.warning(f"Error parsing OCR result line: {e}")
                            continue
            
            logger.debug(f"Extracted {len(full_text)} characters with {len(char_confidence)} confidence scores")
            return full_text, char_confidence
            
        except Exception as e:
            logger.error(f"Error in process_image: {e}", exc_info=True)
            raise
    
    def is_available(self) -> bool:
        """
        Check if OCR is available.
        
        Returns:
            bool: True if PaddleOCR is available, False otherwise
        """
        return PaddleOCR is not None
