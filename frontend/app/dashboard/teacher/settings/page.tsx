import { redirect } from "next/navigation";

export default function TeacherSettingsPage() {
  redirect("/dashboard/teacher/profile?tab=preferences");
}
