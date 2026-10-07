import { AnalyticsView } from "@/components/monitoring/analytics-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return <AnalyticsView />;
}
