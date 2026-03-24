"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type ThreadUser = {
  id: string;
  name: string;
  email: string;
};

type ThreadMessage = {
  id: string;
  subject: string;
  content: string;
  createdAt?: string;
  read: boolean;
  starred: boolean;
  courseTitle: string;
  sender: ThreadUser;
  recipient: ThreadUser;
  parentMessageId: string | null;
};

type ThreadPayload = {
  rootMessageId: string;
  currentUserId: string;
  thread: ThreadMessage[];
};

type TeacherMessageThreadPageProps = {
  messageId: string;
};

const resolveTeacherId = async () => {
  const stored = localStorage.getItem("userId") || "";
  if (stored) {
    return stored;
  }

  try {
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    if (!sessionRes.ok) {
      return "";
    }

    const sessionData = await sessionRes.json();
    const id = String(sessionData?.user?.id || "").trim();

    if (id) {
      localStorage.setItem("userId", id);
    }

    return id;
  } catch {
    return "";
  }
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export function TeacherMessageThreadPage({
  messageId,
}: TeacherMessageThreadPageProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [threadData, setThreadData] = useState<ThreadPayload | null>(null);
  const [replyText, setReplyText] = useState("");

  const loadThread = async () => {
    try {
      setLoading(true);
      const teacherId = await resolveTeacherId();

      const response = await fetch(
        `/api/teacher/messages/${encodeURIComponent(messageId)}?teacherId=${encodeURIComponent(teacherId)}`,
        { cache: "no-store" },
      );

      if (!response.ok) {
        throw new Error(`Failed to load thread: HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        success?: boolean;
        data?: ThreadPayload;
      };

      if (!payload?.data) {
        throw new Error("Thread payload is missing");
      }

      setThreadData(payload.data);
    } catch (error) {
      console.error(error);
      setThreadData(null);
      toast({
        title: "Unable to load thread",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadThread();
  }, [messageId]);

  const sortedThread = useMemo(
    () =>
      [...(threadData?.thread || [])].sort((a, b) => {
        const left = new Date(a.createdAt || 0).getTime();
        const right = new Date(b.createdAt || 0).getTime();
        return left - right;
      }),
    [threadData],
  );

  const handleSendReply = async () => {
    const content = replyText.trim();
    if (!content) {
      return;
    }

    try {
      setSending(true);
      const teacherId = await resolveTeacherId();

      const response = await fetch(
        `/api/teacher/messages/${encodeURIComponent(messageId)}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            teacherId,
            content,
          }),
        },
      );

      if (!response.ok) {
        throw new Error(`Failed to send reply: HTTP ${response.status}`);
      }

      setReplyText("");
      await loadThread();
    } catch (error) {
      console.error(error);
      toast({
        title: "Unable to send reply",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        className="px-0"
        onClick={() => router.push("/dashboard/teacher/messages")}
      >
        ← Back to Inbox
      </Button>

      {loading ? (
        <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          Loading thread...
        </div>
      ) : !sortedThread.length ? (
        <div className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
          No messages in this thread.
        </div>
      ) : (
        <div className="space-y-3">
          {sortedThread.map((message) => {
            const isCurrentUserSender =
              String(message.sender.id) ===
              String(threadData?.currentUserId || "");

            return (
              <div
                key={message.id}
                className={`rounded-md border bg-card p-4 ${
                  isCurrentUserSender ? "ml-8" : "mr-8"
                }`}
              >
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>
                    {message.sender.name} ({message.sender.email}) →{" "}
                    {message.recipient.name} ({message.recipient.email})
                  </span>
                  <span>{formatDateTime(message.createdAt)}</span>
                </div>
                <div className="mb-2 font-medium">{message.subject}</div>
                <div className="whitespace-pre-wrap text-sm leading-6">
                  {message.content}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-md border bg-card p-4">
        <div className="mb-2 font-medium">Reply</div>
        <Textarea
          value={replyText}
          onChange={(event) => setReplyText(event.target.value)}
          rows={5}
          placeholder="Write your reply..."
          disabled={sending}
        />
        <div className="mt-3 flex justify-end">
          <Button
            onClick={handleSendReply}
            disabled={sending || replyText.trim().length === 0}
          >
            {sending ? "Sending..." : "Send Reply"}
          </Button>
        </div>
      </div>
    </div>
  );
}
