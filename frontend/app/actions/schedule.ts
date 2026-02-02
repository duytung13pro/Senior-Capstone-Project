"use server"

import dbConnect from "@/lib/mongodb"
import ScheduleEvent from "@/lib/models/Schedule"
import Assignment from "@/lib/models/Assignment"
import Enrollment from "@/lib/models/Enrollment"

// Get schedule events for a user
export async function getScheduleEvents(
  userId: string,
  options?: {
    startDate?: Date
    endDate?: Date
    type?: string
    courseId?: string
  }
) {
  await dbConnect()

  const query: Record<string, unknown> = {
    $or: [{ createdBy: userId }, { participants: userId }],
  }

  if (options?.startDate && options?.endDate) {
    query.startTime = { $gte: options.startDate, $lte: options.endDate }
  }

  if (options?.type) {
    query.type = options.type
  }

  if (options?.courseId) {
    query.course = options.courseId
  }

  const events = await ScheduleEvent.find(query)
    .populate("course", "title")
    .populate("createdBy", "name")
    .sort({ startTime: 1 })
    .lean()

  return events
}

// Get calendar view with assignments as events
export async function getCalendarView(
  userId: string,
  options: {
    month: number
    year: number
  }
) {
  await dbConnect()

  const startDate = new Date(options.year, options.month, 1)
  const endDate = new Date(options.year, options.month + 1, 0, 23, 59, 59)

  // Get scheduled events
  const events = await getScheduleEvents(userId, { startDate, endDate })

  // Get enrolled courses for assignment due dates
  const enrollments = await Enrollment.find({ student: userId }).lean()
  const courseIds = enrollments.map((e) => e.course)

  // Get assignments with due dates in the month
  const assignments = await Assignment.find({
    course: { $in: courseIds },
    dueDate: { $gte: startDate, $lte: endDate },
  })
    .populate("course", "title")
    .lean()

  // Convert assignments to calendar events
  const assignmentEvents = assignments.map((assignment) => ({
    _id: `assignment-${assignment._id}`,
    title: `Due: ${assignment.title}`,
    description: assignment.description,
    type: "assignment" as const,
    course: assignment.course,
    assignment: assignment._id,
    startTime: assignment.dueDate,
    endTime: assignment.dueDate,
    color: "#ef4444", // Red for assignments
    isAssignment: true,
  }))

  // Combine and sort
  const allEvents = [...events, ...assignmentEvents].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
  )

  // Group by date
  const eventsByDate = allEvents.reduce(
    (acc, event) => {
      const dateKey = new Date(event.startTime).toISOString().split("T")[0]
      if (!acc[dateKey]) {
        acc[dateKey] = []
      }
      acc[dateKey].push(event)
      return acc
    },
    {} as Record<string, typeof allEvents>
  )

  return {
    events: allEvents,
    eventsByDate,
    month: options.month,
    year: options.year,
  }
}

// Create schedule event
export async function createScheduleEvent(
  userId: string,
  data: {
    title: string
    description?: string
    type: "class" | "assignment" | "exam" | "office_hours" | "event"
    courseId?: string
    startTime: Date
    endTime: Date
    location?: string
    recurring?: boolean
    recurrenceRule?: string
    color?: string
    participants?: string[]
    reminders?: { time: number; type: "email" | "notification" }[]
  }
) {
  await dbConnect()

  const event = await ScheduleEvent.create({
    title: data.title,
    description: data.description,
    type: data.type,
    course: data.courseId,
    startTime: data.startTime,
    endTime: data.endTime,
    location: data.location,
    recurring: data.recurring || false,
    recurrenceRule: data.recurrenceRule,
    color: data.color || getDefaultColor(data.type),
    createdBy: userId,
    participants: data.participants || [userId],
    reminders: data.reminders || [],
  })

  return event
}

// Helper for default colors
function getDefaultColor(type: string): string {
  const colors: Record<string, string> = {
    class: "#3b82f6", // Blue
    assignment: "#ef4444", // Red
    exam: "#f97316", // Orange
    office_hours: "#22c55e", // Green
    event: "#8b5cf6", // Purple
  }
  return colors[type] || "#6b7280"
}

// Update schedule event
export async function updateScheduleEvent(
  eventId: string,
  userId: string,
  data: Partial<{
    title: string
    description: string
    type: string
    startTime: Date
    endTime: Date
    location: string
    color: string
    participants: string[]
    reminders: { time: number; type: "email" | "notification" }[]
  }>
) {
  await dbConnect()

  const event = await ScheduleEvent.findOneAndUpdate({ _id: eventId, createdBy: userId }, data, { new: true })

  if (!event) {
    throw new Error("Event not found or unauthorized")
  }

  return event
}

// Delete schedule event
export async function deleteScheduleEvent(eventId: string, userId: string) {
  await dbConnect()

  const event = await ScheduleEvent.findOneAndDelete({
    _id: eventId,
    createdBy: userId,
  })

  if (!event) {
    throw new Error("Event not found or unauthorized")
  }

  return { success: true }
}

// Get upcoming events (next 7 days)
export async function getUpcomingEvents(userId: string, limit = 5) {
  await dbConnect()

  const now = new Date()
  const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

  const events = await ScheduleEvent.find({
    $or: [{ createdBy: userId }, { participants: userId }],
    startTime: { $gte: now, $lte: nextWeek },
  })
    .populate("course", "title")
    .sort({ startTime: 1 })
    .limit(limit)
    .lean()

  return events
}

// Get today's schedule
export async function getTodaySchedule(userId: string) {
  await dbConnect()

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  const events = await ScheduleEvent.find({
    $or: [{ createdBy: userId }, { participants: userId }],
    startTime: { $gte: today, $lt: tomorrow },
  })
    .populate("course", "title")
    .sort({ startTime: 1 })
    .lean()

  return events
}
