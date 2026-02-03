import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentProgressPage } from "@/components/student-progress-page"

export default function StudentProgress() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading assignments...</div>}>
        <StudentProgressPage />
      </Suspense>
    </DashboardLayout>
  )
}
