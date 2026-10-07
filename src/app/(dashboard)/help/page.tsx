import { HelpView } from "@/components/help/help-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Help" };

export default function Page() {
  return <HelpView />;
}
