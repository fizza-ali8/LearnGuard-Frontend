import { StudentBehaviour } from "@/components/monitoring/behaviour-views";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Observation History" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <StudentBehaviour studentId={studentId} />;
}
