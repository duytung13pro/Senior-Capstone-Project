import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { AnnouncementsPage } from "@/components/announcements-page"
import { AssignmentsPage } from "@/components/assignments-page"

export default function Announcements() {
  return (
    <DashboardLayout>
      {/* 2. Wrap the component using useSearchParams in Suspense */}
      <Suspense fallback={<div className="p-8">Loading assignments...</div>}>
        <AnnouncementsPage />
      </Suspense>
    </DashboardLayout>
  )
}
