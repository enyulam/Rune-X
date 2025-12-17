# Cursor Refactor Prompt: Add Sentence Translation to Chinese OCR Platform

Copy and paste this entire prompt into Cursor to refactor your Chinese handwriting OCR platform to adopt sentence-level translation using MarianMT and display it in the results page UI.

---

## Context

I have a Chinese handwriting OCR + translation platform powered by EasyOCR. Currently, it uses a `dictionary.json` file for character-level translations. I want to add **sentence-level neural machine translation** using MarianMT (like the Rune-X platform) and display the full sentence translation in the results page UI under a "Translation & Context" section.

## Current Platform Structure

- **OCR Engine**: EasyOCR (Chinese recognition)
- **Character Translation**: Dictionary-based (`dictionary.json`)
- **Backend**: [Your backend framework - FastAPI/Flask/etc.]
- **Frontend**: [Your frontend framework - Next.js/React/etc.]

## Required Changes

### 1. Backend: Add MarianMT Sentence Translation

**Add translation module** (`backend/src/translate.py` or equivalent):

```python
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
```

**Update your main processing endpoint** to include sentence translation:

```python
# In your image processing endpoint (e.g., POST /process or /ocr)

# After OCR extraction (assuming you have `extracted_text` variable):
extracted_text = "..."  # Your EasyOCR extracted Chinese text

# Initialize translator (do this once at startup, similar to OCR processor)
translator = Translator()  # Or load from your existing initialization

# Translate full sentence
translation = ""
if translator and translator.is_available():
    try:
        translation = translator.translate(extracted_text)
        logger.info(f"Translation completed: {translation}")
    except Exception as e:
        logger.error(f"Translation failed: {e}", exc_info=True)
        translation = "[Translation unavailable]"
else:
    logger.warning("Translator not available")
    translation = "[Translation unavailable]"

# Include `translation` in your response JSON
response_data = {
    "image_id": image_id,
    "original_text": extracted_text,  # or "text" depending on your API
    "characters": characters_list,  # Your existing character-level data
    "translation": translation,  # ← NEW: Full sentence translation
    # ... other fields
}
```

**Update requirements.txt**:

```txt
transformers>=4.57.3
torch>=2.0.0
```

### 2. Frontend: Add Translation & Context Section

**Update your results page component** to display the full sentence translation:

```tsx
// In your results page component (e.g., ResultsPage.tsx or [image_id]/page.tsx)

// Add this section after your characters table, similar to Rune-X platform:

<div className="space-y-4 sm:space-y-6">
  {/* Existing: Extracted text */}
  <div>
    <p className="text-xs font-semibold text-foreground sm:text-sm">Extracted text</p>
    <p className="mt-2 rounded-lg bg-muted p-2 text-sm text-foreground sm:p-3 sm:text-base">
      {result.text}
    </p>
  </div>

  {/* Existing: Characters table */}
  <div className="space-y-2 sm:space-y-3">
    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-xs font-semibold text-foreground sm:text-sm">Characters</p>
      <Badge tone="neutral">{result.characters.length} entries</Badge>
    </div>
    {/* Your existing characters table */}
  </div>

  {/* NEW: Translation & Context Section */}
  <div>
    <p className="text-xs font-semibold text-foreground sm:text-sm">
      Full sentence translation
    </p>
    <p className="mt-2 rounded-lg bg-primary/10 px-2 py-1.5 text-sm text-foreground sm:px-3 sm:py-2 sm:text-base">
      {result.translation || "[Translation unavailable]"}
    </p>
  </div>
</div>
```

**Update your TypeScript types** to include translation field:

```typescript
// In your types file (e.g., types/ocr.ts or types/api.ts)

export interface OCRResponse {
  image_id: string;
  text: string;  // or original_text
  characters: Array<{
    char: string;
    pinyin?: string;
    english?: string;
    confidence: number;
  }>;
  translation: string;  // ← NEW: Add this field
}
```

**Update your API service** to handle the translation field:

```typescript
// In your API service file

export async function fetchResult(imageId: string): Promise<OCRResponse> {
  const response = await api.get(`/results/${imageId}`);
  const data = response.data;
  
  return {
    image_id: data.image_id,
    text: data.original_text || data.text,  // Handle both field names
    characters: data.characters,
    translation: data.translation || "[Translation unavailable]",  // ← NEW
  };
}
```

### 3. UI Styling (if using Tailwind CSS)

The translation section uses these Tailwind classes (matching Rune-X platform):

- **Container**: `rounded-lg bg-primary/10 px-2 py-1.5 text-sm text-foreground sm:px-3 sm:py-2 sm:text-base`
- **Label**: `text-xs font-semibold text-foreground sm:text-sm`
- **Spacing**: `mt-2` for margin-top

If you're using a different CSS framework, adapt these styles to match your design system.

## Implementation Steps

1. **Install dependencies**: Add `transformers` and `torch` to your backend `requirements.txt` or `package.json`
2. **Add Translator class**: Create `translate.py` module in your backend
3. **Initialize translator**: Add translator initialization in your startup/initialization code
4. **Update processing endpoint**: Modify your OCR endpoint to call `translator.translate(extracted_text)` and include `translation` in response
5. **Update frontend types**: Add `translation: string` to your `OCRResponse` interface
6. **Update API service**: Ensure `fetchResult()` maps the `translation` field from backend response
7. **Update results page UI**: Add the "Full sentence translation" section after the characters table
8. **Test**: Upload an image and verify both character-level (dictionary) and sentence-level (MarianMT) translations appear

## Expected Result

After refactoring, your results page should show:
1. **Extracted text**: The Chinese text from OCR
2. **Characters table**: Character-level translations from `dictionary.json` (existing)
3. **Full sentence translation**: Neural translation of the entire sentence using MarianMT (NEW)

The sentence translation provides context-aware translation that considers the full sentence structure, complementing the character-level dictionary translations.

## Notes

- MarianMT model (`Helsinki-NLP/opus-mt-zh-en`) will be downloaded automatically on first use (~300MB)
- Translation is lazy-loaded (model loads only when first translation is requested)
- If translation fails, it gracefully falls back to `"[Translation unavailable]"` without breaking the UI
- The translation field is optional in the response, so existing code won't break if translation isn't available

---

**Please implement these changes step by step, ensuring backward compatibility with existing character-level translations from `dictionary.json`.**
