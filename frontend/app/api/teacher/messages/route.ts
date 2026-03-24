import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import "@/lib/models/Course";
import Message from "@/lib/models/Message";
import "@/lib/models/User";

export const dynamic = "force-dynamic";

const toHexString = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value.toHexString === "function") return value.toHexString();
  if (typeof value.toString === "function") return value.toString();
  return String(value);
};

const toInitials = (name: string) => {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || "ST").toUpperCase();
};

const formatTimeLabel = (value: Date | string | undefined) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const resolveDisplayName = (user: any) => {
  const firstName = String(user?.firstName || "").trim();
  const lastName = String(user?.lastName || "").trim();
  const fullName = `${firstName} ${lastName}`.trim();
  const name = String(user?.name || "").trim();
  const email = String(user?.email || "").trim();

  return {
    name: fullName || name || email || "Unknown user",
    email,
  };
};

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const session = await auth();
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
    
    const messages = await Message.find({
      $or: [{ recipient: teacherId }, { sender: teacherId }],
      archived: { $ne: true },
    })
      .populate("sender", "name firstName lastName email")
      .populate("recipient", "name firstName lastName email")
      .populate("course", "title")
      .sort({ createdAt: -1 })
      .lean();

    console.log("Found messages:", messages.length);

    const data = messages.map((message: any) => {
      // Determine if this message was sent by the teacher (rather than received)
      const senderIdHex = toHexString(message?.sender?._id);
      const teacherIdHex = toHexString(teacherId);
      const isSentByTeacher = senderIdHex === teacherIdHex;

      const senderUser = resolveDisplayName(message?.sender);
      const recipientUser = resolveDisplayName(message?.recipient);
      const counterpart = isSentByTeacher ? recipientUser : senderUser;

      const preview = String(message?.content || "").replace(/\s+/g, " ").trim();

      return {
        id: String(message?._id || ""),
        sender: counterpart.name,
        senderEmail: counterpart.email,
        recipient: recipientUser.name,
        recipientEmail: recipientUser.email,
        direction: isSentByTeacher ? "sent" : "received",
        counterpartName: counterpart.name,
        counterpartEmail: counterpart.email,
        subject: String(message?.subject || "(No subject)"),
        class:
          String(message?.course?.title || "").trim() || "General",
        time: formatTimeLabel(message?.createdAt),
        status:
          isSentByTeacher || message?.read
            ? "Read"
            : "Unread",
        starred: Boolean(message?.starred),
        avatar: toInitials(counterpart.name),
        preview,
        body: String(message?.content || ""),
      };
    });

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Failed to fetch teacher messages", error);
    const detail = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { success: false, error: "Failed to fetch teacher messages", detail },
      { status: 500 },
    );
  }
}
