import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Enrollment from "@/lib/models/Enrollment"
import Grade from "@/lib/models/Grade"
import Assignment from "@/lib/models/Assignmen"
import StudyAnalytics from "@/lib/models/StudyAnalytics"

export const dynamic = "force-dynamic"

type SubmissionStatus = "On-time" | "Late" | "Missing"
type AttendanceStatus = "Present" | "Late" | "Absent"

type StudentProgressDto = {
  id: string
  name: string
  level: string
  progress: number
  lastActivity: string
  feedback: string
  class: string
  avatar: string
  progressData: Array<{ week: string; score: number }>
  submissionData: Array<{ name: SubmissionStatus; value: number; fill: string }>
  quizResults: Array<{ name: string; score: number }>
  attendanceData: Array<{ day: string; status: AttendanceStatus }>
  strengths: string[]
  areasToImprove: string[]
}

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri"]

// Builds avatar initials like "Wang Chen" -> "WC" for the table and dialog UI.
const toInitials = (name: string) =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("")

// Converts timestamps into human-friendly activity labels used in the dashboard.
const formatRelativeActivity = (lastSeen?: Date) => {
  if (!lastSeen) return "No activity"

  const now = Date.now()
  const diffMs = now - new Date(lastSeen).getTime()
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))

  if (diffHours < 24) {
    return `Today, ${new Date(lastSeen).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  }

  const diffDays = Math.floor(diffHours / 24)
  if (diffDays === 1) return "Yesterday"
  return `${diffDays} days ago`
}

// Simple rule-based highlights so teachers can quickly scan strengths and focus areas.
const generateStrengthsAndImprovements = (avgScore: number, attendanceRate: number, progress: number) => {
  const strengths: string[] = []
  const areasToImprove: string[] = []

  if (avgScore >= 80) strengths.push("Strong quiz performance")
  if (progress >= 75) strengths.push("Steady weekly progress")
  if (attendanceRate >= 0.8) strengths.push("Consistent attendance")

  if (avgScore < 70) areasToImprove.push("Quiz/test accuracy")
  if (progress < 60) areasToImprove.push("Learning pace consistency")
  if (attendanceRate < 0.8) areasToImprove.push("Class attendance discipline")

  if (strengths.length === 0) strengths.push("Positive learning attitude")
  if (areasToImprove.length === 0) areasToImprove.push("Advanced speaking fluency")

  return { strengths, areasToImprove }
}

// Translates study minutes into attendance-like status for the weekly chart.
const toAttendanceStatus = (studyMinutes: number): AttendanceStatus => {
  if (studyMinutes >= 45) return "Present"
  if (studyMinutes >= 20) return "Late"
  return "Absent"
}

export async function GET() {
  try {
    // 1) Connect and load enrollment list to know which students belong to which courses.
    await dbConnect()

    const enrollments = await Enrollment.find({})
      .populate({ path: "student", select: "name role" })
      .populate({ path: "course", select: "title level" })
      .lean()

    // 2) Keep only valid student-course rows for progress reporting.
    const filteredEnrollments = enrollments.filter(
      (entry: any) => entry?.student?.role === "Student" && entry?.course?.title
    )

    // 3) For each student, gather raw learning signals and convert them into UI-ready cards/charts.
    const students: StudentProgressDto[] = await Promise.all(
      filteredEnrollments.map(async (entry: any) => {
        const studentId = entry.student._id
        const courseId = entry.course._id

        // Pull all data needed by the dashboard in parallel for faster response.
        const [analyticsDocs, quizGrades, allAssignments, allGrades] = await Promise.all([
          StudyAnalytics.find({ student: studentId, course: courseId }).sort({ date: -1 }).limit(8).lean(),
          Grade.find({ student: studentId, course: courseId, category: "quiz" })
            .sort({ gradedAt: 1 })
            .limit(5)
            .lean(),
          Assignment.find({ course: courseId }).select("_id dueDate title").lean(),
          Grade.find({ student: studentId, course: courseId }).sort({ gradedAt: -1 }).lean(),
        ])

        const sortedAnalytics = [...analyticsDocs].sort(
          (a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime()
        )

        // Progress chart data (with safe fallback if analytics history is missing).
        const progressData = (sortedAnalytics.length > 0
          ? sortedAnalytics
          : Array.from({ length: 8 }, (_, idx) => ({ averageQuizScore: entry.progress, date: new Date(), idx }))
        ).map((item: any, index: number) => ({
          week: `Week ${index + 1}`,
          score: Math.round(item.averageQuizScore ?? entry.progress ?? 0),
        }))

        // Quiz chart data (with fallback so the chart is never empty).
        const quizResults =
          quizGrades.length > 0
            ? quizGrades.map((quiz: any, index: number) => ({
                name: `Quiz ${index + 1}`,
                score: Math.round(quiz.percentage ?? 0),
              }))
            : [{ name: "Quiz 1", score: Math.round(entry.progress ?? 0) }]

        // Assignment donut chart split: on-time, late, and missing.
        const totalAssignments = allAssignments.length
        const submittedAssignmentIds = new Set(allGrades.map((grade: any) => String(grade.assignment)))

        let onTime = 0
        let late = 0

        allAssignments.forEach((assignment: any) => {
          const grade = allGrades.find((g: any) => String(g.assignment) === String(assignment._id))
          if (!grade) return

          const gradedAt = grade.gradedAt ? new Date(grade.gradedAt).getTime() : 0
          const dueAt = assignment.dueDate ? new Date(assignment.dueDate).getTime() : Number.MAX_SAFE_INTEGER

          if (gradedAt <= dueAt) onTime += 1
          else late += 1
        })

        const missing = Math.max(0, totalAssignments - submittedAssignmentIds.size)

        const submissionData: StudentProgressDto["submissionData"] = [
          { name: "On-time", value: onTime, fill: "#4CAF50" },
          { name: "Late", value: late, fill: "#FFC107" },
          { name: "Missing", value: missing, fill: "#F44336" },
        ]

        // Attendance strip chart for recent days.
        const latestFiveDays = (sortedAnalytics.length > 0
          ? [...sortedAnalytics].slice(-5)
          : Array.from({ length: 5 }, () => ({ studyMinutes: 45 }))
        ).map((item: any) => toAttendanceStatus(item.studyMinutes ?? 0))

        const attendanceData = DAY_LABELS.map((day, index) => ({
          day,
          status: latestFiveDays[index] ?? "Present",
        }))

        // Derive highlight bullets from combined score + attendance + progress signals.
        const attendancePresentCount = attendanceData.filter((d) => d.status === "Present").length
        const attendanceRate = attendancePresentCount / Math.max(1, attendanceData.length)
        const avgScore =
          quizResults.reduce((acc, curr) => acc + curr.score, 0) / Math.max(1, quizResults.length)

        const { strengths, areasToImprove } = generateStrengthsAndImprovements(
          avgScore,
          attendanceRate,
          Number(entry.progress ?? 0)
        )

        const latestGradeFeedback = allGrades.find((grade: any) => Boolean(grade.feedback))?.feedback as string | undefined

        // Final record returned to frontend for the student detail modal.
        return {
          id: String(studentId),
          name: entry.student.name,
          level: entry.course.level || "Beginner",
          progress: Number(entry.progress ?? 0),
          lastActivity: formatRelativeActivity(sortedAnalytics.at(-1)?.date),
          feedback:
            latestGradeFeedback ||
            `Average score ${Math.round(avgScore)}%. Attendance ${Math.round(attendanceRate * 100)}%.`,
          class: entry.course.title,
          avatar: toInitials(entry.student.name),
          progressData,
          submissionData,
          quizResults,
          attendanceData,
          strengths,
          areasToImprove,
        }
      })
    )

    // 4) Send pre-computed dashboard data back to frontend.
    return NextResponse.json({ success: true, students })
  } catch (error) {
    console.error("Failed to fetch student progress data", error)
    return NextResponse.json({ success: false, error: "Failed to fetch student progress data" }, { status: 500 })
  }
}
