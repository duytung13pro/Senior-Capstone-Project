import { Suspense } from "react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { LessonPlanDetailPage } from "@/components/lesson-plan-detail-page";

export default async function TeacherLessonPlanDetailPage({
  params,
}: {
  params: Promise<{ lessonPlanId: string }>;
}) {
  const { lessonPlanId } = await params;

  return (
    <DashboardLayout>
      <Suspense
        fallback={<div className="p-8">Loading lesson plan details...</div>}
      >
        <LessonPlanDetailPage lessonPlanId={lessonPlanId} />
      </Suspense>
    </DashboardLayout>
  );
}
