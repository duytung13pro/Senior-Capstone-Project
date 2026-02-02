"use server"

import dbConnect from "@/lib/mongodb"
import Resource from "@/lib/models/Resource"
import Enrollment from "@/lib/models/Enrollment"
import StudyAnalytics from "@/lib/models/StudyAnalytics"

// Get resources for a student (only enrolled courses)
export async function getStudentResources(
  studentId: string,
  filters?: {
    courseId?: string
    type?: string
    tags?: string[]
    search?: string
  }
) {
  await dbConnect()

  // Get enrolled courses
  const enrollments = await Enrollment.find({ student: studentId }).lean()
  const courseIds = enrollments.map((e) => e.course)

  const query: Record<string, unknown> = {
    course: { $in: courseIds },
    isPublic: true,
  }

  if (filters?.courseId) {
    query.course = filters.courseId
  }

  if (filters?.type) {
    query.type = filters.type
  }

  if (filters?.tags && filters.tags.length > 0) {
    query.tags = { $in: filters.tags }
  }

  const resources = await Resource.find(query)
    .populate("course", "title")
    .populate("uploadedBy", "name")
    .populate("module", "title")
    .sort({ createdAt: -1 })
    .lean()

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    return resources.filter(
      (r) =>
        r.title.toLowerCase().includes(searchLower) ||
        r.description?.toLowerCase().includes(searchLower) ||
        r.tags.some((t: string) => t.toLowerCase().includes(searchLower))
    )
  }

  return resources
}

// Get resources organized by course
export async function getResourcesByCourse(studentId: string) {
  await dbConnect()

  const enrollments = await Enrollment.find({ student: studentId })
    .populate("course", "title")
    .lean()

  const resourcesByCourse = await Promise.all(
    enrollments.map(async (enrollment) => {
      const courseId = enrollment.course._id || enrollment.course
      const resources = await Resource.find({
        course: courseId,
        isPublic: true,
      })
        .populate("module", "title order")
        .sort({ createdAt: -1 })
        .lean()

      // Group by type
      const byType = resources.reduce(
        (acc, r) => {
          if (!acc[r.type]) {
            acc[r.type] = []
          }
          acc[r.type].push(r)
          return acc
        },
        {} as Record<string, typeof resources>
      )

      return {
        course: enrollment.course,
        resources,
        byType,
        count: resources.length,
      }
    })
  )

  return resourcesByCourse
}

// Track resource view/download
export async function trackResourceView(studentId: string, resourceId: string) {
  await dbConnect()

  const resource = await Resource.findByIdAndUpdate(resourceId, { $inc: { downloadCount: 1 } }, { new: true })

  if (!resource) {
    throw new Error("Resource not found")
  }

  // Update study analytics
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  await StudyAnalytics.findOneAndUpdate(
    { student: studentId, course: resource.course, date: today },
    { $inc: { resourcesViewed: 1 } },
    { upsert: true }
  )

  return resource
}

// Get all unique tags for filtering
export async function getResourceTags(studentId: string) {
  await dbConnect()

  const enrollments = await Enrollment.find({ student: studentId }).lean()
  const courseIds = enrollments.map((e) => e.course)

  const resources = await Resource.find({
    course: { $in: courseIds },
    isPublic: true,
  })
    .select("tags")
    .lean()

  const allTags = resources.flatMap((r) => r.tags)
  const uniqueTags = [...new Set(allTags)]

  return uniqueTags.sort()
}

// Upload resource (for instructors)
export async function uploadResource(
  userId: string,
  data: {
    title: string
    description?: string
    type: "pdf" | "video" | "link" | "document" | "image" | "other"
    url: string
    fileSize?: number
    courseId: string
    moduleId?: string
    tags?: string[]
    isPublic?: boolean
  }
) {
  await dbConnect()

  const resource = await Resource.create({
    title: data.title,
    description: data.description,
    type: data.type,
    url: data.url,
    fileSize: data.fileSize,
    course: data.courseId,
    module: data.moduleId,
    tags: data.tags || [],
    uploadedBy: userId,
    isPublic: data.isPublic !== false,
  })

  return resource
}

// Delete resource (for instructors)
export async function deleteResource(resourceId: string, userId: string) {
  await dbConnect()

  const resource = await Resource.findOneAndDelete({
    _id: resourceId,
    uploadedBy: userId,
  })

  if (!resource) {
    throw new Error("Resource not found or unauthorized")
  }

  return { success: true }
}

// Get recently viewed resources
export async function getRecentlyViewedResources(studentId: string, limit = 5) {
  await dbConnect()

  // This would ideally be tracked in a separate collection
  // For now, return most popular resources from enrolled courses
  const enrollments = await Enrollment.find({ student: studentId }).lean()
  const courseIds = enrollments.map((e) => e.course)

  const resources = await Resource.find({
    course: { $in: courseIds },
    isPublic: true,
  })
    .populate("course", "title")
    .sort({ downloadCount: -1 })
    .limit(limit)
    .lean()

  return resources
}
