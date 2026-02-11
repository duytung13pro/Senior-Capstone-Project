"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  BookOpen,
  FileText,
  Users,
} from "lucide-react"

const eventColors: Record<string, string> = {
  class: "bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800",
  assignment: "bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800",
  exam: "bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800",
  office_hours: "bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800",
  event: "bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-400 dark:border-purple-800",
}

const scheduleEvents = [
  {
    id: "1",
    title: "Beginner Mandarin",
    type: "class",
    course: "Beginner Mandarin",
    instructor: "Teacher Wang",
    location: "Room 101",
    startTime: "10:00",
    endTime: "11:30",
    days: [1, 3, 5], // Mon, Wed, Fri
    description: "Regular class session",
  },
  {
    id: "2",
    title: "Intermediate Conversation",
    type: "class",
    course: "Intermediate Conversation",
    instructor: "Teacher Li",
    location: "Room 205",
    startTime: "14:00",
    endTime: "15:30",
    days: [2, 4], // Tue, Thu
    description: "Conversation practice session",
  },
  {
    id: "3",
    title: "HSK 4 Preparation",
    type: "class",
    course: "HSK 4 Preparation",
    instructor: "Teacher Zhang",
    location: "Room 302",
    startTime: "16:00",
    endTime: "17:30",
    days: [1, 3], // Mon, Wed
    description: "HSK exam preparation",
  },
  {
    id: "4",
    title: "Chinese Calligraphy",
    type: "class",
    course: "Chinese Calligraphy",
    instructor: "Teacher Chen",
    location: "Art Room B",
    startTime: "13:00",
    endTime: "14:30",
    days: [4], // Thu
    description: "Calligraphy practice",
  },
  {
    id: "5",
    title: "Office Hours - Teacher Wang",
    type: "office_hours",
    course: "Beginner Mandarin",
    instructor: "Teacher Wang",
    location: "Office 108",
    startTime: "15:00",
    endTime: "16:00",
    days: [2], // Tue
    description: "Drop-in office hours for questions",
  },
]

const upcomingDeadlines = [
  { id: "1", title: "Character Writing Practice", course: "Beginner Mandarin", date: "2024-05-22", type: "assignment" },
  { id: "2", title: "Dialogue Recording", course: "Intermediate Conversation", date: "2024-05-25", type: "assignment" },
  { id: "3", title: "Vocabulary Quiz", course: "HSK 4 Preparation", date: "2024-05-26", type: "exam" },
  { id: "4", title: "Calligraphy Portfolio", course: "Chinese Calligraphy", date: "2024-05-30", type: "assignment" },
]

const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]
const shortDayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

export default function StudentSchedulePage() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<"week" | "month">("week")
  const [selectedEvent, setSelectedEvent] = useState<(typeof scheduleEvents)[0] | null>(null)
  const [addEventOpen, setAddEventOpen] = useState(false)

  const getWeekDates = (date: Date) => {
    const week = []
    const startOfWeek = new Date(date)
    startOfWeek.setDate(date.getDate() - date.getDay())

    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek)
      day.setDate(startOfWeek.getDate() + i)
      week.push(day)
    }
    return week
  }

  const weekDates = getWeekDates(currentDate)

  const navigateWeek = (direction: number) => {
    const newDate = new Date(currentDate)
    newDate.setDate(currentDate.getDate() + direction * 7)
    setCurrentDate(newDate)
  }

  const getEventsForDay = (dayIndex: number) => {
    return scheduleEvents.filter((event) => event.days.includes(dayIndex))
  }

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":")
    const hour = parseInt(hours)
    const ampm = hour >= 12 ? "PM" : "AM"
    const formattedHour = hour % 12 || 12
    return `${formattedHour}:${minutes} ${ampm}`
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const TypeIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "class":
        return <BookOpen className="h-4 w-4" />
      case "assignment":
        return <FileText className="h-4 w-4" />
      case "exam":
        return <FileText className="h-4 w-4" />
      case "office_hours":
        return <Users className="h-4 w-4" />
      default:
        return <CalendarIcon className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Schedule</h1>
          <p className="text-muted-foreground">View your classes and upcoming events</p>
        </div>
        <Dialog open={addEventOpen} onOpenChange={setAddEventOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Event
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Personal Event</DialogTitle>
              <DialogDescription>Create a personal reminder or study session</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Event Title</Label>
                <Input placeholder="e.g., Study Session" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input type="date" />
                </div>
                <div className="space-y-2">
                  <Label>Time</Label>
                  <Input type="time" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="event">Personal Event</SelectItem>
                    <SelectItem value="study">Study Session</SelectItem>
                    <SelectItem value="reminder">Reminder</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Notes</Label>
                <Textarea placeholder="Add any notes..." />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setAddEventOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setAddEventOpen(false)}>Add Event</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {/* Main Calendar */}
        <Card className="lg:col-span-3">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => navigateWeek(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <CardTitle>
                  {weekDates[0].toLocaleDateString("en-US", { month: "long", day: "numeric" })} -{" "}
                  {weekDates[6].toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </CardTitle>
                <Button variant="outline" size="icon" onClick={() => navigateWeek(1)}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                Today
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-2">
              {/* Day Headers */}
              {weekDates.map((date, index) => (
                <div
                  key={index}
                  className={`text-center p-2 rounded-lg ${
                    isToday(date) ? "bg-primary text-primary-foreground" : "bg-muted"
                  }`}
                >
                  <div className="text-xs font-medium">{shortDayNames[index]}</div>
                  <div className="text-lg font-bold">{date.getDate()}</div>
                </div>
              ))}

              {/* Events Grid */}
              {weekDates.map((date, dayIndex) => (
                <div key={dayIndex} className="min-h-[300px] border rounded-lg p-2 space-y-2">
                  {getEventsForDay(dayIndex).map((event) => (
                    <div
                      key={event.id}
                      className={`p-2 rounded border text-xs cursor-pointer hover:opacity-80 transition-opacity ${eventColors[event.type]}`}
                      onClick={() => setSelectedEvent(event)}
                    >
                      <div className="font-medium truncate">{event.title}</div>
                      <div className="flex items-center gap-1 mt-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(event.startTime)}
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {event.location}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Upcoming Deadlines */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upcoming Deadlines</CardTitle>
              <CardDescription>Assignments and exams due soon</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingDeadlines.map((deadline) => (
                <div
                  key={deadline.id}
                  className={`p-3 rounded-lg border ${eventColors[deadline.type]}`}
                >
                  <div className="font-medium text-sm">{deadline.title}</div>
                  <div className="text-xs mt-1">{deadline.course}</div>
                  <div className="flex items-center gap-1 text-xs mt-2">
                    <CalendarIcon className="h-3 w-3" />
                    {new Date(deadline.date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Legend */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Legend</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.entries(eventColors).map(([type, color]) => (
                <div key={type} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded ${color.split(" ")[0]}`} />
                  <span className="text-sm capitalize">{type.replace("_", " ")}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Event Detail Dialog */}
      <Dialog open={!!selectedEvent} onOpenChange={() => setSelectedEvent(null)}>
        <DialogContent>
          {selectedEvent && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-2">
                  <TypeIcon type={selectedEvent.type} />
                  <DialogTitle>{selectedEvent.title}</DialogTitle>
                </div>
                <DialogDescription>{selectedEvent.course}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Time</p>
                    <p className="font-medium">
                      {formatTime(selectedEvent.startTime)} - {formatTime(selectedEvent.endTime)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {selectedEvent.location}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Instructor</p>
                    <p className="font-medium">{selectedEvent.instructor}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Days</p>
                    <div className="flex gap-1 mt-1">
                      {selectedEvent.days.map((day) => (
                        <Badge key={day} variant="outline">
                          {shortDayNames[day]}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                {selectedEvent.description && (
                  <div>
                    <p className="text-sm text-muted-foreground">Description</p>
                    <p className="text-sm mt-1">{selectedEvent.description}</p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
