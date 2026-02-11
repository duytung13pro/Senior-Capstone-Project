"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Sidebar } from "@/components/Sidebar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Search,
  Mail,
  Send,
  Star,
  StarOff,
  Archive,
  Trash2,
  Reply,
  Paperclip,
  Plus,
  Inbox,
  Clock,
} from "lucide-react"

const messages = [
  {
    id: "1",
    sender: { name: "Teacher Wang", avatar: "W", role: "Instructor" },
    recipient: { name: "You", avatar: "S" },
    subject: "Great progress on your character writing!",
    content:
      "I wanted to let you know that your character writing has improved significantly over the past few weeks. Your stroke order and proportions are excellent. Keep up the great work! I've attached some additional practice materials for you to continue improving.",
    course: "Beginner Mandarin",
    timestamp: "2024-05-21T10:30:00",
    read: false,
    starred: true,
    archived: false,
    type: "inbox",
  },
  {
    id: "2",
    sender: { name: "Teacher Li", avatar: "L", role: "Instructor" },
    recipient: { name: "You", avatar: "S" },
    subject: "Reminder: Dialogue recording due Friday",
    content:
      "Just a friendly reminder that your dialogue recording assignment is due this Friday at 11:59 PM. Please make sure to include the vocabulary from Unit 5 and follow the pronunciation guidelines we discussed in class.",
    course: "Intermediate Conversation",
    timestamp: "2024-05-20T14:15:00",
    read: true,
    starred: false,
    archived: false,
    type: "inbox",
  },
  {
    id: "3",
    sender: { name: "Student Services", avatar: "SS", role: "Admin" },
    recipient: { name: "You", avatar: "S" },
    subject: "Registration open for Summer 2024 courses",
    content:
      "Dear Student,\n\nRegistration for Summer 2024 courses is now open! We have exciting new offerings including Advanced Business Chinese and Chinese Film Studies. Early registration ends May 30th.\n\nBest regards,\nStudent Services",
    course: null,
    timestamp: "2024-05-19T09:00:00",
    read: true,
    starred: false,
    archived: false,
    type: "inbox",
  },
  {
    id: "4",
    sender: { name: "You", avatar: "S", role: "Student" },
    recipient: { name: "Teacher Zhang", avatar: "Z" },
    subject: "Question about HSK 4 listening section",
    content:
      "Hi Teacher Zhang,\n\nI have a question about the listening section of the HSK 4 exam. Are we allowed to take notes during the listening portion? Also, do you have any tips for improving my listening comprehension speed?\n\nThank you!",
    course: "HSK 4 Preparation",
    timestamp: "2024-05-18T16:45:00",
    read: true,
    starred: false,
    archived: false,
    type: "sent",
  },
  {
    id: "5",
    sender: { name: "Teacher Chen", avatar: "C", role: "Instructor" },
    recipient: { name: "You", avatar: "S" },
    subject: "Calligraphy workshop this Saturday",
    content:
      "I'm hosting a special calligraphy workshop this Saturday from 2-4 PM in Room 301. We'll be practicing landscape painting techniques combined with calligraphy. All materials will be provided. Let me know if you can attend!",
    course: "Chinese Calligraphy",
    timestamp: "2024-05-17T11:20:00",
    read: true,
    starred: true,
    archived: false,
    type: "inbox",
  },
]

const instructors = [
  { id: "1", name: "Teacher Wang", course: "Beginner Mandarin" },
  { id: "2", name: "Teacher Li", course: "Intermediate Conversation" },
  { id: "3", name: "Teacher Zhang", course: "HSK 4 Preparation" },
  { id: "4", name: "Teacher Chen", course: "Chinese Calligraphy" },
]

export default function StudentMessagesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedMessage, setSelectedMessage] = useState<(typeof messages)[0] | null>(null)
  const [messageList, setMessageList] = useState(messages)
  const [composeOpen, setComposeOpen] = useState(false)
  const [newMessage, setNewMessage] = useState({ recipient: "", subject: "", content: "" })
  const [replyContent, setReplyContent] = useState("")

  const inboxMessages = messageList.filter((m) => m.type === "inbox" && !m.archived)
  const sentMessages = messageList.filter((m) => m.type === "sent" && !m.archived)
  const starredMessages = messageList.filter((m) => m.starred && !m.archived)
  const archivedMessages = messageList.filter((m) => m.archived)
  const unreadCount = inboxMessages.filter((m) => !m.read).length

  const filteredInbox = inboxMessages.filter(
    (m) =>
      m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.sender.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))

    if (days === 0) {
      return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })
    } else if (days === 1) {
      return "Yesterday"
    } else if (days < 7) {
      return date.toLocaleDateString("en-US", { weekday: "short" })
    } else {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    }
  }

  const toggleStar = (messageId: string) => {
    setMessageList((prev) => prev.map((m) => (m.id === messageId ? { ...m, starred: !m.starred } : m)))
    if (selectedMessage?.id === messageId) {
      setSelectedMessage((prev) => (prev ? { ...prev, starred: !prev.starred } : null))
    }
  }

  const archiveMessage = (messageId: string) => {
    setMessageList((prev) => prev.map((m) => (m.id === messageId ? { ...m, archived: true } : m)))
    setSelectedMessage(null)
  }

  const markAsRead = (messageId: string) => {
    setMessageList((prev) => prev.map((m) => (m.id === messageId ? { ...m, read: true } : m)))
  }

  const handleSendMessage = () => {
    alert(`Message sent to ${newMessage.recipient}`)
    setComposeOpen(false)
    setNewMessage({ recipient: "", subject: "", content: "" })
  }

  const handleReply = () => {
    if (selectedMessage) {
      alert(`Reply sent to ${selectedMessage.sender.name}`)
      setReplyContent("")
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
          <p className="text-muted-foreground">Communicate with your instructors</p>
        </div>
        <Dialog open={composeOpen} onOpenChange={setComposeOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Compose
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>New Message</DialogTitle>
              <DialogDescription>Send a message to your instructor</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>To</Label>
                <Select value={newMessage.recipient} onValueChange={(v) => setNewMessage({ ...newMessage, recipient: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select recipient" />
                  </SelectTrigger>
                  <SelectContent>
                    {instructors.map((instructor) => (
                      <SelectItem key={instructor.id} value={instructor.id}>
                        {instructor.name} - {instructor.course}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Subject</Label>
                <Input
                  placeholder="Enter subject"
                  value={newMessage.subject}
                  onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>Message</Label>
                <Textarea
                  placeholder="Write your message..."
                  rows={6}
                  value={newMessage.content}
                  onChange={(e) => setNewMessage({ ...newMessage, content: e.target.value })}
                />
              </div>
              <div className="flex justify-between">
                <Button variant="outline">
                  <Paperclip className="h-4 w-4 mr-2" />
                  Attach
                </Button>
                <Button onClick={handleSendMessage}>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Message List */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search messages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Tabs defaultValue="inbox">
              <TabsList className="w-full justify-start rounded-none border-b px-4">
                <TabsTrigger value="inbox" className="relative">
                  <Inbox className="h-4 w-4 mr-1" />
                  Inbox
                  {unreadCount > 0 && (
                    <Badge className="ml-2 h-5 w-5 p-0 flex items-center justify-center">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="sent">
                  <Send className="h-4 w-4 mr-1" />
                  Sent
                </TabsTrigger>
                <TabsTrigger value="starred">
                  <Star className="h-4 w-4 mr-1" />
                  Starred
                </TabsTrigger>
              </TabsList>

              <ScrollArea className="h-[500px]">
                <TabsContent value="inbox" className="m-0">
                  {filteredInbox.length === 0 ? (
                    <div className="p-8 text-center text-muted-foreground">
                      <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No messages found</p>
                    </div>
                  ) : (
                    filteredInbox.map((message) => (
                      <MessageItem
                        key={message.id}
                        message={message}
                        isSelected={selectedMessage?.id === message.id}
                        onSelect={() => {
                          setSelectedMessage(message)
                          markAsRead(message.id)
                        }}
                        onToggleStar={() => toggleStar(message.id)}
                        formatTime={formatTime}
                      />
                    ))
                  )}
                </TabsContent>

                <TabsContent value="sent" className="m-0">
                  {sentMessages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isSelected={selectedMessage?.id === message.id}
                      onSelect={() => setSelectedMessage(message)}
                      onToggleStar={() => toggleStar(message.id)}
                      formatTime={formatTime}
                      isSent
                    />
                  ))}
                </TabsContent>

                <TabsContent value="starred" className="m-0">
                  {starredMessages.map((message) => (
                    <MessageItem
                      key={message.id}
                      message={message}
                      isSelected={selectedMessage?.id === message.id}
                      onSelect={() => {
                        setSelectedMessage(message)
                        markAsRead(message.id)
                      }}
                      onToggleStar={() => toggleStar(message.id)}
                      formatTime={formatTime}
                    />
                  ))}
                </TabsContent>
              </ScrollArea>
            </Tabs>
          </CardContent>
        </Card>

        {/* Message Detail */}
        <Card className="lg:col-span-2">
          {selectedMessage ? (
            <>
              <CardHeader className="border-b">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {selectedMessage.type === "sent"
                          ? selectedMessage.recipient.avatar
                          : selectedMessage.sender.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <CardTitle className="text-lg">{selectedMessage.subject}</CardTitle>
                      <CardDescription>
                        {selectedMessage.type === "sent" ? (
                          <>To: {selectedMessage.recipient.name}</>
                        ) : (
                          <>
                            From: {selectedMessage.sender.name}
                            <span className="text-xs ml-2">({selectedMessage.sender.role})</span>
                          </>
                        )}
                      </CardDescription>
                      {selectedMessage.course && (
                        <Badge variant="outline" className="mt-2">
                          {selectedMessage.course}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">{formatTime(selectedMessage.timestamp)}</span>
                    <Button variant="ghost" size="icon" onClick={() => toggleStar(selectedMessage.id)}>
                      {selectedMessage.starred ? (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      ) : (
                        <StarOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => archiveMessage(selectedMessage.id)}>
                      <Archive className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="prose dark:prose-invert max-w-none">
                  <p className="whitespace-pre-wrap">{selectedMessage.content}</p>
                </div>

                {selectedMessage.type === "inbox" && (
                  <div className="mt-6 pt-6 border-t">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <Reply className="h-4 w-4" />
                      Reply
                    </h4>
                    <div className="space-y-4">
                      <Textarea
                        placeholder="Write your reply..."
                        rows={4}
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                      />
                      <div className="flex justify-between">
                        <Button variant="outline">
                          <Paperclip className="h-4 w-4 mr-2" />
                          Attach
                        </Button>
                        <Button onClick={handleReply}>
                          <Send className="h-4 w-4 mr-2" />
                          Send Reply
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </>
          ) : (
            <CardContent className="flex flex-col items-center justify-center h-[600px] text-muted-foreground">
              <Mail className="h-16 w-16 mb-4 opacity-50" />
              <p className="text-lg">Select a message to read</p>
              <p className="text-sm">Choose from your inbox on the left</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}

function MessageItem({
  message,
  isSelected,
  onSelect,
  onToggleStar,
  formatTime,
  isSent = false,
}: {
  message: (typeof messages)[0]
  isSelected: boolean
  onSelect: () => void
  onToggleStar: () => void
  formatTime: (t: string) => string
  isSent?: boolean
}) {
  return (
    <div
      className={`p-4 border-b cursor-pointer transition-colors ${
        isSelected ? "bg-muted" : "hover:bg-muted/50"
      } ${!message.read && !isSent ? "bg-primary/5" : ""}`}
      onClick={onSelect}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {isSent ? message.recipient.avatar : message.sender.avatar}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className={`font-medium truncate ${!message.read && !isSent ? "text-primary" : ""}`}>
              {isSent ? message.recipient.name : message.sender.name}
            </span>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTime(message.timestamp)}</span>
          </div>
          <p className={`text-sm truncate ${!message.read && !isSent ? "font-medium" : "text-muted-foreground"}`}>
            {message.subject}
          </p>
          <p className="text-xs text-muted-foreground truncate mt-1">{message.content.substring(0, 60)}...</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={(e) => {
            e.stopPropagation()
            onToggleStar()
          }}
        >
          {message.starred ? (
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
          ) : (
            <Star className="h-4 w-4 text-muted-foreground" />
          )}
        </Button>
      </div>
    </div>
  )
}
