"use server"

import { fetchApiFirstOk } from "@/lib/api"

export async function fetchStudentGrades() {
  const res = await fetchApiFirstOk("/api/student/grades", { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch student grades")
  return res.json()
}
