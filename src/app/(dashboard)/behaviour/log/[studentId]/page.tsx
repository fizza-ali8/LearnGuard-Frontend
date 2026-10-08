import { ObservationForm } from "@/components/monitoring/observation-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Classroom Observation" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <ObservationForm studentId={studentId} />;
}
