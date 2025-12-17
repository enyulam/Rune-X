## Rune-X Frontend

Next.js 16 App Router UI for the Rune-X OCR MVP. Built with TypeScript, Tailwind CSS v4, shadcn/ui components, and Axios for backend communication.

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

- **UI Components:** `Button`, `Card`, `Badge`, `Table`, `Input`, `Label` (from `@/components/ui/`)
- **Custom Components:** `UploadDropzone`, `PageHeader`, `ProgressBar`, `ProgressSpinner`, `HowItWorks`, `UploadTips`
- **Services:** `services/api.ts` centralizes Axios calls and provides a mock fallback when `NEXT_PUBLIC_API_BASE` is not set
- **Styling:** Uses Tailwind CSS v4 with CSS variables, supports dark mode, and follows shadcn/ui design system

### Technology Stack

- **Framework:** Next.js 16 with App Router
- **UI Library:** shadcn/ui components (Radix UI primitives)
- **Styling:** Tailwind CSS v4 with OKLCH color system
- **HTTP Client:** Axios
- **Icons:** Lucide React
