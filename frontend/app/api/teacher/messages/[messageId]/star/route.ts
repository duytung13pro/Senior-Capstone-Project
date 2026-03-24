import { NextRequest, NextResponse } from "next/server";

import { auth } from "@/auth";
import dbConnect from "@/lib/mongodb";
import Message from "@/lib/models/Message";

export const dynamic = "force-dynamic";

type PatchBody = {
  teacherId?: string;
};

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> },
) {
  try {
    await dbConnect();

    const [{ messageId }, session, body] = await Promise.all([
      params,
      auth(),
      request.json().catch(() => ({} as PatchBody)),
    ]);

    const teacherId = String(session?.user?.id || body?.teacherId || "").trim();
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
    });

    if (!message) {
      return NextResponse.json(
        { success: false, error: "Message not found" },
        { status: 404 },
      );
    }

    message.starred = !Boolean(message.starred);
    await message.save();

    return NextResponse.json({
      success: true,
      data: {
        id: String(message._id),
        starred: Boolean(message.starred),
      },
    });
  } catch (error) {
    console.error("Failed to toggle teacher message star", error);
    return NextResponse.json(
      { success: false, error: "Failed to toggle message star" },
      { status: 500 },
    );
  }
}
