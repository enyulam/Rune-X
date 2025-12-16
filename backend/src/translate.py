"""Translation functionality using MarianMT with enhanced error handling."""
from typing import Optional
import logging

logger = logging.getLogger(__name__)

try:
    from transformers import MarianMTModel, MarianTokenizer
except ImportError:
    MarianMTModel = None
    MarianTokenizer = None


class Translator:
    """
    Handles Chinese to English translation using MarianMT.
    
    Provides error handling and logging for translation operations.
    """
    
    def __init__(self, model_name: str = "Helsinki-NLP/opus-mt-zh-en"):
        """
        Initialize MarianMT translator.
        
        Args:
            model_name: HuggingFace model identifier for the translation model
            
        Raises:
            ImportError: If transformers library is not installed
        """
        if MarianMTModel is None or MarianTokenizer is None:
            raise ImportError(
                "transformers library is not installed. "
                "Install it with: pip install transformers torch"
            )
        
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self._loaded = False
        logger.info(f"Translator initialized with model: {model_name}")
    
    def _load_model(self):
        """
        Lazy load the model (only when needed).
        
        Handles model loading errors gracefully.
        """
        if self._loaded:
            return
        
        try:
            logger.info(f"Loading translation model: {self.model_name}")
            self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
            self.model = MarianMTModel.from_pretrained(self.model_name)
            self._loaded = True
            logger.info("Translation model loaded successfully")
        except Exception as e:
            logger.error(f"Could not load translation model: {e}", exc_info=True)
            self._loaded = False
    
    def translate(self, text: str) -> str:
        """
        Translate Chinese text to English.
        
        Args:
            text: Chinese text to translate
            
        Returns:
            str: English translation, or error message if translation fails
        """
        if not text.strip():
            return ""
        
        self._load_model()
        
        if not self._loaded or self.model is None or self.tokenizer is None:
            logger.warning("Translation model not loaded")
            return "[Translation unavailable]"
        
        try:
            # Tokenize and translate
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            translated = self.model.generate(**inputs)
            translation = self.tokenizer.decode(translated[0], skip_special_tokens=True)
            logger.debug(f"Translated text: {text[:50]}... -> {translation[:50]}...")
            return translation
        except Exception as e:
            logger.error(f"Translation error: {e}", exc_info=True)
            return "[Translation error]"
    
    def is_available(self) -> bool:
        """
        Check if translation is available.
        
        Returns:
            bool: True if transformers library is available, False otherwise
        """
        return MarianMTModel is not None and MarianTokenizer is not None
