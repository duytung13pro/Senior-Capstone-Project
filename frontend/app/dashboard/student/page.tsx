"use client"

export const dynamic = 'force-dynamic';

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

type DashboardPreviewData = {
  classes: Array<{ id: string; name: string; progress: number }>
  assignments: Array<{ id: string; title: string; due: string; points: number }>
  messages: Array<{ id: string; sender: string; subject: string; time: string }>
  analytics: Array<{ label: string; value: string }>
}

export default function StudentDashboard() {
  const router = useRouter()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [previewData, setPreviewData] = useState<DashboardPreviewData>({
    classes: [],
    assignments: [],
    messages: [],
    analytics: [
      { label: 'Study Hours This Week', value: '0h' },
      { label: 'Average Quiz Score', value: '0%' },
      { label: 'Course Completion', value: '0%' },
    ],
  })
  
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

    const userId = localStorage.getItem('userId')
    const fetchDashboardPreview = async () => {
      try {
        const query = userId ? `?studentId=${encodeURIComponent(userId)}` : ''
        const response = await fetch(`/api/student/dashboard-preview${query}`, {
          cache: 'no-store',
        })

        const result = await response.json()
        if (response.ok && result?.success && result?.data) {
          setPreviewData(result.data)
        }
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
        <h1 className="text-3xl font-bold tracking-tight">Student Dashboard</h1>
        <p className="text-muted-foreground">Welcome back. Here is a quick preview of your learning activity.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>My Classes</CardTitle>
            <CardDescription>Your current classes and schedules.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewData.classes.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No classes found.</p>
            )}
            {previewData.classes.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <p className="font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground">Progress: {item.progress}%</p>
              </div>
            ))}
            {isLoading && <p className="text-sm text-muted-foreground">Loading classes...</p>}
            <Link href="/dashboard/student/my-classes" className="text-sm font-medium text-primary hover:underline">
              View all classes
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignments</CardTitle>
            <CardDescription>Upcoming and recent assignment status.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewData.assignments.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No assignments found.</p>
            )}
            {previewData.assignments.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <p className="font-medium">{item.title}</p>
                <p className="text-sm text-muted-foreground">{item.due} · {item.points} pts</p>
              </div>
            ))}
            {isLoading && <p className="text-sm text-muted-foreground">Loading assignments...</p>}
            <Link href="/dashboard/student/assignments" className="text-sm font-medium text-primary hover:underline">
              View all assignments
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>Latest messages from instructors and center.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewData.messages.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground">No messages found.</p>
            )}
            {previewData.messages.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <p className="font-medium">{item.sender}</p>
                <p className="text-sm">{item.subject}</p>
                <p className="text-xs text-muted-foreground">{item.time}</p>
              </div>
            ))}
            {isLoading && <p className="text-sm text-muted-foreground">Loading messages...</p>}
            <Link href="/dashboard/student/messages" className="text-sm font-medium text-primary hover:underline">
              View all messages
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Analytics</CardTitle>
            <CardDescription>Snapshot of your study performance.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {previewData.analytics.map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-md border p-3">
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="font-semibold">{item.value}</p>
              </div>
            ))}
            <Link href="/dashboard/student/analytics" className="text-sm font-medium text-primary hover:underline">
              View full analytics
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
