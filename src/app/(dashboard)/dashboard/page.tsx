import { DashboardView } from "@/components/dashboard/dashboard-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dashboard" };

export default function Page() {
  return <DashboardView />;
}
