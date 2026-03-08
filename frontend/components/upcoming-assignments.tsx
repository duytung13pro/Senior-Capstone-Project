"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  name: string;
  studentIds?: string[];
};

type UpcomingAssignmentItem = {
  id: string;
  title: string;
  className: string;
  deadline: string;
  submittedCount: number;
  totalStudents: number;
  status: "Published" | "Scheduled" | "Completed" | "Draft";
  source: "assignment" | "lesson-plan";
  lessonPlanId?: string;
};

type LessonPlanRow = {
  id: string;
  classId: string;
  title?: string;
  date?: string;
  status?: string;
  template?: boolean;
  publishedAssignmentId?: string;
};

type UpcomingAssignmentsProps = {
  onPendingCountChange?: (count: number) => void;
};

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

function getStatus(deadlineIso: string): "Open" | "Due Soon" | "Past Due" {
  const deadline = new Date(deadlineIso);
  const now = new Date();

  if (deadline.getTime() <= now.getTime()) {
    return "Past Due";
  }

  const hoursToDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursToDeadline <= 48) {
    return "Due Soon";
  }

  return "Open";
}

function normalizeLessonPlanStatus(
  rawStatus?: string,
): "Published" | "Scheduled" | "Completed" | "Draft" {
  if (rawStatus === "Published") {
    return "Published";
  }

  if (rawStatus === "Completed" || rawStatus === "Completed / Taught") {
    return "Completed";
  }

  if (rawStatus === "Ready / Scheduled" || rawStatus === "Upcoming") {
    return "Scheduled";
  }

  return "Draft";
}

function statusFromAssignmentDeadline(
  deadlineIso: string,
): "Published" | "Scheduled" | "Completed" | "Draft" {
  const deadlineStatus = getStatus(deadlineIso);
  return deadlineStatus === "Past Due" ? "Completed" : "Published";
}

export function UpcomingAssignments({
  onPendingCountChange,
}: UpcomingAssignmentsProps) {
  const router = useRouter();
  const [assignments, setAssignments] = useState<UpcomingAssignmentItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUpcomingAssignments = async () => {
      const { teacherId, teacherEmail } = await resolveTeacherContext();

      if (!teacherId && !teacherEmail) {
        setAssignments([]);
        setLoading(false);
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
        const classData: TeacherClass[] = await classRes.json();
        const classNameById = new Map(
          classData.map((teacherClass) => [teacherClass.id, teacherClass.name]),
        );
        const studentCountByClassId = new Map(
          classData.map((teacherClass) => [
            teacherClass.id,
            Array.isArray(teacherClass.studentIds)
              ? teacherClass.studentIds.length
              : 0,
          ]),
        );

        const assignmentGroups = await Promise.all(
          classData.map(async (teacherClass) => {
            try {
              const res = await fetchApiFirstOk(
                `/api/classes/${teacherClass.id}/assignments`,
                { cache: "no-store" },
              );
              const rows = await res.json();
              if (!Array.isArray(rows)) {
                return [];
              }

              return rows.map((item: any) => {
                const totalStudents = Array.isArray(teacherClass.studentIds)
                  ? teacherClass.studentIds.length
                  : 0;

                return {
                  id: String(item.id ?? ""),
                  title: String(item.title ?? "Untitled"),
                  className: teacherClass.name,
                  deadline: String(item.deadline ?? ""),
                  submittedCount:
                    typeof item.submittedCount === "number"
                      ? item.submittedCount
                      : 0,
                  totalStudents,
                  status: statusFromAssignmentDeadline(
                    String(item.deadline ?? ""),
                  ),
                  source: "assignment",
                } as UpcomingAssignmentItem;
              });
            } catch {
              return [];
            }
          }),
        );

        const assignmentItems = assignmentGroups
          .flat()
          .filter((assignment) => assignment.id && assignment.deadline);
        const assignmentIdSet = new Set(
          assignmentItems.map((assignment) => assignment.id),
        );

        let lessonPlanItems: UpcomingAssignmentItem[] = [];

        if (teacherId) {
          try {
            const lessonPlansRes = await fetchApiFirstOk(
              `/api/lesson-plans?teacherId=${encodeURIComponent(teacherId)}`,
              { cache: "no-store" },
            );
            const lessonPlansRows: LessonPlanRow[] =
              await lessonPlansRes.json();

            if (Array.isArray(lessonPlansRows)) {
              lessonPlanItems = lessonPlansRows
                .filter((plan) => {
                  if (!plan || plan.template) {
                    return false;
                  }

                  const planDate =
                    typeof plan.date === "string" ? plan.date : "";
                  if (!planDate) {
                    return false;
                  }

                  const planStatus = String(plan.status ?? "");
                  const isSchedulable =
                    planStatus === "Ready / Scheduled" ||
                    planStatus === "Upcoming" ||
                    planStatus === "Published" ||
                    planStatus === "Draft" ||
                    planStatus === "Completed" ||
                    planStatus === "Completed / Taught";

                  if (!isSchedulable) {
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
                })
                .map((plan) => {
                  const planId = String(plan.id ?? "");
                  const planDate = String(plan.date ?? "");
                  const publishedAssignmentId =
                    typeof plan.publishedAssignmentId === "string"
                      ? plan.publishedAssignmentId
                      : "";
                  const classId = String(plan.classId ?? "");

                  return {
                    id: publishedAssignmentId || `lesson-plan:${planId}`,
                    title: String(plan.title ?? "Untitled Lesson Plan"),
                    className: classNameById.get(classId) || "Unknown Class",
                    deadline: planDate,
                    submittedCount: 0,
                    totalStudents: studentCountByClassId.get(classId) ?? 0,
                    status: normalizeLessonPlanStatus(plan.status),
                    source: "lesson-plan",
                    lessonPlanId: planId,
                  } as UpcomingAssignmentItem;
                });
            }
          } catch (lessonPlanError) {
            console.error(
              "Failed to load scheduled lesson plans",
              lessonPlanError,
            );
          }
        }

        const now = Date.now();
        const getPriority = (item: UpcomingAssignmentItem) => {
          const deadlineTime = new Date(item.deadline).getTime();

          if (Number.isNaN(deadlineTime)) {
            return { bucket: 2, time: Number.POSITIVE_INFINITY };
          }

          if (deadlineTime <= now) {
            return { bucket: 0, time: deadlineTime };
          }

          return { bucket: 1, time: deadlineTime };
        };

        const allAssignments = [...assignmentItems, ...lessonPlanItems].sort(
          (left, right) => {
            const leftPriority = getPriority(left);
            const rightPriority = getPriority(right);

            if (leftPriority.bucket !== rightPriority.bucket) {
              return leftPriority.bucket - rightPriority.bucket;
            }

            return leftPriority.time - rightPriority.time;
          },
        );

        setAssignments(allAssignments);
      } catch (error) {
        console.error("Failed to load upcoming assignments", error);
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchUpcomingAssignments();
  }, []);

  const pendingAssignments = useMemo(() => assignments, [assignments]);

  useEffect(() => {
    if (onPendingCountChange) {
      onPendingCountChange(pendingAssignments.length);
    }
  }, [pendingAssignments.length, onPendingCountChange]);

  const handleAssignmentClick = (assignment: UpcomingAssignmentItem) => {
    if (assignment.source === "lesson-plan" && assignment.lessonPlanId) {
      router.push(`/dashboard/teacher/lesson-plans/${assignment.lessonPlanId}`);
      return;
    }

    router.push(`/dashboard/teacher/assignments?id=${assignment.id}`);
  };

  if (loading) {
    return <div className="text-muted-foreground">Loading assignments...</div>;
  }

  const visibleAssignments = pendingAssignments.slice(0, 8);

  if (visibleAssignments.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No upcoming assignments.
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="rounded-md border border-[#E5E7EB] bg-white">
        <div className="flex flex-col">
          {visibleAssignments.map((assignment, index) => {
            const deadline = new Date(assignment.deadline);
            const isValidDeadline = !Number.isNaN(deadline.getTime());
            const isPastDue =
              isValidDeadline && deadline.getTime() <= Date.now();
            const submittedCount = Math.max(
              0,
              Math.min(assignment.submittedCount, assignment.totalStudents),
            );

            return (
              <button
                key={assignment.id}
                type="button"
                onClick={() => handleAssignmentClick(assignment)}
                className={`flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-[#F9FAFB] ${
                  index < visibleAssignments.length - 1
                    ? "border-b border-[#E5E7EB]"
                    : ""
                }`}
              >
                <div className="w-24 shrink-0">
                  {isPastDue ? (
                    <Badge className="border border-rose-200 bg-rose-100 text-rose-800">
                      Past Due
                    </Badge>
                  ) : isValidDeadline ? (
                    <div className="inline-flex min-w-[80px] flex-col items-start rounded-md border border-[#E5E7EB] bg-[#FCF9F0] px-2.5 py-1.5">
                      <span className="text-xs font-semibold text-foreground">
                        {format(deadline, "MMM d")}
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {format(deadline, "h:mm a")}
                      </span>
                    </div>
                  ) : (
                    <Badge variant="outline">Scheduled</Badge>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="max-w-[400px] truncate text-[15px] font-semibold text-foreground">
                    {assignment.title}
                  </p>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {assignment.className}
                  </p>
                  {!isPastDue && isValidDeadline ? (
                    <p className="mt-1 text-xs text-muted-foreground">
                      Due{" "}
                      {formatDistanceToNowStrict(deadline, { addSuffix: true })}
                    </p>
                  ) : null}
                </div>

                <div className="ml-auto flex shrink-0 items-center gap-3">
                  {submittedCount > 0 ? (
                    <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800">
                      {submittedCount} to grade
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      0/{assignment.totalStudents} Submitted
                    </span>
                  )}

                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleAssignmentClick(assignment);
                    }}
                  >
                    Review
                  </Button>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
