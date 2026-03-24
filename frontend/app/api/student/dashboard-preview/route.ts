//Show Preview of student dashboard with classes, assignments, messages, and analytics
import { type NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import dbConnect from "@/lib/mongodb"
import Enrollment from "@/lib/models/Enrollment"
import Message from "@/lib/models/Message"
import StudyAnalytics from "@/lib/models/StudyAnalytics"
import StudentWeeklyStudy from "@/lib/models/StudentWeeklyStudy"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

const getWeekStartUtc = (date: Date) => {
  const copy = new Date(date)
  const day = copy.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  copy.setUTCDate(copy.getUTCDate() + diffToMonday)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

const toUtcDayKey = (date: Date) => {
  const year = date.getUTCFullYear()
  const month = String(date.getUTCMonth() + 1).padStart(2, "0")
  const day = String(date.getUTCDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect()

    const session = await auth()
    const { searchParams } = new URL(request.url)
    const studentId = session?.user?.id || searchParams.get("studentId")

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
            .project({ title: 1, dueDate: 1, totalPoints: 1 })
            .toArray()
        : []

    const now = Date.now()
    const currentDate = new Date()
    const weekStartUtc = getWeekStartUtc(currentDate)
    const weekEndUtc = new Date(weekStartUtc)
    weekEndUtc.setUTCDate(weekEndUtc.getUTCDate() + 7)
    const assignmentPreview = assignmentDocs.slice(0, 3).map((assignment) => {
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

    const pendingAssignmentsCount = assignmentDocs.filter((assignment) => {
      if (!assignment.dueDate) {
        return false
      }

      const dueDate = new Date(assignment.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        return false
      }

      return dueDate.getTime() >= now && dueDate < weekEndUtc
    }).length

    const weeklyTaskAssignments = assignmentDocs.filter((assignment) => {
      if (!assignment.dueDate) {
        return false
      }

      const dueDate = new Date(assignment.dueDate)
      if (Number.isNaN(dueDate.getTime())) {
        return false
      }

      return dueDate >= weekStartUtc && dueDate < weekEndUtc
    })

    const weeklyTasksTotal = weeklyTaskAssignments.length
    const weeklyTaskAssignmentIds = weeklyTaskAssignments.map((assignment) => assignment._id)

    const studentIdentityFilters: Record<string, unknown>[] = [
      { student: studentId },
      { studentId },
    ]

    if (mongoose.Types.ObjectId.isValid(studentId)) {
      const studentObjectId = new mongoose.Types.ObjectId(studentId)
      studentIdentityFilters.push({ student: studentObjectId })
      studentIdentityFilters.push({ studentId: studentObjectId })
    }

    const assignmentIdentityFilters: Record<string, unknown>[] = [
      { assignment: { $in: weeklyTaskAssignmentIds } },
      { assignmentId: { $in: weeklyTaskAssignmentIds } },
      {
        assignment: {
          $in: weeklyTaskAssignmentIds.map((id) => id.toString()),
        },
      },
      {
        assignmentId: {
          $in: weeklyTaskAssignmentIds.map((id) => id.toString()),
        },
      },
    ]

    let weeklyTasksCompleted = 0
    if (weeklyTaskAssignmentIds.length > 0) {
      try {
        const completedSubmissions = await mongoose.connection
          .collection("submissions")
          .countDocuments({
            $and: [
              { $or: studentIdentityFilters },
              { $or: assignmentIdentityFilters },
              {
                $or: [
                  { submittedAt: { $exists: true, $ne: null } },
                  { submitted: true },
                  { isSubmitted: true },
                  {
                    status: {
                      $in: ["submitted", "SUBMITTED", "graded", "GRADED"],
                    },
                  },
                ],
              },
            ],
          })

        weeklyTasksCompleted = Math.min(weeklyTasksTotal, Number(completedSubmissions || 0))
      } catch {
        weeklyTasksCompleted = Math.max(0, weeklyTasksTotal - pendingAssignmentsCount)
      }
    }

    const messages = await Message.find({ recipient: studentId, archived: { $ne: true } })
      .populate("sender", "name")
      .sort({ createdAt: -1 })
      .limit(3)
      .lean()

    const unreadMessagesCount = await Message.countDocuments({
      recipient: studentId,
      archived: { $ne: true },
      read: false,
    })

    const messagePreview = messages.map((message) => ({
      id: message._id.toString(),
      sender: (message.sender as { name?: string })?.name || "Unknown sender",
      subject: message.subject,
      time: new Date(message.createdAt).toLocaleString(),
    }))

    const analytics = await StudyAnalytics.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: { $gte: weekStartUtc, $lt: weekEndUtc },
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

    const trackedWeekDoc = await StudentWeeklyStudy.findOne({
      student: new mongoose.Types.ObjectId(studentId),
      weekStart: weekStartUtc,
    })
      .select("trackedMinutes lastHeartbeatAt")
      .lean()

    const trackedHeartbeatMinutes = Number(trackedWeekDoc?.trackedMinutes || 0)
    const analyticsStudyMinutes = Number(analytics[0]?.totalStudyMinutes || 0)
    const combinedStudyMinutes = analyticsStudyMinutes + trackedHeartbeatMinutes

    const studyHoursThisWeek = `${Math.round((combinedStudyMinutes / 60) * 10) / 10}h`
    const averageQuizScore = `${Math.round(analytics[0]?.averageQuizScore || 0)}%`
    const courseCompletion = `${avgProgress}%`

    const streakDays = await StudyAnalytics.aggregate([
      {
        $match: {
          student: new mongoose.Types.ObjectId(studentId),
          date: { $gte: weekStartUtc, $lt: weekEndUtc },
          studyMinutes: { $gt: 0 },
        },
      },
      {
        $project: {
          dayKey: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$date",
              timezone: "UTC",
            },
          },
        },
      },
      {
        $group: {
          _id: "$dayKey",
        },
      },
      {
        $sort: {
          _id: -1,
        },
      },
    ])

    const activeDayKeys = new Set<string>(
      streakDays.map((entry) => String(entry?._id || "")).filter(Boolean),
    )

    if (trackedHeartbeatMinutes > 0) {
      activeDayKeys.add(toUtcDayKey(currentDate))
    }

    let currentStudyStreakDays = 0
    const streakCursor = new Date(currentDate)
    streakCursor.setUTCHours(0, 0, 0, 0)

    while (
      streakCursor >= weekStartUtc &&
      activeDayKeys.has(toUtcDayKey(streakCursor))
    ) {
      currentStudyStreakDays += 1
      streakCursor.setUTCDate(streakCursor.getUTCDate() - 1)
    }

    const analyticsPreview = [
      { label: "Study Hours This Week", value: studyHoursThisWeek },
      { label: "Average Quiz Score", value: averageQuizScore },
      { label: "Course Completion", value: courseCompletion },
    ]

    return NextResponse.json({
      success: true,
      data: {
        enrolledClasses: classPreview.map((classItem) => ({
          id: classItem.id,
          name: classItem.name,
        })),
        pendingAssignmentsCount,
        unreadMessagesCount,
        analyticsSummary: {
          studyHoursThisWeek,
          averageQuizScore,
          courseCompletion,
          currentStudyStreakDays,
          weeklyTasksCompleted,
          weeklyTasksTotal,
        },
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
