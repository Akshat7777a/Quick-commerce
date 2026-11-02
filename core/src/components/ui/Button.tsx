import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "../../lib/format";
import { Spinner } from "./Primitives";

type Variant = "primary" | "secondary" | "tertiary" | "danger";
type Size = "md" | "sm";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  block?: boolean;
  iconLeft?: ReactNode;
  iconRight?: ReactNode;
};

const variantClass: Record<Variant, string> = {
  primary: "btn-primary",
  secondary: "btn-secondary",
  tertiary: "btn-tertiary",
  danger: "btn-danger",
};

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  block = false,
  iconLeft,
  iconRight,
  className,
  children,
  disabled,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn("btn", variantClass[variant], size === "sm" && "btn-sm", block && "btn-block", className)}
      {...rest}
    >
      {loading ? <Spinner /> : iconLeft}
      <span>{children}</span>
      {!loading && iconRight}
    </button>
  );
}
