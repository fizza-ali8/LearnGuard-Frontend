import { BehaviourLogs } from "@/components/monitoring/behaviour-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Classroom Observations" };

export default function Page() {
  return <BehaviourLogs />;
}
