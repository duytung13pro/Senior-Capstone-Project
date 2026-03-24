"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, BookOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { fetchApiFirstOk } from "@/lib/api";

type LessonPlanItem = {
  id?: string;
  classId?: string;
  title?: string;
  status?: string;
  objectives?: string;
  activities?: string;
  date?: string;
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

const formatDate = (raw?: string) => {
  const parsed = new Date(String(raw || ""));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function StudentClassLessonsPage() {
  const params = useParams();
  const classId = String(params.id || "");

  const [lessons, setLessons] = useState<LessonPlanItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId) {
      return;
    }

    const loadLessons = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetchApiFirstOk(
          `/api/lesson-plans/class/${classId}`,
          {
            cache: "no-store",
          },
        );
        const payload: LessonPlanItem[] = await response.json();
        setLessons(Array.isArray(payload) ? payload : []);
      } catch {
        setError("Unable to load lessons.");
      } finally {
        setLoading(false);
      }
    };

    void loadLessons();
  }, [classId]);

  return (
    <div className="min-h-screen space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <Link
        href={`/dashboard/student/class/${classId}`}
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Class Dashboard
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Class Lessons</h1>

      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm"
            />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!loading && !error && lessons.length === 0 ? (
        <p className="text-sm text-[#6B7280]">
          No active lessons at this time.
        </p>
      ) : null}

      {!loading && !error && lessons.length > 0 ? (
        <div className="space-y-4">
          {lessons.map((lesson) => {
            const lessonId = String(lesson.id || "").trim();
            const lessonTitle = String(
              lesson.title || "Untitled Lesson",
            ).trim();
            const excerpt = stripLessonText(
              lesson.objectives || lesson.activities,
            );
            const dateLabel = formatDate(lesson.date);

            return (
              <Link
                key={lessonId}
                href={`/dashboard/student/class/${classId}/lessons/${lessonId}`}
                className="block"
              >
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:-translate-y-[2px] hover:shadow-md">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <BookOpen className="mt-0.5 h-4 w-4 text-gray-400" />
                        <h2 className="text-base font-semibold leading-snug text-foreground">
                          {lessonTitle}
                        </h2>
                      </div>
                      {dateLabel ? (
                        <span className="mt-0.5 shrink-0 text-xs text-[#9CA3AF]">
                          {dateLabel}
                        </span>
                      ) : null}
                    </div>
                    {excerpt ? (
                      <p className="mt-2 text-sm leading-relaxed text-[#6B7280] line-clamp-2">
                        {excerpt}
                      </p>
                    ) : null}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
