"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Bold,
  Italic,
  Link2,
  List,
  ListOrdered,
  Strikethrough,
  UploadCloud,
} from "lucide-react";

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
import { toast } from "@/hooks/use-toast";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  name: string;
};

type ClassModule = {
  id: string;
  title: string;
  order?: number;
};

type SubmissionType = "file-upload" | "text-entry" | "on-paper";

type AssignmentApi = {
  id?: string;
  classId?: string;
  title?: string;
  description?: string;
  deadline?: string;
  maxScore?: number;
};

type ParsedMetadata = {
  instructions: string;
  moduleTitle: string;
  availableFrom: string;
  dueDate: string;
  lockDate: string;
  submissionType: SubmissionType;
  allowedFileExtensions: string;
};

const submissionTypeLabels: Record<SubmissionType, string> = {
  "file-upload": "File Upload",
  "text-entry": "Text Entry",
  "on-paper": "On Paper / In Class",
};

const toDatetimeLocal = (raw?: string) => {
  if (!raw) return "";
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return "";

  const yyyy = parsed.getFullYear();
  const mm = String(parsed.getMonth() + 1).padStart(2, "0");
  const dd = String(parsed.getDate()).padStart(2, "0");
  const hh = String(parsed.getHours()).padStart(2, "0");
  const min = String(parsed.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}T${hh}:${min}`;
};

const parseMetadataFromDescription = (description: string): ParsedMetadata => {
  const lines = String(description || "").split("\n");
  const metadataMap = new Map<string, string>();
  const instructionLines: string[] = [];

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    if (line.includes(": ")) {
      const [key, ...rest] = line.split(": ");
      const value = rest.join(": ").trim();
      if (
        key === "Module / Unit" ||
        key === "Available From" ||
        key === "Due Date" ||
        key === "Lock Date (Until)" ||
        key === "Submission Type" ||
        key === "Allowed File Extensions"
      ) {
        metadataMap.set(key, value);
        continue;
      }
    }

    instructionLines.push(rawLine);
  }

  const submissionTypeLabel =
    metadataMap.get("Submission Type") || "File Upload";
  const submissionType =
    submissionTypeLabel === "Text Entry"
      ? "text-entry"
      : submissionTypeLabel === "On Paper / In Class"
        ? "on-paper"
        : "file-upload";

  return {
    instructions: instructionLines.join("\n").trim(),
    moduleTitle: metadataMap.get("Module / Unit") || "",
    availableFrom:
      metadataMap.get("Available From") &&
      metadataMap.get("Available From") !== "Not set"
        ? toDatetimeLocal(metadataMap.get("Available From"))
        : "",
    dueDate:
      metadataMap.get("Due Date") && metadataMap.get("Due Date") !== "Not set"
        ? toDatetimeLocal(metadataMap.get("Due Date"))
        : "",
    lockDate:
      metadataMap.get("Lock Date (Until)") &&
      metadataMap.get("Lock Date (Until)") !== "Not set"
        ? toDatetimeLocal(metadataMap.get("Lock Date (Until)"))
        : "",
    submissionType,
    allowedFileExtensions: metadataMap.get("Allowed File Extensions") || "",
  };
};

export function AssignmentEditPage() {
  const router = useRouter();
  const params = useParams();
  const editorRef = useRef<HTMLDivElement>(null);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  const classId = String(params.classId || "");
  const assignmentId = String(params.assignmentId || "");

  const backHref = `/dashboard/teacher/assignments?id=${encodeURIComponent(classId)}`;

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [classModules, setClassModules] = useState<ClassModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingModules, setLoadingModules] = useState(false);
  const [title, setTitle] = useState("");
  const [targetClassId, setTargetClassId] = useState("");
  const [moduleUnit, setModuleUnit] = useState("");
  const [moduleTitlePrefill, setModuleTitlePrefill] = useState("");
  const [availableFrom, setAvailableFrom] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [lockDate, setLockDate] = useState("");
  const [maxPoints, setMaxPoints] = useState("100");
  const [submissionType, setSubmissionType] =
    useState<SubmissionType>("file-upload");
  const [allowedFileExtensions, setAllowedFileExtensions] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [editorIsEmpty, setEditorIsEmpty] = useState(true);
  const [editorSeedHtml, setEditorSeedHtml] = useState("");

  useEffect(() => {
    if (!editorRef.current) {
      return;
    }

    editorRef.current.innerHTML = editorSeedHtml;
    const editorText = String(editorRef.current.innerText || "").trim();
    setEditorIsEmpty(editorText.length === 0);
  }, [editorSeedHtml]);

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

    const loadEditData = async () => {
      try {
        setLoading(true);

        const teacherId = await resolveTeacherId();
        if (teacherId) {
          const classRes = await fetchApiFirstOk(
            `/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`,
            { cache: "no-store" },
          );
          const payload: Array<{ id?: string; name?: string }> =
            await classRes.json();
          const mapped = (Array.isArray(payload) ? payload : [])
            .map((item) => ({
              id: String(item.id || "").trim(),
              name: String(item.name || "Untitled Class").trim(),
            }))
            .filter((item) => item.id.length > 0);
          setClasses(mapped);
        }

        const assignmentRes = await fetchApiFirstOk(
          `/api/classes/${encodeURIComponent(classId)}/assignments/${encodeURIComponent(assignmentId)}`,
          { cache: "no-store" },
        );
        const assignmentData = (await assignmentRes.json()) as AssignmentApi;

        const rawDescription = String(assignmentData?.description || "");
        const parsed = parseMetadataFromDescription(rawDescription);

        setTitle(String(assignmentData?.title || ""));
        setTargetClassId(String(assignmentData?.classId || classId));
        setDueDate(
          parsed.dueDate ||
            toDatetimeLocal(String(assignmentData?.deadline || "")),
        );
        setAvailableFrom(parsed.availableFrom || "");
        setLockDate(parsed.lockDate || "");
        setMaxPoints(String(assignmentData?.maxScore || 100));
        setSubmissionType(parsed.submissionType);
        setAllowedFileExtensions(parsed.allowedFileExtensions);
        setModuleTitlePrefill(parsed.moduleTitle);
        setEditorSeedHtml(parsed.instructions || rawDescription);
      } catch {
        setSubmitError("Unable to load assignment details.");
      } finally {
        setLoading(false);
      }
    };

    void loadEditData();
  }, [assignmentId, classId]);

  useEffect(() => {
    if (!targetClassId) {
      setClassModules([]);
      setModuleUnit("");
      return;
    }

    const loadModules = async () => {
      try {
        setLoadingModules(true);

        const res = await fetchApiFirstOk(
          `/api/classes/${targetClassId}/modules`,
          {
            cache: "no-store",
          },
        );
        const payload: Array<{ id?: string; title?: string; order?: number }> =
          await res.json();

        const mapped = (Array.isArray(payload) ? payload : [])
          .map((item) => ({
            id: String(item.id || "").trim(),
            title: String(item.title || "").trim(),
            order: item.order,
          }))
          .filter((item) => item.id.length > 0 && item.title.length > 0)
          .sort(
            (left, right) =>
              (left.order ?? Number.MAX_SAFE_INTEGER) -
              (right.order ?? Number.MAX_SAFE_INTEGER),
          );

        setClassModules(mapped);

        const titleMatch = mapped.find(
          (item) =>
            item.title.toLowerCase() === moduleTitlePrefill.toLowerCase(),
        );
        setModuleUnit((previous) => {
          if (previous && mapped.some((item) => item.id === previous)) {
            return previous;
          }
          return titleMatch?.id || mapped[0]?.id || "";
        });
      } catch {
        setClassModules([]);
        setModuleUnit("");
      } finally {
        setLoadingModules(false);
      }
    };

    void loadModules();
  }, [moduleTitlePrefill, targetClassId]);

  const focusEditor = () => {
    editorRef.current?.focus();
  };

  const readEditorContent = () => {
    const html = String(editorRef.current?.innerHTML || "").trim();
    const text = String(editorRef.current?.innerText || "").trim();
    return { html, text };
  };

  const handleEditorInput = () => {
    const { text } = readEditorContent();
    setEditorIsEmpty(!text);
  };

  const applyCommand = (command: string) => {
    focusEditor();
    document.execCommand(command.trim().toLowerCase(), false);
    handleEditorInput();
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
    handleEditorInput();
  };

  const appendFiles = (incomingFiles: FileList | null) => {
    if (!incomingFiles || incomingFiles.length === 0) {
      return;
    }

    setAttachedFiles((previous) => {
      const existing = new Set(
        previous.map((file) => `${file.name}::${file.size}::${file.type}`),
      );
      const next = [...previous];

      Array.from(incomingFiles).forEach((file) => {
        const key = `${file.name}::${file.size}::${file.type}`;
        if (!existing.has(key)) {
          existing.add(key);
          next.push(file);
        }
      });

      return next;
    });
  };

  const handleFileBrowse = (event: ChangeEvent<HTMLInputElement>) => {
    appendFiles(event.target.files);
    event.target.value = "";
  };

  const handleDropFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
    appendFiles(event.dataTransfer.files);
  };

  const handleDragOverFiles = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault();
  };

  const handleCancel = () => {
    router.push(backHref);
  };

  const handleSaveChanges = async () => {
    const selectedModuleTitle =
      classModules.find((item) => item.id === moduleUnit)?.title ||
      "Not selected";

    const trimmedTitle = title.trim();
    const { html, text } = readEditorContent();
    const parsedMaxPoints = Number(maxPoints);

    if (!trimmedTitle) {
      setSubmitError("Assignment title is required.");
      return;
    }

    if (!targetClassId) {
      setSubmitError("Please select a target class.");
      return;
    }

    if (!text) {
      setSubmitError("Assignment instructions are required.");
      return;
    }

    if (!dueDate) {
      setSubmitError("Please choose a due date and time.");
      return;
    }

    if (!Number.isFinite(parsedMaxPoints) || parsedMaxPoints <= 0) {
      setSubmitError("Maximum points must be greater than 0.");
      return;
    }

    try {
      setSubmitError("");
      setSubmitting(true);

      const metadataLines = [
        `Module / Unit: ${selectedModuleTitle}`,
        `Available From: ${availableFrom || "Not set"}`,
        `Due Date: ${dueDate}`,
        `Lock Date (Until): ${lockDate || "Not set"}`,
        `Submission Type: ${submissionTypeLabels[submissionType]}`,
      ];

      if (submissionType === "file-upload" && allowedFileExtensions.trim()) {
        metadataLines.push(
          `Allowed File Extensions: ${allowedFileExtensions.trim()}`,
        );
      }

      if (attachedFiles.length > 0) {
        metadataLines.push(
          `Teacher Attachments: ${attachedFiles
            .map((file) => file.name)
            .join(", ")}`,
        );
      }

      const description = `${text}\n\n${metadataLines.join("\n")}`;

      await fetchApiFirstOk(
        `/api/classes/${encodeURIComponent(targetClassId)}/assignments/${encodeURIComponent(assignmentId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: targetClassId,
            title: trimmedTitle,
            description,
            deadline: dueDate,
            maxScore: parsedMaxPoints,
          }),
        },
      );

      toast({
        title: "Assignment updated successfully",
        description: "Your assignment changes have been saved.",
      });

      router.push(
        `/dashboard/teacher/assignments?id=${encodeURIComponent(targetClassId)}`,
      );
    } catch {
      setSubmitError("Unable to save assignment changes right now.");
    } finally {
      setSubmitting(false);
      setEditorSeedHtml(html);
    }
  };

  const classNameForTitle = useMemo(() => {
    return (
      classes.find((item) => item.id === targetClassId)?.name ||
      classes.find((item) => item.id === classId)?.name ||
      "Selected Class"
    );
  }, [classId, classes, targetClassId]);

  if (loading) {
    return (
      <div className="min-h-full rounded-lg bg-[#FCF9F0] p-4 md:p-6">
        <div className="mx-auto w-full max-w-4xl space-y-4">
          <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
          <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
            <div className="space-y-4">
              <div className="h-8 w-56 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-80 animate-pulse rounded bg-gray-200" />
              <div className="h-12 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-12 w-full animate-pulse rounded bg-gray-100" />
              <div className="h-48 w-full animate-pulse rounded bg-gray-100" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <Link
          href={backHref}
          className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Assignments
        </Link>

        <div className="rounded-xl border border-gray-100 bg-white p-8 shadow-sm">
          <div className="space-y-8">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tight text-slate-900">
                Edit Assignment
              </h1>
              <p className="text-sm text-muted-foreground">
                Update assignment details, instructions, and delivery settings.
              </p>
            </div>

            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="assignment-title">Assignment Title</Label>
                <Input
                  id="assignment-title"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="Enter assignment title"
                  className="h-12 text-lg font-medium"
                />
              </div>

              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="assignment-target-class">Target Class</Label>
                  <Select
                    value={targetClassId}
                    onValueChange={setTargetClassId}
                  >
                    <SelectTrigger
                      id="assignment-target-class"
                      className="h-11"
                    >
                      <SelectValue placeholder="Select a class" />
                    </SelectTrigger>
                    <SelectContent>
                      {classes.map((teacherClass) => (
                        <SelectItem
                          key={teacherClass.id}
                          value={teacherClass.id}
                        >
                          {teacherClass.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="assignment-module-unit">Module / Unit</Label>
                  <Select
                    value={moduleUnit}
                    onValueChange={setModuleUnit}
                    disabled={loadingModules || classModules.length === 0}
                  >
                    <SelectTrigger id="assignment-module-unit" className="h-11">
                      <SelectValue
                        placeholder={
                          loadingModules
                            ? "Loading modules..."
                            : "No modules defined for this class."
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {classModules.map((moduleItem) => (
                        <SelectItem key={moduleItem.id} value={moduleItem.id}>
                          {moduleItem.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label>Assignment Instructions</Label>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 bg-[#FCF9F0] px-3 py-2">
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

                <div className="relative min-h-[250px]">
                  {editorIsEmpty ? (
                    <span className="pointer-events-none absolute left-4 top-3 text-sm text-muted-foreground">
                      Write assignment instructions, resources, and submission
                      guidelines...
                    </span>
                  ) : null}

                  <div
                    ref={editorRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleEditorInput}
                    className="min-h-[250px] w-full px-4 py-3 text-sm leading-6 text-foreground focus:outline-none"
                  />
                </div>
              </div>

              <input
                ref={attachmentInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={handleFileBrowse}
              />
              <label
                className="block cursor-pointer rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-6 text-center"
                onDrop={handleDropFiles}
                onDragOver={handleDragOverFiles}
                onClick={() => attachmentInputRef.current?.click()}
              >
                <UploadCloud className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  Drag & drop files here, or click to browse (Provide starter
                  code, worksheets, or datasets for students).
                </p>
              </label>
              {attachedFiles.length > 0 ? (
                <p className="text-sm text-muted-foreground">
                  Attached: {attachedFiles.map((file) => file.name).join(", ")}
                </p>
              ) : null}
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="space-y-3 md:col-span-3">
                <Label>Availability Window</Label>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="assignment-available-from">
                      Available From
                    </Label>
                    <Input
                      id="assignment-available-from"
                      type="datetime-local"
                      value={availableFrom}
                      onChange={(event) => setAvailableFrom(event.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-due-date">Due Date</Label>
                    <Input
                      id="assignment-due-date"
                      type="datetime-local"
                      value={dueDate}
                      onChange={(event) => setDueDate(event.target.value)}
                      className="h-11"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="assignment-lock-date">
                      Lock Date (Until)
                    </Label>
                    <Input
                      id="assignment-lock-date"
                      type="datetime-local"
                      value={lockDate}
                      onChange={(event) => setLockDate(event.target.value)}
                      className="h-11"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-max-points">Maximum Points</Label>
                <Input
                  id="assignment-max-points"
                  type="number"
                  min="1"
                  value={maxPoints}
                  onChange={(event) => setMaxPoints(event.target.value)}
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="assignment-submission-type">
                  Submission Type
                </Label>
                <Select
                  value={submissionType}
                  onValueChange={(value) =>
                    setSubmissionType(value as SubmissionType)
                  }
                >
                  <SelectTrigger
                    id="assignment-submission-type"
                    className="h-11"
                  >
                    <SelectValue placeholder="Select submission type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="file-upload">File Upload</SelectItem>
                    <SelectItem value="text-entry">Text Entry</SelectItem>
                    <SelectItem value="on-paper">
                      On Paper / In Class
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {submissionType === "file-upload" ? (
                <div className="space-y-2">
                  <Label htmlFor="assignment-allowed-file-extensions">
                    Allowed File Extensions
                  </Label>
                  <Input
                    id="assignment-allowed-file-extensions"
                    value={allowedFileExtensions}
                    onChange={(event) =>
                      setAllowedFileExtensions(event.target.value)
                    }
                    placeholder="e.g., .pdf, .zip (Leave blank to allow all)"
                    className="h-11"
                  />
                </div>
              ) : null}
            </div>

            {submitError ? (
              <p className="text-sm text-destructive">{submitError}</p>
            ) : null}

            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
              <Button
                type="button"
                variant="ghost"
                className="px-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
                onClick={handleCancel}
                disabled={submitting}
              >
                Cancel
              </Button>

              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  className="bg-emerald-600 text-white hover:bg-emerald-700"
                  onClick={handleSaveChanges}
                  disabled={submitting || loadingModules}
                >
                  {submitting ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground">
          Editing class: {classNameForTitle}
        </p>
      </div>
    </div>
  );
}
