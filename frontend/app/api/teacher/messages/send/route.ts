import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";
import Notification from "@/lib/models/Notification";

export const dynamic = "force-dynamic";

type SendRequestBody = {
  senderId?: string;
  classId?: string;
  subject?: string;
  content?: string;
  recipientId?: string;
  recipientIds?: string[];
};

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
    const body = (await request.json()) as SendRequestBody;

    const senderId = String(session?.user?.id || body?.senderId || "").trim();
    const classId = String(body?.classId || "").trim();
    const subject = String(body?.subject || "").trim();
    const content = String(body?.content || "").trim();
    const directRecipientId = String(body?.recipientId || "").trim();
    const broadcastRecipientIds = Array.isArray(body?.recipientIds)
      ? body.recipientIds
          .map((value) => String(value || "").trim())
          .filter(Boolean)
      : [];

    if (!senderId) {
      return NextResponse.json(
        { success: false, error: "Missing senderId" },
        { status: 400 },
      );
    }

    if (!classId || !subject || !content) {
      return NextResponse.json(
        { success: false, error: "classId, subject, and content are required" },
        { status: 400 },
      );
    }

    if (!directRecipientId && broadcastRecipientIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "recipientId or recipientIds is required" },
        { status: 400 },
      );
    }

    if (directRecipientId) {
      const message = await Message.create({
        sender: senderId,
        recipient: directRecipientId,
        subject,
        content,
        course: classId,
      });

      await Notification.create({
        user: directRecipientId,
        title: "New Message",
        message: `You have a new message: ${subject}`,
        type: "message",
        link: `/student/messages/${message._id}`,
        relatedId: message._id,
        relatedModel: "Message",
      });

      return NextResponse.json({ success: true, count: 1 });
    }

    const messages = await Promise.all(
      broadcastRecipientIds.map((recipientId) =>
        Message.create({
          sender: senderId,
          recipient: recipientId,
          subject,
          content,
          course: classId,
        }),
      ),
    );

    await Promise.all(
      broadcastRecipientIds.map((recipientId) =>
        Notification.create({
          user: recipientId,
          title: "New Message",
          message: `You have a new message: ${subject}`,
          type: "message",
          relatedModel: "Message",
        }),
      ),
    );

    return NextResponse.json({
      success: true,
      count: messages.length,
    });
  } catch (error) {
    console.error("Failed to send teacher message", error);
    return NextResponse.json(
      { success: false, error: "Failed to send message" },
      { status: 500 },
    );
  }
}
