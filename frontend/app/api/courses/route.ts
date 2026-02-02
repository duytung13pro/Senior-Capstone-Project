import { type NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Course from "@/lib/models/Course"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const level = searchParams.get("level")
    const instructor = searchParams.get("instructor")

    const query: any = {}
    if (level) query.level = level
    if (instructor) query.instructor = instructor

    const courses = await Course.find(query).populate("instructor", "name email")

    return NextResponse.json({ success: true, courses })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch courses" }, { status: 500 })
  }
}
