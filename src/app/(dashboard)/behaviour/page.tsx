import { BehaviourLogs } from "@/components/monitoring/behaviour-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Behaviour Logs" };

export default function Page() {
  return <BehaviourLogs />;
}
