"use client"

import type React from "react"
import { StudentHeader } from "@/components/student/student-header"
import { StudentSidebar } from "@/components/student/student-sidebar"

export default function StudentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <StudentHeader />
      <div className="flex flex-1 relative">
        <StudentSidebar />
        <div className="w-full pl-16 bg-background">
          <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8">{children}</main>
        </div>
      </div>
    </div>
  )
}
