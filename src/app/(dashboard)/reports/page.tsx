import { ReportsView } from "@/components/reports/report-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Reports" };

export default function Page() {
  return <ReportsView />;
}
