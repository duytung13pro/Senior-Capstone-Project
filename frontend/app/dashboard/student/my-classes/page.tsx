"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, ChevronRight, Search, Users } from "lucide-react";
import { fetchApiFirstOk } from "@/lib/api";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description?: string;
  room?: string;
  maxStudents?: number | null;
  studentIds: string[];
};

export default function StudentClassesPage() {
  const ENROLLMENT_REFRESH_KEY = "studentClassesUpdatedAt";
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolledClasses, setEnrolledClasses] = useState<ClassItem[]>([]);

  const resolveStudentId = async () => {
    const stored = localStorage.getItem("userId") || "";
    if (stored) {
      return stored;
    }

    try {
      const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
      if (!sessionRes.ok) {
        return "";
      }

      const sessionData = await sessionRes.json();
      const sessionStudentId = sessionData?.user?.id || "";

      if (sessionStudentId) {
        localStorage.setItem("userId", sessionStudentId);
      }

      return sessionStudentId;
    } catch {
      return "";
    }
  };

  const loadData = async (currentStudentId: string) => {
    try {
      setLoading(true);
      setError("");

      const enrolledRes = await fetchApiFirstOk(
        `/api/classes/enrolled?studentId=${currentStudentId}`,
        { cache: "no-store" },
      );

      const enrolledData = await enrolledRes.json();
      setEnrolledClasses(enrolledData);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const currentStudentId = await resolveStudentId();
      if (!currentStudentId) {
        setError("Please log in again");
        setLoading(false);
        return;
      }

      await loadData(currentStudentId);
    };

    bootstrap();

    const refreshEnrolledClasses = async () => {
      const currentStudentId = await resolveStudentId();
      if (!currentStudentId) {
        return;
      }
      await loadData(currentStudentId);
    };

    const onStorage = (event: StorageEvent) => {
      if (event.key === ENROLLMENT_REFRESH_KEY) {
        void refreshEnrolledClasses();
      }
    };

    const onClassesUpdated = () => {
      void refreshEnrolledClasses();
    };

    const onFocus = () => {
      void refreshEnrolledClasses();
    };

    window.addEventListener("storage", onStorage);
    window.addEventListener("student-classes-updated", onClassesUpdated);
    window.addEventListener("focus", onFocus);

    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("student-classes-updated", onClassesUpdated);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const filteredEnrolled = enrolledClasses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <div className="p-6">Loading classes...</div>;
  }

  return (
    <div className="space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">My Classes</h1>
        <p className="text-muted-foreground">
          View classes you have enrolled in
        </p>
        <Link
          href="/dashboard/student/available-classes"
          className="text-sm font-medium text-primary hover:underline"
        >
          Browse available classes
        </Link>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search class name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <ClassGrid classes={filteredEnrolled} mode="enrolled" />
    </div>
  );
}

const getPendingAssignments = (course: ClassItem) => {
  const score = course.name.length + (course.studentIds?.length || 0);
  return score % 4;
};

function ClassGrid({
  classes,
  mode,
  enrollingClassId,
  onEnroll,
}: {
  classes: ClassItem[];
  mode: "available" | "enrolled";
  enrollingClassId?: string | null;
  onEnroll?: (classId: string) => void;
}) {
  if (classes.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No classes found</h3>
          <p className="text-muted-foreground">
            Try a different search keyword
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2">
      {classes.map((course) => (
        <Link
          key={course.id}
          href={
            mode === "enrolled"
              ? `/dashboard/student/class/${encodeURIComponent(course.id)}`
              : "#"
          }
          className={
            mode === "enrolled"
              ? "block h-full"
              : "pointer-events-none block h-full"
          }
          aria-disabled={mode !== "enrolled"}
          tabIndex={mode === "enrolled" ? 0 : -1}
        >
          <Card className="h-full rounded-xl border border-[#E5E7EB] bg-white shadow-sm transition-all duration-200 ease-out hover:-translate-y-[3px] hover:shadow-[0_12px_20px_-5px_rgba(0,0,0,0.08)]">
            <CardHeader>
              <div>
                <CardTitle className="text-lg font-bold text-foreground">
                  {course.name}
                </CardTitle>
                <CardDescription className="text-gray-500">
                  {course.description || "No description"}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {course.level}
                </span>
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {course.days}
                </span>
                <span className="rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  {course.time}
                </span>
                <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700">
                  <Users className="h-3 w-3" />
                  {course.studentIds?.length || 0}
                  {course.maxStudents ? ` / ${course.maxStudents}` : ""}
                </span>
              </div>

              <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-4">
                {(() => {
                  const pendingAssignments = getPendingAssignments(course);
                  return pendingAssignments > 0 ? (
                    <p className="text-sm font-medium text-amber-600">
                      {pendingAssignments} Pending Assignments
                    </p>
                  ) : (
                    <p className="text-sm text-gray-500">All caught up!</p>
                  );
                })()}

                <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
                  Enter Class
                  <ChevronRight className="h-4 w-4" />
                </span>
              </div>

              {mode === "available" ? (
                <Button
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    onEnroll?.(course.id);
                  }}
                  disabled={enrollingClassId === course.id}
                  className="pointer-events-auto w-full"
                >
                  {enrollingClassId === course.id ? "Enrolling..." : "Enroll"}
                </Button>
              ) : null}
            </CardContent>
          </Card>
        </Link>
      ))}
    </div>
  );
}
