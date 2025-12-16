"""Pydantic models for request/response validation."""
from typing import List, Optional
from pydantic import BaseModel, Field


class CharacterData(BaseModel):
    """Individual character data with pinyin and translation."""
    char: str = Field(..., description="Chinese character")
    pinyin: str = Field(..., description="Pinyin pronunciation")
    english: Optional[str] = Field(None, description="English translation/meaning")
    confidence: float = Field(..., ge=0.0, le=1.0, description="OCR confidence score")


class ProcessResponse(BaseModel):
    """Response model for POST /process endpoint."""
    image_id: str = Field(..., description="Unique identifier for the processed image")
    original_text: str = Field(..., description="Original OCR text from image")
    segmented_text: List[str] = Field(..., description="Jieba segmented words/phrases")
    characters: List[CharacterData] = Field(..., description="Character-level data with pinyin and translations")
    translation: str = Field(..., description="Full English translation")
    message: str = Field(..., description="Status message")


class ResultResponse(BaseModel):
    """Response model for GET /results/{image_id} endpoint."""
    image_id: str = Field(..., description="Unique identifier for the processed image")
    original_text: str = Field(..., description="Original OCR text from image")
    segmented_text: List[str] = Field(..., description="Jieba segmented words/phrases")
    characters: List[CharacterData] = Field(..., description="Character-level data with pinyin and translations")
    translation: str = Field(..., description="Full English translation")


class HealthResponse(BaseModel):
    """Response model for GET /health endpoint."""
    status: str = Field(..., description="Health status")
    message: str = Field(..., description="Health message")
