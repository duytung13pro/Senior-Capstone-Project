"use client"

import { useState } from "react"
import { Send, Plus, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Badge } from "@/components/ui/badge"
import { useChatContext } from "@/components/providers/chat-provider"

interface ChatInterfaceProps {
  variant?: "full" | "compact"
}

export function ChatInterface({ variant = "full" }: ChatInterfaceProps) {
  const {
    messages,
    resources,
    selectedResourceIds,
    setSelectedResourceIds,
    startNewChat,
    sendMessage,
    isStreaming,
    streamingError,
  } = useChatContext()

  const [input, setInput] = useState("")

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault()
    if (!input.trim()) return
    await sendMessage(input.trim())
    setInput("")
  }

  const toggleResource = (id: string) => {
    if (selectedResourceIds.includes(id)) {
      setSelectedResourceIds(selectedResourceIds.filter((r) => r !== id))
    } else {
      setSelectedResourceIds([...selectedResourceIds, id])
    }
  }

  return (
    <Card className="flex h-full flex-col border border-border/60 shadow-sm">
      <CardHeader className="flex items-center justify-between space-y-0 pb-3">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <Sparkles className="h-4 w-4 text-primary" />
            Trợ lý AI
          </CardTitle>
          <p className="text-xs text-muted-foreground">Chọn tài liệu để trợ lý trả lời trong ngữ cảnh.</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => void startNewChat()}>
          <Plus className="h-4 w-4 mr-1" /> Cuộc trò chuyện mới
        </Button>
      </CardHeader>

      <CardContent className="space-y-2">
        <div className="flex flex-wrap gap-2">
          {resources.slice(0, 8).map((r) => (
            <Badge
              key={r._id}
              variant={selectedResourceIds.includes(r._id) ? "default" : "secondary"}
              className="cursor-pointer"
              onClick={() => toggleResource(r._id)}
            >
              {r.title}
            </Badge>
          ))}
          {resources.length === 0 && (
            <p className="text-xs text-muted-foreground">Chưa có tài liệu. Vui lòng liên hệ giáo viên để bổ sung.</p>
          )}
        </div>
        <div className={`rounded-lg border bg-muted/20 ${variant === "full" ? "h-[420px]" : "h-64"}`}>
          <ScrollArea className="h-full p-3 space-y-3">
            {messages.length === 0 && (
              <div className="text-sm text-muted-foreground">Hãy bắt đầu trò chuyện với trợ lý của bạn.</div>
            )}
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm ${
                    msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-background border"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}
          </ScrollArea>
        </div>
        {streamingError && <p className="text-xs text-red-500">{streamingError}</p>}
      </CardContent>

      <CardFooter className="mt-auto border-t pt-3">
        <form className="flex w-full gap-2" onSubmit={handleSend}>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Đặt câu hỏi về bài học hoặc tài liệu..."
            disabled={isStreaming}
          />
          <Button type="submit" disabled={isStreaming || !input.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </CardFooter>
    </Card>
  )
}
