export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").trim()

export function apiUrl(path: string) {
  return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`
}

export function apiEndpointCandidates(path: string) {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`

  return Array.from(
    new Set([
      `/backend-api${normalizedPath}`,
      apiUrl(normalizedPath),
      `http://localhost:8081${normalizedPath}`,
      `http://127.0.0.1:8081${normalizedPath}`,
      `http://localhost:8080${normalizedPath}`,
      `http://127.0.0.1:8080${normalizedPath}`,
    ]),
  )
}

export async function fetchWithTimeout(
  input: string,
  init?: RequestInit,
  timeoutMs = 8000,
) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fetch(input, {
      ...init,
      signal: init?.signal ?? controller.signal,
    })
  } finally {
    clearTimeout(timeoutId)
  }
}

export async function fetchApiFirstOk(path: string, init?: RequestInit, timeoutMs = 8000) {
  let lastError: unknown = null

  for (const endpoint of apiEndpointCandidates(path)) {
    try {
      const res = await fetchWithTimeout(endpoint, init, timeoutMs)
      if (res.ok) {
        return res
      }
      lastError = new Error(`HTTP ${res.status} from ${endpoint}`)
    } catch (error) {
      lastError = error
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error("Unable to reach class API")
}
