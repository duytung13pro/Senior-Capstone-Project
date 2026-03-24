import { NextRequest, NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Grade from "@/lib/models/Grade"
import Course from "@/lib/models/Course"
import Assignment from "@/lib/models/Assignmen.ts"
import Enrollment from "@/lib/models/Enrollment"
import { auth } from "@/auth"

export const dynamic = "force-dynamic"

function calculateGPA(grades: any[]): number {
  // Simple GPA calculation: A=4, B=3, C=2, D=1, F=0, weighted by credits
  const letterToPoints: Record<string, number> = {
    "A+": 4.0, A: 4.0, "A-": 3.7,
    "B+": 3.3, B: 3.0, "B-": 2.7,
    "C+": 2.3, C: 2.0, "C-": 1.7,
    "D+": 1.3, D: 1.0, "D-": 0.7,
    F: 0.0,
  }
  let totalPoints = 0
  let totalCredits = 0
  for (const g of grades) {
    const pts = letterToPoints[g.letterGrade] ?? 0
    totalPoints += pts * (g.credits || 1)
    totalCredits += g.credits || 1
  }
  return totalCredits > 0 ? Math.round((totalPoints / totalCredits) * 100) / 100 : 0
}

export async function GET(req: NextRequest) {
  await dbConnect()
  const session = await auth()
  const studentId = session?.user?.id
  if (!studentId) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
  }

  // Get all grades for this student
  const grades = await Grade.find({ student: studentId })
    .populate({ path: "course", model: Course })
    .populate({ path: "assignment", model: Assignment })
    .lean()

  // Group by course
  const coursesMap: Record<string, any> = {}
  for (const g of grades) {
    const courseId = g.course._id.toString()
    if (!coursesMap[courseId]) {
      coursesMap[courseId] = {
        id: courseId,
        title: g.course.title,
        instructor: g.course.instructorName || "",
        credits: g.course.credits || 3,
        currentGrade: 0,
        letterGrade: "",
        trend: "",
        grades: [],
      }
    }
    coursesMap[courseId].grades.push({
      id: g.assignment._id.toString(),
      name: g.assignment.title,
      type: g.category,
      score: g.score,
      maxScore: g.maxScore,
      weight: g.weight,
      date: g.gradedAt,
      feedback: g.feedback || null,
    })
  }

  // Calculate current grade and letter for each course
  for (const course of Object.values(coursesMap)) {
    if (course.grades.length > 0) {
      const total = course.grades.reduce((acc: number, a: any) => acc + (a.score / a.maxScore) * a.weight, 0 as number)
      const max = course.grades.reduce((acc: number, a: any) => acc + a.weight, 0 as number)
      const percent = max > 0 ? (total / max) * 100 : 0
      course.currentGrade = Math.round(percent)
      if (percent >= 93) course.letterGrade = "A"
      else if (percent >= 90) course.letterGrade = "A-"
      else if (percent >= 87) course.letterGrade = "B+"
      else if (percent >= 83) course.letterGrade = "B"
      else if (percent >= 80) course.letterGrade = "B-"
      else if (percent >= 77) course.letterGrade = "C+"
      else if (percent >= 73) course.letterGrade = "C"
      else if (percent >= 70) course.letterGrade = "C-"
      else if (percent >= 67) course.letterGrade = "D+"
      else if (percent >= 63) course.letterGrade = "D"
      else if (percent >= 60) course.letterGrade = "D-"
      else course.letterGrade = "F"
    }
  }

  const courses = Object.values(coursesMap)
  const gpa = calculateGPA(courses)
  const totalCredits = courses.reduce((acc, c) => acc + (c.credits || 3), 0)

  return NextResponse.json({ gpa, totalCredits, courses })
}
