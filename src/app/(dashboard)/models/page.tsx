import { ModelsView } from "@/components/research/models-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Models & Validation" };

export default function Page() {
  return <ModelsView />;
}
