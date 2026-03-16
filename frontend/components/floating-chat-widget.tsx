"use client"

import { useState } from "react"
import { MessageCircle, X } from "lucide-react"
import { ChatInterface } from "@/components/chat/chat-interface"
import { Button } from "@/components/ui/button"

export function FloatingChatWidget() {
  const [open, setOpen] = useState(false)

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {open && (
        <div className="mb-3 w-[360px] max-w-[90vw] rounded-lg border bg-background shadow-2xl">
          <div className="flex items-center justify-between border-b px-3 py-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <MessageCircle className="h-4 w-4 text-primary" />
              Trợ lý AI
            </div>
            <Button size="icon" variant="ghost" onClick={() => setOpen(false)}>
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="p-3">
            <ChatInterface variant="compact" />
          </div>
        </div>
      )}

      <Button
        className="rounded-full shadow-lg"
        size="lg"
        onClick={() => setOpen((v) => !v)}
      >
        <MessageCircle className="mr-2 h-5 w-5" />
        {open ? "Thu gọn" : "Trợ lý"}
      </Button>
    </div>
  )
}
