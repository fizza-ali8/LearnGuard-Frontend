import { DysgraphiaFlow } from "@/components/assessment/dysgraphia-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dysgraphia Screening" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <DysgraphiaFlow studentId={studentId} />;
}
