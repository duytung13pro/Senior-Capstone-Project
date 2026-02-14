import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentDashboardPage } from "@/components/student-dashboard-page"

export default function Home() {
  return (
    <DashboardLayout>
      <StudentDashboardPage />
    </DashboardLayout>
  )
}
