import { NextResponse } from "next/server"
import fs from "node:fs/promises"
import path from "node:path"

export async function GET(_req: Request, { params }: { params: { path: string[] } }) {
  const parts = params?.path || []

  if (!parts.length) {
    return NextResponse.json({ error: "Missing media path" }, { status: 400 })
  }

  // Prevent path traversal
  if (parts.some((p) => p.includes("..") || p.includes("/") || p.includes("\\"))) {
    return NextResponse.json({ error: "Invalid media path" }, { status: 400 })
  }

  const filePath = path.join(process.cwd(), "public", "media", ...parts)

  try {
    const data = await fs.readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentType =
      ext === ".pdf"
        ? "application/pdf"
        : ext === ".txt"
          ? "text/plain; charset=utf-8"
          : "application/octet-stream"

    return new NextResponse(data, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch {
    return NextResponse.json({ error: "Media file not found" }, { status: 404 })
  }
}
