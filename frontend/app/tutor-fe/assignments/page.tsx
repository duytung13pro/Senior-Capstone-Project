import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AssignmentsPage } from "@/components/assignments-page";

export default function Assignments() {
  return (
    <DashboardLayout>
      <Suspense fallback={<div>Loading assignments...</div>}>
        <AssignmentsPage />
      </Suspense>
    </DashboardLayout>
  );
}
