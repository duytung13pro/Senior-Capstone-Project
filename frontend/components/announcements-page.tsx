"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Search, Plus, Edit, Trash, Calendar, Pin } from "lucide-react";
import { fetchApiFirstOk } from "@/lib/api";

type AnnouncementItem = {
  id: string;
  title: string;
  target: string;
  date: string;
  status: string;
  pinned?: boolean;
  content: string;
  contentHtml: string;
};

const fallbackAnnouncements: AnnouncementItem[] = [
  {
    id: "1",
    title: "End of Term Celebration",
    target: "All Classes",
    date: "May 20, 2023",
    status: "Published",
    pinned: true,
    content: "Join us for an end of term celebration on June 15th at 6:00 PM.",
    contentHtml:
      "Join us for an end of term celebration on June 15th at 6:00 PM. There will be food, performances, and certificate presentations.",
  },
];

const stripHtml = (value: string) =>
  value
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const formatDate = (raw?: string) => {
  const parsed = new Date(String(raw || ""));
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  return parsed.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function AnnouncementsPage() {
  const [teacherId, setTeacherId] = useState("");
  const [filter, setFilter] = useState({
    target: "all",
    status: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>(
    fallbackAnnouncements,
  );
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [busyAnnouncementId, setBusyAnnouncementId] = useState<string | null>(
    null,
  );
  const [editing, setEditing] = useState<AnnouncementItem | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editStatus, setEditStatus] = useState<"Draft" | "Published">("Draft");
  const [editPinned, setEditPinned] = useState(false);

  const targetOptions = useMemo(() => {
    const uniqueTargets = new Set(
      announcements.map((announcement) => announcement.target).filter(Boolean),
    );
    return Array.from(uniqueTargets);
  }, [announcements]);

  const mapPayloadToAnnouncements = (
    payload: Array<{
      id?: string;
      title?: string;
      target?: string;
      status?: string;
      pinned?: boolean;
      createdAt?: string;
      content?: string;
    }>,
  ) => {
    return (Array.isArray(payload) ? payload : [])
      .map((item) => {
        const html = String(item.content || "");
        return {
          id: String(item.id || "").trim(),
          title: String(item.title || "Untitled Announcement"),
          target: String(item.target || "All Classes"),
          date: formatDate(item.createdAt),
          status: String(item.status || "Draft"),
          pinned: Boolean(item.pinned),
          content: stripHtml(html),
          contentHtml: html,
        } satisfies AnnouncementItem;
      })
      .filter((item) => item.id.length > 0);
  };

  const loadAnnouncements = async (currentTeacherId: string) => {
    try {
      setLoading(true);
      setLoadError("");

      if (!currentTeacherId) {
        setLoadError("Please log in again");
        return;
      }

      const res = await fetchApiFirstOk(
        `/api/classes/announcements/my?teacherId=${encodeURIComponent(currentTeacherId)}`,
        { cache: "no-store" },
      );

      const payload: Array<{
        id?: string;
        title?: string;
        target?: string;
        status?: string;
        pinned?: boolean;
        createdAt?: string;
        content?: string;
      }> = await res.json();

      setAnnouncements(mapPayloadToAnnouncements(payload));
    } catch {
      setLoadError("Unable to load announcements");
    } finally {
      setLoading(false);
    }
  };

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

    const bootstrap = async () => {
      const resolvedTeacherId = await resolveTeacherId();
      setTeacherId(resolvedTeacherId);
      await loadAnnouncements(resolvedTeacherId);
    };

    void bootstrap();
  }, []);

  const handleDeleteAnnouncement = async (announcementId: string) => {
    if (!teacherId) {
      setActionError("Please log in again to continue.");
      return;
    }

    try {
      setActionError("");
      setBusyAnnouncementId(announcementId);

      await fetchApiFirstOk(
        `/api/classes/announcements/${encodeURIComponent(announcementId)}?teacherId=${encodeURIComponent(teacherId)}`,
        {
          method: "DELETE",
        },
      );

      setAnnouncements((previous) =>
        previous.filter((item) => item.id !== announcementId),
      );
    } catch {
      setActionError("Unable to delete announcement right now.");
    } finally {
      setBusyAnnouncementId(null);
    }
  };

  const openEditDialog = (announcement: AnnouncementItem) => {
    setEditing(announcement);
    setEditTitle(announcement.title);
    setEditContent(announcement.contentHtml || announcement.content);
    setEditStatus(announcement.status === "Published" ? "Published" : "Draft");
    setEditPinned(Boolean(announcement.pinned));
    setActionError("");
  };

  const handleSaveEdit = async () => {
    if (!editing || !teacherId) {
      setActionError("Please log in again to continue.");
      return;
    }

    const title = editTitle.trim();
    const content = editContent.trim();

    if (!title || !content) {
      setActionError("Title and content are required.");
      return;
    }

    try {
      setActionError("");
      setBusyAnnouncementId(editing.id);

      await fetchApiFirstOk(
        `/api/classes/announcements/${encodeURIComponent(editing.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            title,
            content,
            status: editStatus,
            pinned: editPinned,
          }),
        },
      );

      await loadAnnouncements(teacherId);
      setEditing(null);
    } catch {
      setActionError("Unable to update announcement right now.");
    } finally {
      setBusyAnnouncementId(null);
    }
  };

  const handleTogglePin = async (announcement: AnnouncementItem) => {
    if (!teacherId) {
      setActionError("Please log in again to continue.");
      return;
    }

    try {
      setActionError("");
      setBusyAnnouncementId(announcement.id);

      await fetchApiFirstOk(
        `/api/classes/announcements/${encodeURIComponent(announcement.id)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            title: announcement.title,
            content: announcement.contentHtml || announcement.content,
            status: announcement.status,
            pinned: !announcement.pinned,
          }),
        },
      );

      setAnnouncements((previous) =>
        previous.map((item) =>
          item.id === announcement.id
            ? { ...item, pinned: !announcement.pinned }
            : item,
        ),
      );
    } catch {
      setActionError("Unable to update pin state right now.");
    } finally {
      setBusyAnnouncementId(null);
    }
  };

  const filteredAnnouncements = announcements.filter((announcement) => {
    const targetMatch =
      filter.target === "all" || announcement.target === filter.target;
    const statusMatch =
      filter.status === "all" || announcement.status === filter.status;
    const searchMatch =
      searchQuery === "" ||
      announcement.title.toLowerCase().includes(searchQuery.toLowerCase());
    return targetMatch && statusMatch && searchMatch;
  });

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Announcements</h1>
        <Button asChild>
          <Link href="/dashboard/teacher/announcements/create">
            <Plus className="mr-2 h-4 w-4" />
            New Announcement
          </Link>
        </Button>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search announcements..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filter.target}
            onValueChange={(value) => setFilter({ ...filter, target: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by target" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Targets</SelectItem>
              {targetOptions.map((target) => (
                <SelectItem key={target} value={target}>
                  {target}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Published">Published</SelectItem>
              <SelectItem value="Draft">Draft</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="grid gap-4">
        {loadError ? (
          <p className="text-sm text-destructive">{loadError}</p>
        ) : null}

        {actionError ? (
          <p className="text-sm text-destructive">{actionError}</p>
        ) : null}

        {loading ? (
          <div className="flex h-24 items-center justify-center rounded-md border">
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        ) : null}

        {!loading && filteredAnnouncements.length === 0 ? (
          <div className="flex h-24 items-center justify-center rounded-md border">
            <p className="text-muted-foreground">No announcements found.</p>
          </div>
        ) : (
          filteredAnnouncements.map((announcement) => (
            <div
              key={announcement.id}
              className={`rounded-lg border bg-card text-card-foreground shadow-sm ${
                announcement.pinned ? "border-l-4 border-primary" : ""
              }`}
            >
              <div className="flex flex-col space-y-1.5 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-2xl font-semibold leading-none tracking-tight">
                    {announcement.pinned ? (
                      <Pin className="h-4 w-4 text-primary" />
                    ) : null}
                    {announcement.title}
                    {announcement.pinned ? (
                      <Badge
                        variant="secondary"
                        className="h-5 px-1.5 text-[10px] uppercase tracking-wide"
                      >
                        Pinned
                      </Badge>
                    ) : null}
                  </h3>
                  <Badge
                    variant={
                      announcement.status === "Published"
                        ? "default"
                        : "outline"
                    }
                  >
                    {announcement.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Calendar className="h-4 w-4" />
                  <span>{announcement.date}</span>
                  <span>•</span>
                  <span>{announcement.target}</span>
                </div>
              </div>
              <div className="p-6 pt-0">
                <p className="max-w-4xl">{announcement.content}</p>

                <div className="mt-4 flex items-center justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleTogglePin(announcement)}
                    disabled={busyAnnouncementId === announcement.id}
                    title={announcement.pinned ? "Unpin" : "Pin"}
                  >
                    <Pin
                      className={`h-4 w-4 ${announcement.pinned ? "text-primary" : ""}`}
                    />
                    <span className="sr-only">
                      {announcement.pinned ? "Unpin" : "Pin"}
                    </span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(announcement)}
                    disabled={busyAnnouncementId === announcement.id}
                  >
                    <Edit className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeleteAnnouncement(announcement.id)}
                    disabled={busyAnnouncementId === announcement.id}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <Dialog
        open={Boolean(editing)}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="sm:max-w-[640px]">
          <DialogHeader>
            <DialogTitle>Edit Announcement</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-announcement-title">
                Announcement Title
              </Label>
              <Input
                id="edit-announcement-title"
                value={editTitle}
                onChange={(event) => setEditTitle(event.target.value)}
                placeholder="Enter announcement title"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-announcement-status">Status</Label>
              <Select
                value={editStatus}
                onValueChange={(value) =>
                  setEditStatus(value === "Published" ? "Published" : "Draft")
                }
              >
                <SelectTrigger id="edit-announcement-status">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Published">Published</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center justify-between rounded-md border border-gray-200 p-3">
              <Label htmlFor="edit-announcement-pinned">
                Pin this announcement
              </Label>
              <Switch
                id="edit-announcement-pinned"
                checked={editPinned}
                onCheckedChange={setEditPinned}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-announcement-content">Content</Label>
              <Textarea
                id="edit-announcement-content"
                value={editContent}
                onChange={(event) => setEditContent(event.target.value)}
                rows={8}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setEditing(null)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={handleSaveEdit}
              disabled={!editing || busyAnnouncementId === editing.id}
            >
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
