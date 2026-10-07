import { DyslexiaFlow } from "@/components/assessment/dyslexia-flow";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Dyslexia Screening" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return <DyslexiaFlow studentId={studentId} />;
}
