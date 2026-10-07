import { StudentProfile } from "@/components/students/student-profile";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "Timeline" };

export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <StudentProfile studentId={id} section="timeline" />;
}
