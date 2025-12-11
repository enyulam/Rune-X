import { PropsWithChildren } from "react";

type Tone = "info" | "success" | "warning" | "neutral";

const toneStyles: Record<Tone, string> = {
  info: "bg-primary-light text-primary",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  neutral: "bg-gray-100 text-gray-700",
};

export function Badge({
  tone = "info",
  children,
  className,
}: PropsWithChildren<{ tone?: Tone; className?: string }>) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${toneStyles[tone]} ${className ?? ""}`}
    >
      {children}
    </span>
  );
}

