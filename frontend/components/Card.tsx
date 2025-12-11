import { PropsWithChildren, ReactNode } from "react";

type CardProps = PropsWithChildren<{
  title?: string;
  subtitle?: string;
  actions?: ReactNode;
  className?: string;
}>;

export function Card({ title, subtitle, actions, className, children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-gray-100 bg-white shadow-card ${className ?? ""}`}
    >
      {(title || subtitle || actions) && (
        <div className="flex items-start justify-between gap-4 border-b border-gray-100 px-6 py-4">
          <div>
            {title && <h2 className="text-lg font-semibold text-gray-900">{title}</h2>}
            {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      <div className="px-6 py-5">{children}</div>
    </div>
  );
}

