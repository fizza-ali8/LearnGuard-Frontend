import { HeatmapView } from "@/components/monitoring/heatmap-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Class Heatmap" };

export default function Page() {
  return <HeatmapView />;
}
