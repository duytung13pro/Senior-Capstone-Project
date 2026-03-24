"use client";

import { useMemo, useState } from "react";
import {
  Bot,
  GraduationCap,
  MessageCircle,
  Minus,
  Send,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";

type ChatType = "student" | "teacher" | "ai";

type ActiveChat = {
  id: string;
  name: string;
  type: ChatType;
  isMinimized: boolean;
};

type ChatMessage = {
  id: string;
  chatId: string;
  sender: "me" | "them";
  text: string;
};

type DummyContact = {
  id: string;
  name: string;
  role: "Student" | "Teacher";
  avatar: string;
};

const initialMessages: ChatMessage[] = [
  {
    id: "m-1",
    chatId: "student-zhang-wei",
    sender: "them",
    text: "Hi teacher, can you help me with lesson 4?",
  },
  {
    id: "m-2",
    chatId: "student-zhang-wei",
    sender: "me",
    text: "Absolutely — send me the sentence you are stuck on.",
  },
  {
    id: "m-3",
    chatId: "teacher-wang",
    sender: "them",
    text: "Do you want to co-host tomorrow's speaking session?",
  },
  {
    id: "m-4",
    chatId: "teacher-wang",
    sender: "me",
    text: "Yes, let's do it at 2 PM.",
  },
  {
    id: "m-5",
    chatId: "ai-tutor",
    sender: "them",
    text: "I can generate practice prompts for your class.",
  },
  {
    id: "m-6",
    chatId: "ai-tutor",
    sender: "me",
    text: "Great, give me 5 beginner-level speaking prompts.",
  },
];

const aiChatOption: Omit<ActiveChat, "isMinimized"> = {
  id: "ai-tutor",
  name: "AI Tutor",
  type: "ai",
};

const dummyContacts: DummyContact[] = [
  { id: "student-zhang-wei", name: "Zhang Wei", role: "Student", avatar: "ZW" },
  { id: "teacher-wang", name: "Wang", role: "Teacher", avatar: "WA" },
  { id: "student-li-mei", name: "Li Mei", role: "Student", avatar: "LM" },
  { id: "teacher-minh", name: "Minh Tran", role: "Teacher", avatar: "MT" },
  { id: "student-chen-jie", name: "Chen Jie", role: "Student", avatar: "CJ" },
];

function mapContactToChat(contact: DummyContact): Omit<ActiveChat, "isMinimized"> {
  return {
    id: contact.id,
    name: contact.name,
    type: contact.role === "Teacher" ? "teacher" : "student",
  };
}

function getTypeIcon(type: ChatType) {
  if (type === "student") return GraduationCap;
  if (type === "teacher") return UserRound;
  return Bot;
}

function getTypeChip(type: ChatType) {
  if (type === "student") return "Student";
  if (type === "teacher") return "Teacher";
  return "AI";
}

export function FloatingChatWidget() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeChats, setActiveChats] = useState<ActiveChat[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [draftByChatId, setDraftByChatId] = useState<Record<string, string>>({});

  const openChats = useMemo(
    () => activeChats.filter((chat) => !chat.isMinimized),
    [activeChats],
  );

  const minimizedChats = useMemo(
    () => activeChats.filter((chat) => chat.isMinimized),
    [activeChats],
  );

  const filteredContacts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return dummyContacts;
    }

    return dummyContacts.filter((contact) =>
      contact.name.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const openChat = (chat: Omit<ActiveChat, "isMinimized">) => {
    setActiveChats((current) => {
      const existing = current.find((item) => item.id === chat.id);
      if (existing) {
        return current.map((item) =>
          item.id === chat.id ? { ...item, isMinimized: false } : item,
        );
      }

      return [{ ...chat, isMinimized: false }, ...current];
    });
    setIsMenuOpen(false);
    setSearchQuery("");
  };

  const minimizeChat = (chatId: string) => {
    setActiveChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, isMinimized: true } : chat,
      ),
    );
  };

  const restoreChat = (chatId: string) => {
    setActiveChats((current) =>
      current.map((chat) =>
        chat.id === chatId ? { ...chat, isMinimized: false } : chat,
      ),
    );
  };

  const closeChat = (chatId: string) => {
    setActiveChats((current) => current.filter((chat) => chat.id !== chatId));
    setDraftByChatId((current) => {
      const next = { ...current };
      delete next[chatId];
      return next;
    });
  };

  const sendMessage = (chatId: string) => {
    const draft = String(draftByChatId[chatId] || "").trim();
    if (!draft) {
      return;
    }

    setMessages((current) => [
      ...current,
      {
        id: `m-${Date.now()}`,
        chatId,
        sender: "me",
        text: draft,
      },
    ]);

    setDraftByChatId((current) => ({ ...current, [chatId]: "" }));
  };

  return (
    <>
      <div className="fixed bottom-4 right-20 z-50 flex flex-row-reverse items-end gap-3">
        {openChats.map((chat) => {
          const TypeIcon = getTypeIcon(chat.type);
          const chatMessages = messages.filter((message) => message.chatId === chat.id);

          return (
            <div
              key={chat.id}
              className="flex h-[400px] w-80 flex-col overflow-hidden rounded-t-lg bg-white shadow-xl transition-all duration-200"
            >
              <div className="flex items-center justify-between border-b bg-white px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <TypeIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold leading-none">{chat.name}</div>
                    <div className="text-xs text-muted-foreground">{getTypeChip(chat.type)}</div>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => minimizeChat(chat.id)}
                    aria-label="Minimize chat"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    onClick={() => closeChat(chat.id)}
                    aria-label="Close chat"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="flex-1 space-y-2 overflow-y-auto bg-[#FCF9F0] p-3">
                {chatMessages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "me" ? "justify-end" : "justify-start"
                    } transition-all duration-200`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm shadow-sm ${
                        message.sender === "me"
                          ? "bg-primary text-primary-foreground"
                          : "bg-white text-foreground"
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t bg-white p-2">
                <div className="flex items-center gap-2">
                  <input
                    className="h-9 flex-1 rounded-md border border-input bg-background px-3 text-sm outline-none ring-offset-background transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                    placeholder="Type a message..."
                    value={draftByChatId[chat.id] || ""}
                    onChange={(event) =>
                      setDraftByChatId((current) => ({
                        ...current,
                        [chat.id]: event.target.value,
                      }))
                    }
                    onKeyDown={(event) => {
                      if (event.key === "Enter") {
                        event.preventDefault();
                        sendMessage(chat.id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="inline-flex h-9 items-center justify-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:opacity-90"
                    onClick={() => sendMessage(chat.id)}
                  >
                    <Send className="mr-1 h-3.5 w-3.5" />
                    Send
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="fixed bottom-4 right-4 z-50 flex flex-col items-end gap-2">
        <div className="flex flex-col items-end gap-2">
          {minimizedChats.map((chat) => {
            const TypeIcon = getTypeIcon(chat.type);
            return (
              <button
                key={chat.id}
                type="button"
                className="group flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-xl transition-all duration-200 hover:scale-105"
                onClick={() => restoreChat(chat.id)}
                title={chat.name}
                aria-label={`Open minimized chat with ${chat.name}`}
              >
                <TypeIcon className="h-5 w-5 text-primary transition-colors group-hover:text-primary" />
              </button>
            );
          })}

          {isMenuOpen && (
            <div className="flex h-[450px] w-[340px] flex-col overflow-hidden rounded-t-lg bg-white shadow-xl transition-all duration-200">
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="text-base font-semibold">New message</div>
                <button
                  type="button"
                  className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  onClick={() => {
                    setIsMenuOpen(false);
                    setSearchQuery("");
                  }}
                  aria-label="Close new message panel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="sticky top-0 z-10 border-b bg-white px-4 py-3">
                <div className="flex items-center gap-2 rounded-md border border-input bg-background px-3 py-2">
                  <span className="text-sm font-medium text-muted-foreground">To:</span>
                  <input
                    type="text"
                    className="h-5 w-full border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                    placeholder="Type a name..."
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                <button
                  type="button"
                  className="mx-3 mt-3 flex w-[calc(100%-1.5rem)] items-center gap-3 rounded-md border bg-accent/30 p-3 text-left transition-colors hover:bg-accent/60"
                  onClick={() => openChat(aiChatOption)}
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <Sparkles className="h-4 w-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold">Ask AI Tutor</div>
                    <div className="text-xs text-muted-foreground">Generate help instantly</div>
                  </div>
                </button>

                <div className="px-3 pb-3 pt-2">
                  <div className="px-2 pb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {searchQuery.trim() ? "Results" : "Recent"}
                  </div>

                  {filteredContacts.length === 0 ? (
                    <div className="px-2 py-4 text-sm text-muted-foreground">
                      No contacts found.
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {filteredContacts.map((contact) => (
                        <button
                          key={contact.id}
                          type="button"
                          className="w-full cursor-pointer rounded-md p-3 text-left transition-colors hover:bg-gray-50"
                          onClick={() => openChat(mapContactToChat(contact))}
                        >
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
                              {contact.avatar}
                            </div>
                            <div>
                              <div className="text-sm font-medium leading-tight">{contact.name}</div>
                              <div className="text-xs text-muted-foreground">{contact.role}</div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xl transition-all duration-200 hover:scale-105"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label="Toggle chat menu"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    </>
  );
}
