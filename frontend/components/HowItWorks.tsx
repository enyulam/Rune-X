export function HowItWorks() {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-white/80 p-4 shadow-card sm:p-5">
      <div className="flex items-center gap-3">
        <span className="h-2 w-2 rounded-full bg-green-500" />
        <p className="text-xs font-semibold text-gray-800 sm:text-sm">How it works</p>
      </div>
      <ol className="grid gap-2 text-xs text-gray-600 sm:grid-cols-3 sm:gap-3 sm:text-sm">
        <li className="rounded-lg bg-gray-50 px-3 py-2">
          1. Upload an image of Chinese handwriting or print.
        </li>
        <li className="rounded-lg bg-gray-50 px-3 py-2">
          2. We run OCR, character lookup, and translation.
        </li>
        <li className="rounded-lg bg-gray-50 px-3 py-2">
          3. View characters, pinyin, meanings, and export JSON.
        </li>
      </ol>
    </div>
  );
}

