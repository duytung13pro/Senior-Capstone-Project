"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Search,
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Paperclip,
  Send,
  Eye,
} from "lucide-react"

const assignments = [
  {
    id: "1",
    title: "Character Writing Practice",
    course: "Beginner Mandarin",
    courseId: "1",
    type: "homework",
    description:
      "Practice writing the 20 new characters learned this week. Submit a photo or scan of your handwritten practice sheets.",
    dueDate: "2024-05-22T23:59:00",
    totalPoints: 100,
    status: "pending",
    submittedAt: null,
    grade: null,
    feedback: null,
  },
  {
    id: "2",
    title: "Dialogue Recording",
    course: "Intermediate Conversation",
    courseId: "2",
    type: "project",
    description:
      "Record a 3-5 minute dialogue with a partner using the vocabulary and grammar patterns from Unit 5.",
    dueDate: "2024-05-25T23:59:00",
    totalPoints: 150,
    status: "pending",
    submittedAt: null,
    grade: null,
    feedback: null,
  },
  {
    id: "3",
    title: "Essay on Chinese Culture",
    course: "Advanced Writing",
    courseId: "3",
    type: "essay",
    description:
      "Write a 500-word essay in Chinese about a Chinese cultural tradition that interests you.",
    dueDate: "2024-05-23T23:59:00",
    totalPoints: 200,
    status: "submitted",
    submittedAt: "2024-05-20T14:30:00",
    grade: null,
    feedback: null,
  },
  {
    id: "4",
    title: "Vocabulary Quiz",
    course: "HSK 4 Preparation",
    courseId: "4",
    type: "quiz",
    description: "Online quiz covering vocabulary from chapters 7-8.",
    dueDate: "2024-05-20T14:00:00",
    totalPoints: 50,
    status: "graded",
    submittedAt: "2024-05-20T13:45:00",
    grade: 47,
    feedback: "Excellent work! You demonstrated strong vocabulary retention. Minor errors on tones.",
  },
  {
    id: "5",
    title: "Reading Comprehension",
    course: "HSK 4 Preparation",
    courseId: "4",
    type: "homework",
    description: "Complete the reading comprehension exercises in the textbook pages 45-48.",
    dueDate: "2024-05-18T23:59:00",
    totalPoints: 100,
    status: "late",
    submittedAt: "2024-05-19T10:00:00",
    grade: 85,
    feedback: "Good understanding of the material. Late submission penalty applied (-10%).",
  },
  {
    id: "6",
    title: "Calligraphy Portfolio",
    course: "Chinese Calligraphy",
    courseId: "5",
    type: "project",
    description: "Submit your portfolio of 10 characters showing progression in brush technique.",
    dueDate: "2024-05-30T23:59:00",
    totalPoints: 200,
    status: "pending",
    submittedAt: null,
    grade: null,
    feedback: null,
  },
]

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  graded: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  late: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

const typeIcons = {
  homework: FileText,
  quiz: AlertCircle,
  essay: FileText,
  project: Paperclip,
}

export default function StudentAssignmentsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [courseFilter, setCourseFilter] = useState("all")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedAssignment, setSelectedAssignment] = useState<(typeof assignments)[0] | null>(null)
  const [submissionContent, setSubmissionContent] = useState("")

  const filteredAssignments = assignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCourse = courseFilter === "all" || assignment.courseId === courseFilter
    const matchesStatus = statusFilter === "all" || assignment.status === statusFilter
    return matchesSearch && matchesCourse && matchesStatus
  })

  const pendingCount = assignments.filter((a) => a.status === "pending").length
  const submittedCount = assignments.filter((a) => a.status === "submitted").length
  const gradedCount = assignments.filter((a) => a.status === "graded" || a.status === "late").length

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status === "pending"
  }

  const handleSubmit = () => {
    alert(`Assignment submitted: ${selectedAssignment?.title}`)
    setSelectedAssignment(null)
    setSubmissionContent("")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">View and submit your assignments</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">assignments to complete</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">awaiting grading</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">assignments graded</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            <SelectItem value="1">Beginner Mandarin</SelectItem>
            <SelectItem value="2">Intermediate Conversation</SelectItem>
            <SelectItem value="3">Advanced Writing</SelectItem>
            <SelectItem value="4">HSK 4 Preparation</SelectItem>
            <SelectItem value="5">Chinese Calligraphy</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="graded">Graded</SelectItem>
            <SelectItem value="late">Late</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Assignment List */}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No assignments found</h3>
              <p className="text-muted-foreground">Try adjusting your search or filters</p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const Icon = typeIcons[assignment.type as keyof typeof typeIcons] || FileText
            const overdue = isOverdue(assignment.dueDate, assignment.status)

            return (
              <Card
                key={assignment.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${overdue ? "border-red-500" : ""}`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                        assignment.type === "quiz"
                          ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                          : assignment.type === "project"
                            ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                            : assignment.type === "essay"
                              ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                              : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-medium">{assignment.title}</h3>
                          <p className="text-sm text-muted-foreground">{assignment.course}</p>
                        </div>
                        <Badge className={statusColors[assignment.status as keyof typeof statusColors]}>
                          {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{assignment.description}</p>
                      <div className="flex items-center gap-4 mt-3">
                        <span className="text-sm flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Due: {formatDate(assignment.dueDate)}
                        </span>
                        <span className="text-sm">{assignment.totalPoints} points</span>
                        {assignment.grade !== null && (
                          <span className="text-sm font-medium text-green-600">
                            Score: {assignment.grade}/{assignment.totalPoints}
                          </span>
                        )}
                      </div>
                      {overdue && (
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                          <AlertCircle className="h-4 w-4" />
                          This assignment is overdue!
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Assignment Detail Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAssignment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedAssignment.title}</DialogTitle>
                    <DialogDescription>{selectedAssignment.course}</DialogDescription>
                  </div>
                  <Badge className={statusColors[selectedAssignment.status as keyof typeof statusColors]}>
                    {selectedAssignment.status.charAt(0).toUpperCase() + selectedAssignment.status.slice(1)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">{formatDate(selectedAssignment.dueDate)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Points:</span>
                    <p className="font-medium">{selectedAssignment.totalPoints}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">{selectedAssignment.type}</p>
                  </div>
                  {selectedAssignment.submittedAt && (
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">{formatDate(selectedAssignment.submittedAt)}</p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">{selectedAssignment.description}</p>
                </div>

                {selectedAssignment.grade !== null && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Grade</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        {selectedAssignment.grade}/{selectedAssignment.totalPoints}
                      </div>
                      <div className="flex-1">
                        <Progress value={(selectedAssignment.grade / selectedAssignment.totalPoints) * 100} />
                      </div>
                      <div className="text-lg font-medium">
                        {Math.round((selectedAssignment.grade / selectedAssignment.totalPoints) * 100)}%
                      </div>
                    </div>
                    {selectedAssignment.feedback && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-1">Feedback</h5>
                        <p className="text-sm text-muted-foreground">{selectedAssignment.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {selectedAssignment.status === "pending" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Submit Assignment</h4>
                    <div className="space-y-2">
                      <Label htmlFor="submission">Your submission</Label>
                      <Textarea
                        id="submission"
                        placeholder="Enter your response or notes here..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="flex items-center gap-2 bg-transparent">
                        <Upload className="h-4 w-4" />
                        Attach Files
                      </Button>
                      <Button onClick={handleSubmit} className="flex items-center gap-2">
                        <Send className="h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                  </div>
                )}

                {selectedAssignment.status === "submitted" && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Your submission is being reviewed. You'll be notified when it's graded.
                    </p>
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
