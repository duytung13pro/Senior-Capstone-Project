export type TeacherMessage = {
  id: string
  sender: string
  subject: string
  class: string
  time: string
  status: "Unread" | "Read"
  starred: boolean
  avatar: string
  preview: string
}

export const TEACHER_MESSAGES_STORAGE_KEY = "teacherMessages"
export const TEACHER_MESSAGES_UPDATED_EVENT = "teacher-messages-updated"

export const defaultTeacherMessages: TeacherMessage[] = [
  {
    id: "1",
    sender: "Zhang Wei",
    subject: "Question about homework",
    class: "Beginner Mandarin",
    time: "10:30 AM",
    status: "Unread",
    starred: false,
    avatar: "ZW",
    preview: "Hello Teacher, I have a question about the character writing homework...",
  },
  {
    id: "2",
    sender: "Li Mei",
    subject: "Absence notification",
    class: "Intermediate Conversation",
    time: "Yesterday",
    status: "Read",
    starred: true,
    avatar: "LM",
    preview: "Dear Teacher, I will not be able to attend class tomorrow due to a doctor's appointment...",
  },
  {
    id: "3",
    sender: "Wang Chen",
    subject: "Extra practice materials",
    class: "Advanced Writing",
    time: "Yesterday",
    status: "Unread",
    starred: false,
    avatar: "WC",
    preview: "Could you please provide some additional practice materials for the upcoming exam?",
  },
  {
    id: "4",
    sender: "Liu Yang",
    subject: "Assignment extension request",
    class: "HSK 4 Preparation",
    time: "May 19",
    status: "Read",
    starred: false,
    avatar: "LY",
    preview: "I'm writing to request an extension for the essay assignment due this Friday...",
  },
  {
    id: "5",
    sender: "Sun Ling",
    subject: "Thank you",
    class: "Beginner Mandarin",
    time: "May 18",
    status: "Read",
    starred: true,
    avatar: "SL",
    preview: "Thank you for the additional help during office hours yesterday. It was very helpful!",
  },
  {
    id: "6",
    sender: "Zhao Ming",
    subject: "Business vocabulary list",
    class: "Business Mandarin",
    time: "May 17",
    status: "Read",
    starred: false,
    avatar: "ZM",
    preview: "Could you share the business vocabulary list that you mentioned in class?",
  },
  {
    id: "7",
    sender: "Chen Jie",
    subject: "Writing feedback",
    class: "Advanced Writing",
    time: "May 16",
    status: "Read",
    starred: false,
    avatar: "CJ",
    preview: "I received your feedback on my essay. Thank you for the detailed comments.",
  },
]

export function loadTeacherMessages(): TeacherMessage[] {
  if (typeof window === "undefined") {
    return defaultTeacherMessages
  }

  try {
    const raw = localStorage.getItem(TEACHER_MESSAGES_STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(
        TEACHER_MESSAGES_STORAGE_KEY,
        JSON.stringify(defaultTeacherMessages),
      )
      return defaultTeacherMessages
    }

    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return defaultTeacherMessages
    }

    return parsed as TeacherMessage[]
  } catch {
    return defaultTeacherMessages
  }
}

export function saveTeacherMessages(messages: TeacherMessage[]) {
  if (typeof window === "undefined") {
    return
  }

  localStorage.setItem(TEACHER_MESSAGES_STORAGE_KEY, JSON.stringify(messages))
  window.dispatchEvent(new Event(TEACHER_MESSAGES_UPDATED_EVENT))
}
