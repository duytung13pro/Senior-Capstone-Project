//Show Preview of student dashboard with classes, assignments, messages, and analytics
import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Enrollment from "@/lib/models/Enrollment"
import Message from "@/lib/models/Message"
import StudyAnalytics from "@/lib/models/StudyAnalytics"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const { searchParams } = new URL(request.url)
    const studentId = request.cookies.get("userId")?.value || searchParams.get("studentId")

    if (!studentId) {
      return NextResponse.json({ success: false, error: "Missing studentId" }, { status: 400 })
    }

    const enrollments = await Enrollment.find({ student: studentId })
      .populate("course", "title")
      .sort({ updatedAt: -1 })
      .lean()

    const classPreview = enrollments.slice(0, 3).map((enrollment) => ({
      id: enrollment._id.toString(),
      name: (enrollment.course as { title?: string })?.title || "Untitled Course",
      progress: enrollment.progress || 0,
    }))

    const courseIds = enrollments
      .map((enrollment) => {
        const courseId = enrollment.course && typeof enrollment.course === "object" && "_id" in enrollment.course
          ? (enrollment.course as { _id: mongoose.Types.ObjectId })._id
          : enrollment.course
        return typeof courseId === "string" ? new mongoose.Types.ObjectId(courseId) : courseId
      })
      .filter(Boolean)

    const assignmentDocs =
      courseIds.length > 0
        ? await mongoose.connection
            .collection("assignments")
            .find({ course: { $in: courseIds }, dueDate: { $exists: true } })
            .sort({ dueDate: 1 })
            .limit(3)
            .project({ title: 1, dueDate: 1, totalPoints: 1 })
            .toArray()
        : []

    const now = Date.now()
    const assignmentPreview = assignmentDocs.map((assignment) => {
      const dueDate = assignment.dueDate ? new Date(assignment.dueDate) : null
      const dueLabel = dueDate
        ? dueDate.getTime() < now
          ? "Overdue"
          : `Due ${dueDate.toLocaleDateString()}`
        : "No due date"

      return {
        id: assignment._id.toString(),
        title: assignment.title || "Untitled Assignment",
        due: dueLabel,
        points: assignment.totalPoints || 0,
      }
    })

    const messages = await Message.find({ recipient: studentId, archived: { $ne: true } })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()

    const messagePreview = messages.map((message) => ({
      id: message._id.toString(),
      sender: (message.sender as { name?: string })?.name || "Unknown sender",
      subject: message.subject,
      time: new Date(message.createdAt).toLocaleString(),
    }))

    const weekStart = new Date()
    weekStart.setDate(weekStart.getDate() - 7)
    weekStart.setHours(0, 0, 0, 0)

    const analytics = await StudyAnalytics.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: { $gte: weekStart },
        },
      },
      {
        $group: {
          _id: null,
          totalStudyMinutes: { $sum: "$studyMinutes" },
          averageQuizScore: { $avg: "$averageQuizScore" },
        },
      },
    ])

    const avgProgress =
      enrollments.length > 0
        ? Math.round(enrollments.reduce((sum, enrollment) => sum + (enrollment.progress || 0), 0) / enrollments.length)
        : 0

    const analyticsPreview = [
      { label: "Study Hours This Week", value: `${Math.round(((analytics[0]?.totalStudyMinutes || 0) / 60) * 10) / 10}h` },
      { label: "Average Quiz Score", value: `${Math.round(analytics[0]?.averageQuizScore || 0)}%` },
      { label: "Course Completion", value: `${avgProgress}%` },
    ]

    return NextResponse.json({
      success: true,
      data: {
        classes: classPreview,
        assignments: assignmentPreview,
        messages: messagePreview,
        analytics: analyticsPreview,
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Failed to fetch dashboard preview" }, { status: 500 })
  }
}
