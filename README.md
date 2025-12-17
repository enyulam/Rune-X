# Rune-X Chinese OCR MVP
A lightweight, open-source MVP that recognizes Chinese handwriting or printed characters directly in the browser, extracts text, identifies each character’s meaning, and performs sentence-level translation with contextual interpretation.

## ✨ Features
- Browser image upload
- OCR using EasyOCR (offline, free, open-source)
- Character-level dictionary lookup using CC-CEDICT
- Word segmentation using jieba
- Sentence-level translation using open-source MT models (Helsinki-NLP OPUS Chinese-English)
- Backend in Python FastAPI
- Frontend in Next.js with shadcn/ui components
- Modern UI with Tailwind CSS v4 and dark mode support
- Deployable on free-tier services (Railway/Render/Vercel)

## 🎯 MVP Goal
Provide a simple browser-based tool:
Image → OCR → Chinese text → character meanings → full translation → context explanation.

## 🏗 Technology Stack
- **OCR:** EasyOCR (Chinese Simplified)
- **Segmentation:** jieba
- **Dictionary:** CC-CEDICT (open source)
- **Translation:** Helsinki-NLP opus-mt-zh-en
- **Backend:** FastAPI + Python
- **Frontend:** Next.js 16 + React 19 + shadcn/ui + Tailwind CSS v4
- **Storage:** Local filesystem (no DB needed for MVP)

## 📦 Installation
See backend/README.md and frontend/README.md for setup instructions.

## 📜 License
MIT License.

## 📚 Credits
- EasyOCR (https://github.com/JaidedAI/EasyOCR)
- CC-CEDICT Dictionary
- HuggingFace Transformers
- shadcn/ui components
