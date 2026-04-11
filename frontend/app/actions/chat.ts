"use server"

import dbConnect from "@/lib/mongodb"
import ChatSession from "@/lib/models/ChatSession"
import Resource from "@/lib/models/Resource"

export async function listChatSessions(studentId: string) {
  await dbConnect()
  return ChatSession.find({ student: studentId })
    .populate("resourceIds", "title type course")
    .sort({ updatedAt: -1 })
    .lean()
}

export async function createChatSession(
  studentId: string,
  opts?: { courseId?: string; resourceIds?: string[]; title?: string }
) {
  await dbConnect()
  const session = await ChatSession.create({
    student: studentId,
    course: opts?.courseId,
    resourceIds: opts?.resourceIds ?? [],
    title: opts?.title || "Cuộc trò chuyện mới",
  })
  return session.toObject()
}

export async function appendChatMessage(
  sessionId: string,
  message: { role: "user" | "assistant" | "system"; content: string },
  opts?: { resourceIds?: string[]; title?: string }
) {
  await dbConnect()

  const update: {
    $push: { messages: { role: string; content: string; createdAt: Date } }
    $set: Record<string, unknown>
  } = {
    $push: { messages: { ...message, createdAt: new Date() } },
    $set: { updatedAt: new Date() },
  }

  if (opts?.resourceIds) {
    update.$set.resourceIds = opts.resourceIds
  }

  if (opts?.title) {
    update.$set.title = opts.title
  }

  const session = await ChatSession.findByIdAndUpdate(sessionId, update, { new: true })
  if (!session) {
    throw new Error("Chat session not found")
  }

  return session.toObject()
}

export async function deleteChatSession(sessionId: string, studentId: string) {
  await dbConnect()
  const res = await ChatSession.findOneAndDelete({ _id: sessionId, student: studentId })
  if (!res) {
    throw new Error("Chat session not found or unauthorized")
  }
  return { success: true }
}

export async function getResourcesForStudent(studentId: string) {
  await dbConnect()

  // Limit to public resources from enrolled courses
  // MVP: return public document resources (already pre-vetted by instructors)
  const resources = await Resource.find({
    isPublic: true,
    type: { $in: ["pdf", "document", "PDF", "DOCUMENT"] },
  })
    .select("title type course module tags")
    .sort({ createdAt: -1 })
    .lean()

  return resources
}
