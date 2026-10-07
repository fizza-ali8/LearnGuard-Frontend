import { AboutPage } from "@/components/marketing/about-page";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "About" };

export default function Page() {
  return <AboutPage />;
}
