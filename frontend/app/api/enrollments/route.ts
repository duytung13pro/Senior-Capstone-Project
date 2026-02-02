import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Enrollment from "@/lib/models/Enrollment"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const studentId = searchParams.get("studentId")
    const courseId = searchParams.get("courseId")

    const query: any = {}
    if (studentId) query.student = studentId
    if (courseId) query.course = courseId

    const enrollments = await Enrollment.find(query).populate("course").populate("student", "name email")

    return NextResponse.json({ success: true, enrollments })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch enrollments" }, { status: 500 })
  }
}
