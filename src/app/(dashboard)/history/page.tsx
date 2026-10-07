import { HistoryView } from "@/components/monitoring/history-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Assessment History" };

export default function Page() {
  return <HistoryView />;
}
