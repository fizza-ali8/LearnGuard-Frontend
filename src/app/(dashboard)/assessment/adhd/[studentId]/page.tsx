import { AdhdFlow } from "@/components/assessment/adhd-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "ADHD-Related Caregiver Screening" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <AdhdFlow studentId={studentId} />;
}
