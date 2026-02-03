import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { AttendancePage } from "@/components/attendance-page"

export default function Attendance() {
  return (
    <DashboardLayout>
      {/* 2. Wrap the component using useSearchParams in Suspense */}
      <Suspense fallback={<div className="p-8">Loading assignments...</div>}>
        <AttendancePage />
      </Suspense>
    </DashboardLayout>
  )
}
