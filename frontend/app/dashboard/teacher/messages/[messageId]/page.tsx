import { DashboardLayout } from "@/components/dashboard-layout";
import { TeacherMessageThreadPage } from "@/components/teacher-message-thread-page";

type TeacherMessageDetailPageProps = {
  params: Promise<{ messageId: string }>;
};

export default async function TeacherMessageDetailPage({
  params,
}: TeacherMessageDetailPageProps) {
  const { messageId } = await params;

  return (
    <DashboardLayout>
      <TeacherMessageThreadPage messageId={messageId} />
    </DashboardLayout>
  );
}
