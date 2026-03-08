"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentClasses } from "@/components/recent-classes";
import { UpcomingAssignments } from "@/components/upcoming-assignments";
import { StudentAttendance } from "@/components/student-attendance";
import { RecentMessages } from "@/components/recent-messages";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { useEffect, useState } from "react";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  studentIds?: string[];
};

type AssignmentSummary = {
  id?: string;
  deadline?: string;
};

type LessonPlanSummary = {
  date?: string;
  status?: string;
  template?: boolean;
  publishedAssignmentId?: string;
};

function isPendingAssignment(deadlineIso?: string) {
  if (!deadlineIso) {
    return false;
  }

  const deadline = new Date(deadlineIso);
  if (Number.isNaN(deadline.getTime())) {
    return false;
  }

  return deadline.getTime() > Date.now();
}

function isPendingLessonPlan(plan: LessonPlanSummary) {
  if (!plan || plan.template) {
    return false;
  }

  const status = String(plan.status ?? "");
  const isPendingLifecycle =
    status === "Draft" ||
    status === "Ready / Scheduled" ||
    status === "Upcoming" ||
    status === "Published";

  if (!isPendingLifecycle) {
    return false;
  }

  return isPendingAssignment(plan.date);
}

async function resolveTeacherContext() {
  const localTeacherId = localStorage.getItem("userId") || "";
  const localTeacherEmail = localStorage.getItem("userEmail") || "";

  if (localTeacherId && localTeacherEmail) {
    return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
  }

  try {
    const sessionRes = await fetch("/api/auth/session", {
      cache: "no-store",
    });
    if (!sessionRes.ok) {
      return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
    }

    const sessionData = await sessionRes.json();
    const sessionTeacherId = sessionData?.user?.id || localTeacherId;
    const sessionTeacherEmail = sessionData?.user?.email || localTeacherEmail;

    if (sessionTeacherId) {
      localStorage.setItem("userId", sessionTeacherId);
    }
    if (sessionTeacherEmail) {
      localStorage.setItem("userEmail", sessionTeacherEmail);
    }

    return {
      teacherId: sessionTeacherId,
      teacherEmail: sessionTeacherEmail,
    };
  } catch {
    return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
  }
}

export function DashboardPage() {
  const [activeClassCount, setActiveClassCount] = useState<number>(0);
  const [activeStudentCount, setActiveStudentCount] = useState<number>(0);
  const [pendingAssignmentCount, setPendingAssignmentCount] =
    useState<number>(0);
  const [unreadMessagesCount, setUnreadMessagesCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      const { teacherId, teacherEmail } = await resolveTeacherContext();

      if (!teacherId && !teacherEmail) {
        setStatsLoading(false);
        return;
      }

      try {
        const queryParams = new URLSearchParams();
        if (teacherId) {
          queryParams.set("teacherId", teacherId);
        }
        if (teacherEmail) {
          queryParams.set("teacherEmail", teacherEmail);
        }

        const classRes = await fetchApiFirstOk(
          `/api/classes/my?${queryParams.toString()}`,
          { cache: "no-store" },
        );
        const classes: TeacherClass[] = await classRes.json();
        const safeClasses = Array.isArray(classes) ? classes : [];

        setActiveClassCount(safeClasses.length);

        const uniqueStudentIds = new Set(
          safeClasses.flatMap((teacherClass) =>
            Array.isArray(teacherClass.studentIds)
              ? teacherClass.studentIds
              : [],
          ),
        );
        setActiveStudentCount(uniqueStudentIds.size);

        const assignmentGroups = await Promise.all(
          safeClasses.map(async (teacherClass) => {
            try {
              const assignmentRes = await fetchApiFirstOk(
                `/api/classes/${teacherClass.id}/assignments`,
                { cache: "no-store" },
              );
              const data = await assignmentRes.json();
              return Array.isArray(data) ? (data as AssignmentSummary[]) : [];
            } catch {
              return [];
            }
          }),
        );

        const assignmentItems = assignmentGroups.flat();
        const assignmentIdSet = new Set(
          assignmentItems
            .map((assignment) => String(assignment.id ?? ""))
            .filter((id) => id.length > 0),
        );

        const pendingAssignmentsFromClasses = assignmentItems.filter(
          (assignment) => isPendingAssignment(assignment.deadline),
        ).length;

        let pendingLessonPlans = 0;

        if (teacherId) {
          try {
            const lessonPlansRes = await fetchApiFirstOk(
              `/api/lesson-plans?teacherId=${encodeURIComponent(teacherId)}`,
              { cache: "no-store" },
            );
            const lessonPlansData: LessonPlanSummary[] =
              await lessonPlansRes.json();

            if (Array.isArray(lessonPlansData)) {
              pendingLessonPlans = lessonPlansData.filter((plan) => {
                if (!isPendingLessonPlan(plan)) {
                  return false;
                }

                const publishedAssignmentId =
                  typeof plan.publishedAssignmentId === "string"
                    ? plan.publishedAssignmentId
                    : "";

                if (
                  publishedAssignmentId &&
                  assignmentIdSet.has(publishedAssignmentId)
                ) {
                  return false;
                }

                return true;
              }).length;
            }
          } catch {
            pendingLessonPlans = 0;
          }
        }

        setPendingAssignmentCount(
          pendingAssignmentsFromClasses + pendingLessonPlans,
        );
      } catch (error) {
        console.error("Failed to load dashboard stats", error);
      } finally {
        setStatsLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Total Students
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "—" : activeStudentCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Active Classes
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "—" : activeClassCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Pending Assignments
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <rect width="20" height="14" x="2" y="5" rx="2" />
                  <path d="M2 10h20" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {statsLoading ? "—" : pendingAssignmentCount}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  Unread Messages
                </CardTitle>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  className="h-4 w-4 text-muted-foreground"
                >
                  <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
                </svg>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{unreadMessagesCount}</div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Classes - Full Width Row */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Classes</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentClasses />
            </CardContent>
          </Card>

          {/* Upcoming Assignments - Full Width Row */}
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              <UpcomingAssignments
                onPendingCountChange={setPendingAssignmentCount}
              />
            </CardContent>
          </Card>

          {/* Student Attendance and Recent Messages */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            <Card className="col-span-2 lg:col-span-4">
              <CardHeader>
                <CardTitle>Student Attendance</CardTitle>
                <CardDescription>Last 7 days</CardDescription>
              </CardHeader>
              <CardContent>
                <StudentAttendance />
              </CardContent>
            </Card>
            <Card className="col-span-2 lg:col-span-8">
              <CardHeader>
                <CardTitle>Recent Messages</CardTitle>
              </CardHeader>
              <CardContent>
                <RecentMessages onUnreadCountChange={setUnreadMessagesCount} />
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>
                Generate and view reports about student performance.
              </CardDescription>
            </CardHeader>
            <CardContent className="h-[400px] flex items-center justify-center">
              <p className="text-muted-foreground">
                Reports content coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
