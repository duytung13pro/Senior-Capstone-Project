"use client"

import { useChatContext } from "@/components/providers/chat-provider"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Trash2 } from "lucide-react"

export default function StudentAiChatPage() {
  const { sessions, activeSessionId, selectSession, removeSession, startNewChat } = useChatContext()

  return (
    <div className="grid gap-4 md:grid-cols-[300px_1fr]">
      <Card className="h-fit border border-border/60 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Lịch sử trò chuyện</CardTitle>
          <Button size="sm" variant="outline" onClick={() => void startNewChat()}>
            <Plus className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[520px] pr-2">
            {sessions.length === 0 && <p className="text-sm text-muted-foreground">Chưa có cuộc trò chuyện nào.</p>}
            <div className="space-y-2">
              {sessions.map((s) => (
                <div
                  key={s._id}
                  className={`flex items-center justify-between rounded-md border px-3 py-2 text-sm transition hover:bg-muted ${
                    activeSessionId === s._id.toString() ? "border-primary bg-muted" : "border-border"
                  }`}
                >
                  <button className="flex-1 text-left" onClick={() => selectSession(s._id.toString())}>
                    <div className="font-medium">{s.title || "Trò chuyện"}</div>
                    <div className="text-xs text-muted-foreground">{(s.resourceIds as any)?.length || 0} tài liệu</div>
                  </button>
                  <Button size="icon" variant="ghost" onClick={() => void removeSession(s._id.toString())}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      <ChatInterface />
    </div>
  )
}
