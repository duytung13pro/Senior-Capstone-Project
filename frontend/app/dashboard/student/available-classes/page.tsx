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
import { Input } from "@/components/ui/input";
import { Search, Users, BookOpen, ChevronRight } from "lucide-react";
import { apiEndpointCandidates } from "@/lib/api";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description?: string;
  room?: string;
  maxStudents?: number | null;
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  studentIds: string[];
};

export default function AvailableClassesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [availableClasses, setAvailableClasses] = useState<ClassItem[]>([]);

  const fetchClasses = async (): Promise<ClassItem[]> => {
    const candidates = Array.from(
      new Set([
        "/backend-api/api/classes/all",
        ...apiEndpointCandidates("/api/classes/all"),
      ]),
    );

    let lastError: unknown = null;

    for (const endpoint of candidates) {
      try {
        const res = await fetch(endpoint, { cache: "no-store" });
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
          continue;
        }

        const data = await res.json();

        if (Array.isArray(data)) {
          return data as ClassItem[];
        }

        if (Array.isArray(data?.classes)) {
          return data.classes as ClassItem[];
        }

        lastError = new Error(`Unexpected response shape from ${endpoint}`);
      } catch (error) {
        lastError = error;
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error("Unable to load classes");
  };

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

      const allClasses = await fetchClasses();
      const availableData = allClasses.filter((course) => {
        const isAlreadyEnrolled =
          Boolean(currentStudentId) &&
          (course.studentIds || []).includes(currentStudentId);
        const isFull =
          course.maxStudents != null &&
          (course.studentIds?.length || 0) >= course.maxStudents;
        return !isAlreadyEnrolled && !isFull;
      });

      setAvailableClasses(availableData);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load available classes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const currentStudentId = await resolveStudentId();
      await loadData(currentStudentId);
    };

    bootstrap();
  }, []);

  const filteredClasses = availableClasses.filter((course) =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (loading) {
    return <div className="p-6">Loading available classes...</div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Available Classes</h1>
        <p className="text-muted-foreground">
          Hover a class to preview details, then click it to view full class information.
        </p>
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

      {filteredClasses.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BookOpen className="mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="text-lg font-medium">No available classes</h3>
            <p className="text-muted-foreground">
              Try a different keyword or check back later
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {filteredClasses.map((course) => (
            <Link
              key={course.id}
              href={`/dashboard/student/available-classes/${course.id}`}
              className="group block h-full"
            >
              <Card className="h-full border-border transition-colors group-hover:border-primary/40">
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <CardTitle className="text-lg">{course.name}</CardTitle>
                      <CardDescription>
                        {course.description || "No description"}
                      </CardDescription>
                    </div>
                    <Badge variant="outline">Available</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
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

                  <div className="hidden rounded-md border bg-muted/50 p-3 text-sm text-muted-foreground group-hover:block group-focus-within:block">
                    <p>
                      <span className="font-medium text-foreground">Room:</span>{" "}
                      {course.room || "TBD"}
                    </p>
                    <p>
                      <span className="font-medium text-foreground">Duration:</span>{" "}
                      {course.startDate || "TBD"} - {course.endDate || "TBD"}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                    Quick preview shown on hover
                  </p>

                  <div className="flex items-center text-sm font-medium text-primary">
                    View full details <ChevronRight className="ml-1 h-4 w-4" />
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
