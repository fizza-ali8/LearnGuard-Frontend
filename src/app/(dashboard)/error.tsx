"use client";

import { Button } from "@/components/ui/button";
import { ErrorState } from "@/components/ui/display";

export default function DashboardError({ reset }: { error: Error; reset: () => void }) {
  return (
    <ErrorState
      title="We couldn’t complete this request."
      description="Your uploaded data and student records are still available. Please try again."
      action={<Button onClick={reset}>Try Again</Button>}
    />
  );
}
