import { StudentsView } from "@/components/students/students-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Students" };

export default function Page() {
  return <StudentsView />;
}
