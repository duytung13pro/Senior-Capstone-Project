import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

const configuredBase = process.env.NEXT_PUBLIC_API_URL?.trim()

const backendCandidates = [
  configuredBase,
  "http://127.0.0.1:8081",
  "http://localhost:8081",
  "http://127.0.0.1:8080",
  "http://localhost:8080",
  "http://backend:8080",
].filter((value): value is string => Boolean(value))

function buildTargetUrl(base: string, pathSegments: string[], requestUrl: URL) {
  const path = pathSegments.join("/")
  const target = new URL(`${base.replace(/\/$/, "")}/${path}`)
  target.search = requestUrl.search
  return target
}

function createForwardHeaders(request: NextRequest) {
  const headers = new Headers(request.headers)
  headers.delete("host")
  headers.delete("connection")
  headers.delete("content-length")
  headers.delete("accept-encoding")
  return headers
}

async function proxyRequest(request: NextRequest, pathSegments: string[]) {
  const method = request.method.toUpperCase()
  const hasBody = method !== "GET" && method !== "HEAD"
  const requestBody = hasBody ? await request.arrayBuffer() : undefined
  const forwardHeaders = createForwardHeaders(request)

  let lastError: unknown = null

  for (const base of backendCandidates) {
    const targetUrl = buildTargetUrl(base, pathSegments, request.nextUrl)

    try {
      const response = await fetch(targetUrl, {
        method,
        headers: forwardHeaders,
        body: requestBody,
        redirect: "manual",
      })

      const responseHeaders = new Headers(response.headers)
      responseHeaders.delete("content-encoding")
      responseHeaders.delete("transfer-encoding")

      return new NextResponse(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      })
    } catch (error) {
      lastError = error
    }
  }

  const reason = lastError instanceof Error ? lastError.message : "Unknown proxy error"

  return NextResponse.json(
    {
      message: "Unable to reach backend service",
      reason,
      candidates: backendCandidates,
    },
    { status: 502 },
  )
}

export async function GET(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function POST(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params
  return proxyRequest(request, path)
}
