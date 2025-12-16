"""Utility functions for CEDICT loading and character processing."""
import re
import os
from pathlib import Path
from typing import Dict, Optional
import requests
from pypinyin import pinyin, Style


def download_cedict_if_needed(cedict_path: Path) -> None:
    """Download CEDICT dictionary if it doesn't exist."""
    if cedict_path.exists():
        return
    
    # Create parent directory
    cedict_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Download CEDICT
    url = "https://www.mdbg.net/chinese/export/cedict/cedict_1_0_ts_utf-8_mdbg.txt.gz"
    print(f"Downloading CEDICT dictionary...")
    
    try:
        response = requests.get(url, stream=True)
        response.raise_for_status()
        
        import gzip
        with gzip.open(response.raw, 'rt', encoding='utf-8') as f_in, \
             open(cedict_path, 'w', encoding='utf-8') as f_out:
            f_out.write(f_in.read())
        print(f"CEDICT dictionary downloaded to {cedict_path}")
    except Exception as e:
        print(f"Warning: Could not download CEDICT dictionary: {e}")
        print("English translations may be limited.")


def load_cedict(cedict_path: Path) -> Dict[str, str]:
    """Load CEDICT dictionary into memory."""
    cedict_dict = {}
    
    if not cedict_path.exists():
        download_cedict_if_needed(cedict_path)
    
    if not cedict_path.exists():
        return cedict_dict
    
    try:
        with open(cedict_path, 'r', encoding='utf-8') as f:
            for line in f:
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
    except Exception as e:
        print(f"Error loading CEDICT: {e}")
    
    return cedict_dict


def get_pinyin(char: str) -> str:
    """Get pinyin for a Chinese character."""
    try:
        # Use pypinyin to get pinyin with tone marks
        result = pinyin(char, style=Style.TONE, heteronym=False)
        if result:
            return result[0][0] if result[0] else ""
        return ""
    except Exception:
        return ""


def get_char_english(char: str, cedict: Dict[str, str]) -> Optional[str]:
    """Get English translation for a Chinese character from CEDICT."""
    return cedict.get(char)


def generate_image_id() -> str:
    """Generate a unique image ID."""
    import uuid
    return str(uuid.uuid4())


def validate_image_file(filename: str, file_size: int) -> tuple[bool, Optional[str]]:
    """Validate uploaded image file."""
    from src.config import ALLOWED_EXTENSIONS, MAX_FILE_SIZE
    
    # Check file extension
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        return False, f"File type {ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
    
    # Check file size
    if file_size > MAX_FILE_SIZE:
        return False, f"File size {file_size} exceeds maximum {MAX_FILE_SIZE} bytes"
    
    return True, None
