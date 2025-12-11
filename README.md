# Rune-X Chinese OCR MVP
A lightweight, open-source MVP that recognizes Chinese handwriting or printed characters directly in the browser, extracts text, identifies each character’s meaning, and performs sentence-level translation with contextual interpretation.

## ✨ Features
- Browser image upload
- OCR using PaddleOCR (offline, free)
- Character-level dictionary lookup using CC-CEDICT
- Word segmentation using jieba
- Sentence-level translation using open-source MT models (Helsinki-NLP OPUS Chinese-English)
- Backend in Python FastAPI
- Frontend in React/Next.js
- Deployable on free-tier services (Railway/Render/Vercel)

## 🎯 MVP Goal
Provide a simple browser-based tool:
Image → OCR → Chinese text → character meanings → full translation → context explanation.

## 🏗 Technology Stack
- **OCR:** PaddleOCR (PP-OCRv4 Chinese)
- **Segmentation:** jieba
- **Dictionary:** CC-CEDICT (open source)
- **Translation:** Helsinki-NLP opus-mt-zh-en
- **Backend:** FastAPI + Python
- **Frontend:** Next.js / React
- **Storage:** Local filesystem (no DB needed for MVP)

## 📦 Installation
See backend/README.md and frontend/README.md for setup instructions.

## 📜 License
MIT License.

## 📚 Credits
- PaddleOCR (https://github.com/PaddlePaddle/PaddleOCR)
- CC-CEDICT Dictionary
- HuggingFace Transformers
