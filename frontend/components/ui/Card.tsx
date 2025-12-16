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
        <div className="flex flex-col gap-2 border-b border-gray-100 px-4 py-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4 sm:px-6 sm:py-4">
          <div>
            {title && <h2 className="text-base font-semibold text-gray-900 sm:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-xs text-gray-500 sm:text-sm">{subtitle}</p>}
          </div>
          {actions && <div className="flex-shrink-0">{actions}</div>}
        </div>
      )}
      <div className="px-4 py-4 sm:px-6 sm:py-5">{children}</div>
    </div>
  );
}

