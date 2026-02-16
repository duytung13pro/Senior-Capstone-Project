import { DashboardLayout } from "@/components/dashboard-layout"
import { StudentClassesPage } from "@/components/student-classes-page"

export default function Classes() {
  return (
    <DashboardLayout>
      <StudentClassesPage />
    </DashboardLayout>
  )
}