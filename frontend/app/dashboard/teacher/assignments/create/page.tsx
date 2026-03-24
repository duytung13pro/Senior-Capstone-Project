import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AssignmentCreatePage } from "@/components/assignment-create-page";

export default function AssignmentCreate() {
  return (
    <DashboardLayout>
      <Suspense
        fallback={<div className="p-6">Loading assignment form...</div>}
      >
        <AssignmentCreatePage />
      </Suspense>
    </DashboardLayout>
  );
}
