"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"
import { Clock, BookOpen, Target, TrendingUp, Award, Calendar, Zap } from "lucide-react"

const studyHoursData = [
  { week: "Week 1", hours: 12, target: 15 },
  { week: "Week 2", hours: 18, target: 15 },
  { week: "Week 3", hours: 14, target: 15 },
  { week: "Week 4", hours: 20, target: 15 },
  { week: "Week 5", hours: 16, target: 15 },
  { week: "Week 6", hours: 22, target: 15 },
  { week: "Week 7", hours: 19, target: 15 },
  { week: "Week 8", hours: 24, target: 15 },
]

const quizPerformanceData = [
  { name: "Quiz 1", score: 85, average: 78 },
  { name: "Quiz 2", score: 92, average: 80 },
  { name: "Quiz 3", score: 78, average: 75 },
  { name: "Quiz 4", score: 95, average: 82 },
  { name: "Quiz 5", score: 88, average: 79 },
  { name: "Quiz 6", score: 94, average: 81 },
]

const engagementData = [
  { name: "Videos Watched", value: 45 },
  { name: "Exercises Completed", value: 32 },
  { name: "Resources Downloaded", value: 18 },
  { name: "Forum Posts", value: 12 },
]

const courseProgressData = [
  { course: "Beginner Mandarin", progress: 85, modules: 10, completed: 8 },
  { course: "Intermediate Conversation", progress: 60, modules: 10, completed: 6 },
  { course: "HSK 4 Preparation", progress: 45, modules: 15, completed: 7 },
  { course: "Chinese Calligraphy", progress: 30, modules: 8, completed: 2 },
]

const weeklyActivityData = [
  { day: "Mon", study: 3.5, practice: 1.5 },
  { day: "Tue", study: 2.0, practice: 2.0 },
  { day: "Wed", study: 4.0, practice: 1.0 },
  { day: "Thu", study: 1.5, practice: 2.5 },
  { day: "Fri", study: 3.0, practice: 1.5 },
  { day: "Sat", study: 5.0, practice: 2.0 },
  { day: "Sun", study: 2.5, practice: 1.0 },
]

const skillProgressData = [
  { skill: "Reading", current: 75, previous: 65 },
  { skill: "Writing", current: 68, previous: 60 },
  { skill: "Listening", current: 82, previous: 70 },
  { skill: "Speaking", current: 70, previous: 62 },
  { skill: "Grammar", current: 78, previous: 72 },
  { skill: "Vocabulary", current: 85, previous: 75 },
]

const COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"]

export default function StudentAnalyticsPage() {
  const [timeRange, setTimeRange] = useState("month")
  const [selectedCourse, setSelectedCourse] = useState("all")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
          <p className="text-muted-foreground">Track your learning progress and performance</p>
        </div>
        <div className="flex gap-2">
          <Select value={selectedCourse} onValueChange={setSelectedCourse}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All Courses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Courses</SelectItem>
              <SelectItem value="1">Beginner Mandarin</SelectItem>
              <SelectItem value="2">Intermediate Conversation</SelectItem>
              <SelectItem value="3">HSK 4 Preparation</SelectItem>
              <SelectItem value="4">Chinese Calligraphy</SelectItem>
            </SelectContent>
          </Select>
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Time Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="semester">This Semester</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Study Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">145</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <TrendingUp className="h-3 w-3 text-green-500" />
              +12% from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Modules Completed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">23 / 43</div>
            <Progress value={53} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Quiz Score</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">88%</div>
            <p className="text-xs text-muted-foreground">Above class average (79%)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12 days</div>
            <p className="text-xs text-muted-foreground">Personal best: 21 days</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="engagement">Engagement</TabsTrigger>
          <TabsTrigger value="skills">Skills</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Study Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Study Hours</CardTitle>
                <CardDescription>Weekly study time vs target</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={studyHoursData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area type="monotone" dataKey="hours" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.3} name="Study Hours" />
                    <Line type="monotone" dataKey="target" stroke="#ef4444" strokeDasharray="5 5" name="Target" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>Course Progress</CardTitle>
                <CardDescription>Completion status by course</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {courseProgressData.map((course, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{course.course}</span>
                      <span className="text-sm text-muted-foreground">
                        {course.completed}/{course.modules} modules
                      </span>
                    </div>
                    <Progress value={course.progress} className="h-2" />
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Weekly Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Activity</CardTitle>
              <CardDescription>Study and practice time distribution</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={weeklyActivityData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="study" fill="#3b82f6" name="Study (hrs)" />
                  <Bar dataKey="practice" fill="#22c55e" name="Practice (hrs)" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Quiz Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
                <CardDescription>Your scores vs class average</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={quizPerformanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2} name="Your Score" />
                    <Line type="monotone" dataKey="average" stroke="#94a3b8" strokeDasharray="5 5" name="Class Average" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grade Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
                <CardDescription>Breakdown of your grades</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "A (90-100)", value: 8 },
                        { name: "B (80-89)", value: 5 },
                        { name: "C (70-79)", value: 2 },
                        { name: "Below C", value: 1 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label
                    >
                      {COLORS.map((color, index) => (
                        <Cell key={`cell-${index}`} fill={color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Engagement Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Engagement Activities</CardTitle>
                <CardDescription>How you spend your learning time</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={engagementData}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {engagementData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Streaks */}
            <Card>
              <CardHeader>
                <CardTitle>Learning Streaks</CardTitle>
                <CardDescription>Your consistency over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <Zap className="h-8 w-8 text-yellow-500" />
                      <div>
                        <p className="font-medium">Current Streak</p>
                        <p className="text-2xl font-bold">12 days</p>
                      </div>
                    </div>
                    <Badge variant="secondary">Active</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Longest Streak</p>
                      <p className="text-xl font-bold">21 days</p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm text-muted-foreground">Total Active Days</p>
                      <p className="text-xl font-bold">89 days</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-sm text-muted-foreground mb-2">This Month</p>
                    <div className="grid grid-cols-7 gap-1">
                      {Array.from({ length: 31 }, (_, i) => (
                        <div
                          key={i}
                          className={`h-6 rounded ${
                            Math.random() > 0.3 ? "bg-green-500" : "bg-muted"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="skills" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Skill Progress</CardTitle>
              <CardDescription>Track improvement across different language skills</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={skillProgressData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis dataKey="skill" type="category" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="previous" fill="#94a3b8" name="Previous" />
                  <Bar dataKey="current" fill="#3b82f6" name="Current" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {skillProgressData.map((skill, index) => (
              <Card key={index}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">{skill.skill}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-end gap-2">
                    <span className="text-2xl font-bold">{skill.current}%</span>
                    <span className="text-sm text-green-500 flex items-center gap-1 mb-1">
                      <TrendingUp className="h-3 w-3" />+{skill.current - skill.previous}%
                    </span>
                  </div>
                  <Progress value={skill.current} className="mt-2" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
