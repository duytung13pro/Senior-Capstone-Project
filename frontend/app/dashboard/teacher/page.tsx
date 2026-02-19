"use client";

export const dynamic = "force-dynamic";

import { DashboardLayout } from "@/components/dashboard-layout";
import { DashboardPage } from "@/components/dashboard-page";

export default function TeacherDashboardPage() {
  return (
    <DashboardLayout>
      <DashboardPage />
    </DashboardLayout>
  );
}
