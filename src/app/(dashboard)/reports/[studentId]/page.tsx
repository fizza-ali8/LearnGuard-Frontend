import { ReportPreview } from "@/components/reports/report-views";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Report Preview" };

export default async function Page({ params }: { params: Promise<{ studentId: string }> }) {
  const { studentId } = await params;
  return (
    <Suspense>
      <ReportPreview studentId={studentId} />
    </Suspense>
  );
}
