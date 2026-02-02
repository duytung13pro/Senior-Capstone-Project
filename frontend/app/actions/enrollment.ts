"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Enrollment from "@/lib/models/Enrollment"
import Course from "@/lib/models/Course"

export async function enrollInCourse(userId: string, courseId: string) {
  try {
    await dbConnect()

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    if (user.role !== "Student") {
      throw new Error("Only students can enroll in courses")
    }

    const course = await Course.findById(courseId)
    if (!course) throw new Error("Course not found")

    const existingEnrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    })

    if (existingEnrollment) {
      throw new Error("Already enrolled in this course")
    }

    const enrollment = new Enrollment({
      student: userId,
      course: courseId,
      progress: 0,
    })

    await enrollment.save()

    course.enrollmentCount += 1
    await course.save()

    return { success: true, enrollment }
  } catch (error) {
    console.error("Error enrolling in course:", error)
    throw error
  }
}

export async function updateProgress(userId: string, courseId: string, progress: number, completedModuleId?: string) {
  try {
    await dbConnect()

    const enrollment = await Enrollment.findOne({
      student: userId,
      course: courseId,
    })

    if (!enrollment) throw new Error("Enrollment not found")

    enrollment.progress = Math.min(progress, 100)

    if (completedModuleId && !enrollment.completedModules.includes(completedModuleId as any)) {
      enrollment.completedModules.push(completedModuleId as any)
    }

    if (enrollment.progress === 100) {
      enrollment.completedAt = new Date()
    }

    await enrollment.save()

    return { success: true, enrollment }
  } catch (error) {
    console.error("Error updating progress:", error)
    throw error
  }
}

export async function getStudentEnrollments(userId: string) {
  try {
    await dbConnect()

    const enrollments = await Enrollment.find({ student: userId }).populate("course").populate("student", "name email")

    return { success: true, enrollments }
  } catch (error) {
    console.error("Error fetching enrollments:", error)
    throw error
  }
}
