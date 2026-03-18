import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongodb"
import Resource from "@/lib/models/Resource"

export async function GET() {
  try {
    await dbConnect()

    const resources = await Resource.find({
      isPublic: true,
      type: { $in: ["pdf", "document", "PDF", "DOCUMENT"] },
    })
      .populate("course", "title")
      .populate("uploadedBy", "name")
      .sort({ createdAt: -1 })
      .lean()

    return NextResponse.json({ resources })
  } catch (error) {
    console.error("Failed to fetch student resources", error)
    return NextResponse.json({ resources: [] }, { status: 500 })
  }
}
