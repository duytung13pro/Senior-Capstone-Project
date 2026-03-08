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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Search, Users } from "lucide-react";
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
    <div className="space-y-6">
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
        <Card key={course.id} className="h-full">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-lg">{course.name}</CardTitle>
                <CardDescription>
                  {course.description || "No description"}
                </CardDescription>
              </div>
              <Badge variant={mode === "enrolled" ? "default" : "outline"}>
                {mode === "enrolled" ? "Enrolled" : "Available"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{course.level}</Badge>
              <Badge variant="outline">{course.days}</Badge>
              <Badge variant="outline">{course.time}</Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {course.studentIds?.length || 0}
                {course.maxStudents ? ` / ${course.maxStudents}` : ""}
              </Badge>
            </div>

            {mode === "available" ? (
              <Button
                onClick={() => onEnroll?.(course.id)}
                disabled={enrollingClassId === course.id}
                className="w-full"
              >
                {enrollingClassId === course.id ? "Enrolling..." : "Enroll"}
              </Button>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
