"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Star, StarOff } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApiFirstOk } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { type TeacherMessage } from "@/lib/teacher-messages";

type TeacherClassOption = {
  id: string;
  name: string;
};

type StudentOption = {
  id: string;
  name: string;
};

const ENTIRE_CLASS_VALUE = "__entire_class__";

const resolveTeacherId = async () => {
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
    const id = String(sessionData?.user?.id || "").trim();

    if (id) {
      localStorage.setItem("userId", id);
    }

    return id;
  } catch {
    return "";
  }
};

export function MessagesPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [filter, setFilter] = useState({
    status: "all",
    class: "all",
    starred: "all",
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [activeMessages, setActiveMessages] = useState<TeacherMessage[]>([]);
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [teacherClasses, setTeacherClasses] = useState<TeacherClassOption[]>(
    [],
  );
  const [composeClassId, setComposeClassId] = useState("");
  const [composeRecipientId, setComposeRecipientId] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeMessage, setComposeMessage] = useState("");
  const [rosterStudents, setRosterStudents] = useState<StudentOption[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);
  const [isReadingMessage, setIsReadingMessage] = useState(false);
  const [selectedMessage, setSelectedMessage] = useState<TeacherMessage | null>(
    null,
  );

  const loadMessagesFromDatabase = async () => {
    try {
      const teacherId = await resolveTeacherId();
      if (!teacherId) {
        setActiveMessages([]);
        return;
      }

      const response = await fetch(
        `/api/teacher/messages?teacherId=${encodeURIComponent(teacherId)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(
          `Failed to load teacher messages: HTTP ${response.status}`,
        );
      }

      const payload = (await response.json()) as {
        data?: TeacherMessage[];
      };

      setActiveMessages(Array.isArray(payload?.data) ? payload.data : []);
    } catch (error) {
      console.error("Failed to load teacher messages", error);
      setActiveMessages([]);
      toast({
        title: "Unable to load messages",
        description: "Please refresh and try again.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    void loadMessagesFromDatabase();
  }, []);

  const classFilterOptions = useMemo(() => {
    const uniqueClasses = Array.from(
      new Set(
        activeMessages
          .map((message) => String(message.class || "").trim())
          .filter((value) => value.length > 0),
      ),
    );

    uniqueClasses.sort((left, right) => left.localeCompare(right));
    return uniqueClasses;
  }, [activeMessages]);

  const filteredMessages = activeMessages.filter((message) => {
    const statusMatch =
      filter.status === "all" ||
      (filter.status === "unread" && message.status === "Unread") ||
      (filter.status === "read" && message.status === "Read");
    const classMatch = filter.class === "all" || message.class === filter.class;
    const starredMatch =
      filter.starred === "all" ||
      (filter.starred === "starred" && message.starred) ||
      (filter.starred === "unstarred" && !message.starred);
    const searchMatch =
      searchQuery === "" ||
      message.sender.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return statusMatch && classMatch && starredMatch && searchMatch;
  });

  const toggleStar = async (id: string) => {
    const teacherId = await resolveTeacherId();

    const previousMessages = activeMessages;
    const nextMessages = activeMessages.map((message) =>
      message.id === id ? { ...message, starred: !message.starred } : message,
    );

    setActiveMessages(nextMessages);

    if (selectedMessage?.id === id) {
      const nextSelected = nextMessages.find((message) => message.id === id);
      setSelectedMessage(nextSelected || null);
    }

    try {
      const response = await fetch(`/api/teacher/messages/${id}/star`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teacherId }),
      });

      if (!response.ok) {
        throw new Error(`Failed to toggle star: HTTP ${response.status}`);
      }

      const payload = (await response.json()) as {
        data?: { starred?: boolean };
      };
      const serverStarred = Boolean(payload?.data?.starred);

      setActiveMessages((current) =>
        current.map((message) =>
          message.id === id ? { ...message, starred: serverStarred } : message,
        ),
      );
      setSelectedMessage((current) =>
        current && current.id === id
          ? { ...current, starred: serverStarred }
          : current,
      );
    } catch (error) {
      console.error(error);
      setActiveMessages(previousMessages);
      setSelectedMessage((current) =>
        current && current.id === id
          ? previousMessages.find((message) => message.id === id) || null
          : current,
      );
      toast({
        title: "Unable to update star",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const markAsRead = (id: string) => {
    setActiveMessages(
      activeMessages.map((message) =>
        message.id === id ? { ...message, status: "Read" } : message,
      ),
    );
  };

  const handleMessageRowClick = (message: TeacherMessage) => {
    markAsRead(message.id);
    setSelectedMessage(message);
    setIsReadingMessage(true);
  };

  const handleOpenFullThread = () => {
    if (!selectedMessage?.id) {
      return;
    }

    setIsReadingMessage(false);
    router.push(`/dashboard/teacher/messages/${selectedMessage.id}`);
  };

  useEffect(() => {
    if (!isComposeOpen) {
      return;
    }

    let canceled = false;

    const loadTeacherClasses = async () => {
      try {
        setLoadingClasses(true);

        const teacherId = await resolveTeacherId();
        if (!teacherId) {
          if (!canceled) {
            setTeacherClasses([]);
          }
          return;
        }

        const classesRes = await fetchApiFirstOk(
          `/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`,
          {
            cache: "no-store",
          },
        );
        const payload = (await classesRes.json()) as Array<{
          id?: string;
          name?: string;
        }>;

        if (canceled) {
          return;
        }

        setTeacherClasses(
          (Array.isArray(payload) ? payload : [])
            .map((row) => ({
              id: String(row?.id || "").trim(),
              name: String(row?.name || "Untitled Class").trim(),
            }))
            .filter((row) => row.id.length > 0),
        );
      } catch (error) {
        console.error(error);
        if (!canceled) {
          setTeacherClasses([]);
          toast({
            title: "Unable to load classes",
            description: "Please try opening the composer again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!canceled) {
          setLoadingClasses(false);
        }
      }
    };

    void loadTeacherClasses();

    return () => {
      canceled = true;
    };
  }, [isComposeOpen, toast]);

  useEffect(() => {
    setComposeRecipientId("");

    if (!composeClassId) {
      setRosterStudents([]);
      return;
    }

    let canceled = false;

    const loadRoster = async () => {
      try {
        setLoadingStudents(true);

        const inClassStudentsRes = await fetchApiFirstOk(
          `/api/classes/${composeClassId}/in-class-students`,
          { cache: "no-store" },
        );

        const inClassStudentsPayload =
          (await inClassStudentsRes.json()) as Array<{
            id?: string;
            firstName?: string;
            lastName?: string;
            email?: string;
          }>;

        if (canceled) {
          return;
        }

        const nextStudents = (
          Array.isArray(inClassStudentsPayload) ? inClassStudentsPayload : []
        )
          .map((student) => {
            const id = String(student?.id || "").trim();
            const fullName =
              `${String(student?.firstName || "").trim()} ${String(
                student?.lastName || "",
              ).trim()}`.trim();

            return {
              id,
              name: fullName || String(student?.email || "Student"),
            };
          })
          .filter((student) => student.id.length > 0);

        setRosterStudents(nextStudents);
      } catch (error) {
        console.error(error);
        if (!canceled) {
          setRosterStudents([]);
          toast({
            title: "Unable to load students",
            description: "Try selecting the class again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!canceled) {
          setLoadingStudents(false);
        }
      }
    };

    void loadRoster();

    return () => {
      canceled = true;
    };
  }, [composeClassId, toast]);

  const resetComposeForm = () => {
    setComposeClassId("");
    setComposeRecipientId("");
    setComposeSubject("");
    setComposeMessage("");
    setRosterStudents([]);
    setLoadingStudents(false);
  };

  const handleComposeOpenChange = (open: boolean) => {
    setIsComposeOpen(open);
    if (!open) {
      resetComposeForm();
    }
  };

  const handleSendComposeMessage = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    const classId = composeClassId.trim();
    const recipientId = composeRecipientId.trim();
    const subject = composeSubject.trim();
    const content = composeMessage.trim();

    if (!classId) {
      toast({
        title: "Class is required",
        description: "Select a class before sending a message.",
        variant: "destructive",
      });
      return;
    }

    if (!recipientId) {
      toast({
        title: "Student selection required",
        description: "Choose one student or All Students (Entire Class).",
        variant: "destructive",
      });
      return;
    }

    if (!subject || !content) {
      toast({
        title: "Subject and message are required",
        variant: "destructive",
      });
      return;
    }

    try {
      setSendingMessage(true);

      if (recipientId === ENTIRE_CLASS_VALUE) {
        const recipientIds = rosterStudents.map((student) => student.id);
        if (recipientIds.length === 0) {
          toast({
            title: "No students in class",
            description: "This class has no enrolled students to message.",
            variant: "destructive",
          });
          return;
        }

        const response = await fetch("/api/teacher/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            subject,
            content,
            recipientIds,
          }),
        });
        if (!response.ok) {
          throw new Error(
            `Failed to broadcast message: HTTP ${response.status}`,
          );
        }
      } else {
        const response = await fetch("/api/teacher/messages/send", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            classId,
            subject,
            content,
            recipientId,
          }),
        });
        if (!response.ok) {
          throw new Error(`Failed to send message: HTTP ${response.status}`);
        }
      }

      await loadMessagesFromDatabase();

      toast({
        title: "Message sent",
        description:
          recipientId === ENTIRE_CLASS_VALUE
            ? "Broadcast sent to the entire class."
            : "Message sent to the selected student.",
      });

      handleComposeOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({
        title: "Failed to send message",
        description: "Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <Dialog open={isComposeOpen} onOpenChange={handleComposeOpenChange}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Message
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Compose New Message</DialogTitle>
              <DialogDescription>
                Send a message to a student or class.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSendComposeMessage}>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="class">Class</Label>
                  <Select
                    value={composeClassId}
                    onValueChange={(value) => setComposeClassId(value)}
                    disabled={loadingClasses || sendingMessage}
                  >
                    <SelectTrigger id="class">
                      <SelectValue
                        placeholder={
                          loadingClasses ? "Loading classes..." : "Select class"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {teacherClasses.map((classItem) => (
                        <SelectItem key={classItem.id} value={classItem.id}>
                          {classItem.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="recipient">Student(s)</Label>
                  <Select
                    value={composeRecipientId}
                    onValueChange={(value) => setComposeRecipientId(value)}
                    disabled={
                      !composeClassId || loadingStudents || sendingMessage
                    }
                  >
                    <SelectTrigger id="recipient">
                      <SelectValue
                        placeholder={
                          !composeClassId
                            ? "Select a class first..."
                            : loadingStudents
                              ? "Loading students..."
                              : "Select student(s)"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={ENTIRE_CLASS_VALUE}>
                        All Students (Entire Class)
                      </SelectItem>
                      {rosterStudents.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="subject">Subject</Label>
                  <Input
                    id="subject"
                    placeholder="Enter message subject"
                    value={composeSubject}
                    onChange={(event) => setComposeSubject(event.target.value)}
                    disabled={sendingMessage}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="message">Message</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your message"
                    rows={6}
                    value={composeMessage}
                    onChange={(event) => setComposeMessage(event.target.value)}
                    disabled={sendingMessage}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={sendingMessage}>
                  {sendingMessage ? "Sending..." : "Send Message"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 items-center gap-2">
          <div className="relative flex-1 md:max-w-sm">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search messages..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Select
            value={filter.status}
            onValueChange={(value) => setFilter({ ...filter, status: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="unread">Unread</SelectItem>
              <SelectItem value="read">Read</SelectItem>
            </SelectContent>
          </Select>
          <Select
            value={filter.class}
            onValueChange={(value) => setFilter({ ...filter, class: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by class" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Classes</SelectItem>
              {classFilterOptions.map((className) => (
                <SelectItem key={className} value={className}>
                  {className}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={filter.starred}
            onValueChange={(value) => setFilter({ ...filter, starred: value })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by starred" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Messages</SelectItem>
              <SelectItem value="starred">Starred</SelectItem>
              <SelectItem value="unstarred">Unstarred</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="rounded-md border bg-card">
        {filteredMessages.length === 0 ? (
          <div className="flex h-24 items-center justify-center">
            <p className="text-muted-foreground">No messages found.</p>
          </div>
        ) : (
          <div className="divide-y">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`flex cursor-pointer items-start gap-4 p-4 hover:bg-muted/50 ${
                  message.status === "Unread" ? "bg-muted/20" : ""
                }`}
                onClick={() => handleMessageRowClick(message)}
              >
                <Avatar className="h-10 w-10">
                  <AvatarImage
                    src="/placeholder.svg"
                    alt={message.counterpartName || message.sender}
                  />
                  <AvatarFallback>{message.avatar}</AvatarFallback>
                </Avatar>
                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-medium">
                        {message.direction === "sent" ? "To: " : "From: "}
                        {message.counterpartName || message.sender}
                      </div>
                      {!!message.counterpartEmail && (
                        <div className="text-xs text-muted-foreground">
                          {message.counterpartEmail}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">
                        {message.time}
                      </span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleStar(message.id);
                        }}
                      >
                        {message.starred ? (
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        ) : (
                          <StarOff className="h-4 w-4" />
                        )}
                        <span className="sr-only">
                          {message.starred ? "Unstar" : "Star"}
                        </span>
                      </Button>
                    </div>
                  </div>
                  <div className="font-medium">{message.subject}</div>
                  <div className="text-sm text-muted-foreground line-clamp-1">
                    {message.preview}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-xs text-muted-foreground">
                      {message.class}
                    </div>
                    {message.status === "Unread" && (
                      <Badge variant="secondary" className="text-xs">
                        New
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Dialog open={isReadingMessage} onOpenChange={setIsReadingMessage}>
        <DialogContent
          className="sm:max-w-[700px]"
          overlayClassName="bg-black/50"
        >
          <DialogHeader>
            <DialogTitle>{selectedMessage?.subject || "Message"}</DialogTitle>
            <DialogDescription>{selectedMessage?.time || ""}</DialogDescription>
          </DialogHeader>

          {selectedMessage && (
            <div className="space-y-3 text-sm">
              <div className="rounded-md border bg-card p-3">
                <div className="font-medium">
                  From:{" "}
                  {selectedMessage.direction === "sent"
                    ? "You"
                    : selectedMessage.counterpartName || selectedMessage.sender}
                </div>
                {selectedMessage.direction !== "sent" &&
                  selectedMessage.counterpartEmail && (
                    <div className="text-xs text-muted-foreground">
                      {selectedMessage.counterpartEmail}
                    </div>
                  )}
              </div>

              <div className="rounded-md border bg-card p-3">
                <div className="font-medium">
                  To:{" "}
                  {selectedMessage.direction === "sent"
                    ? selectedMessage.counterpartName || selectedMessage.sender
                    : "You"}
                </div>
                {selectedMessage.direction === "sent" &&
                  selectedMessage.counterpartEmail && (
                    <div className="text-xs text-muted-foreground">
                      {selectedMessage.counterpartEmail}
                    </div>
                  )}
              </div>

              <div className="rounded-md border bg-card p-4 leading-6">
                {selectedMessage.body || selectedMessage.preview}
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsReadingMessage(false)}
            >
              Close
            </Button>
            <Button type="button" onClick={handleOpenFullThread}>
              Reply / Expand Full Thread
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
