"use client";

export const dynamic = "force-dynamic";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";

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

type TeacherProfile = {
  firstName?: string;
  lastName?: string;
  email?: string;
};

type ClassItem = {
  teacherId?: string;
};

const formatDate = (raw?: string) => {
  const parsed = new Date(String(raw || ""));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

const toLines = (raw?: string, headersToRemove: RegExp[] = []) =>
  String(raw || "")
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !headersToRemove.some((pattern) => pattern.test(line)))
    .filter((line) => line !== "-");

export default function StudentLessonDetailPage() {
  const params = useParams();
  const classId = String(params.id || "");
  const lessonId = String(params.lessonId || "");

  const [lesson, setLesson] = useState<LessonPlanItem | null>(null);
  const [teacherName, setTeacherName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId || !lessonId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const lessonRes = await fetchApiFirstOk(
          `/api/lesson-plans/${lessonId}`,
          {
            cache: "no-store",
          },
        );
        const lessonPayload: LessonPlanItem = await lessonRes.json();

        if (String(lessonPayload.classId || "") !== classId) {
          setError("Lesson not found.");
          return;
        }

        setLesson(lessonPayload);

        try {
          const classRes = await fetchApiFirstOk(`/api/classes/${classId}`, {
            cache: "no-store",
          });
          const classData: ClassItem = await classRes.json();
          if (classData.teacherId) {
            const teacherRes = await fetchApiFirstOk(
              `/api/users/${classData.teacherId}`,
              { cache: "no-store" },
            );
            const teacher: TeacherProfile = await teacherRes.json();
            const fullName =
              `${teacher.firstName || ""} ${teacher.lastName || ""}`.trim();
            setTeacherName(fullName || teacher.email || "Teacher");
          }
        } catch {
          setTeacherName("Teacher");
        }
      } catch {
        setError("Unable to load lesson.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classId, lessonId]);

  const objectiveLines = useMemo(
    () =>
      toLines(lesson?.objectives, [
        /^Learning Objectives:?$/i,
        /^Standards Alignment:?$/i,
      ]),
    [lesson?.objectives],
  );

  const arcLines = useMemo(
    () =>
      toLines(lesson?.activities, [
        /^Lesson Arc \(Gradual Release\):?$/i,
        /^Differentiation & Accessibility:?$/i,
        /^Accommodations:?$/i,
        /^Extensions:?$/i,
        /^ELL Support:?$/i,
        /^Total Arc Minutes:/i,
      ]),
    [lesson?.activities],
  );

  return (
    <div className="min-h-screen space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <Link
        href={`/dashboard/student/class/${classId}/lessons`}
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Lessons
      </Link>

      {loading ? (
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-64 rounded-xl border border-gray-100 bg-white shadow-sm animate-pulse" />
        </div>
      ) : null}

      {!loading && error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : null}

      {!loading && !error && lesson ? (
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {lesson.title || "Untitled Lesson"}
              </h2>

              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
                {formatDate(lesson.date) ? (
                  <span>{formatDate(lesson.date)}</span>
                ) : null}
                {teacherName ? (
                  <>
                    <span>·</span>
                    <span>Posted by {teacherName}</span>
                  </>
                ) : null}
              </div>

              <hr className="my-6 border-gray-100" />

              <div className="space-y-6 text-sm text-[#4B5563]">
                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Objectives
                  </h3>
                  {objectiveLines.length > 0 ? (
                    <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed">
                      {objectiveLines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-3 text-[#6B7280]">No objectives listed.</p>
                  )}
                </section>

                <section>
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-[#9CA3AF]">
                    Lesson Flow
                  </h3>
                  {arcLines.length > 0 ? (
                    <div className="mt-3 space-y-2 leading-relaxed">
                      {arcLines.map((line) => (
                        <p key={line}>{line}</p>
                      ))}
                    </div>
                  ) : (
                    <p className="mt-3 text-[#6B7280]">
                      No lesson flow available.
                    </p>
                  )}
                </section>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
