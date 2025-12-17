export function UploadTips() {
  return (
    <aside className="w-full rounded-2xl border border-border bg-card/90 p-4 shadow-sm sm:p-6 lg:sticky lg:top-16 lg:max-w-sm">
      <h3 className="text-base font-semibold text-foreground sm:text-lg">Upload tips</h3>
      <ul className="mt-3 space-y-2 text-xs text-muted-foreground sm:mt-4 sm:space-y-3 sm:text-sm">
        <li>Use clear lighting and avoid heavy shadows.</li>
        <li>Crop tightly around the text for best accuracy.</li>
        <li>Supports simplified and traditional characters.</li>
      </ul>
      <div className="mt-4 flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-xs text-primary sm:mt-6 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="sm:w-5 sm:h-5">
          <circle cx="12" cy="12" r="10" stroke="#0066ff" strokeWidth="1.5" />
          <path d="M12 7v5l3 3" stroke="#0066ff" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
        <span>Average processing time: ~5 seconds per image.</span>
      </div>
    </aside>
  );
}

