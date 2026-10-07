import { format, isToday, isYesterday, parseISO } from "date-fns";

export function formatDate(iso: string, pattern = "dd MMM yyyy") {
  return format(parseISO(iso), pattern);
}

export function formatTime(iso: string) {
  return format(parseISO(iso), "h:mm a");
}

export function formatActivityWhen(iso: string) {
  const date = parseISO(iso);
  if (isToday(date)) return format(date, "h:mm a");
  if (isYesterday(date)) return "Yesterday";
  return format(date, "EEEE");
}

export function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function greeting(date = new Date()) {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function formatPercent(value: number) {
  return `${Math.round(value)}%`;
}
