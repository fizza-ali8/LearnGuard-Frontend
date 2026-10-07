"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";
import { forwardRef, type ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "tertiary" | "destructive";
type Size = "md" | "sm" | "icon";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover active:bg-primary-dark",
  secondary: "border border-line bg-surface text-heading hover:border-lavender-border hover:bg-primary-softer",
  tertiary: "bg-transparent text-primary-dark hover:bg-primary-soft",
  destructive: "bg-risk-high-bg text-risk-high hover:bg-[#FDECEC]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { className, variant = "primary", size = "md", loading, disabled, children, type = "button", ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[10px] text-sm font-semibold transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50",
        size === "md" && "h-11 px-4",
        size === "sm" && "h-9 px-3 text-[13px]",
        size === "icon" && "h-11 w-11",
        variants[variant],
        className,
      )}
      {...props}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null}
      {children}
    </button>
  );
});

export const IconButton = forwardRef<HTMLButtonElement, ButtonProps>(function IconButton(
  { className, variant = "secondary", size = "icon", ...props },
  ref,
) {
  return <Button ref={ref} variant={variant} size={size} className={className} {...props} />;
});
