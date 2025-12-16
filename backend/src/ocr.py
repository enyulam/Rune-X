"""OCR functionality using EasyOCR with enhanced error handling."""
import io
import logging
from typing import List, Tuple

import numpy as np
from PIL import Image

logger = logging.getLogger(__name__)

try:
    import easyocr
except ImportError:
    easyocr = None


class OCRProcessor:
    """
    Handles OCR processing using PaddleOCR.
    
    Provides error handling and logging for OCR operations.
    """
    
    def __init__(self, lang: str = "ch"):
        """
        Initialize OCR processor.
        
        Args:
            lang: Language code for OCR (default: "ch" for Chinese). For EasyOCR we
                  map this to the appropriate language code list.
            
        Raises:
            ImportError: If PaddleOCR is not installed
            Exception: If initialization fails
        """
        if easyocr is None:
            raise ImportError("EasyOCR is not installed. Install it with: pip install easyocr")
        
        try:
            # Map PaddleOCR-style language code to EasyOCR codes
            # 'ch' (simplified Chinese) -> 'ch_sim'
            lang_codes = ["ch_sim"]
            # If needed in future, we could support traditional Chinese with 'ch_tra'

            self.reader = easyocr.Reader(lang_codes)
            logger.info("EasyOCR initialized for languages: %s", lang_codes)
        except Exception as e:
            logger.error("Failed to initialize EasyOCR: %s", e, exc_info=True)
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

            # Convert PIL Image to numpy array for EasyOCR
            img_array = np.array(image)
            
            # Perform OCR using EasyOCR (expects bytes, numpy array, or file path/url)
            try:
                # EasyOCR format: [ [bbox, text, confidence], ... ]
                results = self.reader.readtext(img_array)
                logger.debug(
                    "EasyOCR results type: %s, length: %s",
                    type(results),
                    len(results) if results is not None else "N/A",
                )
            except Exception as e:
                logger.error("EasyOCR processing failed: %s", e, exc_info=True)
                raise Exception(f"OCR processing error: {e}")
            
            # Extract text and confidence
            full_text = ""
            char_confidence = []
            
            # Handle EasyOCR response format: List[[bbox, text, confidence]]
            if results:
                logger.debug("OCR data extracted: %d lines detected", len(results))
                for bbox, text, conf in results:
                    try:
                        if not text:
                            continue

                        # Ensure confidence is valid
                        try:
                            confidence = max(0.0, min(1.0, float(conf)))
                        except (ValueError, TypeError):
                            confidence = 0.9

                        # Log extracted text for debugging (first 100 chars to avoid spam)
                        text_preview = text[:100] + "..." if len(text) > 100 else text
                        logger.info(
                            "Extracted text line: '%s' (confidence: %.3f, length: %d)",
                            text_preview,
                            confidence,
                            len(text),
                        )

                        # Validate text contains Chinese characters
                        has_chinese = any('\u4e00' <= char <= '\u9fff' for char in text)
                        if not has_chinese and len(text) > 0:
                            logger.warning(
                                "Warning: Extracted text '%s' does not appear to contain Chinese characters!",
                                text_preview,
                            )

                        full_text += text

                        # Store character-level confidence (use line confidence for each char)
                        for char in text:
                            if char.strip():  # Only store non-whitespace characters
                                char_confidence.append((char, confidence))
                    except Exception as e:
                        logger.warning("Error parsing EasyOCR result line: %s, line: %s", e, (bbox, text, conf))
                        continue
            else:
                logger.debug("EasyOCR returned no results")
            
            # Post-process: keep only Chinese characters to avoid noisy Latin output
            chinese_chars = []
            chinese_char_confidence = []
            for ch, conf in char_confidence:
                if '\u4e00' <= ch <= '\u9fff':
                    chinese_chars.append(ch)
                    chinese_char_confidence.append((ch, conf))
            
            filtered_text = "".join(chinese_chars)
            if not filtered_text:
                # If PaddleOCR produced only non-Chinese text, treat as "no text"
                if full_text:
                    logger.warning(
                        "OCR produced text but no Chinese characters after filtering. "
                        f"Raw text preview: '{(full_text[:50] + '...') if len(full_text) > 50 else full_text}'"
                    )
                logger.warning("No Chinese text extracted from image after filtering.")
                return "", []
            
            logger.info(
                "OCR extraction complete: %d total characters (before filtering), "
                "%d Chinese characters kept, %d confidence entries kept",
                len(full_text),
                len(filtered_text),
                len(chinese_char_confidence),
            )
            preview = filtered_text[:50] + "..." if len(filtered_text) > 50 else filtered_text
            logger.info(f"Filtered Chinese text preview: '{preview}'")
            
            return filtered_text, chinese_char_confidence
            
        except Exception as e:
            logger.error(f"Error in process_image: {e}", exc_info=True)
            raise
    
    def is_available(self) -> bool:
        """
        Check if OCR is available.
        
        Returns:
            bool: True if EasyOCR is available, False otherwise
        """
        return easyocr is not None
