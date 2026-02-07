import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout"
import { ClassesPage } from "@/components/classes-page"

export default function Classes() {
  return (
    <DashboardLayout>
      {/* 2. Wrap the component using useSearchParams in Suspense */}
      <Suspense fallback={<div className="p-8">Loading classes...</div>}>
        <ClassesPage />
      </Suspense>
    </DashboardLayout>
  )
}
