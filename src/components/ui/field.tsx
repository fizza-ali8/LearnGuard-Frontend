import { cn } from "@/lib/utils";

export const fieldClass =
  "h-11 w-full rounded-[10px] border border-line bg-surface px-3 text-sm text-heading outline-none transition placeholder:text-faint focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:bg-soft disabled:text-muted";

export function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
  className,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      {label ? (
        <label htmlFor={htmlFor} className="block text-[13px] font-medium text-heading">
          {label}
        </label>
      ) : null}
      {children}
      {error ? (
        <p className="text-xs leading-5 text-risk-high" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs leading-5 text-faint">{hint}</p>
      ) : null}
    </div>
  );
}
