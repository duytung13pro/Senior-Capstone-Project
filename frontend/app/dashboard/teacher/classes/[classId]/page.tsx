import { DashboardLayout } from "@/components/dashboard-layout"
import { EachClass } from "@/components/each-class"

export default function Classes() {
  return (
    <DashboardLayout>
        <Suspense fallback={<div className="p-8">Loading classes...</div>}>
            <EachClass/>
        </Suspense>
    </DashboardLayout>
  )
}