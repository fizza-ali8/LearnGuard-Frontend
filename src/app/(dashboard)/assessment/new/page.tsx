import { NewAssessment } from "@/components/assessment/new-assessment";
import type { Metadata } from "next";
import { Suspense } from "react";

export const metadata: Metadata = { title: "New Assessment" };

export default function Page() {
  return (
    <Suspense>
      <NewAssessment />
    </Suspense>
  );
}
