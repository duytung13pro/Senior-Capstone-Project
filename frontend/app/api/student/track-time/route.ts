import { NextResponse } from "next/server"
import mongoose from "mongoose"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import StudentWeeklyStudy from "@/lib/models/StudentWeeklyStudy"

export const dynamic = "force-dynamic"
const HEARTBEAT_INCREMENT_WINDOW_MS = 45000

const getWeekStartUtc = (date: Date) => {
  const copy = new Date(date)
  const day = copy.getUTCDay()
  const diffToMonday = day === 0 ? -6 : 1 - day
  copy.setUTCDate(copy.getUTCDate() + diffToMonday)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

export async function POST() {
  try {
    const session = await auth()
    const studentId = String(session?.user?.id || "")
    const role = String(session?.user?.role || "").toLowerCase()

    if (!studentId || role !== "student") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      )
    }

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { success: false, error: "Invalid student id" },
        { status: 400 },
      )
    }

    await dbConnect()

    const now = new Date()
    const weekStart = getWeekStartUtc(now)
    const studentObjectId = new mongoose.Types.ObjectId(studentId)
    const cutoff = new Date(now.getTime() - HEARTBEAT_INCREMENT_WINDOW_MS)

    const updateResult = await StudentWeeklyStudy.updateOne(
      {
        student: studentObjectId,
        weekStart,
        $or: [
          { lastHeartbeatAt: { $exists: false } },
          { lastHeartbeatAt: null },
          { lastHeartbeatAt: { $lte: cutoff } },
        ],
      },
      {
        $inc: { trackedMinutes: 1 },
        $set: { lastHeartbeatAt: now },
        $setOnInsert: {
          student: studentObjectId,
          weekStart,
        },
      },
      { upsert: false },
    )

    if (updateResult.modifiedCount > 0) {
      return NextResponse.json({ success: true, counted: true })
    }

    const existing = await StudentWeeklyStudy.findOne({
      student: studentObjectId,
      weekStart,
    })
      .select("_id")
      .lean()

    if (existing) {
      return NextResponse.json({ success: true, counted: false })
    }

    try {
      await StudentWeeklyStudy.create({
        student: studentObjectId,
        weekStart,
        trackedMinutes: 1,
        lastHeartbeatAt: now,
      })

      return NextResponse.json({ success: true, counted: true })
    } catch (createError) {
      const duplicateKeyErrorCode =
        createError &&
        typeof createError === "object" &&
        "code" in createError &&
        Number((createError as { code?: unknown }).code) === 11000

      if (duplicateKeyErrorCode) {
        return NextResponse.json({ success: true, counted: false })
      }

      throw createError
    }
  } catch (error) {
    console.error("track-time error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to track study time" },
      { status: 500 },
    )
  }
}
