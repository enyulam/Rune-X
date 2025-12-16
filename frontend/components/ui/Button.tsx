import { ButtonHTMLAttributes } from "react";

const cn = (...classes: Array<string | undefined | false>) =>
  classes.filter(Boolean).join(" ");

type ButtonVariant = "primary" | "secondary";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  loading?: boolean;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-primary text-white shadow-sm hover:bg-primary-dark focus-visible:ring-primary",
  secondary: "border border-gray-200 bg-white text-gray-800 hover:border-primary hover:text-primary focus-visible:ring-primary",
};

export function Button({ variant = "primary", loading, className, children, ...props }: ButtonProps) {
  return (
    <button
      className={cn(baseClasses, variantClasses[variant], className)}
      {...props}
      aria-busy={loading}
    >
      {loading ? "Loading..." : children}
    </button>
  );
}

// Convenience exports for backward compatibility
export const PrimaryButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="primary" {...props} />
);

export const SecondaryButton = (props: Omit<ButtonProps, "variant">) => (
  <Button variant="secondary" {...props} />
);

