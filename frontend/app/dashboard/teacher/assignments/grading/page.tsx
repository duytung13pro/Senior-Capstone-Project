import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { GradingDashboardPage } from "@/components/grading-dashboard-page";

export default function GradingDashboardRoute() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div className="p-8">Loading grading dashboard...</div>}>
        <GradingDashboardPage />
      </Suspense>
    </DashboardLayout>
  );
}
