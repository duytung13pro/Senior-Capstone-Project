import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProductivityToolsPage } from "@/components/productivity-tools-page"

export default function Productivity() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading productivity tools...</div>}>
              <ProductivityToolsPage />
      </Suspense>
    </DashboardLayout>
  )
}
