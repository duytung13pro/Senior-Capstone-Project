"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { fetchApiFirstOk } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type AssignmentListItem = {
  id: string;
  title?: string;
  maxScore?: number;
};

type TeacherClass = {
  id: string;
};

type SubmissionStudent = {
  studentId: string;
  firstName: string;
  lastName: string;
  email: string;
  submitted: boolean;
  submittedAt: string | null;
  late: boolean;
  score: number | null;
};

export function GradingDashboardPage() {
  const router = useRouter();
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const assignmentId = searchParams.get("id");
  const classId = searchParams.get("classId");

  const [students, setStudents] = useState<SubmissionStudent[]>([]);
  const [resolvedClassId, setResolvedClassId] = useState<string | null>(
    classId,
  );
  const [assignmentTitle, setAssignmentTitle] = useState("Assignment");
  const [maxScore, setMaxScore] = useState(100);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [grade, setGrade] = useState("");
  const [teacherComments, setTeacherComments] = useState("");

  const deepLearningPlaceholder =
    "Deep learning allows models to discover layered patterns from large datasets without manually engineering every feature. In this reflection, I compared convolutional networks and transformer-style architectures for image understanding. CNNs generalized better with our limited samples, while transformer models became competitive only after stronger augmentation and regularization.";

  const backHref = useMemo(
    () =>
      assignmentId
        ? `/dashboard/teacher/assignments?id=${assignmentId}`
        : "/dashboard/teacher/assignments",
    [assignmentId],
  );

  useEffect(() => {
    setResolvedClassId(classId);
  }, [classId]);

  useEffect(() => {
    const fetchWorkspaceData = async () => {
      if (!assignmentId) {
        setLoadError("Missing assignment context.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError(null);

      try {
        let effectiveClassId = classId;

        if (!effectiveClassId) {
          const teacherId = localStorage.getItem("userId") || "";
          const teacherEmail = localStorage.getItem("userEmail") || "";

          if (!teacherId && !teacherEmail) {
            setLoadError("Missing teacher context to resolve class.");
            setLoading(false);
            return;
          }

          const classQuery = new URLSearchParams();
          if (teacherId) {
            classQuery.set("teacherId", teacherId);
          }
          if (teacherEmail) {
            classQuery.set("teacherEmail", teacherEmail);
          }

          const classesRes = await fetchApiFirstOk(
            `/api/classes/my?${classQuery.toString()}`,
            { cache: "no-store" },
          );
          const classesPayload: TeacherClass[] = await classesRes.json();

          for (const teacherClass of classesPayload) {
            if (!teacherClass?.id) {
              continue;
            }

            const classAssignmentsRes = await fetchApiFirstOk(
              `/api/classes/${teacherClass.id}/assignments`,
              { cache: "no-store" },
            );
            const classAssignments: AssignmentListItem[] =
              await classAssignmentsRes.json();

            const exists = classAssignments.some(
              (assignment) => assignment.id === assignmentId,
            );
            if (exists) {
              effectiveClassId = teacherClass.id;
              break;
            }
          }
        }

        if (!effectiveClassId) {
          setLoadError("Unable to resolve class for this assignment.");
          setLoading(false);
          return;
        }

        setResolvedClassId(effectiveClassId);

        const [assignmentsRes, submissionsRes] = await Promise.all([
          fetchApiFirstOk(`/api/classes/${effectiveClassId}/assignments`, {
            cache: "no-store",
          }),
          fetchApiFirstOk(
            `/api/classes/${effectiveClassId}/assignments/${assignmentId}/submissions`,
            { cache: "no-store" },
          ),
        ]);

        const assignmentsPayload: AssignmentListItem[] =
          await assignmentsRes.json();
        const assignment = assignmentsPayload.find(
          (item) => item.id === assignmentId,
        );

        if (assignment) {
          setAssignmentTitle(assignment.title?.trim() || "Assignment");
          setMaxScore(
            typeof assignment.maxScore === "number" && assignment.maxScore > 0
              ? assignment.maxScore
              : 100,
          );
        }

        const submissionsPayload = await submissionsRes.json();
        const parsedStudents = Array.isArray(submissionsPayload?.students)
          ? submissionsPayload.students
              .map(
                (student: any): SubmissionStudent => ({
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
                }),
              )
              .sort((left, right) => {
                if (left.submitted !== right.submitted) {
                  return left.submitted ? -1 : 1;
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

                const leftName =
                  `${left.firstName} ${left.lastName}`.trim() || left.email;
                const rightName =
                  `${right.firstName} ${right.lastName}`.trim() || right.email;
                return leftName.localeCompare(rightName, undefined, {
                  sensitivity: "base",
                });
              })
          : [];

        setStudents(parsedStudents);
        setSelectedStudentIndex(0);
      } catch (error) {
        console.error(error);
        setLoadError("Unable to load grading workspace.");
      } finally {
        setLoading(false);
      }
    };

    fetchWorkspaceData();
  }, [assignmentId, classId]);

  const currentSubmission = students[selectedStudentIndex] ?? null;

  useEffect(() => {
    if (!currentSubmission) {
      setGrade("");
      setTeacherComments("");
      return;
    }
    setGrade(
      currentSubmission.score === null ? "" : String(currentSubmission.score),
    );
    setTeacherComments("");
  }, [currentSubmission?.studentId]);

  const handleSaveGradeAndNext = async () => {
    if (!assignmentId || !resolvedClassId || !currentSubmission) {
      return;
    }

    if (!currentSubmission.submitted) {
      toast({
        title: "No submission",
        description: "This student has not submitted the assignment.",
        variant: "destructive",
      });
      return;
    }

    const parsedGrade = Number.parseInt(grade.trim(), 10);
    if (!Number.isFinite(parsedGrade)) {
      toast({
        title: "Invalid grade",
        description: `Enter a numeric grade between 0 and ${maxScore}.`,
        variant: "destructive",
      });
      return;
    }

    if (parsedGrade < 0 || parsedGrade > maxScore) {
      toast({
        title: "Invalid grade",
        description: `Grade must be between 0 and ${maxScore}.`,
        variant: "destructive",
      });
      return;
    }

    try {
      setSaving(true);

      await fetchApiFirstOk(
        `/api/classes/${resolvedClassId}/assignments/${assignmentId}/submissions/${currentSubmission.studentId}/grade`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            score: parsedGrade,
            feedback: teacherComments.trim(),
          }),
        },
      );

      setStudents((previous) =>
        previous.map((student, index) =>
          index === selectedStudentIndex
            ? { ...student, score: parsedGrade }
            : student,
        ),
      );

      const nextIndex =
        students.length <= 1
          ? selectedStudentIndex
          : (selectedStudentIndex + 1) % students.length;
      setSelectedStudentIndex(nextIndex);

      toast({
        title: "Grade saved",
        description: "Saved successfully and moved to the next student.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Save failed",
        description: "Unable to save grade right now.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const currentStudentName = currentSubmission
    ? `${currentSubmission.firstName} ${currentSubmission.lastName}`.trim() ||
      currentSubmission.email ||
      "Student"
    : "Student";

  const submissionPillLabel = currentSubmission?.submittedAt
    ? `Submitted ${format(new Date(currentSubmission.submittedAt), "MMM d, yyyy 'at' h:mm a")}`
    : "Not submitted";

  const showsFileAttachment =
    Boolean(currentSubmission?.submitted) && selectedStudentIndex % 2 === 1;

  const attachmentFileName = `${currentStudentName.replace(/\s+/g, "") || "Student"}_DeepLearningReflection.pdf`;

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-4 rounded-lg border border-[#E5E7EB] bg-[#FCF9F0] p-4 md:p-5">
      <Button
        variant="ghost"
        className="h-8 w-fit px-1"
        onClick={() => router.push(backHref)}
      >
        ← Back to Assignments
      </Button>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
        <aside className="min-h-0 rounded-lg border border-[#E5E7EB] bg-white shadow-sm">
          <div className="border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-sm font-semibold">Student Roster</h2>
            <p className="text-xs text-muted-foreground">
              Assignment {assignmentId ?? "Unknown"}
            </p>
          </div>
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
            <ul className="space-y-2">
              {students.map((submission, index) => {
                const isActive = index === selectedStudentIndex;
                const studentName =
                  `${submission.firstName} ${submission.lastName}`.trim() ||
                  submission.email ||
                  "Student";

                return (
                  <li
                    key={
                      submission.studentId || submission.email || studentName
                    }
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedStudentIndex(index)}
                      className={`w-full rounded-md border px-3 py-2 text-left transition-colors ${
                        isActive
                          ? "border-[#E5E7EB] bg-[#FCF9F0]"
                          : "border-[#E5E7EB] bg-white hover:bg-muted/40"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {studentName}
                        </span>
                        {!submission.submitted ? (
                          <Badge variant="outline" className="text-[11px]">
                            Pending
                          </Badge>
                        ) : submission.score === null ? (
                          <Badge className="text-[11px]">Submitted</Badge>
                        ) : (
                          <Badge className="text-[11px]">Graded</Badge>
                        )}
                      </div>
                    </button>
                  </li>
                );
              })}
              {!students.length ? (
                <li className="rounded-md border border-dashed border-[#E5E7EB] px-3 py-4 text-center text-xs text-muted-foreground">
                  {loading ? "Loading roster..." : "No students available."}
                </li>
              ) : null}
            </ul>
          </div>
        </aside>

        <main className="min-h-0 rounded-lg border border-[#E5E7EB] bg-white p-4 shadow-sm md:p-5">
          <div className="grid min-h-0 h-full grid-cols-1 gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
            <section className="min-h-0 space-y-4">
              <header className="rounded-lg border border-[#E5E7EB] bg-white p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h1 className="text-2xl font-bold">{currentStudentName}</h1>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {assignmentTitle}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#FCF9F0] px-3 py-1.5 text-xs font-medium text-foreground">
                    <span>{submissionPillLabel}</span>
                    <Badge
                      className={
                        currentSubmission?.submitted && !currentSubmission.late
                          ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                          : "border-rose-200 bg-rose-100 text-rose-800"
                      }
                    >
                      {currentSubmission?.submitted
                        ? currentSubmission.late
                          ? "Late"
                          : "On Time"
                        : "Missing"}
                    </Badge>
                  </div>
                </div>
              </header>

              <article className="min-h-[460px] rounded-lg border border-[#E5E7EB] bg-white p-5">
                {!currentSubmission?.submitted ? (
                  <div className="rounded-lg border border-dashed border-[#E5E7EB] bg-[#FCF9F0] p-5 text-sm text-muted-foreground">
                    This student has not submitted a response yet.
                  </div>
                ) : showsFileAttachment ? (
                  <div className="rounded-lg border border-[#E5E7EB] bg-[#FCF9F0] p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      File Attachment
                    </p>
                    <div className="mt-3 flex items-center justify-between rounded-md border border-[#E5E7EB] bg-white px-4 py-3">
                      <div>
                        <p className="text-sm font-medium">
                          {attachmentFileName}
                        </p>
                        <p className="text-xs text-muted-foreground">2.1 MB</p>
                      </div>
                      <Button variant="outline" className="h-8">
                        Preview
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      Text Submission
                    </p>
                    <p className="text-[15px] leading-7 text-foreground">
                      {deepLearningPlaceholder}
                    </p>
                  </div>
                )}
              </article>
            </section>

            <aside className="rounded-lg border border-[#E5E7EB] bg-white p-4 xl:sticky xl:top-4 xl:h-fit">
              <h2 className="text-sm font-semibold">Grading Panel</h2>

              <div className="mt-4 space-y-2">
                <p className="text-sm font-medium">Grade Input</p>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    value={grade}
                    onChange={(event) => setGrade(event.target.value)}
                    className="h-14 w-28 border-[#E5E7EB] bg-white text-center text-2xl font-semibold"
                    placeholder="0"
                    min="0"
                    max={String(maxScore)}
                  />
                  <span className="text-sm text-muted-foreground">
                    / {maxScore} points
                  </span>
                </div>
              </div>

              <div className="mt-5 space-y-2">
                <p className="text-sm font-medium">Teacher Comments</p>
                <Textarea
                  value={teacherComments}
                  onChange={(event) => setTeacherComments(event.target.value)}
                  placeholder="Add feedback for this student..."
                  className="min-h-[190px] resize-none border-[#E5E7EB] bg-white"
                />
              </div>

              <Button
                className="mt-5 h-10 w-full bg-emerald-600 text-white hover:bg-emerald-700"
                onClick={handleSaveGradeAndNext}
                disabled={saving || loading || !currentSubmission}
              >
                {saving ? "Saving..." : "Save Grade"}
              </Button>

              {loadError ? (
                <p className="mt-3 text-xs text-destructive">{loadError}</p>
              ) : null}
            </aside>
          </div>
        </main>
      </div>
    </div>
  );
}
