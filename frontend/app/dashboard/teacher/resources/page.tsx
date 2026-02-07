import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { ResourcesPage } from "@/components/resources-page"

export default function Resources() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading resources...</div>}>
        <ResourcesPage />
      </Suspense>
    </DashboardLayout>
  )
}
