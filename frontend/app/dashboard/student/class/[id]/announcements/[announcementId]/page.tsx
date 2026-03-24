"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { fetchApiFirstOk } from "@/lib/api";

type AnnouncementItem = {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
  date?: string;
  status?: string;
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

export default function AnnouncementDetailPage() {
  const params = useParams();
  const classId = String(params.id || "");
  const announcementId = String(params.announcementId || "");

  const [announcement, setAnnouncement] = useState<AnnouncementItem | null>(
    null,
  );
  const [teacherName, setTeacherName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId || !announcementId) return;

    const load = async () => {
      try {
        setLoading(true);
        setError("");

        // Fetch all announcements for this class and find the matching one
        const res = await fetchApiFirstOk(
          `/api/classes/${classId}/announcements`,
          { cache: "no-store" },
        );
        const all: AnnouncementItem[] = await res.json();
        const found = (Array.isArray(all) ? all : []).find(
          (item) => String(item?.id || "") === announcementId,
        );

        if (!found) {
          setError("Announcement not found.");
          return;
        }
        setAnnouncement(found);

        // Resolve teacher name from class info
        try {
          const classRes = await fetchApiFirstOk(`/api/classes/${classId}`, {
            cache: "no-store",
          });
          const classData: ClassItem = await classRes.json();

          if (classData?.teacherId) {
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
        setError("Unable to load announcement.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [classId, announcementId]);

  return (
    <div className="min-h-screen space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/student/class/${classId}/announcements`}
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Announcements
      </Link>

      {loading && (
        <div className="mx-auto max-w-4xl space-y-4">
          <div className="h-10 w-64 animate-pulse rounded bg-gray-200" />
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm" />
        </div>
      )}

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && announcement && (
        <div className="mx-auto max-w-4xl">
          <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
            <CardContent className="p-8">
              {/* Title */}
              <h2 className="text-2xl font-bold tracking-tight text-foreground">
                {announcement.title || "Untitled Announcement"}
              </h2>

              {/* Sub-text: date + teacher */}
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[#9CA3AF]">
                {formatDate(announcement.createdAt || announcement.date) && (
                  <span>
                    {formatDate(announcement.createdAt || announcement.date)}
                  </span>
                )}
                {teacherName && (
                  <>
                    <span>·</span>
                    <span>Posted by {teacherName}</span>
                  </>
                )}
              </div>

              {/* Divider */}
              <hr className="my-6 border-gray-100" />

              {/* Rich-text content */}
              {String(announcement.content || "").trim() ? (
                <div
                  className="prose prose-sm max-w-none text-gray-700 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: announcement.content! }}
                />
              ) : (
                <p className="text-sm text-[#6B7280]">No content available.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
