import { NextResponse } from "next/server"

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || "http://localhost:8000"

export async function POST(req: Request) {
  const { messages, courseId, resourceIds, sessionId } = await req.json()

  if (!messages || !courseId) {
    return NextResponse.json({ error: "Missing messages or courseId" }, { status: 400 })
  }

  let upstream: Response
  try {
    upstream = await fetch(`${AI_SERVICE_URL}/chat/stream`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
      body: JSON.stringify({ messages, courseId, resourceIds, sessionId }),
      // @ts-expect-error node18 fetch duplex hint
      duplex: "half",
    })
  } catch (error) {
    console.error("Failed to reach AI service", error)
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 502 })
  }

  if (!upstream.ok || !upstream.body) {
    return NextResponse.json({ error: "Failed to reach AI service" }, { status: 502 })
  }

  const stream = new ReadableStream({
    async start(controller) {
      const reader = upstream.body!.getReader()
      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          if (value) controller.enqueue(value)
        }
      } catch (err) {
        console.error("Chat stream relay error", err)
      } finally {
        controller.close()
      }
    },
  })

  return new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  })
}
