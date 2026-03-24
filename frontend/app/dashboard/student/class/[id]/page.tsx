"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CalendarDays,
  Link2,
  Megaphone,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApiFirstOk } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description?: string;
  room?: string;
  teacherId?: string;
  teacher?: {
    name?: string;
  };
  resources?: ResourceItem[];
};

type TeacherProfile = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type AssignmentItem = {
  id: string;
  title: string;
  dueLabel: string;
  isUrgent: boolean;
};

type AssignmentApiItem = {
  id?: string;
  title?: string;
  description?: string;
  deadline?: string;
  createdAt?: string;
};

type AssignmentSubmissionOverview = {
  students?: Array<{
    studentId?: string;
    submitted?: boolean;
  }>;
};

type AnnouncementItem = {
  id?: string;
  title?: string;
  content?: string;
  message?: string;
  createdAt?: string;
  date?: string;
};

type LessonPlanItem = {
  id?: string;
  classId?: string;
  title?: string;
  status?: string;
  objectives?: string;
  activities?: string;
  materials?: string;
  date?: string;
};

const LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX =
  "This assignment was published from a lesson plan.";
const DROP_CLASS_CONFIRM_TOKEN = "drop-this-class";

type ResourceItem = {
  id?: string;
  title?: string;
  label?: string;
  name?: string;
  url?: string;
  href?: string;
  link?: string;
};

const stripLessonText = (raw?: string) =>
  String(raw || "")
    .replace(/<[^>]*>/g, " ")
    .replace(
      /Learning Objectives:|Standards Alignment:|Lesson Arc \(Gradual Release\):|Differentiation & Accessibility:|Hook \/ Warm-Up \([^)]*\):|Direct Instruction \/ I Do \([^)]*\):|Guided Practice \/ We Do \([^)]*\):|Independent Practice \/ You Do \([^)]*\):|Closure & Assessment \([^)]*\):|Total Arc Minutes:[^\n]*|Accommodations:|Extensions:|ELL Support:/gi,
      " ",
    )
    .replace(/\s+/g, " ")
    .trim();

const parseListText = (raw?: string) =>
  String(raw || "")
    .split(/\n|;|\|/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatDueLabel = (iso?: string) => {
  if (!iso) {
    return "No due date";
  }

  const due = new Date(iso);
  if (Number.isNaN(due.getTime())) {
    return "No due date";
  }

  return `Due ${due.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })}`;
};

const isUrgentDeadline = (iso?: string) => {
  if (!iso) {
    return false;
  }

  const due = new Date(iso).getTime();
  if (Number.isNaN(due)) {
    return false;
  }

  const now = Date.now();
  const twoDays = 48 * 60 * 60 * 1000;
  return due <= now + twoDays;
};

const getResourceHref = (resource: ResourceItem, classId: string) =>
  resource.url ||
  resource.href ||
  resource.link ||
  `/dashboard/student/resources?classId=${encodeURIComponent(classId)}`;

export default function StudentClassDashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const classId = String(params.id || "");

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [teacherName, setTeacherName] = useState("Teacher");
  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(
    null,
  );
  const [currentLesson, setCurrentLesson] = useState<LessonPlanItem | null>(
    null,
  );
  const [assignments, setAssignments] = useState<AssignmentItem[]>([]);
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isDropModalOpen, setIsDropModalOpen] = useState(false);
  const [dropConfirmationText, setDropConfirmationText] = useState("");
  const [isDroppingClass, setIsDroppingClass] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
    if (!classId) {
      return;
    }

    const safeFetchJson = async <T,>(path: string): Promise<T | null> => {
      try {
        const response = await fetchApiFirstOk(path, { cache: "no-store" });
        return (await response.json()) as T;
      } catch {
        return null;
      }
    };

    const loadDashboard = async () => {
      try {
        setLoading(true);
        setError("");

        const classRes = await fetchApiFirstOk(`/api/classes/${classId}`, {
          cache: "no-store",
        });
        const classPayload: ClassItem = await classRes.json();
        setClassData(classPayload);

        const studentIdPromise = resolveStudentId();
        const announcementsPromise = safeFetchJson<
          AnnouncementItem[] | { items?: AnnouncementItem[] }
        >(`/api/classes/${classId}/announcements`);
        const resourcesPromise = safeFetchJson<ResourceItem[]>(
          `/api/classes/${classId}/resources`,
        );

        let resolvedTeacherName = classPayload?.teacher?.name?.trim() || "";

        if (classPayload.teacherId) {
          try {
            const teacherRes = await fetchApiFirstOk(
              `/api/users/${classPayload.teacherId}`,
              { cache: "no-store" },
            );
            const teacherPayload: TeacherProfile = await teacherRes.json();

            const fullName =
              `${teacherPayload.firstName || ""} ${teacherPayload.lastName || ""}`.trim();
            if (fullName) {
              resolvedTeacherName = fullName;
            } else if (teacherPayload.email) {
              resolvedTeacherName = teacherPayload.email;
            }
          } catch {
            // keep fallback name
          }
        }

        setTeacherName(resolvedTeacherName || "Teacher");

        const latestLesson = await safeFetchJson<LessonPlanItem>(
          `/api/lesson-plans/class/${classId}/latest`,
        );

        setCurrentLesson(latestLesson || null);

        const assignmentsRaw =
          (await safeFetchJson<AssignmentApiItem[]>(
            `/api/classes/${classId}/assignments`,
          )) || [];

        const studentId = await studentIdPromise;

        const pendingAssignments = await Promise.all(
          assignmentsRaw.map(async (assignment) => {
            const assignmentId = String(assignment?.id || "");
            if (!assignmentId) {
              return null;
            }

            const description = String(assignment?.description || "").trim();
            if (description.startsWith(LEGACY_LESSON_PLAN_ASSIGNMENT_PREFIX)) {
              return null;
            }

            let isSubmitted = false;
            if (studentId) {
              const submissions =
                await safeFetchJson<AssignmentSubmissionOverview>(
                  `/api/classes/${classId}/assignments/${assignmentId}/submissions`,
                );

              const studentSubmission = submissions?.students?.find(
                (row) => String(row?.studentId || "") === studentId,
              );
              isSubmitted = Boolean(studentSubmission?.submitted);
            }

            if (isSubmitted) {
              return null;
            }

            return {
              id: assignmentId,
              title: String(assignment?.title || "Untitled Assignment"),
              dueLabel: formatDueLabel(assignment?.deadline),
              isUrgent: isUrgentDeadline(assignment?.deadline),
            } satisfies AssignmentItem;
          }),
        );

        setAssignments(
          pendingAssignments.filter((item): item is AssignmentItem =>
            Boolean(item),
          ),
        );

        const announcementsRaw = await announcementsPromise;
        const announcementsList = Array.isArray(announcementsRaw)
          ? announcementsRaw
          : announcementsRaw?.items || [];

        const latestAnnouncement = [...announcementsList]
          .sort((a, b) => {
            const left = new Date(
              String(a?.createdAt || a?.date || 0),
            ).getTime();
            const right = new Date(
              String(b?.createdAt || b?.date || 0),
            ).getTime();
            return right - left;
          })
          .at(0);

        setAnnouncement(latestAnnouncement || null);

        const resourceData = await resourcesPromise;
        if (Array.isArray(resourceData) && resourceData.length > 0) {
          setResources(resourceData);
        } else if (Array.isArray(classPayload.resources)) {
          setResources(classPayload.resources);
        } else {
          setResources([]);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Unable to load class dashboard");
      } finally {
        setLoading(false);
      }
    };

    void loadDashboard();
  }, [classId]);

  const handleDropClass = async () => {
    const studentId = await resolveStudentId();

    if (!studentId) {
      toast({
        variant: "destructive",
        title: "Unable to drop class",
        description: "Please log in again and try one more time.",
      });
      return;
    }

    try {
      setIsDroppingClass(true);

      await fetchApiFirstOk(`/api/classes/${classId}/drop`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          classId,
          studentId,
        }),
      });

      setIsDropModalOpen(false);
      setDropConfirmationText("");
      localStorage.setItem("studentClassesUpdatedAt", String(Date.now()));
      window.dispatchEvent(new Event("student-classes-updated"));

      toast({
        title: "You have successfully dropped the class",
      });

      router.push("/dashboard/student/my-classes");
    } catch (dropError) {
      console.error(dropError);
      toast({
        variant: "destructive",
        title: "Unable to drop class",
        description: "Please try again in a moment.",
      });
    } finally {
      setIsDroppingClass(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
        <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
        <div className="space-y-2">
          <div className="h-9 w-72 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="h-44 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
            <div className="h-72 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
          </div>
          <div className="space-y-6">
            <div className="h-56 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
            <div className="h-40 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !classData) {
    return (
      <div className="space-y-4 p-6">
        <Link
          href="/dashboard/student/my-classes"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to My Classes
        </Link>
        <p className="text-sm text-destructive">
          {error || "Class not found."}
        </p>
      </div>
    );
  }

  const announcementTitle = String(announcement?.title || "").trim();
  const announcementExcerpt = String(
    announcement?.content || announcement?.message || "",
  )
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const announcementDate = (() => {
    const raw = announcement?.createdAt || announcement?.date || "";
    const parsed = new Date(String(raw));
    if (!raw || Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();
  const lessonTitle = String(currentLesson?.title || "").trim();
  const lessonExcerpt = stripLessonText(
    currentLesson?.objectives || currentLesson?.activities,
  );
  const lessonDate = (() => {
    const raw = currentLesson?.date || "";
    const parsed = new Date(String(raw));
    if (!raw || Number.isNaN(parsed.getTime())) return "";
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  })();

  return (
    <div className="space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <Link
            href="/dashboard/student/my-classes"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back to My Classes
          </Link>

          <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
          <p className="text-sm text-[#6B7280]">Teacher: {teacherName}</p>
          <p className="inline-flex items-center gap-2 text-sm text-[#6B7280]">
            <CalendarDays className="h-4 w-4" />
            {classData.days} • {classData.time}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsDropModalOpen(true)}
          className="rounded-md border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
        >
          Drop Class
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.9fr_1.1fr]">
        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-1.5">
                <Megaphone className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Latest Announcement
                </span>
              </div>
              <Link
                href={`/dashboard/student/class/${classId}/announcements`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View All →
              </Link>
            </CardHeader>
            <CardContent>
              {announcementTitle ? (
                <Link
                  href={`/dashboard/student/class/${classId}/announcements/${announcement?.id}`}
                  className="group block rounded-md -mx-2 px-2 py-2 transition-colors hover:bg-gray-50"
                >
                  <p className="text-xl font-bold text-gray-900 leading-snug">
                    {announcementTitle}
                  </p>
                  {announcementDate && (
                    <p className="mt-1 text-xs text-gray-400">
                      {announcementDate}
                    </p>
                  )}
                  {announcementExcerpt && (
                    <p className="mt-2 text-sm text-[#4B5563] leading-relaxed line-clamp-3">
                      {announcementExcerpt}
                    </p>
                  )}
                  <span className="mt-3 block text-sm font-medium text-primary group-hover:underline">
                    Read full announcement →
                  </span>
                </Link>
              ) : (
                <div className="flex flex-col items-center justify-center gap-2 py-6 text-center">
                  <Megaphone className="h-8 w-8 text-gray-200" />
                  <p className="text-sm text-[#9CA3AF]">
                    No new announcements from your teacher yet.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-4 w-4 text-gray-400" />
                <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                  Current Lesson
                </span>
              </div>
              <Link
                href={`/dashboard/student/class/${classId}/lessons`}
                className="text-xs font-medium text-primary hover:underline"
              >
                View All Lessons →
              </Link>
            </CardHeader>
            <CardContent>
              {lessonTitle && currentLesson?.id ? (
                <Link
                  href={`/dashboard/student/class/${classId}/lessons/${currentLesson.id}`}
                  className="group block rounded-md -mx-2 px-2 py-2 transition-colors hover:bg-gray-50"
                >
                  <p className="text-xl font-bold text-gray-900 leading-snug">
                    {lessonTitle}
                  </p>
                  {lessonDate && (
                    <p className="mt-1 text-xs text-gray-400">{lessonDate}</p>
                  )}
                  {lessonExcerpt ? (
                    <p className="mt-2 text-sm text-[#4B5563] leading-relaxed line-clamp-3">
                      {lessonExcerpt}
                    </p>
                  ) : null}
                  <span className="mt-3 block text-sm font-medium text-primary group-hover:underline">
                    View full lesson plan →
                  </span>
                </Link>
              ) : (
                <p className="text-sm text-[#6B7280]">
                  No active lessons at this time.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Upcoming Assignments</CardTitle>
            </CardHeader>
            <CardContent>
              {assignments.length === 0 ? (
                <p className="text-sm text-[#6B7280]">
                  You&apos;re all caught up!
                </p>
              ) : (
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div
                      key={assignment.id}
                      className="rounded-lg border border-gray-100 p-3"
                    >
                      <p className="font-medium text-foreground">
                        {assignment.title}
                      </p>
                      <p
                        className={`mt-1 text-xs ${
                          assignment.isUrgent
                            ? "text-red-500"
                            : "text-[#6B7280]"
                        }`}
                      >
                        {assignment.dueLabel}
                      </p>
                      <Button
                        asChild
                        className="mt-3 h-8 bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        <Link
                          href={`/dashboard/student/assignments?classId=${encodeURIComponent(classId)}&assignmentId=${encodeURIComponent(assignment.id)}`}
                        >
                          View / Submit
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle>Quick Resources</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              {resources.length > 0 ? (
                resources.map((resource, index) => (
                  <a
                    key={`${resource.id || resource.url || resource.label || index}`}
                    href={getResourceHref(resource, classId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-primary hover:underline"
                  >
                    <Link2 className="h-4 w-4" />
                    {resource.title ||
                      resource.label ||
                      resource.name ||
                      "Resource"}
                  </a>
                ))
              ) : (
                <p className="text-sm text-[#6B7280]">
                  No resources available yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {isDropModalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-gray-900">
              Drop {classData.name}?
            </h2>
            <p className="mt-3 text-sm text-gray-600">
              This action cannot be undone. You will be removed from the class
              roster and lose access to all lessons and assignments.
            </p>

            <div className="mt-5 space-y-2">
              <label
                htmlFor="drop-class-confirm"
                className="text-sm font-medium text-gray-700"
              >
                Please type drop-this-class to confirm.
              </label>
              <input
                id="drop-class-confirm"
                type="text"
                value={dropConfirmationText}
                onChange={(event) =>
                  setDropConfirmationText(event.target.value)
                }
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100"
                placeholder="drop-this-class"
              />
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  if (isDroppingClass) return;
                  setIsDropModalOpen(false);
                  setDropConfirmationText("");
                }}
                className="rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDropClass}
                disabled={
                  isDroppingClass ||
                  dropConfirmationText !== DROP_CLASS_CONFIRM_TOKEN
                }
                className="rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isDroppingClass ? "Dropping..." : "Confirm Drop"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
