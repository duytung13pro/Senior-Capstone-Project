"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  Calendar,
  FileText,
  Users,
  ArrowLeft,
  Pencil,
  Circle,
} from "lucide-react";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  name: string;
  studentIds?: string[];
};

type Assignment = {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  createdAt?: string;
  submittedCount: number;
  totalStudents: number;
};

type LessonPlanRef = {
  id: string;
  classId: string;
  title: string;
  publishedAssignmentId?: string;
};

type AssignmentSubmissionStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  submitted: boolean;
  submittedAt: string | null;
  late: boolean;
  score: number | null;
};

type AssignmentSubmissionOverview = {
  assignmentId: string;
  classId: string;
  submittedCount: number;
  totalStudents: number;
  students: AssignmentSubmissionStudent[];
};

let assignmentsBootstrapCache: {
  classes: TeacherClass[];
  assignments: Assignment[];
  lessonPlans: LessonPlanRef[];
} | null = null;

let assignmentsBootstrapPromise: Promise<{
  classes: TeacherClass[];
  assignments: Assignment[];
  lessonPlans: LessonPlanRef[];
}> | null = null;

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

export function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlanRef[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("details");
  const [error, setError] = useState<string | null>(null);

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null,
  );
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState<
    "all" | "active" | "pastDue" | "graded"
  >("all");

  const [submissionStatusFilter, setSubmissionStatusFilter] = useState<
    "all" | "pending" | "submitted"
  >("all");
  const [submissionOverview, setSubmissionOverview] =
    useState<AssignmentSubmissionOverview | null>(null);
  const [submissionOverviewLoading, setSubmissionOverviewLoading] =
    useState(false);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      if (!isCancelled) {
        setLoading(true);
        setError(null);
      }

      try {
        if (assignmentsBootstrapCache) {
          if (!isCancelled) {
            setClasses(assignmentsBootstrapCache.classes);
            setAssignments(assignmentsBootstrapCache.assignments);
            setLessonPlans(assignmentsBootstrapCache.lessonPlans);
          }
          return;
        }

        if (!assignmentsBootstrapPromise) {
          assignmentsBootstrapPromise = (async () => {
            const localTeacherId = localStorage.getItem("userId") || "";
            const localTeacherEmail = localStorage.getItem("userEmail") || "";

            if (!localTeacherId && !localTeacherEmail) {
              throw new Error("Missing teacher identity");
            }

            const queryParams = new URLSearchParams();
            if (localTeacherId) {
              queryParams.set("teacherId", localTeacherId);
            }
            if (localTeacherEmail) {
              queryParams.set("teacherEmail", localTeacherEmail);
            }

            const classRes = await fetchApiFirstOk(
              `/api/classes/my?${queryParams.toString()}`,
              { cache: "no-store" },
            );

            if (!classRes.ok) {
              throw new Error("Failed to fetch classes");
            }

            const classData: TeacherClass[] = await classRes.json();

            const lessonPlansRes = localTeacherId
              ? await fetchApiFirstOk(
                  `/api/lesson-plans?teacherId=${localTeacherId}`,
                  { cache: "no-store" },
                )
              : null;
            const lessonPlansData: LessonPlanRef[] = lessonPlansRes
              ? await lessonPlansRes.json()
              : [];

            const assignmentResponses = await Promise.all(
              classData.map(async (teacherClass) => {
                const res = await fetchApiFirstOk(
                  `/api/classes/${teacherClass.id}/assignments`,
                  { cache: "no-store" },
                );
                if (!res.ok) {
                  return [];
                }
                const classAssignments = await res.json();
                return classAssignments.map((item: any) => ({
                  id: item.id,
                  classId: teacherClass.id,
                  className: teacherClass.name,
                  title: item.title ?? "Untitled",
                  description: item.description ?? "",
                  deadline: item.deadline,
                  maxScore: item.maxScore ?? 100,
                  createdAt: item.createdAt,
                  submittedCount:
                    typeof item.submittedCount === "number"
                      ? item.submittedCount
                      : 0,
                  totalStudents: teacherClass.studentIds?.length ?? 0,
                }));
              }),
            );

            const mergedAssignments = assignmentResponses
              .flat()
              .sort((a, b) => {
                return (
                  new Date(a.deadline).getTime() -
                  new Date(b.deadline).getTime()
                );
              });

            return {
              classes: classData,
              assignments: mergedAssignments,
              lessonPlans: Array.isArray(lessonPlansData)
                ? lessonPlansData.map((plan: any) => ({
                    id: String(plan.id ?? ""),
                    classId: String(plan.classId ?? ""),
                    title: String(plan.title ?? ""),
                    publishedAssignmentId:
                      typeof plan.publishedAssignmentId === "string"
                        ? plan.publishedAssignmentId
                        : undefined,
                  }))
                : [],
            };
          })();
        }

        const bootstrapped = await assignmentsBootstrapPromise;
        assignmentsBootstrapCache = bootstrapped;

        if (!isCancelled) {
          setClasses(bootstrapped.classes);
          setAssignments(bootstrapped.assignments);
          setLessonPlans(bootstrapped.lessonPlans);
        }
      } catch (fetchError) {
        console.error(fetchError);
        assignmentsBootstrapPromise = null;
        if (!isCancelled) {
          setError("Không thể tải assignments từ backend");
        }
      } finally {
        if (!isCancelled) {
          setLoading(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, []);

  useEffect(() => {
    const requestedId = searchParams.get("id");

    if (!requestedId) {
      setSelectedAssignment(null);
      return;
    }

    const isClassId = classes.some(
      (teacherClass) => teacherClass.id === requestedId,
    );

    if (isClassId) {
      setSelectedAssignment(null);
      setSelectedClassId(requestedId);
      return;
    }

    setSelectedAssignment(requestedId);
  }, [searchParams, classes]);

  useEffect(() => {
    if (!selectedAssignment) {
      return;
    }

    const selected = assignments.find(
      (assignment) => assignment.id === selectedAssignment,
    );

    if (selected?.classId) {
      setSelectedClassId(selected.classId);
    }
  }, [selectedAssignment, assignments]);

  useEffect(() => {
    const fetchSubmissionOverview = async () => {
      if (!selectedAssignment) {
        setSubmissionOverview(null);
        return;
      }

      const currentAssignment = assignments.find(
        (assignment) => assignment.id === selectedAssignment,
      );

      if (!currentAssignment) {
        setSubmissionOverview(null);
        return;
      }

      setSubmissionOverviewLoading(true);
      try {
        const res = await fetchApiFirstOk(
          `/api/classes/${currentAssignment.classId}/assignments/${currentAssignment.id}/submissions`,
          { cache: "no-store" },
        );

        const overview = await res.json();
        setSubmissionOverview({
          assignmentId: String(overview.assignmentId ?? currentAssignment.id),
          classId: String(overview.classId ?? currentAssignment.classId),
          submittedCount:
            typeof overview.submittedCount === "number"
              ? overview.submittedCount
              : 0,
          totalStudents:
            typeof overview.totalStudents === "number"
              ? overview.totalStudents
              : 0,
          students: Array.isArray(overview.students)
            ? overview.students.map((student: any) => ({
                studentId: String(student.studentId ?? ""),
                firstName: String(student.firstName ?? ""),
                lastName: String(student.lastName ?? ""),
                email: String(student.email ?? ""),
                submitted: Boolean(student.submitted),
                submittedAt:
                  typeof student.submittedAt === "string" &&
                  student.submittedAt.length > 0
                    ? student.submittedAt
                    : null,
                late: Boolean(student.late),
                score:
                  typeof student.score === "number" &&
                  Number.isFinite(student.score)
                    ? student.score
                    : null,
              }))
            : [],
        });
      } catch (overviewError) {
        console.error(overviewError);
        setSubmissionOverview(null);
      } finally {
        setSubmissionOverviewLoading(false);
      }
    };

    fetchSubmissionOverview();
  }, [selectedAssignment, assignments]);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const classMatch =
        !selectedClassId || assignment.classId === selectedClassId;
      const searchMatch =
        searchQuery === "" ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase());

      const { safeSubmitted, safeTotal } = normalizeSubmissionCount(
        assignment.submittedCount,
        assignment.totalStudents,
      );
      const isPastDue = getStatus(assignment.deadline) === "Past Due";
      const isActive = !isPastDue;
      const isGraded = safeTotal > 0 && safeSubmitted === safeTotal;
      const statusMatch =
        assignmentStatusFilter === "all" ||
        (assignmentStatusFilter === "active" && isActive) ||
        (assignmentStatusFilter === "pastDue" && isPastDue) ||
        (assignmentStatusFilter === "graded" && isGraded);

      return classMatch && searchMatch && statusMatch;
    });
  }, [assignments, assignmentStatusFilter, searchQuery, selectedClassId]);

  const classDirectory = useMemo(() => {
    return classes
      .map((teacherClass) => {
        const classAssignments = assignments.filter(
          (assignment) => assignment.classId === teacherClass.id,
        );

        const activeAssignments = classAssignments.filter(
          (assignment) => getStatus(assignment.deadline) !== "Past Due",
        ).length;

        const needsGrading = classAssignments.reduce((total, assignment) => {
          const { safeSubmitted } = normalizeSubmissionCount(
            assignment.submittedCount,
            assignment.totalStudents,
          );
          return total + safeSubmitted;
        }, 0);

        return {
          id: teacherClass.id,
          name: teacherClass.name,
          activeAssignments,
          needsGrading,
          totalAssignments: classAssignments.length,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [assignments, classes]);

  const selectedAssignmentData = assignments.find(
    (assignment) => assignment.id === selectedAssignment,
  );
  const selectedClassName =
    classes.find((item) => item.id === selectedClassId)?.name ||
    "Unknown class";

  const selectedClassInsights = useMemo(() => {
    if (!selectedClassId) {
      return { active: 0, needsGrading: 0, completed: 0 };
    }

    return assignments
      .filter((assignment) => assignment.classId === selectedClassId)
      .reduce(
        (acc, assignment) => {
          const status = getStatus(assignment.deadline);
          if (status !== "Past Due") {
            acc.active += 1;
          }

          const { safeSubmitted, safeTotal } = normalizeSubmissionCount(
            assignment.submittedCount,
            assignment.totalStudents,
          );

          if (safeSubmitted > 0 && safeSubmitted < safeTotal) {
            acc.needsGrading += 1;
          }

          if (safeTotal > 0 && safeSubmitted === safeTotal) {
            acc.completed += 1;
          }

          return acc;
        },
        { active: 0, needsGrading: 0, completed: 0 },
      );
  }, [assignments, selectedClassId]);

  const lessonPlanIdByAssignmentId = useMemo(() => {
    const mapping = new Map<string, string>();

    lessonPlans.forEach((plan) => {
      if (plan.publishedAssignmentId) {
        mapping.set(plan.publishedAssignmentId, plan.id);
      }
    });

    assignments.forEach((assignment) => {
      if (mapping.has(assignment.id)) {
        return;
      }

      const matched = lessonPlans.find(
        (plan) =>
          plan.classId === assignment.classId &&
          plan.title.trim().toLowerCase() ===
            assignment.title.trim().toLowerCase(),
      );

      if (matched) {
        mapping.set(assignment.id, matched.id);
      }
    });

    return mapping;
  }, [assignments, lessonPlans]);

  function normalizeSubmissionCount(
    submittedCount: number,
    totalStudents: number,
  ) {
    const safeTotal = Math.max(
      0,
      Number.isFinite(totalStudents) ? totalStudents : 0,
    );
    const safeSubmitted = Math.max(
      0,
      Math.min(safeTotal, Number.isFinite(submittedCount) ? submittedCount : 0),
    );

    return { safeSubmitted, safeTotal };
  }

  const selectedSubmission = selectedAssignmentData
    ? normalizeSubmissionCount(
        submissionOverview?.submittedCount ??
          selectedAssignmentData.submittedCount,
        submissionOverview?.totalStudents ??
          selectedAssignmentData.totalStudents,
      )
    : { safeSubmitted: 0, safeTotal: 0 };
  const sortedSubmissionStudents = useMemo(() => {
    if (!submissionOverview?.students?.length) {
      return [];
    }

    const getStudentName = (student: AssignmentSubmissionStudent) =>
      `${student.firstName} ${student.lastName}`.trim() ||
      student.email ||
      "Student";

    return [...submissionOverview.students].sort((left, right) => {
      if (left.submitted !== right.submitted) {
        return left.submitted ? 1 : -1;
      }

      if (left.submitted && right.submitted) {
        const leftTime = left.submittedAt
          ? new Date(left.submittedAt).getTime()
          : 0;
        const rightTime = right.submittedAt
          ? new Date(right.submittedAt).getTime()
          : 0;
        if (leftTime !== rightTime) {
          return rightTime - leftTime;
        }
      }

      return getStudentName(left).localeCompare(
        getStudentName(right),
        undefined,
        {
          sensitivity: "base",
        },
      );
    });
  }, [submissionOverview]);
  const filteredSubmissionStudents = useMemo(() => {
    if (submissionStatusFilter === "pending") {
      return sortedSubmissionStudents.filter((student) => !student.submitted);
    }

    if (submissionStatusFilter === "submitted") {
      return sortedSubmissionStudents.filter((student) => student.submitted);
    }

    return sortedSubmissionStudents;
  }, [sortedSubmissionStudents, submissionStatusFilter]);
  const pendingSubmissionCount =
    selectedSubmission.safeTotal - selectedSubmission.safeSubmitted;

  const handleAssignmentClick = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    router.push(`/dashboard/teacher/assignments?id=${assignmentId}`, {
      scroll: false,
    });
  };

  const handleOpenGradingDashboard = (assignment: Assignment) => {
    const query = new URLSearchParams({
      id: assignment.id,
      classId: assignment.classId,
    });

    router.push(`/dashboard/teacher/assignments/grading?${query.toString()}`, {
      scroll: false,
    });
  };

  const handleEditLessonPlan = (assignment: Assignment) => {
    const lessonPlanId = lessonPlanIdByAssignmentId.get(assignment.id);
    if (lessonPlanId) {
      router.push(`/dashboard/teacher/lesson-plans/${lessonPlanId}?mode=edit`);
      return;
    }

    router.push(`/dashboard/teacher/lesson-plans?id=${assignment.classId}`);
  };

  if (loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  return (
    <div className="flex flex-col gap-4 rounded-lg bg-background p-4 md:p-5">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {selectedAssignment ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAssignment(null);
                  const query = selectedClassId ? `?id=${selectedClassId}` : "";
                  router.push(`/dashboard/teacher/assignments${query}`, {
                    scroll: false,
                  });
                }}
              >
                Back to Assignments
              </Button>
              <h2 className="text-2xl font-bold">
                {selectedAssignmentData?.title}
              </h2>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Class:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData?.className}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Deadline:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData
                        ? format(
                            new Date(selectedAssignmentData.deadline),
                            "PPpp",
                          )
                        : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Max Score:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData?.maxScore ?? "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Time left:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData
                        ? formatDistanceToNowStrict(
                            new Date(selectedAssignmentData.deadline),
                            {
                              addSuffix: true,
                            },
                          )
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Assignment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="flex-1">
                      <Users className="mr-2 h-4 w-4" />
                      Submissions
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    <h3 className="mb-2 text-lg font-medium">Description</h3>
                    <p className="whitespace-pre-line text-sm text-muted-foreground">
                      {selectedAssignmentData?.description || "No description"}
                    </p>
                  </TabsContent>

                  <TabsContent value="submissions" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Submitted</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold">
                            {selectedSubmission.safeSubmitted}/
                            {selectedSubmission.safeTotal}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Pending</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold">
                            {pendingSubmissionCount}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Completion</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-2xl font-semibold">
                            {selectedSubmission.safeTotal === 0
                              ? "0%"
                              : `${Math.round(
                                  (selectedSubmission.safeSubmitted /
                                    selectedSubmission.safeTotal) *
                                    100,
                                )}%`}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                    <div className="mt-4">
                      <Card>
                        <CardHeader>
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <CardTitle className="text-base">
                              Student Submission Status
                            </CardTitle>
                            <Select
                              value={submissionStatusFilter}
                              onValueChange={(
                                value: "all" | "pending" | "submitted",
                              ) => setSubmissionStatusFilter(value)}
                            >
                              <SelectTrigger className="w-full sm:w-[170px]">
                                <SelectValue placeholder="Filter status" />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="all">All</SelectItem>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="submitted">
                                  Submitted
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {submissionOverviewLoading ? (
                            <p className="text-sm text-muted-foreground">
                              Loading submission details...
                            </p>
                          ) : filteredSubmissionStudents.length ? (
                            <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                              {filteredSubmissionStudents.map((student) => {
                                const fullName =
                                  `${student.firstName} ${student.lastName}`.trim() ||
                                  student.email ||
                                  "Student";

                                return (
                                  <div
                                    key={
                                      student.studentId ||
                                      student.email ||
                                      fullName
                                    }
                                    className="flex items-center justify-between gap-3 rounded-md border p-3"
                                  >
                                    <div className="min-w-0">
                                      <p className="truncate font-medium">
                                        {fullName}
                                      </p>
                                      <p className="truncate text-xs text-muted-foreground">
                                        {student.email || "No email"}
                                      </p>
                                    </div>
                                    <div className="text-right">
                                      {student.submitted ? (
                                        <>
                                          <Badge>Submitted</Badge>
                                          <p className="mt-1 text-xs text-muted-foreground">
                                            {student.submittedAt
                                              ? format(
                                                  new Date(student.submittedAt),
                                                  "PPpp",
                                                )
                                              : "Submitted"}
                                          </p>
                                          <p className="text-xs text-muted-foreground">
                                            {student.score === null
                                              ? "Not graded"
                                              : `Score: ${student.score}`}
                                            {student.late ? " • Late" : ""}
                                          </p>
                                        </>
                                      ) : (
                                        <Badge variant="outline">Pending</Badge>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No student submission data available yet.
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  <TabsContent value="schedule" className="mt-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Deadline</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">
                            {selectedAssignmentData
                              ? format(
                                  new Date(selectedAssignmentData.deadline),
                                  "PPpp",
                                )
                              : "-"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Created</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">
                            {selectedAssignmentData?.createdAt
                              ? format(
                                  new Date(selectedAssignmentData.createdAt),
                                  "PPpp",
                                )
                              : "Không có dữ liệu"}
                          </p>
                        </CardContent>
                      </Card>
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm">Time Status</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm font-medium">
                            {selectedAssignmentData
                              ? formatDistanceToNowStrict(
                                  new Date(selectedAssignmentData.deadline),
                                  {
                                    addSuffix: true,
                                  },
                                )
                              : "-"}
                          </p>
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : selectedClassId ? (
        <div className="space-y-4">
          <div className="rounded-md border border-border bg-card p-3 shadow-sm">
            <div className="space-y-3">
              <div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 px-1 text-sm text-muted-foreground hover:text-foreground"
                  onClick={() => {
                    setSelectedClassId(null);
                    setSearchQuery("");
                    setAssignmentStatusFilter("all");
                    router.push("/dashboard/teacher/assignments", {
                      scroll: false,
                    });
                  }}
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back to All Classes
                </Button>
                <h2 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
                  {selectedClassName}
                </h2>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-border bg-card">
                  Active Assignments: {selectedClassInsights.active}
                </Badge>
                <Badge
                  className={
                    selectedClassInsights.needsGrading > 0
                      ? "border-transparent bg-orange-100 text-orange-700"
                      : "border-border bg-card text-muted-foreground"
                  }
                >
                  Needs Grading: {selectedClassInsights.needsGrading}
                </Badge>
                <Badge variant="outline" className="border-border bg-card">
                  Completed: {selectedClassInsights.completed}
                </Badge>
              </div>
            </div>
          </div>

          <Tabs
            value={assignmentStatusFilter}
            onValueChange={(value) =>
              setAssignmentStatusFilter(
                value as "all" | "active" | "pastDue" | "graded",
              )
            }
            className="space-y-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="pastDue">Past Due</TabsTrigger>
                <TabsTrigger value="graded">Graded</TabsTrigger>
              </TabsList>

              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assignments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
          </Tabs>

          <div className="space-y-3">
            {filteredAssignments.length === 0 ? (
              <div className="rounded-md border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                No assignments found.
              </div>
            ) : (
              filteredAssignments.map((assignment) => {
                const { safeSubmitted, safeTotal } = normalizeSubmissionCount(
                  assignment.submittedCount,
                  assignment.totalStudents,
                );

                const status = getStatus(assignment.deadline);
                const progressPercent =
                  safeTotal === 0
                    ? 0
                    : Math.round((safeSubmitted / safeTotal) * 100);

                const statusBadgeClass =
                  status === "Past Due"
                    ? "border-transparent bg-red-100 text-red-700"
                    : "border-transparent bg-green-100 text-green-700";

                const submissionBadgeClass =
                  safeSubmitted === 0
                    ? "border-transparent bg-muted text-muted-foreground"
                    : safeSubmitted >= safeTotal && safeTotal > 0
                      ? "border-transparent bg-green-100 text-green-700"
                      : "border-transparent bg-orange-100 text-orange-700";

                return (
                  <div
                    key={assignment.id}
                    role="button"
                    tabIndex={0}
                    className="rounded-md border border-[rgba(0,0,0,0.05)] bg-white p-4 shadow-[0_2px_4px_rgba(0,0,0,0.05)] transition-all duration-200 hover:-translate-y-[1px] cursor-pointer"
                    onClick={() => handleAssignmentClick(assignment.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        handleAssignmentClick(assignment.id);
                      }
                    }}
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                      <div className="flex min-w-0 flex-1 items-start gap-4">
                        <Badge className={statusBadgeClass}>
                          <Circle className="mr-1.5 h-2.5 w-2.5 fill-current" />
                          {status === "Past Due" ? "Past Due" : "Active"}
                        </Badge>

                        <div className="min-w-0 flex-1">
                          <p
                            className="truncate text-base font-semibold text-foreground"
                            title={assignment.title}
                          >
                            {assignment.title}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            Deadline:{" "}
                            {format(
                              new Date(assignment.deadline),
                              "MMM d, yyyy 'at' h:mm a",
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="w-full lg:w-[230px]">
                        <div className="mb-2 flex items-center justify-between text-xs text-muted-foreground">
                          <span>Submissions</span>
                          <Badge className={submissionBadgeClass}>
                            {safeSubmitted}/{safeTotal}
                          </Badge>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-green-600 transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                      </div>

                      <div className="flex items-center gap-2 lg:justify-end">
                        <Button
                          className="bg-green-600 text-white hover:bg-green-700"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleOpenGradingDashboard(assignment);
                          }}
                        >
                          View Submissions
                        </Button>
                        <Button
                          variant="outline"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleEditLessonPlan(assignment);
                          }}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit Lesson Plan
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))] gap-4">
          {classDirectory.map((classItem) => (
            <Card
              key={classItem.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setSelectedClassId(classItem.id);
                setSearchQuery("");
                setAssignmentStatusFilter("all");
                router.push(
                  `/dashboard/teacher/assignments?id=${classItem.id}`,
                  {
                    scroll: false,
                  },
                );
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedClassId(classItem.id);
                  setSearchQuery("");
                  setAssignmentStatusFilter("all");
                  router.push(
                    `/dashboard/teacher/assignments?id=${classItem.id}`,
                    {
                      scroll: false,
                    },
                  );
                }
              }}
              className="cursor-pointer border border-border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader>
                <CardTitle className="text-lg leading-tight">
                  {classItem.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Active Assignments
                  </span>
                  <Badge variant="outline">
                    {classItem.activeAssignments} Active
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Needs Grading
                  </span>
                  <Badge
                    className={
                      classItem.needsGrading > 0
                        ? "border-transparent bg-orange-100 text-orange-700"
                        : "border-transparent bg-muted text-muted-foreground"
                    }
                  >
                    {classItem.needsGrading} submissions to review
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {classItem.totalAssignments} total assignments
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
