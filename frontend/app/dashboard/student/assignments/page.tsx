"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Search,
  FileText,
  Upload,
  Clock,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Paperclip,
  Send,
  Eye,
} from "lucide-react";
import { fetchApiFirstOk } from "@/lib/api";

type AssignmentStatus = "pending" | "submitted" | "graded" | "late";

type StudentAssignment = {
  id: string;
  title: string;
  course: string;
  courseId: string;
  type: "homework" | "quiz" | "essay" | "project";
  description: string;
  dueDate: string;
  totalPoints: number;
  status: AssignmentStatus;
  submittedAt: string | null;
  grade: number | null;
  feedback: string | null;
  bucket: "todo" | "completed";
};

type EnrolledClass = {
  id?: string;
  name?: string;
};

type AssignmentApiItem = {
  id?: string;
  title?: string;
  description?: string;
  deadline?: string;
  maxScore?: number;
};

type AssignmentSubmissionOverview = {
  students?: Array<{
    studentId?: string;
    submitted?: boolean;
    submittedAt?: string;
    late?: boolean;
    score?: number | null;
  }>;
};

type SubmitAssignmentResponse = {
  submitted?: boolean;
  submittedAt?: string;
  late?: boolean;
};

const LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX =
  "This assignment was published from a lesson plan.";

const inferAssignmentType = (
  title: string,
  description: string,
): StudentAssignment["type"] => {
  const merged = `${title} ${description}`.toLowerCase();
  if (merged.includes("quiz") || merged.includes("trắc nghiệm")) {
    return "quiz";
  }
  if (merged.includes("essay") || merged.includes("bài luận")) {
    return "essay";
  }
  if (
    merged.includes("project") ||
    merged.includes("portfolio") ||
    merged.includes("record")
  ) {
    return "project";
  }
  return "homework";
};

const statusColors = {
  pending:
    "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  submitted: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  graded:
    "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  late: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const typeIcons = {
  homework: FileText,
  quiz: AlertCircle,
  essay: FileText,
  project: Paperclip,
};

export default function StudentAssignmentsPage() {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [courseFilter, setCourseFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("todo");
  const [assignments, setAssignments] = useState<StudentAssignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedAssignment, setSelectedAssignment] =
    useState<StudentAssignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");

  const resolveStudentId = async () => {
    const stored = localStorage.getItem("userId") || "";
    if (stored) {
      return stored;
    }

    try {
      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        return "";
      }

      const sessionData = await sessionRes.json();
      const sessionStudentId = String(sessionData?.user?.id || "");
      if (sessionStudentId) {
        localStorage.setItem("userId", sessionStudentId);
      }

      return sessionStudentId;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    const loadAssignments = async () => {
      try {
        setLoading(true);
        setError("");

        const studentId = await resolveStudentId();
        if (!studentId) {
          setError("Please log in again");
          return;
        }

        const classesRes = await fetchApiFirstOk(
          `/api/classes/enrolled?studentId=${encodeURIComponent(studentId)}`,
          { cache: "no-store" },
        );

        const classList = (await classesRes.json()) as EnrolledClass[];
        const safeClassList = Array.isArray(classList) ? classList : [];
        const now = Date.now();

        const assignmentGroups = await Promise.all(
          safeClassList.map(async (classItem) => {
            const classId = String(classItem?.id || "");
            if (!classId) {
              return [] as StudentAssignment[];
            }

            const className = String(classItem?.name || "Untitled Class");

            try {
              const assignmentRes = await fetchApiFirstOk(
                `/api/classes/${classId}/assignments`,
                { cache: "no-store" },
              );
              const assignmentRows =
                (await assignmentRes.json()) as AssignmentApiItem[];
              const safeRows = Array.isArray(assignmentRows)
                ? assignmentRows
                : [];

              const mappedRows = await Promise.all(
                safeRows.map(async (row) => {
                  const assignmentId = String(row?.id || "");
                  if (!assignmentId) {
                    return null;
                  }

                  const description = String(row?.description || "").trim();
                  if (
                    description.startsWith(LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX)
                  ) {
                    return null;
                  }

                  let studentSubmission:
                    | AssignmentSubmissionOverview["students"][number]
                    | undefined;

                  try {
                    const submissionsRes = await fetchApiFirstOk(
                      `/api/classes/${classId}/assignments/${assignmentId}/submissions`,
                      { cache: "no-store" },
                    );
                    const submissions =
                      (await submissionsRes.json()) as AssignmentSubmissionOverview;

                    studentSubmission = submissions?.students?.find(
                      (studentRow) =>
                        String(studentRow?.studentId || "") === studentId,
                    );
                  } catch {
                    studentSubmission = undefined;
                  }

                  const dueDate = String(row?.deadline || "");
                  const dueTime = dueDate ? new Date(dueDate).getTime() : NaN;
                  const hasSubmitted = Boolean(studentSubmission?.submitted);
                  const hasScore =
                    studentSubmission?.score !== null &&
                    studentSubmission?.score !== undefined;
                  const isLateSubmission = Boolean(studentSubmission?.late);

                  let status: AssignmentStatus = "pending";
                  if (hasScore) {
                    status = "graded";
                  } else if (hasSubmitted && isLateSubmission) {
                    status = "late";
                  } else if (hasSubmitted) {
                    status = "submitted";
                  } else if (!Number.isNaN(dueTime) && dueTime < now) {
                    status = "late";
                  }

                  const bucket: "todo" | "completed" =
                    hasSubmitted || hasScore ? "completed" : "todo";

                  return {
                    id: assignmentId,
                    title: String(row?.title || "Untitled Assignment"),
                    course: className,
                    courseId: classId,
                    type: inferAssignmentType(
                      String(row?.title || ""),
                      description,
                    ),
                    description: description || "No description",
                    dueDate,
                    totalPoints: Number(row?.maxScore || 100),
                    status,
                    submittedAt: studentSubmission?.submittedAt
                      ? String(studentSubmission.submittedAt)
                      : null,
                    grade: hasScore ? Number(studentSubmission?.score) : null,
                    feedback: null,
                    bucket,
                  } satisfies StudentAssignment;
                }),
              );

              return mappedRows.filter((item): item is StudentAssignment =>
                Boolean(item),
              );
            } catch {
              return [] as StudentAssignment[];
            }
          }),
        );

        const normalized = assignmentGroups.flat().sort((left, right) => {
          const leftDue = left.dueDate
            ? new Date(left.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          const rightDue = right.dueDate
            ? new Date(right.dueDate).getTime()
            : Number.MAX_SAFE_INTEGER;
          return leftDue - rightDue;
        });

        setAssignments(normalized);
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load assignments");
      } finally {
        setLoading(false);
      }
    };

    void loadAssignments();
  }, []);

  useEffect(() => {
    const assignmentIdFromQuery = String(
      searchParams.get("assignmentId") || "",
    );
    const classIdFromQuery = String(searchParams.get("classId") || "");

    if (classIdFromQuery) {
      setCourseFilter(classIdFromQuery);
    }

    if (!assignmentIdFromQuery || assignments.length === 0) {
      return;
    }

    const matched = assignments.find(
      (item) => item.id === assignmentIdFromQuery,
    );
    if (matched) {
      setSelectedAssignment(matched);
      if (matched.bucket === "completed") {
        setActiveTab("completed");
      }
    }
  }, [assignments, searchParams]);

  const todoAssignments = assignments.filter(
    (assignment) => assignment.bucket === "todo",
  );
  const completedAssignments = assignments.filter(
    (assignment) => assignment.bucket === "completed",
  );

  const activeAssignments =
    activeTab === "todo" ? todoAssignments : completedAssignments;

  const filteredAssignments = activeAssignments.filter((assignment) => {
    const matchesSearch =
      assignment.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      assignment.course.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCourse =
      courseFilter === "all" || assignment.courseId === courseFilter;
    const matchesStatus =
      statusFilter === "all" || assignment.status === statusFilter;
    return matchesSearch && matchesCourse && matchesStatus;
  });

  const pendingCount = assignments.filter((a) => a.bucket === "todo").length;
  const submittedCount = assignments.filter(
    (a) => a.status === "submitted",
  ).length;
  const gradedCount = assignments.filter((a) => a.status === "graded").length;
  const todoCount = todoAssignments.length;

  const courseOptions = Array.from(
    new Map(
      assignments.map((assignment) => [assignment.courseId, assignment.course]),
    ).entries(),
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isOverdue = (dueDate: string, status: string) => {
    return new Date(dueDate) < new Date() && status === "pending";
  };

  const activeStatusOptions =
    activeTab === "todo"
      ? [
          { value: "all", label: "All Status" },
          { value: "pending", label: "Pending" },
          { value: "late", label: "Late" },
        ]
      : [
          { value: "all", label: "All Status" },
          { value: "submitted", label: "Submitted" },
          { value: "graded", label: "Graded" },
          { value: "late", label: "Late" },
        ];

  const handleSubmit = () => {
    const submitAssignment = async () => {
      if (!selectedAssignment) {
        return;
      }

      const studentId = await resolveStudentId();
      if (!studentId) {
        setError("Please log in again");
        return;
      }

      try {
        setError("");
        const response = await fetchApiFirstOk(
          `/api/classes/${selectedAssignment.courseId}/assignments/${selectedAssignment.id}/submit`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ studentId }),
          },
        );

        const payload = (await response.json()) as SubmitAssignmentResponse;
        const submittedAt = payload?.submittedAt
          ? String(payload.submittedAt)
          : new Date().toISOString();
        const isLate = Boolean(payload?.late);

        setAssignments((prev) =>
          prev.map((assignment) => {
            if (assignment.id !== selectedAssignment.id) {
              return assignment;
            }

            return {
              ...assignment,
              status: isLate ? "late" : "submitted",
              submittedAt,
              bucket: "completed",
            };
          }),
        );

        setSelectedAssignment((prev) =>
          prev
            ? {
                ...prev,
                status: isLate ? "late" : "submitted",
                submittedAt,
                bucket: "completed",
              }
            : prev,
        );

        setActiveTab("completed");
        setSubmissionContent("");
      } catch (submitError) {
        console.error(submitError);
        setError("Unable to submit assignment");
      }
    };

    void submitAssignment();
  };

  if (loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <p className="text-muted-foreground">
          View and submit your assignments
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-500" />
              Pending
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingCount}</div>
            <p className="text-xs text-muted-foreground">
              assignments to complete
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-blue-500" />
              Submitted
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submittedCount}</div>
            <p className="text-xs text-muted-foreground">awaiting grading</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              Graded
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradedCount}</div>
            <p className="text-xs text-muted-foreground">assignments graded</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-6 border-b">
        <button
          type="button"
          onClick={() => {
            setActiveTab("todo");
            setStatusFilter("all");
          }}
          className={`pb-2 transition-colors ${
            activeTab === "todo"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          To-Do ({todoCount})
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("completed");
            setStatusFilter("all");
          }}
          className={`pb-2 transition-colors ${
            activeTab === "completed"
              ? "text-primary border-b-2 border-primary font-semibold"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Completed
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search assignments..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Courses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {courseOptions.map(([courseId, courseName]) => (
              <SelectItem key={courseId} value={courseId}>
                {courseName}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            {activeStatusOptions.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Assignment List */}
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <div className="space-y-4">
        {filteredAssignments.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">
                {activeTab === "todo"
                  ? "No to-do assignments found"
                  : "No completed assignments found"}
              </h3>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAssignments.map((assignment) => {
            const Icon =
              typeIcons[assignment.type as keyof typeof typeIcons] || FileText;
            const overdue = isOverdue(assignment.dueDate, assignment.status);
            const statusLabel = overdue
              ? "Overdue"
              : assignment.status.charAt(0).toUpperCase() +
                assignment.status.slice(1);
            const statusClassName = overdue
              ? "bg-red-100 text-red-700"
              : statusColors[assignment.status as keyof typeof statusColors];
            const ctaLabel =
              activeTab === "todo"
                ? assignment.status === "late"
                  ? "Resume Assignment"
                  : "Start Assignment"
                : assignment.status === "graded"
                  ? "View Feedback"
                  : "View Submission";

            return (
              <Card
                key={assignment.id}
                className={`cursor-pointer hover:shadow-md transition-shadow ${
                  overdue
                    ? "border-l-4 border-l-red-500 border-y border-r border-gray-200"
                    : ""
                }`}
                onClick={() => setSelectedAssignment(assignment)}
              >
                <CardContent className="p-4">
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <div
                        className={`h-12 w-12 rounded-lg flex items-center justify-center ${
                          assignment.type === "quiz"
                            ? "bg-orange-100 text-orange-600 dark:bg-orange-900/30"
                            : assignment.type === "project"
                              ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30"
                              : assignment.type === "essay"
                                ? "bg-green-100 text-green-600 dark:bg-green-900/30"
                                : "bg-blue-100 text-blue-600 dark:bg-blue-900/30"
                        }`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className="font-medium">{assignment.title}</h3>
                            <p className="text-sm text-muted-foreground">
                              {assignment.course}
                            </p>
                          </div>
                          <Badge className={statusClassName}>
                            {statusLabel}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {assignment.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 mt-3">
                          <span className="text-sm flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            Due: {formatDate(assignment.dueDate)}
                          </span>
                          <span className="text-sm">
                            {assignment.totalPoints} points
                          </span>
                          {assignment.grade !== null && (
                            <span className="text-sm font-medium text-green-600">
                              Score: {assignment.grade}/{assignment.totalPoints}
                            </span>
                          )}
                        </div>
                        {overdue && (
                          <p className="text-sm text-red-500 mt-2 flex items-center gap-1">
                            <AlertCircle className="h-4 w-4" />
                            This assignment is overdue!
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex justify-end lg:justify-start lg:pl-4 lg:min-w-[180px]">
                      <Button
                        type="button"
                        variant={activeTab === "todo" ? "default" : "outline"}
                        className={
                          activeTab === "todo"
                            ? "bg-green-600 hover:bg-green-700 text-white"
                            : ""
                        }
                        onClick={(event) => {
                          event.stopPropagation();
                          setSelectedAssignment(assignment);
                        }}
                      >
                        {ctaLabel}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Assignment Detail Dialog */}
      <Dialog
        open={!!selectedAssignment}
        onOpenChange={() => setSelectedAssignment(null)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedAssignment && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <DialogTitle>{selectedAssignment.title}</DialogTitle>
                    <DialogDescription>
                      {selectedAssignment.course}
                    </DialogDescription>
                  </div>
                  <Badge
                    className={
                      statusColors[
                        selectedAssignment.status as keyof typeof statusColors
                      ]
                    }
                  >
                    {selectedAssignment.status.charAt(0).toUpperCase() +
                      selectedAssignment.status.slice(1)}
                  </Badge>
                </div>
              </DialogHeader>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Due Date:</span>
                    <p className="font-medium">
                      {formatDate(selectedAssignment.dueDate)}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Points:</span>
                    <p className="font-medium">
                      {selectedAssignment.totalPoints}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Type:</span>
                    <p className="font-medium capitalize">
                      {selectedAssignment.type}
                    </p>
                  </div>
                  {selectedAssignment.submittedAt && (
                    <div>
                      <span className="text-muted-foreground">Submitted:</span>
                      <p className="font-medium">
                        {formatDate(selectedAssignment.submittedAt)}
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-medium mb-2">Description</h4>
                  <p className="text-sm text-muted-foreground">
                    {selectedAssignment.description}
                  </p>
                </div>

                {selectedAssignment.grade !== null && (
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">Grade</h4>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold">
                        {selectedAssignment.grade}/
                        {selectedAssignment.totalPoints}
                      </div>
                      <div className="flex-1">
                        <Progress
                          value={
                            (selectedAssignment.grade /
                              selectedAssignment.totalPoints) *
                            100
                          }
                        />
                      </div>
                      <div className="text-lg font-medium">
                        {Math.round(
                          (selectedAssignment.grade /
                            selectedAssignment.totalPoints) *
                            100,
                        )}
                        %
                      </div>
                    </div>
                    {selectedAssignment.feedback && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium mb-1">Feedback</h5>
                        <p className="text-sm text-muted-foreground">
                          {selectedAssignment.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {selectedAssignment.bucket === "todo" && (
                  <div className="space-y-4 pt-4 border-t">
                    <h4 className="font-medium">Submit Assignment</h4>
                    <div className="space-y-2">
                      <Label htmlFor="submission">Your submission</Label>
                      <Textarea
                        id="submission"
                        placeholder="Enter your response or notes here..."
                        value={submissionContent}
                        onChange={(e) => setSubmissionContent(e.target.value)}
                        rows={4}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        className="flex items-center gap-2 bg-transparent"
                      >
                        <Upload className="h-4 w-4" />
                        Attach Files
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        className="flex items-center gap-2"
                      >
                        <Send className="h-4 w-4" />
                        Submit
                      </Button>
                    </div>
                  </div>
                )}

                {selectedAssignment.status === "submitted" && (
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      Your submission is being reviewed. You'll be notified when
                      it's graded.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
