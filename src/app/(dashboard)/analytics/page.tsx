import type { Metadata } from "next";
import dynamic from "next/dynamic";

const AnalyticsView = dynamic(
  () => import("@/components/monitoring/analytics-view").then((mod) => mod.AnalyticsView),
  { loading: () => <div className="h-80 animate-pulse rounded-2xl bg-soft" /> },
);

export const metadata: Metadata = { title: "Analytics" };

export default function Page() {
  return <AnalyticsView />;
}
