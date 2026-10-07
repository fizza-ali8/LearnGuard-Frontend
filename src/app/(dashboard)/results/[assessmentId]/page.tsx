import { ResultView } from "@/components/results/result-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Screening Result" };

export default async function Page({ params }: { params: Promise<{ assessmentId: string }> }) {
  const { assessmentId } = await params;
  return <ResultView assessmentId={assessmentId} />;
}
