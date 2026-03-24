"use server"

import { fetchApiFirstOk } from "@/lib/api"

export async function dropClass(classId: string, studentId: string) {
  try {
    // Call the backend DELETE endpoint to drop the class
    const response = await fetchApiFirstOk(`/api/classes/${classId}/drop`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        studentId: studentId,
      }),
      cache: "no-store",
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(
        errorData.message || "Failed to drop class"
      )
    }

    return { success: true }
  } catch (error) {
    console.error("Error dropping class:", error)
    throw error
  }
}
