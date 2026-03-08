"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
} from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import {
  ArrowLeft,
  BookOpen,
  CalendarIcon,
  CheckSquare,
  Clock3,
  FileText,
  GraduationCap,
  Link2,
  MoreHorizontal,
  Plus,
  Send,
  Star,
  Target,
  Trash2,
} from "lucide-react";

import { fetchApiFirstOk } from "@/lib/api";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type LessonStatus =
  | "Draft"
  | "Ready / Scheduled"
  | "Published"
  | "Completed / Taught"
  | "Template";

type RawLessonStatus = LessonStatus | "Upcoming" | "Completed" | "" | string;

type LessonPlan = {
  id: string;
  title: string;
  classId: string;
  date: string;
  status: RawLessonStatus;
  objectives?: string;
  activities?: string;
  materials?: string;
  assessment?: string;
  publishedAssignmentId?: string;
  template: boolean;
};

type TeacherClass = {
  id: string;
  name: string;
};

type LessonPlanDetailPageProps = {
  lessonPlanId: string;
};

type TimelineStep = {
  id: string;
  title: string;
  minutes: number;
  description: string;
};

type ParsedAsset = {
  id: string;
  category: AssetCategory;
  type: "link" | "file";
  title: string;
  value: string;
  isLink: boolean;
};

type EditableAsset = {
  id: string;
  type: "link" | "file";
  title: string;
  value: string;
};

type AssetCategory =
  | "Instructional Materials"
  | "Student Handouts"
  | "Assessments - Formative"
  | "Assessments - Summative"
  | "Evaluation Tools"
  | "Interactive Activities";

const ASSET_CATEGORIES: AssetCategory[] = [
  "Instructional Materials",
  "Student Handouts",
  "Assessments - Formative",
  "Assessments - Summative",
  "Evaluation Tools",
  "Interactive Activities",
];

const sectionLabels = {
  learningObjectives: "Learning Objectives",
  standardsAlignment: "Standards Alignment",
  closureAssessment: "Closure Assessment",
  postLessonReflection: "Post-Lesson Reflection",
  teacherTodo: "Teacher To-Do List",
  duration: "Duration",
  difficulty: "Difficulty (1-5 stars)",
  assetLinker: "Asset Linker",
};

const defaultTimelineSteps = (): TimelineStep[] => [
  {
    id: crypto.randomUUID(),
    title: "Hook / Warm-Up",
    minutes: 5,
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Direct Instruction / I Do",
    minutes: 10,
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Guided Practice / We Do",
    minutes: 12,
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Independent Practice / You Do",
    minutes: 13,
    description: "",
  },
  {
    id: crypto.randomUUID(),
    title: "Closure & Assessment",
    minutes: 5,
    description: "",
  },
];

const emptyEditableAssets = (): Record<AssetCategory, EditableAsset[]> => ({
  "Instructional Materials": [],
  "Student Handouts": [],
  "Assessments - Formative": [],
  "Assessments - Summative": [],
  "Evaluation Tools": [],
  "Interactive Activities": [],
});

const extractSection = (raw: string | undefined, label: string) => {
  if (!raw) return "";
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`${escaped}:\\n([\\s\\S]*?)(?=\\n\\n[^\\n]+:\\n|$)`);
  const match = raw.match(regex);
  return match?.[1]?.trim() || "";
};

const parseDuration = (materials: string | undefined) => {
  const value = extractSection(materials, sectionLabels.duration);
  const numeric = Number.parseInt(value, 10);
  return Number.isFinite(numeric) ? Math.max(numeric, 0) : 0;
};

const parseDifficulty = (materials: string | undefined) => {
  const value = extractSection(materials, sectionLabels.difficulty);
  const numeric = value.match(/(\d)\s*\/\s*5|\b([1-5])\b/);
  return Number.parseInt(numeric?.[1] || numeric?.[2] || "0", 10) || 0;
};

const parseStandardsTags = (standards: string | undefined) => {
  if (!standards || standards === "-") return [];
  return standards
    .split(/\n|,|;/)
    .map((tag) => tag.trim())
    .filter(Boolean);
};

const parseChecklistItems = (materials: string | undefined) => {
  const raw = extractSection(materials, sectionLabels.teacherTodo);
  if (!raw || raw === "-") return [];

  return raw
    .split(/\n|,/)
    .map((line) => line.replace(/^[-•]\s*/, "").trim())
    .filter(Boolean);
};

const parseTimeline = (activities: string | undefined): TimelineStep[] => {
  if (!activities) return defaultTimelineSteps();

  const pattern =
    /(Hook \/ Warm-Up|Direct Instruction \/ I Do|Guided Practice \/ We Do|Independent Practice \/ You Do|Closure & Assessment|[^\n]+)\s*\((\d+)\s*mins?\):\n([\s\S]*?)(?=\n\n(?:Hook \/ Warm-Up|Direct Instruction \/ I Do|Guided Practice \/ We Do|Independent Practice \/ You Do|Closure & Assessment|[^\n]+)\s*\(\d+\s*mins?\):|\n\nTotal Arc Minutes:|\n\nDifferentiation & Accessibility:|$)/g;

  const steps: TimelineStep[] = [];
  let match = pattern.exec(activities);
  while (match) {
    steps.push({
      id: crypto.randomUUID(),
      title: match[1].trim(),
      minutes: Number.parseInt(match[2], 10) || 0,
      description: match[3].trim(),
    });
    match = pattern.exec(activities);
  }

  if (steps.length > 0) {
    return steps;
  }

  return defaultTimelineSteps();
};

const parseAssets = (materials: string | undefined): ParsedAsset[] => {
  if (!materials) return [];

  const assets: ParsedAsset[] = [];

  ASSET_CATEGORIES.forEach((category) => {
    const content = extractSection(materials, category);
    if (!content || content === "-") return;

    content
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.startsWith("-"))
      .forEach((line) => {
        const normalized = line.replace(/^-\s*/, "");
        const fullMatch = normalized.match(/^\[(.*?)\]\s*(.*?):\s*(.+)$/);
        const assetType =
          fullMatch?.[1]?.trim().toLowerCase() === "file" ? "file" : "link";
        const title = fullMatch?.[2]?.trim() || "Untitled Asset";
        const value = fullMatch?.[3]?.trim() || "";

        assets.push({
          id: crypto.randomUUID(),
          category,
          type: assetType,
          title,
          value,
          isLink: /^https?:\/\//i.test(value),
        });
      });
  });

  return assets;
};

const normalizeStatus = (
  status: RawLessonStatus,
  template: boolean,
): LessonStatus => {
  if (template || status === "Template") {
    return "Template";
  }
  if (status === "Upcoming") {
    return "Ready / Scheduled";
  }
  if (status === "Completed") {
    return "Completed / Taught";
  }
  if (
    status === "Draft" ||
    status === "Ready / Scheduled" ||
    status === "Published" ||
    status === "Completed / Taught"
  ) {
    return status;
  }
  return "Draft";
};

const statusBadgeVariant = (status: LessonStatus) => {
  if (status === "Published") return "default" as const;
  if (status === "Draft") return "outline" as const;
  return "secondary" as const;
};

const serializeAssetCategory = (items: EditableAsset[]) => {
  if (!items.length) {
    return "-";
  }

  return items
    .map((item) => {
      const displayTitle = item.title.trim() || "Untitled Asset";
      const displayValue = item.value.trim() || "(not linked yet)";
      return `- [${item.type}] ${displayTitle}: ${displayValue}`;
    })
    .join("\n");
};

const joinUrlParts = (base: string, fileName: string) => {
  const normalizedBase = base.endsWith("/") ? base : `${base}/`;
  const encodedPath = fileName
    .split("/")
    .map((segment) => encodeURIComponent(segment.trim()))
    .join("/");

  try {
    return new URL(encodedPath, normalizedBase).toString();
  } catch {
    return "";
  }
};

const resolveAssetHref = (rawValue: string, assetLinkerBase?: string) => {
  const value = rawValue.trim();
  if (!value) return "";

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (/^www\./i.test(value)) {
    return `https://${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  const normalizedBase = (assetLinkerBase || "").trim();
  if (normalizedBase && normalizedBase !== "-") {
    if (/^https?:\/\//i.test(normalizedBase)) {
      return joinUrlParts(normalizedBase, value);
    }

    if (/^www\./i.test(normalizedBase)) {
      return joinUrlParts(`https://${normalizedBase}`, value);
    }

    if (normalizedBase.startsWith("/")) {
      const cleanBase = normalizedBase.replace(/\/+$/, "");
      const encodedFile = value
        .split("/")
        .map((segment) => encodeURIComponent(segment.trim()))
        .join("/");
      return `${cleanBase}/${encodedFile}`;
    }
  }

  if (/\.pdf(\?.*)?$/i.test(value)) {
    return "";
  }

  return `https://${value}`;
};

const AutoResizeTextarea = ({
  className,
  onInput,
  value,
  ...props
}: ComponentProps<typeof Textarea>) => {
  const ref = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.style.height = "0px";
    ref.current.style.height = `${ref.current.scrollHeight}px`;
  }, [value]);

  return (
    <Textarea
      ref={ref}
      value={value}
      className={cn("resize-none overflow-hidden", className)}
      onInput={(event) => {
        const target = event.currentTarget;
        target.style.height = "0px";
        target.style.height = `${target.scrollHeight}px`;
        onInput?.(event);
      }}
      {...props}
    />
  );
};

export function LessonPlanDetailPage({
  lessonPlanId,
}: LessonPlanDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lessonPlan, setLessonPlan] = useState<LessonPlan | null>(null);
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const [checklistState, setChecklistState] = useState<Record<string, boolean>>(
    {},
  );

  const [titleInput, setTitleInput] = useState("");
  const [classIdInput, setClassIdInput] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [statusInput, setStatusInput] = useState<LessonStatus>("Draft");
  const [durationMinutes, setDurationMinutes] = useState(45);
  const [difficulty, setDifficulty] = useState<0 | 1 | 2 | 3 | 4 | 5>(0);

  const [learningObjectivesInput, setLearningObjectivesInput] = useState("");
  const [standardsTags, setStandardsTags] = useState<string[]>([]);
  const [standardsDraft, setStandardsDraft] = useState("");

  const [timelineSteps, setTimelineSteps] = useState<TimelineStep[]>(
    defaultTimelineSteps(),
  );
  const [closureAssessmentInput, setClosureAssessmentInput] = useState("");
  const [postReflectionInput, setPostReflectionInput] = useState("");

  const [assetsByCategory, setAssetsByCategory] = useState<
    Record<AssetCategory, EditableAsset[]>
  >(emptyEditableAssets());
  const [teacherTodoInput, setTeacherTodoInput] = useState("");
  const [initialEditorSnapshot, setInitialEditorSnapshot] = useState("");

  const classNameById = useMemo(() => {
    return classes.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [classes]);

  const lifecycleStatus = lessonPlan
    ? normalizeStatus(lessonPlan.status, lessonPlan.template)
    : "Draft";

  const isTaught = lifecycleStatus === "Completed / Taught";

  const hydrateEditorState = (plan: LessonPlan) => {
    const normalized = normalizeStatus(plan.status, plan.template);

    const standardsRaw = extractSection(
      plan.objectives,
      sectionLabels.standardsAlignment,
    );
    const learningObjectivesRaw = extractSection(
      plan.objectives,
      sectionLabels.learningObjectives,
    );

    const parsedTimeline = parseTimeline(plan.activities);
    const parsedAssets = parseAssets(plan.materials);
    const nextAssets = emptyEditableAssets();
    parsedAssets.forEach((asset) => {
      nextAssets[asset.category].push({
        id: asset.id,
        type: asset.type,
        title: asset.title,
        value: asset.value,
      });
    });

    const todos = parseChecklistItems(plan.materials);

    setTitleInput(plan.title || "");
    setClassIdInput(plan.classId || "");
    setDateInput(
      plan.date ? format(new Date(plan.date), "yyyy-MM-dd'T'HH:mm") : "",
    );
    setStatusInput(normalized);
    setDurationMinutes(parseDuration(plan.materials));
    setDifficulty(
      Math.min(Math.max(parseDifficulty(plan.materials), 0), 5) as
        | 0
        | 1
        | 2
        | 3
        | 4
        | 5,
    );
    setLearningObjectivesInput(learningObjectivesRaw || plan.objectives || "");
    setStandardsTags(parseStandardsTags(standardsRaw));
    setTimelineSteps(parsedTimeline);
    setClosureAssessmentInput(
      extractSection(plan.assessment, sectionLabels.closureAssessment) ||
        plan.assessment ||
        "",
    );
    setPostReflectionInput(
      extractSection(plan.assessment, sectionLabels.postLessonReflection),
    );
    setAssetsByCategory(nextAssets);
    setTeacherTodoInput(todos.join("\n"));
    setChecklistState(
      todos.reduce<Record<string, boolean>>((acc, item) => {
        acc[item] = false;
        return acc;
      }, {}),
    );

    const snapshot = JSON.stringify({
      title: plan.title || "",
      classId: plan.classId || "",
      date: plan.date ? format(new Date(plan.date), "yyyy-MM-dd'T'HH:mm") : "",
      status: normalized,
      durationMinutes: parseDuration(plan.materials),
      difficulty: Math.min(Math.max(parseDifficulty(plan.materials), 0), 5),
      learningObjectivesInput: learningObjectivesRaw || plan.objectives || "",
      standardsTags: parseStandardsTags(standardsRaw),
      timelineSteps: parsedTimeline,
      closureAssessmentInput:
        extractSection(plan.assessment, sectionLabels.closureAssessment) ||
        plan.assessment ||
        "",
      postReflectionInput: extractSection(
        plan.assessment,
        sectionLabels.postLessonReflection,
      ),
      assetsByCategory: nextAssets,
      teacherTodoInput: todos.join("\n"),
    });
    setInitialEditorSnapshot(snapshot);
  };

  const currentEditorSnapshot = useMemo(
    () =>
      JSON.stringify({
        title: titleInput,
        classId: classIdInput,
        date: dateInput,
        status: statusInput,
        durationMinutes,
        difficulty,
        learningObjectivesInput,
        standardsTags,
        timelineSteps,
        closureAssessmentInput,
        postReflectionInput,
        assetsByCategory,
        teacherTodoInput,
      }),
    [
      titleInput,
      classIdInput,
      dateInput,
      statusInput,
      durationMinutes,
      difficulty,
      learningObjectivesInput,
      standardsTags,
      timelineSteps,
      closureAssessmentInput,
      postReflectionInput,
      assetsByCategory,
      teacherTodoInput,
    ],
  );

  const hasUnsavedChanges =
    isEditing &&
    initialEditorSnapshot.length > 0 &&
    currentEditorSnapshot !== initialEditorSnapshot;

  const confirmDiscardChanges = () => {
    if (!hasUnsavedChanges) {
      return true;
    }

    return window.confirm(
      "You have unsaved changes. Discard them and continue?",
    );
  };

  useEffect(() => {
    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!hasUnsavedChanges) {
        return;
      }
      event.preventDefault();
      event.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      setError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        setLoading(true);
        setError(null);

        const [classesRes, lessonPlansRes] = await Promise.all([
          fetchApiFirstOk(`/api/classes/my?teacherId=${teacherId}`, {
            cache: "no-store",
          }),
          fetchApiFirstOk(`/api/lesson-plans?teacherId=${teacherId}`, {
            cache: "no-store",
          }),
        ]);

        const classesData = await classesRes.json();
        const lessonPlansData = await lessonPlansRes.json();

        const allPlans = Array.isArray(lessonPlansData) ? lessonPlansData : [];
        const matched =
          allPlans.find((plan: LessonPlan) => plan.id === lessonPlanId) || null;

        setClasses(Array.isArray(classesData) ? classesData : []);
        setLessonPlan(matched);

        if (!matched) {
          setError("Không tìm thấy lesson plan.");
          return;
        }

        hydrateEditorState(matched);

        if (searchParams.get("mode") === "edit") {
          setIsEditing(true);
        }
      } catch (loadError) {
        console.error(loadError);
        setError("Không thể tải lesson plan.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [lessonPlanId, searchParams]);

  const handleSave = async () => {
    if (!lessonPlan) {
      return;
    }

    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      setError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const buildLessonUpdatePayload = (nextStatus?: LessonStatus) => {
        const effectiveStatus = nextStatus ?? statusInput;
        const isTemplate = effectiveStatus === "Template";

        const totalArcMinutes = timelineSteps.reduce(
          (sum, step) => sum + Math.max(step.minutes, 0),
          0,
        );

        const objectives = [
          `Learning Objectives:\n${learningObjectivesInput.trim() || "-"}`,
          `Standards Alignment:\n${standardsTags.length ? standardsTags.join(", ") : "-"}`,
        ].join("\n\n");

        const activities = [
          "Lesson Arc (Gradual Release):",
          ...timelineSteps.map(
            (step) =>
              `${step.title.trim() || "Lesson Step"} (${Math.max(step.minutes, 0)} mins):\n${
                step.description.trim() || "-"
              }`,
          ),
          `Total Arc Minutes: ${totalArcMinutes}`,
        ].join("\n\n");

        const materials = [
          "Lesson Logistics:",
          `Difficulty (1-5 stars): ${
            difficulty > 0
              ? `${difficulty} / 5 (${"★".repeat(difficulty)}${"☆".repeat(5 - difficulty)})`
              : "-"
          }`,
          `Duration: ${durationMinutes > 0 ? `${durationMinutes} mins` : "-"}`,
          "Materials & Assets Library:",
          ...ASSET_CATEGORIES.map(
            (category) =>
              `${category}:\n${serializeAssetCategory(assetsByCategory[category])}`,
          ),
          `Teacher To-Do List:\n${teacherTodoInput.trim() || "-"}`,
        ].join("\n\n");

        const assessment = [
          `Closure Assessment:\n${closureAssessmentInput.trim() || "-"}`,
          `Post-Lesson Reflection:\n${postReflectionInput.trim() || "-"}`,
        ].join("\n\n");

        return {
          classId: isTemplate ? "" : classIdInput,
          title: titleInput.trim() || lessonPlan.title,
          date: dateInput ? new Date(dateInput).toISOString() : lessonPlan.date,
          status: effectiveStatus,
          objectives,
          activities,
          materials,
          assessment,
          template: isTemplate,
        };
      };

      const res = await fetchApiFirstOk(
        `/api/lesson-plans/${lessonPlan.id}?teacherId=${encodeURIComponent(teacherId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            ...buildLessonUpdatePayload(),
          }),
        },
        8000,
      );

      const updated = await res.json();
      setLessonPlan(updated);
      hydrateEditorState(updated);
      setIsEditing(false);
    } catch (saveError) {
      console.error(saveError);
      setError("Không thể lưu thay đổi lesson plan.");
    } finally {
      setSaving(false);
    }
  };

  const handleQuickPublish = async () => {
    if (!lessonPlan) return;

    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      setError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      const totalArcMinutes = timelineSteps.reduce(
        (sum, step) => sum + Math.max(step.minutes, 0),
        0,
      );

      const objectives = [
        `Learning Objectives:\n${learningObjectivesInput.trim() || "-"}`,
        `Standards Alignment:\n${standardsTags.length ? standardsTags.join(", ") : "-"}`,
      ].join("\n\n");

      const activities = [
        "Lesson Arc (Gradual Release):",
        ...timelineSteps.map(
          (step) =>
            `${step.title.trim() || "Lesson Step"} (${Math.max(step.minutes, 0)} mins):\n${
              step.description.trim() || "-"
            }`,
        ),
        `Total Arc Minutes: ${totalArcMinutes}`,
      ].join("\n\n");

      const materials = [
        "Lesson Logistics:",
        `Difficulty (1-5 stars): ${
          difficulty > 0
            ? `${difficulty} / 5 (${"★".repeat(difficulty)}${"☆".repeat(5 - difficulty)})`
            : "-"
        }`,
        `Duration: ${durationMinutes > 0 ? `${durationMinutes} mins` : "-"}`,
        "Materials & Assets Library:",
        ...ASSET_CATEGORIES.map(
          (category) =>
            `${category}:\n${serializeAssetCategory(assetsByCategory[category])}`,
        ),
        `Teacher To-Do List:\n${teacherTodoInput.trim() || "-"}`,
      ].join("\n\n");

      const assessment = [
        `Closure Assessment:\n${closureAssessmentInput.trim() || "-"}`,
        `Post-Lesson Reflection:\n${postReflectionInput.trim() || "-"}`,
      ].join("\n\n");

      const res = await fetchApiFirstOk(
        `/api/lesson-plans/${lessonPlan.id}?teacherId=${encodeURIComponent(teacherId)}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            classId: classIdInput || lessonPlan.classId,
            title: titleInput.trim() || lessonPlan.title,
            date: dateInput
              ? new Date(dateInput).toISOString()
              : lessonPlan.date,
            status: "Published",
            objectives,
            activities,
            materials,
            assessment,
            template: false,
          }),
        },
        8000,
      );

      const updated = await res.json();
      setLessonPlan(updated);

      const targetId =
        typeof updated?.publishedAssignmentId === "string" &&
        updated.publishedAssignmentId.length > 0
          ? updated.publishedAssignmentId
          : lessonPlan.classId;

      if (typeof targetId === "string" && targetId.length > 0) {
        router.push(
          `/dashboard/teacher/assignments?id=${encodeURIComponent(targetId)}`,
        );
      } else {
        router.push("/dashboard/teacher/assignments");
      }
    } catch (publishError) {
      console.error(publishError);
      setError("Không thể publish lesson plan.");
    } finally {
      setSaving(false);
    }
  };

  const addStandardTag = () => {
    const candidate = standardsDraft.trim();
    if (!candidate) return;
    if (
      standardsTags.some(
        (item) => item.toLowerCase() === candidate.toLowerCase(),
      )
    ) {
      setStandardsDraft("");
      return;
    }
    setStandardsTags((prev) => [...prev, candidate]);
    setStandardsDraft("");
  };

  const addTimelineStep = () => {
    setTimelineSteps((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        title: "New Step",
        minutes: 5,
        description: "",
      },
    ]);
  };

  const updateTimelineStep = (
    stepId: string,
    patch: Partial<Pick<TimelineStep, "title" | "minutes" | "description">>,
  ) => {
    setTimelineSteps((prev) =>
      prev.map((step) => (step.id === stepId ? { ...step, ...patch } : step)),
    );
  };

  const removeTimelineStep = (stepId: string) => {
    setTimelineSteps((prev) => prev.filter((step) => step.id !== stepId));
  };

  const addAsset = (category: AssetCategory) => {
    setAssetsByCategory((prev) => ({
      ...prev,
      [category]: [
        ...prev[category],
        {
          id: crypto.randomUUID(),
          type: "link",
          title: "",
          value: "",
        },
      ],
    }));
  };

  const updateAsset = (
    category: AssetCategory,
    assetId: string,
    patch: Partial<EditableAsset>,
  ) => {
    setAssetsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].map((asset) =>
        asset.id === assetId ? { ...asset, ...patch } : asset,
      ),
    }));
  };

  const removeAsset = (category: AssetCategory, assetId: string) => {
    setAssetsByCategory((prev) => ({
      ...prev,
      [category]: prev[category].filter((asset) => asset.id !== assetId),
    }));
  };

  const parsedAssets = useMemo(
    () => parseAssets(lessonPlan?.materials),
    [lessonPlan?.materials],
  );
  const todoItems = useMemo(
    () => parseChecklistItems(lessonPlan?.materials),
    [lessonPlan?.materials],
  );
  const learningObjectives = useMemo(
    () =>
      extractSection(lessonPlan?.objectives, sectionLabels.learningObjectives),
    [lessonPlan?.objectives],
  );
  const standardsAlignment = useMemo(
    () =>
      extractSection(lessonPlan?.objectives, sectionLabels.standardsAlignment),
    [lessonPlan?.objectives],
  );
  const timelineForView = useMemo(
    () => parseTimeline(lessonPlan?.activities),
    [lessonPlan?.activities],
  );
  const closureAssessment = useMemo(
    () =>
      extractSection(lessonPlan?.assessment, sectionLabels.closureAssessment),
    [lessonPlan?.assessment],
  );
  const postLessonReflection = useMemo(
    () =>
      extractSection(
        lessonPlan?.assessment,
        sectionLabels.postLessonReflection,
      ),
    [lessonPlan?.assessment],
  );
  const assetLinkerBase = useMemo(() => {
    const raw = extractSection(
      lessonPlan?.materials,
      sectionLabels.assetLinker,
    );
    if (!raw || raw === "-") {
      return "";
    }

    return (
      raw
        .split("\n")
        .map((line) => line.trim())
        .find((line) => line.length > 0 && line !== "-") || ""
    );
  }, [lessonPlan?.materials]);

  useEffect(() => {
    if (!todoItems.length) {
      setChecklistState({});
      return;
    }

    setChecklistState((prev) => {
      const next: Record<string, boolean> = {};
      todoItems.forEach((item) => {
        next[item] = prev[item] || false;
      });
      return next;
    });
  }, [todoItems]);

  if (loading) {
    return <div className="p-6">Loading lesson plan...</div>;
  }

  if (error || !lessonPlan) {
    return (
      <div className="flex flex-col gap-4">
        <Button
          variant="outline"
          className="w-fit"
          onClick={() => router.push("/dashboard/teacher/lesson-plans")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lesson Plans
        </Button>
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-destructive">
              {error || "Lesson plan not found."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isEditing) {
    return (
      <div className="space-y-6">
        <div className="sticky top-0 z-20 rounded-lg border bg-background/95 p-3 shadow-sm backdrop-blur">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <Button
              variant="outline"
              onClick={() => {
                if (!confirmDiscardChanges()) return;
                router.push("/dashboard/teacher/lesson-plans");
              }}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>

            <Input
              value={titleInput}
              onChange={(event) => setTitleInput(event.target.value)}
              className="h-12 text-xl font-semibold lg:max-w-2xl"
              placeholder="Lesson title"
            />

            <div className="flex items-center gap-2 self-end lg:self-auto">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => window.print()}>
                    Print
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleQuickPublish}
                    disabled={
                      saving ||
                      statusInput === "Template" ||
                      lifecycleStatus === "Published"
                    }
                  >
                    Publish to Student Portal
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button
                variant="secondary"
                onClick={() => {
                  if (!confirmDiscardChanges()) return;
                  setIsEditing(false);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Foundation & Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Learning Objectives</p>
                  <AutoResizeTextarea
                    value={learningObjectivesInput}
                    onChange={(event) =>
                      setLearningObjectivesInput(event.target.value)
                    }
                    className="min-h-[120px]"
                    placeholder="What should students know or be able to do by the end of this lesson?"
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-sm font-medium">Standards Alignment</p>
                  <div className="flex flex-wrap gap-2">
                    {standardsTags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() =>
                            setStandardsTags((prev) =>
                              prev.filter((item) => item !== tag),
                            )
                          }
                        >
                          ×
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input
                      value={standardsDraft}
                      onChange={(event) =>
                        setStandardsDraft(event.target.value)
                      }
                      placeholder="Add standard tag (e.g., CCSS.ELA-LITERACY.RI.6.1)"
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          addStandardTag();
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addStandardTag}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">Lesson Arc</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addTimelineStep}
                >
                  <Plus className="mr-1 h-4 w-4" />
                  Add Step
                </Button>
              </CardHeader>
              <CardContent className="space-y-4">
                {timelineSteps.map((step, index) => (
                  <div key={step.id} className="rounded-md border p-3">
                    <div className="mb-3 grid grid-cols-1 gap-3 md:grid-cols-[1fr_110px_auto]">
                      <Input
                        value={step.title}
                        onChange={(event) =>
                          updateTimelineStep(step.id, {
                            title: event.target.value,
                          })
                        }
                        placeholder={`Step ${index + 1} title`}
                      />
                      <Input
                        type="number"
                        min={0}
                        value={step.minutes}
                        onChange={(event) =>
                          updateTimelineStep(step.id, {
                            minutes: Math.max(
                              Number.parseInt(event.target.value || "0", 10),
                              0,
                            ),
                          })
                        }
                        placeholder="Minutes"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeTimelineStep(step.id)}
                        disabled={timelineSteps.length <= 1}
                        aria-label="Remove step"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <AutoResizeTextarea
                      value={step.description}
                      onChange={(event) =>
                        updateTimelineStep(step.id, {
                          description: event.target.value,
                        })
                      }
                      className="min-h-[88px]"
                      placeholder="Describe what happens during this step"
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">
                  Assessment & Reflection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Closure Assessment</p>
                  <AutoResizeTextarea
                    value={closureAssessmentInput}
                    onChange={(event) =>
                      setClosureAssessmentInput(event.target.value)
                    }
                    className="min-h-[96px]"
                    placeholder="Exit ticket or final check for understanding"
                  />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium">Post-Lesson Reflection</p>
                  <AutoResizeTextarea
                    value={postReflectionInput}
                    onChange={(event) =>
                      setPostReflectionInput(event.target.value)
                    }
                    className="min-h-[96px]"
                    placeholder="What worked, what to improve next time"
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Lesson Logistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Class</p>
                  <Select
                    value={classIdInput || undefined}
                    onValueChange={setClassIdInput}
                    disabled={statusInput === "Template"}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select class" />
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

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Date</p>
                  <Input
                    type="datetime-local"
                    value={dateInput}
                    onChange={(event) => setDateInput(event.target.value)}
                    disabled={statusInput === "Template"}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-sm font-medium">Status</p>
                  <Select
                    value={statusInput}
                    onValueChange={(value) => {
                      const next = value as LessonStatus;
                      setStatusInput(next);
                      if (next === "Template") {
                        setClassIdInput("");
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Draft">Draft</SelectItem>
                      <SelectItem value="Ready / Scheduled">
                        Ready / Scheduled
                      </SelectItem>
                      <SelectItem value="Published">Published</SelectItem>
                      <SelectItem value="Completed / Taught">
                        Completed / Taught
                      </SelectItem>
                      <SelectItem value="Template">Template</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Total Duration</p>
                    <Input
                      type="number"
                      min={0}
                      value={durationMinutes}
                      onChange={(event) =>
                        setDurationMinutes(
                          Math.max(
                            Number.parseInt(event.target.value || "0", 10),
                            0,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <p className="text-sm font-medium">Difficulty (1-5)</p>
                    <Select
                      value={difficulty === 0 ? "0" : String(difficulty)}
                      onValueChange={(value) =>
                        setDifficulty(
                          (Number.parseInt(value, 10) || 0) as
                            | 0
                            | 1
                            | 2
                            | 3
                            | 4
                            | 5,
                        )
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="0">Not set</SelectItem>
                        <SelectItem value="1">1</SelectItem>
                        <SelectItem value="2">2</SelectItem>
                        <SelectItem value="3">3</SelectItem>
                        <SelectItem value="4">4</SelectItem>
                        <SelectItem value="5">5</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Prep & Assets</CardTitle>
                <CardDescription>
                  Add clean links or file references by category.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {ASSET_CATEGORIES.map((category) => (
                  <div key={category} className="rounded-md border p-3">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-medium">{category}</p>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => addAsset(category)}
                      >
                        <Plus className="mr-1 h-3.5 w-3.5" />
                        Add Asset
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {assetsByCategory[category].map((asset) => (
                        <div
                          key={asset.id}
                          className="rounded-md bg-muted/30 p-2"
                        >
                          <div className="grid grid-cols-1 gap-2 md:grid-cols-[110px_1fr_1fr_auto]">
                            <Select
                              value={asset.type}
                              onValueChange={(value) =>
                                updateAsset(category, asset.id, {
                                  type: value as "link" | "file",
                                })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="link">Link</SelectItem>
                                <SelectItem value="file">File</SelectItem>
                              </SelectContent>
                            </Select>
                            <Input
                              value={asset.title}
                              onChange={(event) =>
                                updateAsset(category, asset.id, {
                                  title: event.target.value,
                                })
                              }
                              placeholder="Title"
                            />
                            <Input
                              value={asset.value}
                              onChange={(event) =>
                                updateAsset(category, asset.id, {
                                  value: event.target.value,
                                })
                              }
                              placeholder={
                                asset.type === "link"
                                  ? "https://..."
                                  : "File name or path"
                              }
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => removeAsset(category, asset.id)}
                              aria-label="Remove asset"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                <div className="space-y-2">
                  <p className="text-sm font-medium">Teacher To-Do List</p>
                  <AutoResizeTextarea
                    value={teacherTodoInput}
                    onChange={(event) =>
                      setTeacherTodoInput(event.target.value)
                    }
                    className="min-h-[90px]"
                    placeholder="One item per line"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const durationDisplay = parseDuration(lessonPlan.materials);
  const difficultyDisplay = parseDifficulty(lessonPlan.materials);
  const classDisplay = classNameById[lessonPlan.classId] || "Not specified";
  const dateDisplay = lessonPlan.date
    ? format(new Date(lessonPlan.date), "PPP")
    : "Not specified";
  const durationPill =
    durationDisplay > 0 ? `${durationDisplay} mins` : "Not specified";
  const difficultyPill =
    difficultyDisplay > 0 ? `${difficultyDisplay}/5` : "Not rated";
  const isNeutralPill = (value: string) =>
    value === "Not specified" || value === "Not rated";
  const pillToneClass = (value: string) =>
    isNeutralPill(value)
      ? "border-border bg-muted text-muted-foreground"
      : "border-transparent bg-secondary text-secondary-foreground";

  return (
    <div className="flex flex-col gap-6">
      <div className="sticky top-0 z-20 -mx-1 flex items-center justify-between gap-3 border-b bg-background/95 px-1 py-3 shadow-sm backdrop-blur">
        <Button
          variant="outline"
          onClick={() => router.push("/dashboard/teacher/lesson-plans")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Lesson Plans
        </Button>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleQuickPublish}
            disabled={
              saving ||
              lifecycleStatus === "Template" ||
              lifecycleStatus === "Published"
            }
            className="h-10 rounded-md border-0 bg-green-600 px-4 text-white hover:bg-green-700"
          >
            Publish to Student Portal
          </Button>
          <Button
            variant="secondary"
            className="h-10 rounded-md px-4"
            onClick={() => {
              hydrateEditorState(lessonPlan);
              setIsEditing(true);
            }}
          >
            Edit Plan
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="More options">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.print()}>
                Print
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Card className="overflow-hidden border-b-4">
        <CardHeader className="bg-muted/40">
          <div className="space-y-3">
            <CardTitle className="text-2xl">{lessonPlan.title}</CardTitle>
            <CardDescription>{classDisplay}</CardDescription>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <Badge
              variant={statusBadgeVariant(lifecycleStatus)}
              className="gap-1.5 py-1"
            >
              {lifecycleStatus}
            </Badge>
            <Badge
              className={cn("gap-1.5 border py-1", pillToneClass(classDisplay))}
            >
              <GraduationCap className="h-3.5 w-3.5" />
              {classDisplay}
            </Badge>
            <Badge
              className={cn("gap-1.5 border py-1", pillToneClass(dateDisplay))}
            >
              <CalendarIcon className="h-3.5 w-3.5" />
              {dateDisplay}
            </Badge>
            <Badge
              className={cn("gap-1.5 border py-1", pillToneClass(durationPill))}
            >
              <Clock3 className="h-3.5 w-3.5" />
              {durationPill}
            </Badge>
            <Badge
              className={cn(
                "gap-1.5 border py-1",
                pillToneClass(difficultyPill),
              )}
            >
              <Star className="h-3.5 w-3.5" />
              {difficultyPill}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-[minmax(0,1.85fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Foundation & Goals</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="rounded-md border p-3">
                  <p className="mb-1 flex items-center gap-2 font-medium text-foreground">
                    <Target className="h-4 w-4" />
                    Learning Objectives
                  </p>
                  <p className="whitespace-pre-wrap">
                    {learningObjectives || "Not specified"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Lesson Arc Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6">
                <div className="absolute bottom-1 left-2 top-1 w-px bg-border" />
                <div className="space-y-4">
                  {timelineForView.map((step) => (
                    <div
                      key={step.id}
                      className="relative rounded-md border p-3"
                    >
                      <span className="absolute -left-[1.08rem] top-4 h-3 w-3 rounded-full bg-primary" />
                      <div className="mb-2 flex items-start justify-between gap-2">
                        <p className="font-medium text-foreground">
                          {step.title}
                        </p>
                        <Badge className="shrink-0">{step.minutes} mins</Badge>
                      </div>
                      <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                        {step.description || "Not specified"}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Assessment & Reflection
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-md border bg-muted/40 p-3">
                <p className="mb-1 font-medium text-foreground">
                  Exit Ticket / Closure Prompt
                </p>
                <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                  {closureAssessment || "Not specified"}
                </p>
              </div>
              {isTaught ? (
                <div className="rounded-md border p-3">
                  <p className="mb-1 font-medium text-foreground">
                    Post-Lesson Reflection
                  </p>
                  <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                    {postLessonReflection || "No reflection added yet."}
                  </p>
                </div>
              ) : (
                <div className="rounded-md border border-dashed p-3">
                  <p className="font-medium text-foreground">
                    Reflection Locked
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Reflection unlocks after the lesson is marked as Taught.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Prep & Assets</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {parsedAssets.length > 0 ? (
                <div className="space-y-2">
                  {parsedAssets.map((asset) => {
                    const assetHref = resolveAssetHref(
                      asset.value,
                      assetLinkerBase,
                    );

                    return (
                      <div
                        key={asset.id}
                        className="rounded-md border bg-muted/40 p-3"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs uppercase tracking-wide text-muted-foreground">
                              {asset.category}
                            </p>
                            <p className="font-medium text-foreground">
                              {asset.title}
                            </p>
                          </div>
                          <Badge variant="outline">{asset.type}</Badge>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <p className="max-w-[220px] truncate whitespace-nowrap text-xs text-muted-foreground">
                            {asset.value}
                          </p>
                          {assetHref ? (
                            <Button asChild size="sm" variant="secondary">
                              <a
                                href={assetHref}
                                target="_blank"
                                rel="noreferrer"
                              >
                                {asset.isLink ? (
                                  <Link2 className="mr-1 h-3.5 w-3.5" />
                                ) : (
                                  <FileText className="mr-1 h-3.5 w-3.5" />
                                )}
                                Open in New Tab
                              </a>
                            </Button>
                          ) : (
                            <Button size="sm" variant="outline" disabled>
                              <FileText className="mr-1 h-3.5 w-3.5" />
                              Add file/link
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No linked assets.
                </p>
              )}

              <div className="rounded-md border p-3">
                <p className="mb-2 flex items-center gap-2 font-medium text-foreground">
                  <CheckSquare className="h-4 w-4" />
                  Teacher To-Do Checklist
                </p>
                {todoItems.length > 0 ? (
                  <div className="space-y-2">
                    {todoItems.map((item) => (
                      <label
                        key={item}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <Checkbox
                          checked={checklistState[item] || false}
                          onCheckedChange={(checked) =>
                            setChecklistState((prev) => ({
                              ...prev,
                              [item]: Boolean(checked),
                            }))
                          }
                        />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No checklist items.
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Standards Alignment</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                {standardsAlignment || "Not specified"}
              </p>
              {!standardsAlignment ? (
                <div className="mt-3 rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                  <p className="flex items-center gap-2">
                    <BookOpen className="h-3.5 w-3.5" />
                    Add standards in plan editing to guide curriculum alignment.
                  </p>
                </div>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
