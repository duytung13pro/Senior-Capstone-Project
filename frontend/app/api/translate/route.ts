import { NextResponse } from "next/server"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000"

export async function POST(req: Request) {
  try {
    const payload = await req.json()

    const upstream = await fetch(`${AI_SERVICE_URL}/translate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    const data = await upstream.json()

    if (!upstream.ok) {
      return NextResponse.json(
        { error: data?.detail || data?.message || "Translation request failed" },
        { status: upstream.status }
      )
    }

    return NextResponse.json(data)
  } catch (error) {
    console.error("Translate proxy error", error)
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 502 })
  }
}
