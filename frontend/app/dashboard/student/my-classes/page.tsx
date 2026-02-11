"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { BookOpen, Clock, Search, Users, Video, FileText, Calendar, ChevronRight } from "lucide-react"

const enrolledCourses = [
  {
    id: "1",
    title: "Beginner Mandarin",
    instructor: { name: "Teacher Wang", avatar: "W" },
    description: "Learn the fundamentals of Mandarin Chinese including pinyin, basic characters, and daily conversation.",
    level: "Beginner",
    progress: 85,
    totalModules: 12,
    completedModules: 10,
    nextLesson: "Character Writing Practice",
    nextLessonTime: "Today, 2:00 PM",
    students: 24,
    duration: "12 weeks",
    status: "active",
    semester: "Spring 2024",
  },
  {
    id: "2",
    title: "Intermediate Conversation",
    instructor: { name: "Teacher Li", avatar: "L" },
    description: "Improve your speaking skills with real-world conversation practice and business Chinese.",
    level: "Intermediate",
    progress: 60,
    totalModules: 10,
    completedModules: 6,
    nextLesson: "Business Phrases",
    nextLessonTime: "Tomorrow, 10:00 AM",
    students: 18,
    duration: "10 weeks",
    status: "active",
    semester: "Spring 2024",
  },
  {
    id: "3",
    title: "HSK 4 Preparation",
    instructor: { name: "Teacher Zhang", avatar: "Z" },
    description: "Comprehensive preparation for the HSK Level 4 examination with practice tests and review.",
    level: "Intermediate",
    progress: 45,
    totalModules: 15,
    completedModules: 7,
    nextLesson: "Reading Comprehension",
    nextLessonTime: "Wed, 3:00 PM",
    students: 32,
    duration: "15 weeks",
    status: "active",
    semester: "Spring 2024",
  },
  {
    id: "4",
    title: "Chinese Calligraphy",
    instructor: { name: "Teacher Chen", avatar: "C" },
    description: "Master the art of Chinese calligraphy with traditional brush techniques and character aesthetics.",
    level: "Beginner",
    progress: 30,
    totalModules: 8,
    completedModules: 2,
    nextLesson: "Brush Techniques",
    nextLessonTime: "Thu, 1:00 PM",
    students: 15,
    duration: "8 weeks",
    status: "active",
    semester: "Spring 2024",
  },
  {
    id: "5",
    title: "Chinese Culture & History",
    instructor: { name: "Teacher Liu", avatar: "L" },
    description: "Explore the rich history and cultural traditions of China through engaging lectures and discussions.",
    level: "All Levels",
    progress: 100,
    totalModules: 10,
    completedModules: 10,
    nextLesson: null,
    nextLessonTime: null,
    students: 28,
    duration: "10 weeks",
    status: "completed",
    semester: "Fall 2023",
  },
]

export default function StudentClassesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [semesterFilter, setSemesterFilter] = useState("all")

  const filteredCourses = enrolledCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      course.instructor.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesStatus = statusFilter === "all" || course.status === statusFilter
    const matchesSemester = semesterFilter === "all" || course.semester === semesterFilter
    return matchesSearch && matchesStatus && matchesSemester
  })

  const activeCourses = filteredCourses.filter((c) => c.status === "active")
  const completedCourses = filteredCourses.filter((c) => c.status === "completed")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <p className="text-muted-foreground">View and manage your enrolled courses</p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses or instructors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        <Select value={semesterFilter} onValueChange={setSemesterFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Semester" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            <SelectItem value="Spring 2024">Spring 2024</SelectItem>
            <SelectItem value="Fall 2023">Fall 2023</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Courses ({filteredCourses.length})</TabsTrigger>
          <TabsTrigger value="active">Active ({activeCourses.length})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCourses.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CourseGrid courses={filteredCourses} />
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <CourseGrid courses={activeCourses} />
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          <CourseGrid courses={completedCourses} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CourseGrid({ courses }: { courses: typeof enrolledCourses }) {
  if (courses.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No courses found</h3>
          <p className="text-muted-foreground">Try adjusting your search or filters</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {courses.map((course) => (
        <Link key={course.id} href={`/student/classes/${course.id}`}>
          <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {course.instructor.avatar}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-lg">{course.title}</CardTitle>
                    <CardDescription>{course.instructor.name}</CardDescription>
                  </div>
                </div>
                <Badge variant={course.status === "active" ? "default" : "secondary"}>
                  {course.status === "active" ? "Active" : "Completed"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground line-clamp-2">{course.description}</p>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{course.progress}%</span>
                </div>
                <Progress value={course.progress} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  {course.completedModules} of {course.totalModules} modules completed
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <BookOpen className="h-3 w-3" />
                  {course.level}
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {course.students} students
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {course.duration}
                </Badge>
              </div>

              {course.nextLesson && (
                <div className="pt-2 border-t">
                  <p className="text-sm font-medium">Next: {course.nextLesson}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {course.nextLessonTime}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  )
}
