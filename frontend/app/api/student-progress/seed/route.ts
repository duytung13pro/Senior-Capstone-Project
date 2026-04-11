import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Course from "@/lib/models/Course"
import Enrollment from "@/lib/models/Enrollment"
import Grade from "@/lib/models/Grade"
import Assignment from "@/lib/models/Assignmen"
import StudyAnalytics from "@/lib/models/StudyAnalytics"

export const dynamic = "force-dynamic"

type DemoStudent = {
  name: string
  level: "Beginner" | "Intermediate" | "Advanced"
  progress: number
  className: string
  feedback: string
  weeklyScores: number[]
  quizScores: number[]
  attendanceLoad: number[]
}

const DEMO_TEACHER_EMAIL = "demo.teacher@rewood.local"

const DEMO_STUDENTS: DemoStudent[] = [
  {
    name: "Zhang Wei",
    level: "Beginner",
    progress: 75,
    className: "Beginner Mandarin",
    feedback: "Good progress on character writing",
    weeklyScores: [65, 68, 72, 70, 75, 78, 75, 80],
    quizScores: [75, 80, 72, 85, 82],
    attendanceLoad: [55, 48, 52, 10, 60],
  },
  {
    name: "Li Mei",
    level: "Intermediate",
    progress: 60,
    className: "Intermediate Conversation",
    feedback: "Needs to work on pronunciation",
    weeklyScores: [55, 58, 62, 60, 65, 63, 60, 65],
    quizScores: [65, 70, 62, 68, 72],
    attendanceLoad: [52, 25, 51, 45, 8],
  },
  {
    name: "Wang Chen",
    level: "Advanced",
    progress: 90,
    className: "Advanced Writing",
    feedback: "Excellent writing skills",
    weeklyScores: [85, 88, 86, 90, 92, 88, 90, 94],
    quizScores: [92, 88, 90, 95, 93],
    attendanceLoad: [62, 58, 61, 59, 60],
  },
  {
    name: "Liu Yang",
    level: "Intermediate",
    progress: 45,
    className: "HSK 4 Preparation",
    feedback: "Struggling with grammar",
    weeklyScores: [50, 48, 45, 42, 46, 44, 45, 48],
    quizScores: [48, 52, 45, 50, 55],
    attendanceLoad: [47, 9, 44, 7, 23],
  },
  {
    name: "Sun Ling",
    level: "Beginner",
    progress: 80,
    className: "Beginner Mandarin",
    feedback: "Great participation in class",
    weeklyScores: [70, 72, 75, 78, 76, 80, 82, 85],
    quizScores: [78, 82, 80, 85, 88],
    attendanceLoad: [58, 60, 56, 62, 54],
  },
  {
    name: "Zhao Ming",
    level: "Intermediate",
    progress: 70,
    className: "Business Mandarin",
    feedback: "Improving in conversation skills",
    weeklyScores: [65, 68, 70, 72, 68, 72, 75, 78],
    quizScores: [72, 75, 70, 78, 80],
    attendanceLoad: [57, 55, 26, 52, 50],
  },
]

const slugify = (value: string) =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")

const percentageToLetter = (percentage: number) => {
  if (percentage >= 97) return "A+"
  if (percentage >= 93) return "A"
  if (percentage >= 90) return "A-"
  if (percentage >= 87) return "B+"
  if (percentage >= 83) return "B"
  if (percentage >= 80) return "B-"
  if (percentage >= 77) return "C+"
  if (percentage >= 73) return "C"
  if (percentage >= 70) return "C-"
  if (percentage >= 67) return "D+"
  if (percentage >= 63) return "D"
  if (percentage >= 60) return "D-"
  return "F"
}

export async function POST() {
  try {
    await dbConnect()

    const teacher = await User.findOneAndUpdate(
      { email: DEMO_TEACHER_EMAIL },
      {
        $setOnInsert: {
          name: "Demo Teacher",
          password: "demo1234",
          role: "Teacher",
          teacherId: "T-DEMO-001",
          preferences: { language: "en", timezone: "UTC", theme: "system" },
        },
      },
      { upsert: true, new: true }
    )

    const courseMap = new Map<string, any>()

    for (const student of DEMO_STUDENTS) {
      if (!courseMap.has(student.className)) {
        const course = await Course.findOneAndUpdate(
          { title: student.className },
          {
            $setOnInsert: {
              description: `${student.className} demo dataset for AI-assisted progress monitoring`,
              instructor: teacher._id,
              level: student.level,
              duration: 960,
              price: 0,
            },
          },
          { upsert: true, new: true }
        )

        courseMap.set(student.className, course)
      }
    }

    for (const student of DEMO_STUDENTS) {
      const studentEmail = `${slugify(student.name)}@demo.student.local`
      const studentRecord = await User.findOneAndUpdate(
        { email: studentEmail },
        {
          $setOnInsert: {
            name: student.name,
            password: "demo1234",
            role: "Student",
            studentId: `S-${slugify(student.name).toUpperCase()}`,
            preferences: { language: "en", timezone: "UTC", theme: "system" },
          },
        },
        { upsert: true, new: true }
      )

      const course = courseMap.get(student.className)

      await Enrollment.findOneAndUpdate(
        { student: studentRecord._id, course: course._id },
        {
          $set: {
            progress: student.progress,
            completedAt: student.progress >= 100 ? new Date() : null,
          },
          $setOnInsert: {
            enrolledAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 56),
          },
        },
        { upsert: true }
      )

      const assignmentIds: any[] = []
      for (let i = 0; i < 5; i += 1) {
        const assignment = await Assignment.findOneAndUpdate(
          { course: course._id, title: `Demo Quiz ${i + 1}` },
          {
            $setOnInsert: {
              description: `Auto-generated demo quiz ${i + 1}`,
              type: "quiz",
              dueDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * (30 - i * 4)),
              totalPoints: 100,
              attachments: [],
              createdBy: teacher._id,
            },
          },
          { upsert: true, new: true }
        )

        assignmentIds.push(assignment._id)
      }

      for (let i = 0; i < student.quizScores.length; i += 1) {
        const score = student.quizScores[i]
        const assignmentId = assignmentIds[i]
        await Grade.findOneAndUpdate(
          { student: studentRecord._id, assignment: assignmentId },
          {
            $set: {
              course: course._id,
              score,
              maxScore: 100,
              percentage: score,
              letterGrade: percentageToLetter(score),
              category: "quiz",
              feedback: i === student.quizScores.length - 1 ? student.feedback : undefined,
              gradedBy: teacher._id,
              gradedAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * (25 - i * 4)),
            },
          },
          { upsert: true }
        )
      }

      for (let i = 0; i < student.weeklyScores.length; i += 1) {
        const date = new Date()
        date.setDate(date.getDate() - (student.weeklyScores.length - i) * 7)
        date.setHours(0, 0, 0, 0)

        const attendanceLoad = student.attendanceLoad[i % student.attendanceLoad.length]

        await StudyAnalytics.findOneAndUpdate(
          { student: studentRecord._id, course: course._id, date },
          {
            $set: {
              studyMinutes: attendanceLoad,
              modulesCompleted: Math.max(0, Math.round(student.weeklyScores[i] / 20)),
              quizzesTaken: 1,
              averageQuizScore: student.weeklyScores[i],
              assignmentsSubmitted: student.weeklyScores[i] >= 55 ? 1 : 0,
              resourcesViewed: Math.max(1, Math.round(student.weeklyScores[i] / 15)),
            },
          },
          { upsert: true }
        )
      }
    }

    for (const className of [...new Set(DEMO_STUDENTS.map((student) => student.className))]) {
      const course = courseMap.get(className)
      const enrolledCount = await Enrollment.countDocuments({ course: course._id })
      await Course.updateOne({ _id: course._id }, { $set: { enrollmentCount: enrolledCount } })
    }

    const userCount = await User.countDocuments({ email: /demo\.student\.local$/ })
    const enrollmentCount = await Enrollment.countDocuments({})

    return NextResponse.json({
      success: true,
      message: "Demo student progress data seeded successfully",
      seededStudents: userCount,
      totalEnrollments: enrollmentCount,
    })
  } catch (error) {
    console.error("Failed to seed student progress demo data", error)
    return NextResponse.json({ success: false, error: "Failed to seed demo data" }, { status: 500 })
  }
}
