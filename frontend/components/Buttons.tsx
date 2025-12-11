import { ButtonHTMLAttributes } from "react";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

export function PrimaryButton({ loading, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        baseClasses,
        "bg-primary text-white shadow-sm hover:bg-primary-dark focus-visible:ring-primary",
        className
      )}
      {...props}
      aria-busy={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

export function SecondaryButton({ loading, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(
        baseClasses,
        "border border-gray-200 bg-white text-gray-800 hover:border-primary hover:text-primary focus-visible:ring-primary",
        className
      )}
      {...props}
      aria-busy={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

