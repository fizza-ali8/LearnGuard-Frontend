import { riskLabel, riskPhrase, riskTone } from "@/lib/risk";
import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types";

export function RiskBadge({ level, className, phrase }: { level: RiskLevel; className?: string; phrase?: boolean }) {
  const tone = riskTone(level);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        tone.bg,
        tone.text,
        className,
      )}
    >
      <span className={cn("h-1.5 w-1.5 rounded-full", tone.bar)} aria-hidden />
      {phrase ? riskPhrase[level] : `${riskLabel[level]} risk`}
    </span>
  );
}

export function RiskBar({
  value,
  level,
  label,
}: {
  value: number;
  level?: RiskLevel;
  label?: string;
}) {
  const tone = riskTone(level ?? (value >= 80 ? "high" : value >= 60 ? "elevated" : value >= 40 ? "moderate" : "low"));
  return (
    <div>
      {label ? (
        <div className="mb-1.5 flex items-center justify-between text-sm">
          <span className="text-body">{label}</span>
          <span className="font-semibold text-heading">{Math.round(value)}%</span>
        </div>
      ) : null}
      <div className="h-1.5 overflow-hidden rounded-full bg-soft" role="presentation">
        <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${Math.max(4, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function RiskGauge({
  value,
  level,
  size = 148,
}: {
  value: number;
  level: RiskLevel;
  size?: number;
}) {
  const tone = riskTone(level);
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
        <circle cx="70" cy="70" r={radius} fill="none" stroke="#F3F0FF" strokeWidth="10" />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone.soft}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute text-center">
        <div className="font-heading text-3xl font-bold text-heading">{Math.round(value)}%</div>
        <div className={cn("text-xs font-medium", tone.text)}>{riskLabel[level]}</div>
      </div>
    </div>
  );
}

export function ProgressRing({ value, label, sublabel }: { value: number; label: string; sublabel?: string }) {
  const radius = 58;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.min(100, value) / 100) * circumference;
  return (
    <div className="flex flex-col items-center">
      <div className="relative h-40 w-40">
        <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90" aria-hidden>
          <circle cx="70" cy="70" r={radius} fill="none" stroke="#F3F0FF" strokeWidth="10" />
          <circle
            cx="70"
            cy="70"
            r={radius}
            fill="none"
            stroke="#8B7CF6"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-3xl font-bold text-heading">{Math.round(value)}%</span>
        </div>
      </div>
      <p className="mt-2 text-sm font-medium text-heading">{label}</p>
      {sublabel ? <p className="text-xs text-muted">{sublabel}</p> : null}
    </div>
  );
}
