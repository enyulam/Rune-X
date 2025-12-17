export function ProgressSpinner() {
  return (
    <div className="relative h-12 w-12 sm:h-14 sm:w-14">
      <div className="absolute inset-0 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
      <div className="absolute inset-2 rounded-full bg-primary/10" />
    </div>
  );
}

