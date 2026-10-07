import { cn } from "@/lib/utils";
import Link from "next/link";

export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("h-9 w-9", className)} aria-hidden>
      <rect width="32" height="32" rx="10" fill="#F3F0FF" />
      <path d="M16 6.2 24.2 9.6v5.8c0 4.7-3.1 8-8.2 9.9-5.1-1.9-8.2-5.2-8.2-9.9V9.6L16 6.2Z" stroke="#5F50C8" strokeWidth="1.5" fill="#fff" />
      <circle cx="16" cy="14.2" r="1.3" fill="#8B7CF6" />
      <circle cx="12.4" cy="17.4" r="1.15" fill="#8B7CF6" />
      <circle cx="19.6" cy="17.4" r="1.15" fill="#8B7CF6" />
      <path d="M16 14.2 12.4 17.4M16 14.2l3.6 3.2" stroke="#8B7CF6" strokeWidth="1.2" />
    </svg>
  );
}

export function Logo({
  subtitle = true,
  href,
  compact,
  light,
}: {
  subtitle?: boolean;
  href?: string;
  compact?: boolean;
  light?: boolean;
}) {
  const content = (
    <span className="flex items-center gap-3">
      <LogoMark className={compact ? "h-8 w-8" : "h-9 w-9"} />
      {compact ? null : (
        <span className="leading-tight">
          <span className={cn("block font-heading text-[15px] font-bold", light ? "text-white" : "text-heading")}>LearnGuard</span>
          {subtitle ? <span className={cn("block text-[11px]", light ? "text-white/75" : "text-faint")}>Early Learning Screening</span> : null}
        </span>
      )}
    </span>
  );
  if (!href) return content;
  return (
    <Link href={href} className="rounded-lg" aria-label="LearnGuard home">
      {content}
    </Link>
  );
}

export function ScreeningDisclaimer({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs leading-5 text-faint", className)}>
      LearnGuard provides AI-assisted screening support and does not replace professional assessment.
    </p>
  );
}
