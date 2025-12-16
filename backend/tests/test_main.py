"""Tests for main FastAPI application."""
import pytest
from fastapi.testclient import TestClient
from src.main import app

client = TestClient(app)


def test_health_check():
    """Test health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "message" in data


def test_process_no_file():
    """Test process endpoint without file."""
    response = client.post("/process")
    assert response.status_code == 422  # Validation error


def test_get_results_not_found():
    """Test getting results for non-existent image_id."""
    response = client.get("/results/non-existent-id")
    assert response.status_code == 404


# TODO: Add tests for:
# - test_process_valid_image
# - test_process_invalid_file_type
# - test_process_file_too_large
# - test_get_results_success
# - test_ocr_integration
# - test_translation_integration
