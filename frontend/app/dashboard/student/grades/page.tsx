"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Award, BookOpen, TrendingUp, TrendingDown, Minus, FileText, Calendar } from "lucide-react"

const gradeData = {
  gpa: 3.75,
  totalCredits: 12,
  courses: [
    {
      id: "1",
      title: "Beginner Mandarin",
      instructor: "Teacher Wang",
      credits: 3,
      currentGrade: 92,
      letterGrade: "A-",
      trend: "up",
      grades: [
        {
          id: "1",
          name: "Character Writing Quiz 1",
          type: "quiz",
          score: 95,
          maxScore: 100,
          weight: 10,
          date: "2024-03-15",
          feedback: "Excellent stroke order and character recognition!",
        },
        {
          id: "2",
          name: "Homework Week 1-4",
          type: "homework",
          score: 88,
          maxScore: 100,
          weight: 15,
          date: "2024-03-22",
          feedback: "Good effort, but watch your tone marks.",
        },
        {
          id: "3",
          name: "Midterm Exam",
          type: "exam",
          score: 91,
          maxScore: 100,
          weight: 25,
          date: "2024-04-10",
          feedback: "Strong performance in listening and reading sections.",
        },
        {
          id: "4",
          name: "Oral Presentation",
          type: "project",
          score: 94,
          maxScore: 100,
          weight: 20,
          date: "2024-04-25",
          feedback: "Great pronunciation and natural flow!",
        },
        {
          id: "5",
          name: "Character Writing Quiz 2",
          type: "quiz",
          score: 92,
          maxScore: 100,
          weight: 10,
          date: "2024-05-05",
          feedback: null,
        },
      ],
    },
    {
      id: "2",
      title: "Intermediate Conversation",
      instructor: "Teacher Li",
      credits: 3,
      currentGrade: 88,
      letterGrade: "B+",
      trend: "stable",
      grades: [
        {
          id: "1",
          name: "Dialogue Practice 1",
          type: "assignment",
          score: 85,
          maxScore: 100,
          weight: 15,
          date: "2024-03-18",
          feedback: "Good vocabulary usage, work on fluency.",
        },
        {
          id: "2",
          name: "Listening Comprehension",
          type: "quiz",
          score: 90,
          maxScore: 100,
          weight: 20,
          date: "2024-04-01",
          feedback: "Excellent comprehension of natural speech.",
        },
        {
          id: "3",
          name: "Group Conversation Project",
          type: "project",
          score: 88,
          maxScore: 100,
          weight: 25,
          date: "2024-04-20",
          feedback: "Good teamwork and clear communication.",
        },
      ],
    },
    {
      id: "3",
      title: "HSK 4 Preparation",
      instructor: "Teacher Zhang",
      credits: 3,
      currentGrade: 94,
      letterGrade: "A",
      trend: "up",
      grades: [
        {
          id: "1",
          name: "Vocabulary Quiz Ch. 1-3",
          type: "quiz",
          score: 95,
          maxScore: 100,
          weight: 10,
          date: "2024-03-20",
          feedback: "Exceptional vocabulary retention!",
        },
        {
          id: "2",
          name: "Reading Practice Set 1",
          type: "homework",
          score: 92,
          maxScore: 100,
          weight: 15,
          date: "2024-04-02",
          feedback: null,
        },
        {
          id: "3",
          name: "Mock Exam 1",
          type: "exam",
          score: 94,
          maxScore: 100,
          weight: 30,
          date: "2024-04-15",
          feedback: "On track to pass HSK 4 with high marks!",
        },
      ],
    },
    {
      id: "4",
      title: "Chinese Calligraphy",
      instructor: "Teacher Chen",
      credits: 3,
      currentGrade: 78,
      letterGrade: "C+",
      trend: "down",
      grades: [
        {
          id: "1",
          name: "Basic Strokes Practice",
          type: "assignment",
          score: 82,
          maxScore: 100,
          weight: 20,
          date: "2024-03-25",
          feedback: "Good foundation, needs more practice with pressure control.",
        },
        {
          id: "2",
          name: "Character Composition 1",
          type: "project",
          score: 75,
          maxScore: 100,
          weight: 30,
          date: "2024-04-18",
          feedback: "Proportions need work. Consider extra practice sessions.",
        },
      ],
    },
  ],
}

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "A-": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "B+": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "B-": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "C+": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "C-": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "D+": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "D-": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  F: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
}

export default function StudentGradesPage() {
  const [selectedCourse, setSelectedCourse] = useState<string>("all")
  const [selectedGrade, setSelectedGrade] = useState<(typeof gradeData.courses)[0]["grades"][0] | null>(null)
  const [selectedCourseData, setSelectedCourseData] = useState<(typeof gradeData.courses)[0] | null>(null)

  const filteredCourses =
    selectedCourse === "all" ? gradeData.courses : gradeData.courses.filter((c) => c.id === selectedCourse)

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up") return <TrendingUp className="h-4 w-4 text-green-500" />
    if (trend === "down") return <TrendingDown className="h-4 w-4 text-red-500" />
    return <Minus className="h-4 w-4 text-muted-foreground" />
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">View your grades and academic performance</p>
      </div>

      {/* GPA Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Current GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{gradeData.gpa}</span>
              <span className="text-muted-foreground">/ 4.0</span>
            </div>
            <Progress value={(gradeData.gpa / 4) * 100} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gradeData.totalCredits}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gradeData.courses.length}</div>
            <p className="text-xs text-muted-foreground">Enrolled courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {gradeData.courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Grades */}
      <div className="space-y-6">
        {filteredCourses.map((course) => (
          <Card key={course.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle>{course.title}</CardTitle>
                  <CardDescription>
                    {course.instructor} | {course.credits} credits
                  </CardDescription>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold">{course.currentGrade}%</span>
                      <TrendIcon trend={course.trend} />
                    </div>
                    <Badge className={gradeColors[course.letterGrade]}>{course.letterGrade}</Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Assignment</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Score</TableHead>
                    <TableHead className="text-right">Weight</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {course.grades.map((grade) => (
                    <TableRow
                      key={grade.id}
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => {
                        setSelectedGrade(grade)
                        setSelectedCourseData(course)
                      }}
                    >
                      <TableCell className="font-medium">{grade.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {grade.type}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(grade.date).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {grade.score}/{grade.maxScore}
                        <span className="text-muted-foreground ml-2">
                          ({Math.round((grade.score / grade.maxScore) * 100)}%)
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-muted-foreground">{grade.weight}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Grade Detail Dialog */}
      <Dialog open={!!selectedGrade} onOpenChange={() => setSelectedGrade(null)}>
        <DialogContent>
          {selectedGrade && selectedCourseData && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGrade.name}</DialogTitle>
                <DialogDescription>{selectedCourseData.title}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedGrade.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedGrade.date).toLocaleDateString("en-US", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{selectedGrade.weight}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="font-medium">
                      {selectedGrade.score} / {selectedGrade.maxScore}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-2xl font-bold">
                      {Math.round((selectedGrade.score / selectedGrade.maxScore) * 100)}%
                    </span>
                  </div>
                  <Progress value={(selectedGrade.score / selectedGrade.maxScore) * 100} />
                </div>

                {selectedGrade.feedback && (
                  <div>
                    <p className="text-sm font-medium mb-2">Instructor Feedback</p>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">{selectedGrade.feedback}</p>
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
