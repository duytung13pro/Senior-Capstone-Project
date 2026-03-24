import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import "@/lib/models/Course";
import Message from "@/lib/models/Message";
import Notification from "@/lib/models/Notification";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

type RequestBody = {
  teacherId?: string;
  content?: string;
};

const toPlainUser = (value: any) => {
  const name = String(value?.name || "").trim();
  const email = String(value?.email || "").trim();

  return {
    id: String(value?._id || ""),
    name: name || email || "Unknown user",
    email,
  };
};

const toThreadItem = (message: any) => ({
  id: String(message?._id || ""),
  subject: String(message?.subject || "(No subject)"),
  content: String(message?.content || ""),
  createdAt: message?.createdAt,
  read: Boolean(message?.read),
  starred: Boolean(message?.starred),
  courseTitle: String(message?.course?.title || "").trim() || "General",
  sender: toPlainUser(message?.sender),
  recipient: toPlainUser(message?.recipient),
  parentMessageId: String(message?.parentMessage || "").trim() || null,
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    await dbConnect();

    const [{ messageId }, session] = await Promise.all([params, auth()]);
    const { searchParams } = new URL(request.url);
    const teacherId = String(
      session?.user?.id || searchParams.get("teacherId") || "",
    ).trim();

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "Missing teacherId" },
        { status: 400 },
      );
    }

    const message = await Message.findOne({
      _id: messageId,
      $or: [{ sender: teacherId }, { recipient: teacherId }],
      archived: { $ne: true },
    })
      .populate("sender", "name email")
      .populate("recipient", "name email")
      .populate("course", "title")
      .lean();

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 },
      );
    }

    const rootMessageId = String(message?.parentMessage || message?._id || "").trim();

    const threadMessages = await Message.find({
      $or: [{ _id: rootMessageId }, { parentMessage: rootMessageId }],
      archived: { $ne: true },
    })
      .populate("sender", "name email")
      .populate("recipient", "name email")
      .populate("course", "title")
      .sort({ createdAt: 1 })
      .lean();

    await Message.updateMany(
      {
        _id: { $in: threadMessages.map((item: any) => item._id) },
        recipient: teacherId,
        read: false,
      },
      { $set: { read: true } },
    );

    return NextResponse.json({
      success: true,
      data: {
        rootMessageId,
        currentUserId: teacherId,
        thread: threadMessages.map(toThreadItem),
      },
    });
  } catch (error) {
    console.error("Failed to fetch teacher message thread", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch message thread" },
      { status: 500 },
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    await dbConnect();

    const [{ messageId }, session, body] = await Promise.all([
      params,
      auth(),
      request.json().catch(() => ({} as RequestBody)),
    ]);

    const teacherId = String(session?.user?.id || body?.teacherId || "").trim();
    const content = String(body?.content || "").trim();

    if (!teacherId) {
      return NextResponse.json(
        { success: false, error: "Missing teacherId" },
        { status: 400 },
      );
    }

    if (!content) {
      return NextResponse.json(
        { success: false, error: "Reply content is required" },
        { status: 400 },
      );
    }

    const baseMessage = await Message.findOne({
      _id: messageId,
      $or: [{ sender: teacherId }, { recipient: teacherId }],
      archived: { $ne: true },
    });

    if (!baseMessage) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 },
      );
    }

    const rootMessageId = String(baseMessage.parentMessage || baseMessage._id).trim();
    const senderId = String(teacherId).trim();
    const recipientId =
      String(baseMessage.sender) === senderId
        ? String(baseMessage.recipient)
        : String(baseMessage.sender);

    const reply = await Message.create({
      sender: senderId,
      recipient: recipientId,
      subject: baseMessage.subject,
      content,
      course: baseMessage.course,
      parentMessage: rootMessageId,
    });

    await Notification.create({
      user: recipientId,
      title: "New Message Reply",
      message: `You have a new reply: ${String(baseMessage.subject || "Message")}`,
      type: "message",
      relatedId: reply._id,
      relatedModel: "Message",
    });

    return NextResponse.json({
      success: true,
      data: {
        id: String(reply._id),
      },
    });
  } catch (error) {
    console.error("Failed to send teacher message reply", error);
    return NextResponse.json(
      { success: false, error: "Failed to send reply" },
      { status: 500 },
    );
  }
}
