"use client"

export const dynamic = 'force-dynamic';

import { redirect } from 'next/navigation'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { DashboardLayout } from "@/components/dashboard-layout"
import { DashboardPage } from "@/components/dashboard-page"

export default function StudentDashboard() {
  const router = useRouter()
  
  useEffect(() => {
    // Verify user role on mount for production
    const role = localStorage.getItem('role')
    if (role !== 'STUDENT' && role !== 'Student') {
      // Redirect to login if not a student
      router.push('/auth/login')
    }
  }, [router])

  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  )
}
