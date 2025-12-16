"""Utility functions for CEDICT loading and character processing."""
import re
import os
from pathlib import Path
from typing import Dict, Optional, Tuple
import requests
from pypinyin import pinyin, Style
import logging

logger = logging.getLogger(__name__)


def download_cedict_if_needed(cedict_path: Path) -> None:
    """
    Download CEDICT dictionary if it doesn't exist.
    
    Args:
        cedict_path: Path where the CEDICT dictionary should be stored
        
    Raises:
        Exception: If download fails (logged but not re-raised)
    """
    if cedict_path.exists():
        logger.debug(f"CEDICT dictionary already exists at {cedict_path}")
        return
    
    # Create parent directory
    cedict_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Download CEDICT
    url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
    logger.info("Downloading CEDICT dictionary...")
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        import gzip
        with gzip.open(response.raw, 'rt', encoding='utf-8') as f_in, \
             open(cedict_path, 'w', encoding='utf-8') as f_out:
            f_out.write(f_in.read())
        logger.info(f"CEDICT dictionary downloaded to {cedict_path}")
    except Exception as e:
        logger.warning(f"Could not download CEDICT dictionary: {e}")
        logger.warning("English translations may be limited.")


def load_cedict(cedict_path: Path) -> Dict[str, str]:
    """
    Load CEDICT dictionary into memory.
    
    Args:
        cedict_path: Path to the CEDICT dictionary file
        
    Returns:
        Dict mapping Chinese characters/words to English translations
    """
    cedict_dict = {}
    
    if not cedict_path.exists():
        download_cedict_if_needed(cedict_path)
    
    if not cedict_path.exists():
        logger.warning(f"CEDICT dictionary not found at {cedict_path}")
        return cedict_dict
    
    try:
        logger.info(f"Loading CEDICT dictionary from {cedict_path}")
        with open(cedict_path, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                if not line or line.startswith('#'):
                    continue
                
                # CEDICT format: Traditional Simplified [pinyin] /English translations/
                # Example: 中國 中国 [Zhong1 guo2] /China/
                match = re.match(r'^(\S+)\s+(\S+)\s+\[(.+?)\]\s+/(.+?)/', line)
                if match:
                    traditional, simplified, _pinyin, english = match.groups()
                    # Get first English translation
                    first_english = english.split('/')[0].strip()
                    # Store both traditional and simplified
                    if first_english:
                        cedict_dict[traditional] = first_english
                        cedict_dict[simplified] = first_english
                        # Also store individual characters if they're single characters
                        if len(traditional) == 1:
                            cedict_dict[traditional] = first_english
                        if len(simplified) == 1 and simplified != traditional:
                            cedict_dict[simplified] = first_english
                elif line_num % 10000 == 0:
                    logger.debug(f"Processed {line_num} lines, loaded {len(cedict_dict)} entries")
        
        logger.info(f"CEDICT dictionary loaded: {len(cedict_dict)} entries")
    except Exception as e:
        logger.error(f"Error loading CEDICT: {e}", exc_info=True)
    
    return cedict_dict


def get_pinyin(char: str) -> str:
    """
    Get pinyin for a Chinese character.
    
    Args:
        char: Chinese character(s) to get pinyin for
        
    Returns:
        str: Pinyin pronunciation with tone marks, empty string on error
    """
    try:
        # Use pypinyin to get pinyin with tone marks
        result = pinyin(char, style=Style.TONE, heteronym=False)
        if result:
            return result[0][0] if result[0] else ""
        return ""
    except Exception as e:
        logger.debug(f"Failed to get pinyin for '{char}': {e}")
        return ""


def get_char_english(char: str, cedict: Dict[str, str]) -> Optional[str]:
    """
    Get English translation for a Chinese character from CEDICT.
    
    Args:
        char: Chinese character to translate
        cedict: CEDICT dictionary mapping characters to English
        
    Returns:
        Optional[str]: English translation if found, None otherwise
    """
    return cedict.get(char)


def generate_image_id() -> str:
    """
    Generate a unique image ID using UUID.
    
    Returns:
        str: UUID string identifier
    """
    import uuid
    return str(uuid.uuid4())


def validate_image_file(filename: str, file_size: int) -> Tuple[bool, Optional[str]]:
    """
    Validate uploaded image file extension and size.
    
    Args:
        filename: Name of the uploaded file
        file_size: Size of the file in bytes
        
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    from src.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
    
    # Handle None or empty filename
    if not filename:
        return False, "Filename is required"
    
    # Check file extension
    try:
        ext = Path(filename).suffix.lower()
        if not ext or ext not in ALLOWED_EXTENSIONS:
            return False, f"File type {ext or '(no extension)'} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    except Exception as e:
        logger.warning(f"Error parsing filename '{filename}': {e}")
        return False, f"Invalid filename format: {filename}"
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        return False, f"File size {file_size} exceeds maximum {MAX_FILE_SIZE} bytes"
    
    return True, None


def validate_mime_type(file_bytes: bytes, content_type: Optional[str] = None) -> Tuple[bool, Optional[str]]:
    """
    Validate MIME type of uploaded file using magic bytes.
    
    Args:
        file_bytes: File content as bytes
        content_type: Optional content type from request header
        
    Returns:
        Tuple[bool, Optional[str]]: (is_valid, error_message)
    """
    # Allowed MIME types
    ALLOWED_MIME_TYPES = {
        'image/png',
        'image/jpeg',
        'image/jpg',
        'image/bmp',
        'image/tiff',
        'image/webp'
    }
    
    try:
        # Try to use python-magic if available
        try:
            try:
                import magic
                mime = magic.Magic(mime=True)
                detected_type = mime.from_buffer(file_bytes)
            except (ImportError, OSError):
                # python-magic not available or libmagic not installed
                raise ImportError("python-magic not available")
        except ImportError:
            # Fallback: use file signature (magic bytes)
            detected_type = None
            if file_bytes.startswith(b'\x89PNG\r\n\x1a\n'):
                detected_type = 'image/png'
            elif file_bytes.startswith(b'\xff\xd8\xff'):
                detected_type = 'image/jpeg'
            elif file_bytes.startswith(b'BM'):
                detected_type = 'image/bmp'
            elif file_bytes.startswith(b'RIFF') and b'WEBP' in file_bytes[:12]:
                detected_type = 'image/webp'
            elif file_bytes.startswith(b'II*\x00') or file_bytes.startswith(b'MM\x00*'):
                detected_type = 'image/tiff'
        
        # Validate detected MIME type
        if detected_type and detected_type.lower() not in ALLOWED_MIME_TYPES:
            return False, f"Detected MIME type '{detected_type}' is not allowed"
        
        # If content_type provided, validate it matches
        if content_type:
            content_type_lower = content_type.lower().split(';')[0].strip()
            if content_type_lower not in ALLOWED_MIME_TYPES:
                return False, f"Content type '{content_type}' is not allowed"
            
            # If both detected and provided, they should match
            if detected_type and detected_type.lower() != content_type_lower:
                logger.warning(f"MIME type mismatch: detected '{detected_type}' vs provided '{content_type}'")
        
        return True, None
        
    except Exception as e:
        logger.warning(f"MIME type validation error: {e}")
        # Don't fail validation if MIME check fails - extension check is primary
        return True, None
