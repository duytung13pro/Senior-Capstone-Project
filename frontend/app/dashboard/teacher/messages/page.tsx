import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { MessagesPage } from "@/components/messages-page"

export default function Messages() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading messages...</div>}>
              <MessagesPage />
      </Suspense>
    </DashboardLayout>
  )
}
