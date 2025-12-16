"""Translation functionality using MarianMT."""
from typing import Optional

try:
    from transformers import MarianMTModel, MarianTokenizer
except ImportError:
    MarianMTModel = None
    MarianTokenizer = None


class Translator:
    """Handles Chinese to English translation using MarianMT."""
    
    def __init__(self, model_name: str = "Helsinki-NLP/opus-mt-zh-en"):
        """Initialize MarianMT translator."""
        if MarianMTModel is None or MarianTokenizer is None:
            raise ImportError(
                "transformers library is not installed. "
                "Install it with: pip install transformers torch"
            )
        
        self.model_name = model_name
        self.tokenizer = None
        self.model = None
        self._loaded = False
    
    def _load_model(self):
        """Lazy load the model (only when needed)."""
        if self._loaded:
            return
        
        try:
            self.tokenizer = MarianTokenizer.from_pretrained(self.model_name)
            self.model = MarianMTModel.from_pretrained(self.model_name)
            self._loaded = True
        except Exception as e:
            print(f"Warning: Could not load translation model: {e}")
            self._loaded = False
    
    def translate(self, text: str) -> str:
        """
        Translate Chinese text to English.
        
        Args:
            text: Chinese text to translate
            
        Returns:
            English translation
        """
        if not text.strip():
            return ""
        
        self._load_model()
        
        if not self._loaded or self.model is None or self.tokenizer is None:
            return "[Translation unavailable]"
        
        try:
            # Tokenize and translate
            inputs = self.tokenizer(text, return_tensors="pt", padding=True, truncation=True, max_length=512)
            translated = self.model.generate(**inputs)
            translation = self.tokenizer.decode(translated[0], skip_special_tokens=True)
            return translation
        except Exception as e:
            print(f"Translation error: {e}")
            return "[Translation error]"
    
    def is_available(self) -> bool:
        """Check if translation is available."""
        return MarianMTModel is not None and MarianTokenizer is not None
