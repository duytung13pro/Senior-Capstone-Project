"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Clock3 } from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  fetchTeacherProgressData,
  type ClassProgressMetric,
} from "@/lib/teacher-progress-data";

const gradeToLetter = (grade: number) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
};

const formatDuration = (minutes: number) => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins.toString().padStart(2, "0")}m`;
};

const getGradeBadgeTone = (grade: number) => {
  if (grade >= 90) return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (grade >= 70) return "border-amber-200 bg-amber-100 text-amber-800";
  return "border-rose-200 bg-rose-100 text-rose-800";
};

const getGradeValueTone = (grade: number) => {
  if (grade >= 90) return "text-[#10B981]";
  if (grade >= 80) return "text-[#F59E0B]";
  return "text-[#EF4444]";
};

const getGradeProgressTone = (grade: number) => {
  if (grade >= 90) return "bg-[#10B981]";
  if (grade >= 80) return "bg-[#F59E0B]";
  return "bg-[#EF4444]";
};

export function StudentProgressPage() {
  const [classDirectory, setClassDirectory] = useState<ClassProgressMetric[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeClassId, setActiveClassId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const loadProgress = async () => {
      try {
        setLoading(true);
        setError("");

        const payload = await fetchTeacherProgressData();
        if (!cancelled) {
          setClassDirectory(payload);
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setClassDirectory([]);
          setError("Unable to load student progress right now.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadProgress();

    return () => {
      cancelled = true;
    };
  }, []);

  const activeClass = useMemo(
    () => classDirectory.find((item) => item.id === activeClassId) ?? null,
    [activeClassId],
  );

  if (loading) {
    return <div className="p-6">Loading student progress...</div>;
  }

  if (!activeClass) {
    return (
      <div className="min-h-full space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">
            Student Progress
          </h1>
          <p className="text-sm text-[#6B7280]">Class Directory</p>
        </div>

        {error ? (
          <div className="rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        {!error && classDirectory.length === 0 ? (
          <div className="rounded-lg border border-[#E5E7EB] bg-white p-8 text-center text-sm text-muted-foreground">
            No classes found for this teacher.
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {classDirectory.map((course) => {
            const averageGrade =
              course.students.length > 0
                ? Math.round(
                    course.students.reduce(
                      (sum, student) => sum + student.currentGrade,
                      0,
                    ) / course.students.length,
                  )
                : 0;
            const averageWeeklyMinutes =
              course.students.length > 0
                ? Math.round(
                    course.students.reduce(
                      (sum, student) => sum + student.weeklyMinutes,
                      0,
                    ) / course.students.length,
                  )
                : 0;

            return (
              <button
                key={course.id}
                type="button"
                onClick={() => setActiveClassId(course.id)}
                className="w-full cursor-pointer rounded-lg border border-[#E5E7EB] bg-white p-6 text-left transition-all duration-200 ease-out hover:-translate-y-0.5 hover:shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)]"
              >
                <h3 className="text-lg font-semibold text-foreground">
                  {course.name}
                </h3>
                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-stretch">
                  <div className="sm:flex-1 sm:border-r sm:border-gray-200 sm:pr-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Class Average Grade
                    </p>
                    <p
                      className={`mt-2 text-3xl font-bold ${getGradeValueTone(averageGrade)}`}
                    >
                      {averageGrade}% ({gradeToLetter(averageGrade)})
                    </p>
                  </div>
                  <div className="sm:flex-1 sm:pl-6">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400">
                      Avg Time Spent/Week
                    </p>
                    <p className="mt-2 inline-flex items-center gap-2 text-3xl font-bold text-foreground">
                      <Clock3 className="h-5 w-5 text-[#9CA3AF]" />
                      <span>{formatDuration(averageWeeklyMinutes)}</span>
                    </p>
                  </div>
                </div>
                <div className="mt-4 h-1.5 w-full rounded-full bg-[#F3F4F6]">
                  <div
                    className={`h-full rounded-full ${getGradeProgressTone(averageGrade)}`}
                    style={{
                      width: `${Math.max(0, Math.min(100, averageGrade))}%`,
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full space-y-4 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <Button
        variant="ghost"
        size="sm"
        className="h-8 px-1"
        onClick={() => setActiveClassId(null)}
      >
        ← Back to Classes
      </Button>

      <h1 className="text-3xl font-bold tracking-tight">{activeClass.name}</h1>

      <div className="rounded-lg border border-[#E5E7EB] bg-white p-2 md:p-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="py-4">Student</TableHead>
              <TableHead className="py-4">Current Grade</TableHead>
              <TableHead className="py-4">Time Engaged</TableHead>
              <TableHead className="py-4">Last Active</TableHead>
              <TableHead className="py-4 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activeClass.students.map((student) => (
              <TableRow key={student.id} className="hover:bg-[#FAFAFA]">
                <TableCell className="py-4">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-9 w-9 border border-[#E5E7EB] bg-[#F3F4F6]">
                      <AvatarImage src="/placeholder.svg" alt={student.name} />
                      <AvatarFallback className="bg-[#F3F4F6] text-foreground">
                        {student.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-foreground">
                      {student.name}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="py-4">
                  <Badge className={getGradeBadgeTone(student.currentGrade)}>
                    {student.currentGrade}% (
                    {gradeToLetter(student.currentGrade)})
                  </Badge>
                </TableCell>
                <TableCell className="py-4">
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <Clock3 className="h-4 w-4 text-[#6B7280]" />
                    <span>{formatDuration(student.totalMinutes)}</span>
                  </div>
                </TableCell>
                <TableCell className="py-4 text-sm text-[#6B7280]">
                  {student.lastActive}
                </TableCell>
                <TableCell className="py-4 text-right">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      href={`/dashboard/teacher/progress/${encodeURIComponent(activeClass.id)}/student/${encodeURIComponent(student.id)}`}
                    >
                      View Full Report
                    </Link>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
