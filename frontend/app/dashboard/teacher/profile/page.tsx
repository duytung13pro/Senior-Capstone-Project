import { Suspense } from "react" // 1. Import Suspense
import { DashboardLayout } from "@/components/dashboard-layout"
import { ProfilePage } from "@/components/profile-page"

export default function Profile() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading profile...</div>}>
        <ProfilePage />
      </Suspense>
    </DashboardLayout>
  )
}
