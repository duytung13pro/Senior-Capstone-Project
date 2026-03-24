"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  name: string;
};

const normalizeCommand = (value: string) => value.trim().toLowerCase();

export function AnnouncementCreatePage() {
  const router = useRouter();
  const editorRef = useRef<HTMLDivElement>(null);

  const [teacherId, setTeacherId] = useState("");
  const [title, setTitle] = useState("");
  const [targetClassId, setTargetClassId] = useState("all");
  const [pinned, setPinned] = useState(false);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [submitError, setSubmitError] = useState("");
  const [submittingState, setSubmittingState] = useState<
    "draft" | "publish" | null
  >(null);

  useEffect(() => {
    const resolveTeacherId = async () => {
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
        const sessionTeacherId = String(sessionData?.user?.id || "");
        if (sessionTeacherId) {
          localStorage.setItem("userId", sessionTeacherId);
        }
        return sessionTeacherId;
      } catch {
        return "";
      }
    };

    const loadClasses = async () => {
      try {
        setLoadingClasses(true);
        const teacherId = await resolveTeacherId();
        setTeacherId(teacherId);
        if (!teacherId) {
          setClasses([]);
          return;
        }

        const res = await fetchApiFirstOk(
          `/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`,
          { cache: "no-store" },
        );

        const payload: Array<{ id?: string; name?: string }> = await res.json();
        const mapped = (Array.isArray(payload) ? payload : [])
          .map((item) => ({
            id: String(item.id || "").trim(),
            name: String(item.name || "Untitled Class").trim(),
          }))
          .filter((item) => item.id.length > 0);

        setClasses(mapped);
      } catch {
        setClasses([]);
      } finally {
        setLoadingClasses(false);
      }
    };

    void loadClasses();
  }, []);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const applyCommand = (command: string) => {
    focusEditor();
    document.execCommand(normalizeCommand(command), false);
  };

  const applyLink = () => {
    focusEditor();
    const rawUrl = window.prompt("Enter URL", "https://");
    if (!rawUrl) {
      return;
    }

    const url = rawUrl.trim();
    if (!url) {
      return;
    }

    document.execCommand("createLink", false, url);
  };

  const handleCancel = () => {
    router.push("/dashboard/teacher/announcements");
  };

  const readEditorContent = () => {
    const html = String(editorRef.current?.innerHTML || "").trim();
    const text = String(editorRef.current?.textContent || "").trim();
    return { html, text };
  };

  const submitAnnouncement = async (status: "Draft" | "Published") => {
    if (!teacherId) {
      setSubmitError("Please log in again to continue.");
      return;
    }

    const trimmedTitle = title.trim();
    const { html, text } = readEditorContent();

    if (!trimmedTitle) {
      setSubmitError("Announcement title is required.");
      return;
    }

    if (!text) {
      setSubmitError("Announcement content is required.");
      return;
    }

    try {
      setSubmitError("");
      setSubmittingState(status === "Draft" ? "draft" : "publish");

      await fetchApiFirstOk("/api/classes/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          targetClassId,
          title: trimmedTitle,
          content: html,
          status,
          pinned,
        }),
      });

      router.push("/dashboard/teacher/announcements");
    } catch {
      setSubmitError("Unable to save announcement right now.");
    } finally {
      setSubmittingState(null);
    }
  };

  return (
    <div className="min-h-full rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <Link
          href="/dashboard/teacher/announcements"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Announcements
        </Link>

        <h1 className="text-3xl font-bold tracking-tight">
          Create New Announcement
        </h1>

        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl">Announcement Details</CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="announcement-title">Announcement Title</Label>
              <Input
                id="announcement-title"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                placeholder="Enter announcement title"
                className="h-11"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="announcement-target">Select Class/Audience</Label>
              <Select value={targetClassId} onValueChange={setTargetClassId}>
                <SelectTrigger id="announcement-target" className="h-11">
                  <SelectValue placeholder="Select class or audience" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {classes.map((teacherClass) => (
                    <SelectItem key={teacherClass.id} value={teacherClass.id}>
                      {teacherClass.name}
                    </SelectItem>
                  ))}
                  {!loadingClasses && classes.length === 0 ? (
                    <SelectItem value="no-classes" disabled>
                      No active classes found
                    </SelectItem>
                  ) : null}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <Label htmlFor="announcement-pinned">Pin this announcement</Label>
              <Switch
                id="announcement-pinned"
                checked={pinned}
                onCheckedChange={setPinned}
              />
            </div>

            <div className="space-y-2">
              <Label>Announcement Content</Label>

              <div className="rounded-md border border-input bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyCommand("bold")}
                  >
                    <Bold className="h-4 w-4" />
                    <span className="sr-only">Bold</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyCommand("italic")}
                  >
                    <Italic className="h-4 w-4" />
                    <span className="sr-only">Italic</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyCommand("strikeThrough")}
                  >
                    <Strikethrough className="h-4 w-4" />
                    <span className="sr-only">Strikethrough</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyCommand("insertUnorderedList")}
                  >
                    <List className="h-4 w-4" />
                    <span className="sr-only">Bulleted List</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => applyCommand("insertOrderedList")}
                  >
                    <ListOrdered className="h-4 w-4" />
                    <span className="sr-only">Numbered List</span>
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={applyLink}
                  >
                    <Link2 className="h-4 w-4" />
                    <span className="sr-only">Insert Link</span>
                  </Button>
                </div>

                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  className="min-h-[320px] w-full px-4 py-3 text-sm text-foreground focus:outline-none"
                  data-placeholder="Write your announcement..."
                />
              </div>
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            <div className="mt-8 flex items-center justify-between border-t pt-6">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCancel}
                disabled={submittingState !== null}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => submitAnnouncement("Draft")}
                  disabled={submittingState !== null}
                >
                  {submittingState === "draft" ? "Saving..." : "Save Draft"}
                </Button>
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={() => submitAnnouncement("Published")}
                  disabled={submittingState !== null}
                >
                  {submittingState === "publish"
                    ? "Publishing..."
                    : "Publish Announcement"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
