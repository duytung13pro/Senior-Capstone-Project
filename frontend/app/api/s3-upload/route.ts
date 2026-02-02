import { type NextRequest, NextResponse } from "next/server"
import { getPresignedUploadUrl } from "@/lib/aws/s3"

export async function POST(request: NextRequest) {
  try {
    const { fileName, fileType, folderPath } = await request.json()

    if (!fileName || !fileType) {
      return NextResponse.json({ success: false, error: "Missing required fields" }, { status: 400 })
    }

    const url = await getPresignedUploadUrl(fileName, fileType, folderPath || "uploads")

    return NextResponse.json({ success: true, url })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ success: false, error: "Failed to generate upload URL" }, { status: 500 })
  }
}
