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
  title: string;
  content: string;
  createdAt?: string;
  date?: string;
  status?: string;
};

const stripHtml = (html: string) =>
  html
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatDate = (raw?: string) => {
  const parsed = new Date(String(raw || ""));
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
};

export default function ClassAnnouncementsPage() {
  const params = useParams();
  const classId = String(params.id || "");

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!classId) return;

    const loadAnnouncements = async () => {
      try {
        setLoading(true);
        setError("");

        const res = await fetchApiFirstOk(
          `/api/classes/${classId}/announcements`,
          { cache: "no-store" },
        );
        const raw: AnnouncementItem[] = await res.json();

        const sorted = (Array.isArray(raw) ? raw : [])
          .filter((item) => {
            const status = String(item?.status || "").toLowerCase();
            return !status || status === "published";
          })
          .sort((a, b) => {
            const left = new Date(
              String(a?.createdAt || a?.date || 0),
            ).getTime();
            const right = new Date(
              String(b?.createdAt || b?.date || 0),
            ).getTime();
            return right - left;
          });

        setAnnouncements(sorted);
      } catch {
        setError("Unable to load announcements.");
      } finally {
        setLoading(false);
      }
    };

    void loadAnnouncements();
  }, [classId]);

  return (
    <div className="min-h-screen space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      {/* Breadcrumb */}
      <Link
        href={`/dashboard/student/class/${classId}`}
        className="inline-flex items-center text-sm font-medium text-primary hover:underline"
      >
        <ArrowLeft className="mr-1 h-4 w-4" />
        Back to Class Dashboard
      </Link>

      <h1 className="text-3xl font-bold tracking-tight">Class Announcements</h1>

      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-28 animate-pulse rounded-xl border border-gray-100 bg-white shadow-sm"
            />
          ))}
        </div>
      )}

      {!loading && error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && announcements.length === 0 && (
        <p className="text-sm text-[#6B7280]">
          No announcements have been posted yet.
        </p>
      )}

      {!loading && !error && announcements.length > 0 && (
        <div className="space-y-4">
          {announcements.map((item) => {
            const excerpt = stripHtml(item.content || "");
            const dateLabel = formatDate(item.createdAt || item.date);

            return (
              <Link
                key={item.id}
                href={`/dashboard/student/class/${classId}/announcements/${item.id}`}
                className="block"
              >
                <Card className="rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-[2px] cursor-pointer">
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-4">
                      <h2 className="text-base font-semibold text-foreground leading-snug">
                        {item.title || "Untitled Announcement"}
                      </h2>
                      {dateLabel && (
                        <span className="shrink-0 text-xs text-[#9CA3AF] mt-0.5">
                          {dateLabel}
                        </span>
                      )}
                    </div>
                    {excerpt && (
                      <p className="mt-2 text-sm text-[#6B7280] leading-relaxed line-clamp-2">
                        {excerpt}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
