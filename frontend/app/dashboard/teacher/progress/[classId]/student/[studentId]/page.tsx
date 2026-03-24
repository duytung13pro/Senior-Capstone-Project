import { DashboardLayout } from "@/components/dashboard-layout";
import { StudentDiagnosticReportPage } from "@/components/student-diagnostic-report-page";

export default function TeacherStudentDiagnosticReportRoute() {
  return (
    <DashboardLayout>
      <StudentDiagnosticReportPage />
    </DashboardLayout>
  );
}
