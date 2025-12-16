"""OCR functionality using PaddleOCR."""
from typing import List, Tuple
from PIL import Image
import io

try:
    from paddleocr import PaddleOCR
except ImportError:
    PaddleOCR = None


class OCRProcessor:
    """Handles OCR processing using PaddleOCR."""
    
    def __init__(self, lang: str = "ch"):
        """Initialize PaddleOCR processor."""
        if PaddleOCR is None:
            raise ImportError("PaddleOCR is not installed. Install it with: pip install paddleocr")
        
        self.ocr = PaddleOCR(use_angle_cls=True, lang=lang, show_log=False)
    
    def process_image(self, image_bytes: bytes) -> Tuple[str, List[Tuple[str, float]]]:
        """
        Process image and extract Chinese text with confidence scores.
        
        Args:
            image_bytes: Image file bytes
            
        Returns:
            Tuple of (full_text, list of (char, confidence) tuples)
        """
        # Convert bytes to PIL Image
        image = Image.open(io.BytesIO(image_bytes))
        
        # Convert to RGB if necessary
        if image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Convert PIL Image to numpy array for PaddleOCR
        import numpy as np
        img_array = np.array(image)
        
        # Perform OCR (PaddleOCR accepts numpy array or PIL Image)
        results = self.ocr.ocr(img_array, cls=True)
        
        # Extract text and confidence
        full_text = ""
        char_confidence = []
        
        if results and results[0]:
            for line in results[0]:
                if line:
                    text_info = line[1]
                    text = text_info[0]
                    confidence = text_info[1]
                    
                    full_text += text
                    
                    # Store character-level confidence (use line confidence for each char)
                    for char in text:
                        char_confidence.append((char, confidence))
        
        return full_text, char_confidence
    
    def is_available(self) -> bool:
        """Check if OCR is available."""
        return PaddleOCR is not None
