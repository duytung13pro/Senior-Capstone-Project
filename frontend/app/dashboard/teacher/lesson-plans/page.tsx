import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { LessonPlansPage } from "@/components/lesson-plans-page"

export  default function LessonPlans() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading lesson plans...</div>}>
        <LessonPlansPage />
      </Suspense>
    </DashboardLayout>
  )
}
