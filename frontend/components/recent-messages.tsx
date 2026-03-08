"use client";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  loadTeacherMessages,
  TEACHER_MESSAGES_UPDATED_EVENT,
  type TeacherMessage,
} from "@/lib/teacher-messages";

type RecentMessagesProps = {
  onUnreadCountChange?: (count: number) => void;
};

export function RecentMessages({ onUnreadCountChange }: RecentMessagesProps) {
  const router = useRouter(); // Initialize router
  const [messages, setMessages] = useState<TeacherMessage[]>([]);

  useEffect(() => {
    const syncMessages = () => {
      setMessages(loadTeacherMessages());
    };

    syncMessages();
    window.addEventListener(TEACHER_MESSAGES_UPDATED_EVENT, syncMessages);

    return () => {
      window.removeEventListener(TEACHER_MESSAGES_UPDATED_EVENT, syncMessages);
    };
  }, []);

  const recentMessages = useMemo(() => messages.slice(0, 4), [messages]);

  useEffect(() => {
    if (!onUnreadCountChange) {
      return;
    }

    const unreadCount = messages.filter(
      (message) => message.status === "Unread",
    ).length;
    onUnreadCountChange(unreadCount);
  }, [messages, onUnreadCountChange]);

  const handleMessageClick = (messageId: string) => {
    router.push(`/dashboard/teacher/messages?id=${messageId}`);
  };

  return (
    <div className="space-y-4">
      {recentMessages.map((message) => (
        <div
          key={message.id}
          className="flex cursor-pointer items-start gap-4 rounded-lg border p-3 hover:bg-muted/50"
          onClick={() => handleMessageClick(message.id)}
        >
          <Avatar className="h-10 w-10">
            <AvatarImage src="/placeholder.svg" alt={message.sender} />
            <AvatarFallback>{message.avatar}</AvatarFallback>
          </Avatar>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between">
              <div className="font-medium">{message.sender}</div>
              <div className="text-xs text-muted-foreground">
                {message.time}
              </div>
            </div>
            <div className="text-sm">{message.subject}</div>
            <div className="flex items-center gap-2">
              <div className="text-xs text-muted-foreground">
                {message.class}
              </div>
              {message.status === "Unread" && (
                <Badge variant="secondary" className="text-xs">
                  New
                </Badge>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
