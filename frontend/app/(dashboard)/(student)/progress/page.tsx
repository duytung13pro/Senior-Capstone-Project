"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { CheckCircle2, Circle, Lock, PlayCircle, FileText, Clock, Award, TrendingUp } from "lucide-react"

const coursesProgress = [
  {
    id: "1",
    title: "Beginner Mandarin",
    instructor: "Teacher Wang",
    overallProgress: 85,
    modules: [
      {
        id: "m1",
        title: "Introduction to Pinyin",
        progress: 100,
        status: "completed",
        lessons: [
          { id: "l1", title: "Tones and Pronunciation", type: "video", duration: "15 min", completed: true },
          { id: "l2", title: "Initial Consonants", type: "video", duration: "20 min", completed: true },
          { id: "l3", title: "Final Vowels", type: "video", duration: "18 min", completed: true },
          { id: "l4", title: "Practice Quiz", type: "quiz", duration: "10 min", completed: true },
        ],
      },
      {
        id: "m2",
        title: "Basic Characters",
        progress: 100,
        status: "completed",
        lessons: [
          { id: "l5", title: "Stroke Order Basics", type: "video", duration: "25 min", completed: true },
          { id: "l6", title: "Numbers 1-10", type: "video", duration: "15 min", completed: true },
          { id: "l7", title: "Writing Practice", type: "assignment", duration: "30 min", completed: true },
          { id: "l8", title: "Character Quiz", type: "quiz", duration: "15 min", completed: true },
        ],
      },
      {
        id: "m3",
        title: "Greetings & Introductions",
        progress: 75,
        status: "in-progress",
        lessons: [
          { id: "l9", title: "Hello & Goodbye", type: "video", duration: "20 min", completed: true },
          { id: "l10", title: "Introducing Yourself", type: "video", duration: "18 min", completed: true },
          { id: "l11", title: "Asking Questions", type: "video", duration: "22 min", completed: true },
          { id: "l12", title: "Conversation Practice", type: "assignment", duration: "30 min", completed: false },
        ],
      },
      {
        id: "m4",
        title: "Numbers & Dates",
        progress: 0,
        status: "locked",
        lessons: [
          { id: "l13", title: "Numbers 11-100", type: "video", duration: "20 min", completed: false },
          { id: "l14", title: "Days & Months", type: "video", duration: "25 min", completed: false },
          { id: "l15", title: "Telling Time", type: "video", duration: "20 min", completed: false },
          { id: "l16", title: "Date Practice", type: "quiz", duration: "15 min", completed: false },
        ],
      },
    ],
  },
  {
    id: "2",
    title: "Intermediate Conversation",
    instructor: "Teacher Li",
    overallProgress: 60,
    modules: [
      {
        id: "m5",
        title: "Daily Routines",
        progress: 100,
        status: "completed",
        lessons: [
          { id: "l17", title: "Morning Activities", type: "video", duration: "20 min", completed: true },
          { id: "l18", title: "Work & School", type: "video", duration: "25 min", completed: true },
          { id: "l19", title: "Evening Habits", type: "video", duration: "20 min", completed: true },
          { id: "l20", title: "Dialogue Practice", type: "assignment", duration: "30 min", completed: true },
        ],
      },
      {
        id: "m6",
        title: "Shopping & Bargaining",
        progress: 50,
        status: "in-progress",
        lessons: [
          { id: "l21", title: "At the Market", type: "video", duration: "22 min", completed: true },
          { id: "l22", title: "Prices & Quantities", type: "video", duration: "18 min", completed: true },
          { id: "l23", title: "Bargaining Phrases", type: "video", duration: "25 min", completed: false },
          { id: "l24", title: "Role Play Assignment", type: "assignment", duration: "45 min", completed: false },
        ],
      },
    ],
  },
]

const achievements = [
  { id: "1", title: "First Steps", description: "Complete your first lesson", earned: true, date: "Mar 15" },
  { id: "2", title: "Quick Learner", description: "Complete 10 lessons in a week", earned: true, date: "Mar 22" },
  { id: "3", title: "Perfect Score", description: "Get 100% on a quiz", earned: true, date: "Apr 5" },
  { id: "4", title: "Streak Master", description: "Maintain a 7-day streak", earned: true, date: "Apr 12" },
  { id: "5", title: "Module Champion", description: "Complete 5 modules", earned: false, date: null },
  { id: "6", title: "Polyglot", description: "Learn 500 vocabulary words", earned: false, date: null },
]

export default function StudentProgressPage() {
  const [selectedCourse, setSelectedCourse] = useState("all")

  const filteredCourses =
    selectedCourse === "all" ? coursesProgress : coursesProgress.filter((c) => c.id === selectedCourse)

  const totalModules = coursesProgress.reduce((sum, c) => sum + c.modules.length, 0)
  const completedModules = coursesProgress.reduce(
    (sum, c) => sum + c.modules.filter((m) => m.status === "completed").length,
    0
  )
  const totalLessons = coursesProgress.reduce(
    (sum, c) => sum + c.modules.reduce((mSum, m) => mSum + m.lessons.length, 0),
    0
  )
  const completedLessons = coursesProgress.reduce(
    (sum, c) => sum + c.modules.reduce((mSum, m) => mSum + m.lessons.filter((l) => l.completed).length, 0),
    0
  )

  const StatusIcon = ({ status }: { status: string }) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "in-progress":
        return <Circle className="h-5 w-5 text-blue-500" />
      case "locked":
        return <Lock className="h-5 w-5 text-muted-foreground" />
      default:
        return <Circle className="h-5 w-5 text-muted-foreground" />
    }
  }

  const LessonIcon = ({ type }: { type: string }) => {
    switch (type) {
      case "video":
        return <PlayCircle className="h-4 w-4" />
      case "quiz":
        return <FileText className="h-4 w-4" />
      case "assignment":
        return <FileText className="h-4 w-4" />
      default:
        return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Progress</h1>
        <p className="text-muted-foreground">Track your learning journey</p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Overall Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round((completedLessons / totalLessons) * 100)}%
            </div>
            <Progress value={(completedLessons / totalLessons) * 100} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedModules} / {totalModules}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Across all courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Lessons Completed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {completedLessons} / {totalLessons}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Total lessons</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Achievements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {achievements.filter((a) => a.earned).length} / {achievements.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Badges earned</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Course Progress */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">Course Progress</h2>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="All Courses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {coursesProgress.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {filteredCourses.map((course) => (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>{course.instructor}</CardDescription>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold">{course.overallProgress}%</div>
                    <Progress value={course.overallProgress} className="w-24 mt-1" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {course.modules.map((module, index) => (
                    <AccordionItem key={module.id} value={module.id}>
                      <AccordionTrigger className="hover:no-underline">
                        <div className="flex items-center gap-3 flex-1">
                          <StatusIcon status={module.status} />
                          <div className="flex-1 text-left">
                            <div className="font-medium">
                              Module {index + 1}: {module.title}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              {module.lessons.filter((l) => l.completed).length} / {module.lessons.length} lessons
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={module.progress} className="w-20" />
                            <span className="text-sm text-muted-foreground w-12">{module.progress}%</span>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-2 pl-8 pt-2">
                          {module.lessons.map((lesson) => (
                            <div
                              key={lesson.id}
                              className={`flex items-center justify-between p-3 rounded-lg border ${
                                lesson.completed ? "bg-green-50 dark:bg-green-900/10" : "bg-muted/50"
                              } ${module.status === "locked" ? "opacity-50" : ""}`}
                            >
                              <div className="flex items-center gap-3">
                                {lesson.completed ? (
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                ) : (
                                  <Circle className="h-5 w-5 text-muted-foreground" />
                                )}
                                <LessonIcon type={lesson.type} />
                                <div>
                                  <div className="font-medium text-sm">{lesson.title}</div>
                                  <div className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Badge variant="outline" className="text-xs capitalize">
                                      {lesson.type}
                                    </Badge>
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      {lesson.duration}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              {!lesson.completed && module.status !== "locked" && (
                                <Button size="sm">Start</Button>
                              )}
                            </div>
                          ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Achievements */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Achievements</h2>
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`flex items-center gap-4 p-3 rounded-lg border ${
                      achievement.earned
                        ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/10 dark:border-yellow-800"
                        : "bg-muted/50 opacity-60"
                    }`}
                  >
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        achievement.earned ? "bg-yellow-100 text-yellow-600" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      <Award className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="font-medium">{achievement.title}</div>
                      <div className="text-sm text-muted-foreground">{achievement.description}</div>
                      {achievement.earned && (
                        <div className="text-xs text-muted-foreground mt-1">Earned {achievement.date}</div>
                      )}
                    </div>
                    {achievement.earned && <CheckCircle2 className="h-5 w-5 text-yellow-500" />}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
