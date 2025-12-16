## Rune-X Frontend

Next.js 13 App Router UI for the Rune-X OCR MVP. Built with TypeScript, Tailwind
CSS, and Axios for backend communication.

### Requirements

- Node.js 18+
- Env var `NEXT_PUBLIC_API_BASE` pointing to the FastAPI backend (e.g.
  `http://localhost:8000`)

### Setup

```bash
cd frontend
npm install
npm run dev
```

The app will be available at http://localhost:3000.

### Pages

- `/` – Upload page with drag-and-drop or manual file selection (JPG/PNG).
- `/processing?jobId=...&imageId=...` – Polls backend every second for status.
- `/results/[image_id]` – Shows image preview, extracted text, per-character
  table (character | pinyin | english meaning | confidence), translation, and
  JSON export.

### Components

- `PrimaryButton`, `SecondaryButton`, `Card`, `Badge`, `Table`, `TableRow`,
  `UploadDropzone`
- `services/api.ts` centralizes Axios calls and provides a mock fallback when
  `NEXT_PUBLIC_API_BASE` is not set.
