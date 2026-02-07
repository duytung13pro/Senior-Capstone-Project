"use server"

import dbConnect from "@/lib/mongodb"
import Message from "@/lib/models/Message"
import Notification from "@/lib/models/Notification"

// Get messages for a user
export async function getMessages(
  userId: string,
  filters?: {
    type?: "inbox" | "sent" | "starred" | "archived"
    unreadOnly?: boolean
    search?: string
  }
) {
  await dbConnect()

  let query: Record<string, unknown> = {}

  switch (filters?.type) {
    case "sent":
      query.sender = userId
      query.archived = { $ne: true }
      break
    case "starred":
      query.recipient = userId
      query.starred = true
      query.archived = { $ne: true }
      break
    case "archived":
      query.$or = [{ sender: userId }, { recipient: userId }]
      query.archived = true
      break
    default: // inbox
      query.recipient = userId
      query.archived = { $ne: true }
  }

  if (filters?.unreadOnly) {
    query.read = false
  }

  const messages = await Message.find(query)
    .populate("sender", "name email avatar")
    .populate("recipient", "name email avatar")
    .populate("course", "title")
    .sort({ createdAt: -1 })
    .lean()

  // Apply search filter
  if (filters?.search) {
    const searchLower = filters.search.toLowerCase()
    return messages.filter(
      (m) =>
        m.subject.toLowerCase().includes(searchLower) ||
        m.content.toLowerCase().includes(searchLower) ||
        (m.sender as { name?: string })?.name?.toLowerCase().includes(searchLower)
    )
  }

  return messages
}

// Get single message with thread
export async function getMessage(messageId: string, userId: string) {
  await dbConnect()

  const message = await Message.findOne({
    _id: messageId,
    $or: [{ sender: userId }, { recipient: userId }],
  })
    .populate("sender", "name email avatar")
    .populate("recipient", "name email avatar")
    .populate("course", "title")
    .lean()

  if (!message) {
    throw new Error("Message not found")
  }

  // Mark as read if recipient
  if (message.recipient._id.toString() === userId && !message.read) {
    await Message.findByIdAndUpdate(messageId, { read: true })
  }

  // Get thread (replies)
  const thread = await Message.find({ parentMessage: messageId })
    .populate("sender", "name email avatar")
    .sort({ createdAt: 1 })
    .lean()

  return { message, thread }
}

// Send a message
export async function sendMessage(
  senderId: string,
  data: {
    recipientId: string
    subject: string
    content: string
    courseId?: string
    attachments?: string[]
    parentMessageId?: string
  }
) {
  await dbConnect()

  const message = await Message.create({
    sender: senderId,
    recipient: data.recipientId,
    subject: data.subject,
    content: data.content,
    course: data.courseId,
    attachments: data.attachments || [],
    parentMessage: data.parentMessageId,
  })

  // Create notification for recipient
  await Notification.create({
    user: data.recipientId,
    title: "New Message",
    message: `You have a new message: ${data.subject}`,
    type: "message",
    link: `/student/messages/${message._id}`,
    relatedId: message._id,
    relatedModel: "Message",
  })

  return message
}

// Toggle message starred
export async function toggleMessageStarred(messageId: string, userId: string) {
  await dbConnect()

  const message = await Message.findOne({
    _id: messageId,
    recipient: userId,
  })

  if (!message) {
    throw new Error("Message not found")
  }

  message.starred = !message.starred
  await message.save()

  return message
}

// Archive message
export async function archiveMessage(messageId: string, userId: string) {
  await dbConnect()

  const message = await Message.findOneAndUpdate(
    {
      _id: messageId,
      $or: [{ sender: userId }, { recipient: userId }],
    },
    { archived: true },
    { new: true }
  )

  if (!message) {
    throw new Error("Message not found")
  }

  return message
}

// Delete message
export async function deleteMessage(messageId: string, userId: string) {
  await dbConnect()

  const message = await Message.findOneAndDelete({
    _id: messageId,
    $or: [{ sender: userId }, { recipient: userId }],
  })

  if (!message) {
    throw new Error("Message not found")
  }

  return { success: true }
}

// Get unread count
export async function getUnreadMessageCount(userId: string) {
  await dbConnect()

  const count = await Message.countDocuments({
    recipient: userId,
    read: false,
    archived: { $ne: true },
  })

  return count
}

// Bulk send messages (for instructors)
export async function bulkSendMessages(
  senderId: string,
  data: {
    recipientIds: string[]
    subject: string
    content: string
    courseId?: string
  }
) {
  await dbConnect()

  const messages = await Promise.all(
    data.recipientIds.map((recipientId) =>
      Message.create({
        sender: senderId,
        recipient: recipientId,
        subject: data.subject,
        content: data.content,
        course: data.courseId,
      })
    )
  )

  // Create notifications for all recipients
  await Promise.all(
    data.recipientIds.map((recipientId) =>
      Notification.create({
        user: recipientId,
        title: "New Message",
        message: `You have a new message: ${data.subject}`,
        type: "message",
        relatedModel: "Message",
      })
    )
  )

  return messages
}
