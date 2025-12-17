type ProgressBarProps = {
  progress: number;
  label?: string;
};

export function ProgressBar({ progress, label }: ProgressBarProps) {
  return (
    <div className="space-y-2 sm:space-y-3">
      {label && (
        <div className="flex items-center justify-between text-xs text-foreground sm:text-sm">
          <span>{label}</span>
          <span>{progress}%</span>
        </div>
      )}
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted sm:h-3">
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

