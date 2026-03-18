"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { useSession } from "next-auth/react"
import type { IChatMessage } from "@/lib/models/ChatSession"
import {
  appendChatMessage,
  createChatSession,
  deleteChatSession,
  listChatSessions,
  getResourcesForStudent,
} from "@/app/actions/chat"

interface ChatSessionRecord {
  _id: string
  title: string
  resourceIds?: { _id: string; title: string; course?: string }[] | string[]
  course?: string
  messages?: IChatMessage[]
}

interface ResourceRecord {
  _id: string
  title: string
  type: string
  course?: string
  module?: string
  tags?: string[]
}

interface ChatContextValue {
  sessions: ChatSessionRecord[]
  resources: ResourceRecord[]
  activeSessionId: string | null
  messages: IChatMessage[]
  selectedResourceIds: string[]
  isStreaming: boolean
  streamingError: string | null
  startNewChat: (opts?: { resourceIds?: string[]; courseId?: string; title?: string }) => Promise<string>
  selectSession: (id: string) => void
  removeSession: (id: string) => Promise<void>
  sendMessage: (content: string) => Promise<void>
  setSelectedResourceIds: (ids: string[]) => void
}

const ChatContext = createContext<ChatContextValue | undefined>(undefined)

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession()
  const studentId = session?.user?.id

  const [sessions, setSessions] = useState<ChatSessionRecord[]>([])
  const [resources, setResources] = useState<ResourceRecord[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<IChatMessage[]>([])
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingError, setStreamingError] = useState<string | null>(null)

  // Load sessions and resources when session is ready
  useEffect(() => {
    if (!studentId) return

    const load = async () => {
      const [sessionsRes, resourcesRes] = await Promise.all([
        listChatSessions(studentId),
        getResourcesForStudent(studentId),
      ])

      setSessions(sessionsRes as ChatSessionRecord[])
      setResources(resourcesRes as ResourceRecord[])

      if (!activeSessionId && sessionsRes.length > 0) {
        const first = sessionsRes[0]
        setActiveSessionId(first._id.toString())
        setMessages((first.messages || []) as IChatMessage[])
        const attached = (first.resourceIds || []) as string[]
        setSelectedResourceIds(attached.map((r: any) => (typeof r === "string" ? r : r._id)))
      }
    }

    void load()
  }, [studentId])

  const activeSession = useMemo(
    () => sessions.find((s) => s._id.toString() === activeSessionId),
    [sessions, activeSessionId]
  )

  const selectSession = useCallback(
    (id: string) => {
      setActiveSessionId(id)
      const found = sessions.find((s) => s._id.toString() === id)
      setMessages((found?.messages || []) as IChatMessage[])
      const attached = (found?.resourceIds || []) as string[]
      setSelectedResourceIds(attached.map((r: any) => (typeof r === "string" ? r : r._id)))
    },
    [sessions]
  )

  const startNewChat = useCallback(
    async (opts?: { resourceIds?: string[]; courseId?: string; title?: string }) => {
      if (!studentId) throw new Error("Missing student session")
      const sessionRes = await createChatSession(studentId, opts)
      setSessions((prev) => [sessionRes as ChatSessionRecord, ...prev])
      const newId = sessionRes._id.toString()
      setActiveSessionId(newId)
      setMessages([])
      setSelectedResourceIds(opts?.resourceIds ?? [])
      return newId
    },
    [studentId]
  )

  const removeSession = useCallback(
    async (id: string) => {
      if (!studentId) return
      await deleteChatSession(id, studentId)
      setSessions((prev) => prev.filter((s) => s._id.toString() !== id))
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
    },
    [studentId, activeSessionId]
  )

  const resolveCourseId = useCallback(() => {
    if (activeSession?.course) return activeSession.course.toString()
    // derive course from first attached resource
    const first = selectedResourceIds[0]
    if (first) {
      const resource = resources.find((r) => r._id.toString() === first)
      if (resource?.course) return resource.course.toString()
    }
    return null
  }, [activeSession, resources, selectedResourceIds])

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim()) return
      if (!studentId) throw new Error("Missing student session")

      let sessionId = activeSessionId
      if (!sessionId) {
        sessionId = await startNewChat({ resourceIds: selectedResourceIds })
      }

      if (!sessionId) return

      const courseId = resolveCourseId()
      if (!courseId) {
        setStreamingError("Vui lòng chọn khóa học hoặc tài liệu để trò chuyện.")
        return
      }

      const userMessage: IChatMessage = { role: "user", content, createdAt: new Date() }
      setMessages((prev) => [...prev, userMessage])
      await appendChatMessage(sessionId, userMessage, { resourceIds: selectedResourceIds })

      setIsStreaming(true)
      setStreamingError(null)

      const assistantMessage: IChatMessage = { role: "assistant", content: "", createdAt: new Date() }
      setMessages((prev) => [...prev, assistantMessage])

      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...(messages || []), userMessage].map((m) => ({ role: m.role, content: m.content })),
          courseId,
          resourceIds: selectedResourceIds,
          sessionId,
        }),
      })

      if (!response.ok) {
        let errorMessage = "Không thể kết nối AI service."
        try {
          const errData = await response.json()
          errorMessage = errData?.error || errData?.detail || errorMessage
        } catch {
          // no-op
        }
        setIsStreaming(false)
        setStreamingError(errorMessage)
        return
      }

      if (!response.body) {
        setIsStreaming(false)
        setStreamingError("Không thể kết nối AI service.")
        return
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder("utf-8")
      let buffer = ""
      let acc = ""

      const updateAssistant = (text: string) => {
        setMessages((prev) => {
          const clone = [...prev]
          const lastIndex = [...clone].reverse().findIndex((m) => m.role === "assistant")
          const idx = lastIndex >= 0 ? clone.length - 1 - lastIndex : clone.length - 1
          clone[idx] = { ...clone[idx], content: text }
          return clone
        })
      }

      try {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          buffer += decoder.decode(value, { stream: true })

          const parts = buffer.split("\n\n")
          buffer = parts.pop() || ""

          for (const part of parts) {
            const line = part.trim()
            if (!line.startsWith("data:")) continue
            const payload = line.slice(5).trim()
            if (payload === "[DONE]") {
              break
            }
            acc += payload
            updateAssistant(acc)
          }
        }
      } catch (err) {
        console.error("Chat stream failed", err)
        setStreamingError("Luồng phản hồi bị gián đoạn.")
      } finally {
        setIsStreaming(false)
        if (acc) {
          await appendChatMessage(sessionId, { role: "assistant", content: acc })
        }
        const updatedMessages = [...messages, userMessage, { ...assistantMessage, content: acc }]
        setSessions((prev) =>
          prev.map((s) => (s._id.toString() === sessionId ? { ...s, messages: updatedMessages } : s))
        )
      }
    },
    [studentId, activeSessionId, messages, selectedResourceIds, resolveCourseId, startNewChat]
  )

  const value: ChatContextValue = {
    sessions,
    resources,
    activeSessionId,
    messages,
    selectedResourceIds,
    isStreaming,
    streamingError,
    startNewChat,
    selectSession,
    removeSession,
    sendMessage,
    setSelectedResourceIds,
  }

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChatContext() {
  const ctx = useContext(ChatContext)
  if (!ctx) throw new Error("useChatContext must be used within ChatProvider")
  return ctx
}
