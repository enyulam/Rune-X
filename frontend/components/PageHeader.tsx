import { ReactNode } from "react";
import { Badge } from "@/components/ui/Badge";

type PageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ badge, title, description, actions }: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4">
      {badge && <Badge tone="info">{badge}</Badge>}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-2xl font-bold leading-tight text-gray-900 sm:text-3xl lg:text-4xl">
            {title}
          </h1>
          {description && (
            <p className="text-sm text-gray-600 sm:text-base lg:text-lg">{description}</p>
          )}
        </div>
        {actions && <div className="flex flex-shrink-0 flex-wrap gap-2 sm:gap-3">{actions}</div>}
      </div>
    </div>
  );
}

