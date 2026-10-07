import { StudentForm } from "@/components/students/student-form";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Add Student" };

export default function Page() {
  return <StudentForm />;
}
