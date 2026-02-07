"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import Course from "@/lib/models/Course"
import { requireRole } from "@/lib/auth/rbac"
import { getPresignedUploadUrl } from "@/lib/aws/s3"

export async function createCourse(
  userId: string,
  courseData: {
    title: string
    description: string
    level: "Beginner" | "Intermediate" | "Advanced"
    price: number
    duration: number
  },
) {
  try {
    await dbConnect()

    const user = await User.findById(userId)
    if (!user || !requireRole(user, "Instructor", "Admin")) {
      throw new Error("Only Instructors and Admins can create courses")
    }

    const course = new Course({
      ...courseData,
      instructor: userId,
    })

    await course.save()
    return { success: true, course }
  } catch (error) {
    console.error("Error creating course:", error)
    throw error
  }
}

export async function updateCourse(
  userId: string,
  courseId: string,
  courseData: Partial<{
    title: string
    description: string
    level: string
    price: number
    duration: number
    thumbnail: string
    videoUrl: string
  }>,
) {
  try {
    await dbConnect()

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    const course = await Course.findById(courseId)
    if (!course) throw new Error("Course not found")

    if (course.instructor.toString() !== userId && user.role !== "Admin") {
      throw new Error("You can only update your own courses")
    }

    Object.assign(course, courseData)
    await course.save()

    return { success: true, course }
  } catch (error) {
    console.error("Error updating course:", error)
    throw error
  }
}

export async function deleteCourse(userId: string, courseId: string) {
  try {
    await dbConnect()

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    const course = await Course.findById(courseId)
    if (!course) throw new Error("Course not found")

    if (course.instructor.toString() !== userId && user.role !== "Admin") {
      throw new Error("You can only delete your own courses")
    }

    await Course.deleteOne({ _id: courseId })
    return { success: true, message: "Course deleted" }
  } catch (error) {
    console.error("Error deleting course:", error)
    throw error
  }
}

export async function getCourses(filters?: { level?: string; instructor?: string }) {
  try {
    await dbConnect()

    const query: any = {}
    if (filters?.level) query.level = filters.level
    if (filters?.instructor) query.instructor = filters.instructor

    const courses = await Course.find(query).populate("instructor", "name email")
    return { success: true, courses }
  } catch (error) {
    console.error("Error fetching courses:", error)
    throw error
  }
}

export async function getPresignedVideoUploadUrl(fileName: string) {
  try {
    const fileType = "video/mp4"
    const url = await getPresignedUploadUrl(fileName, fileType, "videos")
    return { success: true, url }
  } catch (error) {
    console.error("Error getting presigned URL:", error)
    throw error
  }
}
