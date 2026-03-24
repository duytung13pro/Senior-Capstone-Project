"use client"

export const dynamic = 'force-dynamic';

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { fetchApiFirstOk } from '@/lib/api'
import {
  AlertTriangle,
  BookOpen,
  ChevronRight,
  ClipboardList,
  Flame,
  MessageSquare,
  TrendingUp,
} from 'lucide-react'

type ClassItem = {
  id?: string
  name?: string
}

type AssignmentApiItem = {
  id?: string
  description?: string
  deadline?: string
}

type AssignmentSubmissionOverview = {
  students?: Array<{
    studentId?: string
    submitted?: boolean
  }>
}

type DashboardSummaryData = {
  enrolledClasses: Array<{ id: string; name: string }>
  upcomingAssignmentsCount: number
  overdueAssignmentsCount: number
  unreadMessagesCount: number
  analyticsSummary: {
    studyHoursThisWeek: string
    averageQuizScore: string
    courseCompletion: string
    currentStudyStreakDays: number
    weeklyTasksCompleted: number
    weeklyTasksTotal: number
  }
}

const PRAISE_LIBRARY = {
  activeStreak: [
    "You're on fire! Keep the streak alive.",
    'Consistency is key. Great job!',
    'Unstoppable! Another day down.',
    'Your daily habit is building!',
  ],
  tasksComplete: [
    'Weekend ready! All tasks done.',
    'Flawless victory. You cleared your board.',
    'Take a breather, you earned it!',
    '100% complete. Masterful work.',
  ],
  tasksOverHalf: [
    'Over halfway there. Keep pushing!',
    'Making great progress this week.',
    "You're chipping away at it!",
  ],
}

const STUDY_GOAL_MILESTONES = {
  warmup: 3,
  starter: 5,
  stretch: 7,
  max: 10,
}

const parseStudyMinutes = (rawValue: string) => {
  const normalized = String(rawValue || '').trim().toLowerCase()

  if (!normalized) {
    return 0
  }

  if (normalized.endsWith('m')) {
    const minutes = Number.parseFloat(normalized.replace(/[^\d.]/g, ''))
    return Number.isNaN(minutes) ? 0 : Math.max(0, Math.round(minutes))
  }

  const hours = Number.parseFloat(normalized.replace(/[^\d.]/g, ''))
  if (Number.isNaN(hours)) {
    return 0
  }

  return Math.max(0, Math.round(hours * 60))
}

const formatStudyDuration = (totalMinutes: number) => {
  const safeMinutes = Math.max(0, Math.round(totalMinutes))

  if (safeMinutes < 60) {
    return `${safeMinutes}m`
  }

  const hours = Math.floor(safeMinutes / 60)
  const minutes = safeMinutes % 60

  if (minutes === 0) {
    return `${hours}h`
  }

  return `${hours}h ${minutes}m`
}

const useRandomMessage = (messages: string[], key: string) => {
  const [message, setMessage] = useState('')

  useEffect(() => {
    if (!key || messages.length === 0) {
      setMessage('')
      return
    }

    const randomIndex = Math.floor(Math.random() * messages.length)
    setMessage(messages[randomIndex] || '')
  }, [messages, key])

  return message
}

export default function StudentDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [studentFirstName, setStudentFirstName] = useState('Student')
  const [summaryData, setSummaryData] = useState<DashboardSummaryData>({
    enrolledClasses: [],
    upcomingAssignmentsCount: 0,
    overdueAssignmentsCount: 0,
    unreadMessagesCount: 0,
    analyticsSummary: {
      studyHoursThisWeek: '0h',
      averageQuizScore: '0%',
      courseCompletion: '0%',
      currentStudyStreakDays: 0,
      weeklyTasksCompleted: 0,
      weeklyTasksTotal: 0,
    },
  })

  const greetingName = studentFirstName || 'Student'
  const studyMinutesThisWeek = parseStudyMinutes(
    summaryData.analyticsSummary.studyHoursThisWeek,
  )
  const studyHoursThisWeek = studyMinutesThisWeek / 60
  const studyTier = useMemo(() => {
    if (studyHoursThisWeek < STUDY_GOAL_MILESTONES.warmup) {
      return {
        currentGoal: STUDY_GOAL_MILESTONES.starter,
        message: '',
        themeColor: 'primary',
      }
    }

    if (studyHoursThisWeek < STUDY_GOAL_MILESTONES.starter) {
      return {
        currentGoal: STUDY_GOAL_MILESTONES.starter,
        message: 'Great start! Keep the momentum going.',
        themeColor: 'primary',
      }
    }

    if (studyHoursThisWeek < STUDY_GOAL_MILESTONES.stretch) {
      return {
        currentGoal: STUDY_GOAL_MILESTONES.stretch,
        message: 'Awesome work! You hit your first major milestone.',
        themeColor: 'blue',
      }
    }

    if (studyHoursThisWeek < STUDY_GOAL_MILESTONES.max) {
      return {
        currentGoal: STUDY_GOAL_MILESTONES.max,
        message: 'Incredible dedication! You are crushing it this week.',
        themeColor: 'indigo',
      }
    }

    return {
      currentGoal: STUDY_GOAL_MILESTONES.max,
      message: "Outstanding! 🌟 You've maxed out your weekly study goals!",
      themeColor: 'yellow',
    }
  }, [studyHoursThisWeek])

  const getTierTextClass = (themeColor: string) => {
    if (themeColor === 'blue') return 'text-blue-600'
    if (themeColor === 'indigo') return 'text-indigo-600'
    if (themeColor === 'yellow') return 'text-yellow-600'
    return 'text-primary'
  }

  const getTierBarClass = (themeColor: string) => {
    if (themeColor === 'blue') return 'bg-blue-600'
    if (themeColor === 'indigo') return 'bg-indigo-600'
    if (themeColor === 'yellow') return 'bg-yellow-400'
    return 'bg-primary'
  }

  const currentGoalHours = studyTier.currentGoal
  const currentGoalMinutes = currentGoalHours * 60
  const studyTimeDisplay = formatStudyDuration(studyMinutesThisWeek)
  const studyGoalDisplay = `${studyTimeDisplay} / ${currentGoalHours}h`
  const studyGoalPercent = Math.max(
    0,
    Math.min(100, (studyMinutesThisWeek / currentGoalMinutes) * 100),
  )
  const currentStudyStreakDays = Math.max(
    0,
    Number(summaryData.analyticsSummary.currentStudyStreakDays || 0),
  )
  const weeklyTasksTotal = Math.max(
    0,
    Number(summaryData.analyticsSummary.weeklyTasksTotal || 0),
  )
  const weeklyTasksCompleted = Math.max(
    0,
    Math.min(weeklyTasksTotal, Number(summaryData.analyticsSummary.weeklyTasksCompleted || 0)),
  )
  const weeklyTasksPercent =
    weeklyTasksTotal > 0 ? (weeklyTasksCompleted / weeklyTasksTotal) * 100 : 0

  const streakMessages =
    currentStudyStreakDays > 2 ? PRAISE_LIBRARY.activeStreak : []
  const tasksMessages =
    weeklyTasksPercent >= 100
      ? PRAISE_LIBRARY.tasksComplete
      : weeklyTasksPercent > 50
        ? PRAISE_LIBRARY.tasksOverHalf
        : []

  const streakMessage = useRandomMessage(
    streakMessages,
    isLoading ? '' : `streak-${currentStudyStreakDays}`,
  )
  const weeklyTasksMessage = useRandomMessage(
    tasksMessages,
    isLoading ? '' : `tasks-${weeklyTasksCompleted}-${weeklyTasksTotal}`,
  )
  const LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX =
    'This assignment was published from a lesson plan.'
  
  useEffect(() => {
    // Verify user role on mount for production
    const role = localStorage.getItem('role')
    const normalizedRole = role?.toLowerCase()

    if (normalizedRole !== 'student') {
      // Redirect to login if not a student
      router.push('/auth/login')
      return
    }

    setIsAuthorized(true)

    const resolveStudentId = async () => {
      const localStudentId = localStorage.getItem('userId') || ''
      if (localStudentId) {
        return localStudentId
      }

      try {
        const sessionRes = await fetch('/api/auth/session', {
          cache: 'no-store',
        })
        if (!sessionRes.ok) {
          return ''
        }

        const sessionData = await sessionRes.json()
        const sessionStudentId = String(sessionData?.user?.id || '')
        if (sessionStudentId) {
          localStorage.setItem('userId', sessionStudentId)
        }
        return sessionStudentId
      } catch {
        return ''
      }
    }

    const fetchDashboardPreview = async () => {
      try {
        const userId = await resolveStudentId()

        const sessionRes = await fetch('/api/auth/session', {
          cache: 'no-store',
        })
        const sessionData = sessionRes.ok ? await sessionRes.json() : null
        const sessionName = String(sessionData?.user?.name || '').trim()
        const firstName = sessionName.split(' ').filter(Boolean)[0] || 'Student'
        setStudentFirstName(firstName)

        if (!userId) {
          return
        }

        const classesRes = await fetchApiFirstOk(
          `/api/classes/enrolled?studentId=${encodeURIComponent(userId)}`,
          { cache: 'no-store' },
        )
        const enrolledClassesData = (await classesRes.json()) as ClassItem[]

        const enrolledClasses = (Array.isArray(enrolledClassesData)
          ? enrolledClassesData
          : []
        )
          .map((item) => ({
            id: String(item?.id || ''),
            name: String(item?.name || 'Untitled Class'),
          }))
          .filter((item) => item.id)

        const now = Date.now()
        const weekEnd = now + 7 * 24 * 60 * 60 * 1000

        const assignmentStatsByClass = await Promise.all(
          enrolledClasses.map(async (classItem) => {
            try {
              const assignmentsRes = await fetchApiFirstOk(
                `/api/classes/${classItem.id}/assignments`,
                { cache: 'no-store' },
              )

              const assignments = (await assignmentsRes.json()) as AssignmentApiItem[]
              const safeAssignments = Array.isArray(assignments) ? assignments : []

              const assignmentStats = await Promise.all(
                safeAssignments.map(async (assignment) => {
                  const assignmentId = String(assignment?.id || '')
                  if (!assignmentId) {
                    return { upcoming: 0, overdue: 0 }
                  }

                  const description = String(assignment?.description || '').trim()
                  if (description.startsWith(LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX)) {
                    return { upcoming: 0, overdue: 0 }
                  }

                  const dueRaw = String(assignment?.deadline || '').trim()
                  const dueTime = dueRaw ? new Date(dueRaw).getTime() : NaN
                  if (Number.isNaN(dueTime)) {
                    return { upcoming: 0, overdue: 0 }
                  }

                  try {
                    const submissionsRes = await fetchApiFirstOk(
                      `/api/classes/${classItem.id}/assignments/${assignmentId}/submissions`,
                      { cache: 'no-store' },
                    )
                    const submissions =
                      (await submissionsRes.json()) as AssignmentSubmissionOverview

                    const studentSubmission = submissions?.students?.find(
                      (row) => String(row?.studentId || '') === userId,
                    )

                    if (studentSubmission?.submitted) {
                      return { upcoming: 0, overdue: 0 }
                    }

                    if (dueTime < now) {
                      return { upcoming: 0, overdue: 1 }
                    }

                    if (dueTime <= weekEnd) {
                      return { upcoming: 1, overdue: 0 }
                    }

                    return { upcoming: 0, overdue: 0 }
                  } catch {
                    if (dueTime < now) {
                      return { upcoming: 0, overdue: 1 }
                    }

                    if (dueTime <= weekEnd) {
                      return { upcoming: 1, overdue: 0 }
                    }

                    return { upcoming: 0, overdue: 0 }
                  }
                }),
              )

              return assignmentStats.reduce(
                (accumulator, item) => ({
                  upcoming: accumulator.upcoming + item.upcoming,
                  overdue: accumulator.overdue + item.overdue,
                }),
                { upcoming: 0, overdue: 0 },
              )
            } catch {
              return { upcoming: 0, overdue: 0 }
            }
          }),
        )

        const assignmentSummary = assignmentStatsByClass.reduce(
          (accumulator, item) => ({
            upcoming: accumulator.upcoming + item.upcoming,
            overdue: accumulator.overdue + item.overdue,
          }),
          { upcoming: 0, overdue: 0 },
        )

        let unreadMessagesCount = 0
        let analyticsSummary: DashboardSummaryData['analyticsSummary'] = {
          studyHoursThisWeek: '0h',
          averageQuizScore: '0%',
          courseCompletion: '0%',
          currentStudyStreakDays: 0,
          weeklyTasksCompleted: 0,
          weeklyTasksTotal: 0,
        }

        try {
          const query = `?studentId=${encodeURIComponent(userId)}`
          const previewResponse = await fetch(`/api/student/dashboard-preview${query}`, {
            cache: 'no-store',
          })
          const previewResult = await previewResponse.json()

          if (previewResponse.ok && previewResult?.success && previewResult?.data) {
            unreadMessagesCount = Number(previewResult.data.unreadMessagesCount || 0)
            analyticsSummary = {
              studyHoursThisWeek: String(
                previewResult.data.analyticsSummary?.studyHoursThisWeek || '0h',
              ),
              averageQuizScore: String(
                previewResult.data.analyticsSummary?.averageQuizScore || '0%',
              ),
              courseCompletion: String(
                previewResult.data.analyticsSummary?.courseCompletion || '0%',
              ),
              currentStudyStreakDays: Number(
                previewResult.data.analyticsSummary?.currentStudyStreakDays || 0,
              ),
              weeklyTasksCompleted: Number(
                previewResult.data.analyticsSummary?.weeklyTasksCompleted || 0,
              ),
              weeklyTasksTotal: Number(
                previewResult.data.analyticsSummary?.weeklyTasksTotal || 0,
              ),
            }
          }
        } catch {
          // keep fallback summary values
        }

        setSummaryData({
          enrolledClasses,
          upcomingAssignmentsCount: assignmentSummary.upcoming,
          overdueAssignmentsCount: assignmentSummary.overdue,
          unreadMessagesCount,
          analyticsSummary,
        })
      } catch (error) {
        console.error('Failed to load student dashboard preview:', error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchDashboardPreview()
  }, [router])

  if (!isAuthorized) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Welcome back, {greetingName}!</h1>
        <p className="text-muted-foreground">Here is a quick preview of your learning activity.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-primary" />
              My Classes
            </CardTitle>
            <CardDescription>Your current classes and schedules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            ) : summaryData.enrolledClasses.length === 0 ? (
              <p className="text-sm text-muted-foreground">No classes found.</p>
            ) : (
              <div className="space-y-2">
                {summaryData.enrolledClasses.slice(0, 3).map((item) => (
                  <Link
                    key={item.id}
                    href={`/dashboard/student/class/${encodeURIComponent(item.id)}`}
                    className="flex cursor-pointer items-center justify-between rounded-md border border-stone-200 bg-white p-2 text-sm font-medium text-gray-800 transition-colors hover:bg-stone-50"
                  >
                    <span className="truncate">{item.name}</span>
                    <ChevronRight className="h-4 w-4 text-gray-500" />
                  </Link>
                ))}
              </div>
            )}
            <Link href="/dashboard/student/my-classes" className="text-sm font-medium text-primary hover:underline">
              View all classes
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ClipboardList className="h-4 w-4 text-primary" />
              Assignments
            </CardTitle>
            <CardDescription>Upcoming and recent assignment status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  You have {summaryData.upcomingAssignmentsCount} upcoming assignment{summaryData.upcomingAssignmentsCount === 1 ? '' : 's'} due this week.
                </p>

                {summaryData.overdueAssignmentsCount > 0 ? (
                  <p className="flex items-center gap-2 text-sm font-semibold text-red-600">
                    <AlertTriangle className="h-4 w-4" />
                    {summaryData.overdueAssignmentsCount} overdue assignment{summaryData.overdueAssignmentsCount === 1 ? '' : 's'} need attention.
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No overdue assignments! 🎉</p>
                )}
              </>
            )}
            <Link href="/dashboard/student/assignments" className="text-sm font-medium text-primary hover:underline">
              View all assignments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-primary" />
              Messages
            </CardTitle>
            <CardDescription>Latest messages from instructors and center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
            ) : (
              <p className="text-sm text-muted-foreground">
                {summaryData.unreadMessagesCount} unread message{summaryData.unreadMessagesCount === 1 ? '' : 's'} from instructors.
              </p>
            )}
            <Link href="/dashboard/student/messages" className="text-sm font-medium text-primary hover:underline">
              View all messages
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Analytics
            </CardTitle>
            <CardDescription>Snapshot of your study performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {isLoading ? (
              <div className="space-y-2">
                <div className="h-12 animate-pulse rounded-md bg-gray-200" />
                <div className="h-12 animate-pulse rounded-md bg-gray-200" />
                <div className="h-12 animate-pulse rounded-md bg-gray-200" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm font-medium text-gray-500">Study Hours This Week</p>
                  <p className="text-lg font-bold text-gray-900">{studyGoalDisplay}</p>
                </div>
                <div className="h-1.5 rounded-full bg-gray-200 -mt-2">
                  <div
                    className={`h-1.5 rounded-full transition-colors duration-300 ${getTierBarClass(studyTier.themeColor)}`}
                    style={{ width: `${studyGoalPercent}%` }}
                  />
                </div>
                {studyTier.message ? (
                  <p
                    className={`mt-1.5 text-xs font-medium transition-colors duration-300 ${getTierTextClass(studyTier.themeColor)}`}
                  >
                    {studyTier.message}
                  </p>
                ) : null}
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Current Study Streak</p>
                    <p className="flex items-center gap-1 text-lg font-bold text-gray-900">
                      <Flame className="h-4 w-4 text-orange-500" />
                      {currentStudyStreakDays} Days
                    </p>
                  </div>
                  {currentStudyStreakDays > 2 && streakMessage ? (
                    <p className="mt-1 text-xs font-medium text-orange-600">{streakMessage}</p>
                  ) : null}
                </div>
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-500">Weekly Tasks</p>
                    <p className="text-lg font-bold text-gray-900">
                      {weeklyTasksCompleted} / {weeklyTasksTotal} Tasks
                    </p>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-200">
                    <div
                      className="h-1.5 rounded-full bg-primary"
                      style={{ width: `${Math.min(100, Math.max(0, weeklyTasksPercent))}%` }}
                    />
                  </div>
                  {weeklyTasksMessage ? (
                    <p className="mt-1.5 text-xs font-medium text-blue-600">{weeklyTasksMessage}</p>
                  ) : null}
                </div>
              </>
            )}
            <Link href="/dashboard/student/analytics" className="text-sm font-medium text-primary hover:underline">
              View full analytics
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
