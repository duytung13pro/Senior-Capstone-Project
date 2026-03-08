"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Plus,
  Search,
  FileText,
  Copy,
  Trash,
  CalendarIcon,
  BookOpen,
  ArrowLeft,
} from "lucide-react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { fetchApiFirstOk } from "@/lib/api";

type TeacherClass = {
  id: string;
  name: string;
};

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
  template: boolean;
};

type PlannerTab = "foundation" | "prep" | "arc" | "diff" | "reflection";

type CreateLessonPlanForm = {
  title: string;
  topic: string;
  classId: string;
  date?: Date;
  difficulty: "1" | "2" | "3" | "4" | "5" | "";
  duration: string;
  status: LessonStatus;
  learningObjectives: string;
  standardsAlignment: string;
  assetLinker: string;
  teacherTodoList: string;
  warmUp: string;
  directInstruction: string;
  guidedPractice: string;
  independentPractice: string;
  closureAssessment: string;
  accommodations: string;
  extensions: string;
  ellSupport: string;
  reflectionNotes: string;
};

type AssetType = "upload" | "link" | "generated";
type AssetCategoryKey =
  | "instructionalMaterials"
  | "studentHandouts"
  | "formativeAssessments"
  | "summativeAssessments"
  | "evaluationTools"
  | "interactiveActivities";

type AssetItem = {
  id: string;
  type: AssetType;
  label: string;
  value: string;
  uploadedFileName?: string;
};

type AssetLibraryState = Record<AssetCategoryKey, AssetItem[]>;

type StatusFilter =
  | "all"
  | "upcoming"
  | "draft"
  | "ready"
  | "published"
  | "completed"
  | "templates";

const DRAFT_STORAGE_KEY = "lesson-plan-dialog-draft-v3";

const DIFFICULTY_OPTIONS: Array<{
  value: "1" | "2" | "3" | "4" | "5";
  label: string;
}> = [
  { value: "1", label: "★☆☆☆☆" },
  { value: "2", label: "★★☆☆☆" },
  { value: "3", label: "★★★☆☆" },
  { value: "4", label: "★★★★☆" },
  { value: "5", label: "★★★★★" },
];

const ASSET_CATEGORY_LABELS: Record<AssetCategoryKey, string> = {
  instructionalMaterials: "Instructional Materials",
  studentHandouts: "Student Handouts",
  formativeAssessments: "Assessments — Formative",
  summativeAssessments: "Assessments — Summative",
  evaluationTools: "Evaluation Tools",
  interactiveActivities: "Interactive Activities",
};

const PLANNER_TABS: PlannerTab[] = [
  "foundation",
  "prep",
  "arc",
  "diff",
  "reflection",
];

const defaultForm = (): CreateLessonPlanForm => ({
  title: "",
  topic: "",
  classId: "",
  date: new Date(),
  difficulty: "",
  duration: "45 mins",
  status: "Draft",
  learningObjectives: "",
  standardsAlignment: "",
  assetLinker: "",
  teacherTodoList: "",
  warmUp: "",
  directInstruction: "",
  guidedPractice: "",
  independentPractice: "",
  closureAssessment: "",
  accommodations: "",
  extensions: "",
  ellSupport: "",
  reflectionNotes: "",
});

const defaultArcMinutes = () => ({
  warmUp: 5,
  directInstruction: 15,
  guidedPractice: 10,
  independentPractice: 10,
  closureAssessment: 5,
});

const emptyAssetLibrary = (): AssetLibraryState => ({
  instructionalMaterials: [],
  studentHandouts: [],
  formativeAssessments: [],
  summativeAssessments: [],
  evaluationTools: [],
  interactiveActivities: [],
});

const statusBadgeVariant = (status: LessonStatus) => {
  if (status === "Published") {
    return "default";
  }
  if (status === "Draft") {
    return "outline";
  }
  if (status === "Completed / Taught") {
    return "secondary";
  }
  if (status === "Ready / Scheduled") {
    return "secondary";
  }
  return "outline";
};

export function LessonPlansPage() {
  const router = useRouter();

  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [filterDate, setFilterDate] = useState<Date | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [plannerTab, setPlannerTab] = useState<PlannerTab>("foundation");
  const [form, setForm] = useState<CreateLessonPlanForm>(defaultForm);
  const [assetLibrary, setAssetLibrary] =
    useState<AssetLibraryState>(emptyAssetLibrary());
  const [arcMinutes, setArcMinutes] = useState(defaultArcMinutes());
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

  const classNameById = useMemo(() => {
    return classes.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [classes]);

  const parseDurationMinutes = (duration: string) => {
    const parsed = Number.parseInt(duration, 10);
    return Number.isFinite(parsed) ? Math.max(parsed, 0) : 0;
  };

  const normalizedStatus = (
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

  const isUpcomingSession = (plan: LessonPlan) => {
    const lifecycleStatus = normalizedStatus(plan.status, plan.template);
    if (lifecycleStatus === "Template") {
      return false;
    }

    const date = new Date(plan.date);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );
    return date.getTime() >= todayStart.getTime();
  };

  const totalArcMinutes =
    arcMinutes.warmUp +
    arcMinutes.directInstruction +
    arcMinutes.guidedPractice +
    arcMinutes.independentPractice +
    arcMinutes.closureAssessment;
  const plannedDurationMinutes = parseDurationMinutes(form.duration);
  const isOverPlanned =
    plannedDurationMinutes > 0 && totalArcMinutes > plannedDurationMinutes;

  const canWriteReflection = useMemo(() => {
    if (form.status === "Completed / Taught") {
      return true;
    }
    if (!form.date) {
      return false;
    }
    return form.date.getTime() <= Date.now();
  }, [form.date, form.status]);

  const summary = useMemo(() => {
    const statuses = lessonPlans.map((plan) =>
      normalizedStatus(plan.status, plan.template),
    );

    return {
      total: lessonPlans.length,
      upcoming: lessonPlans.filter((plan) => isUpcomingSession(plan)).length,
      drafts: statuses.filter((status) => status === "Draft").length,
      ready: statuses.filter((status) => status === "Ready / Scheduled").length,
      published: statuses.filter((status) => status === "Published").length,
      completed: statuses.filter((status) => status === "Completed / Taught")
        .length,
      templates: statuses.filter((status) => status === "Template").length,
    };
  }, [lessonPlans]);

  const filteredLessonPlans = useMemo(() => {
    if (!selectedClassId) {
      return [];
    }

    return lessonPlans.filter((plan) => {
      const classMatch = plan.classId === selectedClassId;
      const searchMatch =
        searchQuery === "" ||
        plan.title.toLowerCase().includes(searchQuery.toLowerCase());
      const dateMatch =
        !filterDate ||
        format(new Date(plan.date), "yyyy-MM-dd") ===
          format(filterDate, "yyyy-MM-dd");

      const lifecycleStatus = normalizedStatus(plan.status, plan.template);
      const statusMatch =
        statusFilter === "all" ||
        (statusFilter === "upcoming" && isUpcomingSession(plan)) ||
        (statusFilter === "draft" && lifecycleStatus === "Draft") ||
        (statusFilter === "ready" && lifecycleStatus === "Ready / Scheduled") ||
        (statusFilter === "published" && lifecycleStatus === "Published") ||
        (statusFilter === "completed" &&
          lifecycleStatus === "Completed / Taught") ||
        (statusFilter === "templates" && lifecycleStatus === "Template");

      return classMatch && searchMatch && dateMatch && statusMatch;
    });
  }, [filterDate, lessonPlans, searchQuery, selectedClassId, statusFilter]);

  const classDirectory = useMemo(() => {
    const now = new Date();
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    );

    return classes
      .map((teacherClass) => {
        const plansInClass = lessonPlans.filter(
          (plan) => plan.classId === teacherClass.id,
        );
        const nextLessonDate = plansInClass
          .filter((plan) => {
            const lifecycleStatus = normalizedStatus(
              plan.status,
              plan.template,
            );
            if (lifecycleStatus === "Template") {
              return false;
            }

            const parsed = new Date(plan.date);
            return (
              !Number.isNaN(parsed.getTime()) &&
              parsed.getTime() >= todayStart.getTime()
            );
          })
          .sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
          )[0]?.date;

        return {
          id: teacherClass.id,
          name: teacherClass.name,
          lessonCount: plansInClass.length,
          nextLessonDate,
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [classes, lessonPlans]);

  const selectedClassName = selectedClassId
    ? classNameById[selectedClassId] || "Unknown class"
    : "";

  const serializeAssetCategory = (items: AssetItem[]) => {
    if (!items.length) {
      return "-";
    }

    return items
      .map((item) => {
        const displayLabel =
          item.label.trim() ||
          item.uploadedFileName?.trim() ||
          "Untitled Asset";
        const displayValue = item.value.trim() || "(not linked yet)";
        return `- [${item.type}] ${displayLabel}: ${displayValue}`;
      })
      .join("\n");
  };

  const addAssetItem = (category: AssetCategoryKey) => {
    const newItem: AssetItem = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: "link",
      label: "",
      value: "",
      uploadedFileName: "",
    };

    setAssetLibrary((prev) => ({
      ...prev,
      [category]: [...prev[category], newItem],
    }));
  };

  const updateAssetItem = (
    category: AssetCategoryKey,
    itemId: string,
    patch: Partial<AssetItem>,
  ) => {
    setAssetLibrary((prev) => ({
      ...prev,
      [category]: prev[category].map((item) =>
        item.id === itemId ? { ...item, ...patch } : item,
      ),
    }));
  };

  const removeAssetItem = (category: AssetCategoryKey, itemId: string) => {
    setAssetLibrary((prev) => ({
      ...prev,
      [category]: prev[category].filter((item) => item.id !== itemId),
    }));
  };

  const goToNextPlannerTab = () => {
    const index = PLANNER_TABS.indexOf(plannerTab);
    if (index >= 0 && index < PLANNER_TABS.length - 1) {
      setPlannerTab(PLANNER_TABS[index + 1]);
    }
  };

  const goToPreviousPlannerTab = () => {
    const index = PLANNER_TABS.indexOf(plannerTab);
    if (index > 0) {
      setPlannerTab(PLANNER_TABS[index - 1]);
    }
  };

  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      setLoading(false);
      setError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
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

        setClasses(Array.isArray(classesData) ? classesData : []);
        setLessonPlans(Array.isArray(lessonPlansData) ? lessonPlansData : []);
      } catch (loadError) {
        console.error(loadError);
        setError("Không thể tải lesson plans từ backend");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    try {
      const raw = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw);
      if (parsed?.form) {
        setForm((prev) => ({
          ...prev,
          ...parsed.form,
          date: parsed.form.date ? new Date(parsed.form.date) : prev.date,
        }));
      }
      if (parsed?.assetLibrary) {
        setAssetLibrary({
          ...emptyAssetLibrary(),
          ...parsed.assetLibrary,
        });
      }
      if (parsed?.arcMinutes) {
        setArcMinutes({
          ...defaultArcMinutes(),
          ...parsed.arcMinutes,
        });
      }
      if (parsed?.plannerTab && PLANNER_TABS.includes(parsed.plannerTab)) {
        setPlannerTab(parsed.plannerTab);
      }
      if (parsed?.savedAt) {
        setLastSavedAt(new Date(parsed.savedAt));
      }
    } catch {
      // ignore invalid saved draft
    }
  }, [dialogOpen]);

  useEffect(() => {
    if (!dialogOpen) {
      return;
    }

    const timeoutId = setTimeout(() => {
      const savedAt = new Date();
      localStorage.setItem(
        DRAFT_STORAGE_KEY,
        JSON.stringify({
          form,
          assetLibrary,
          arcMinutes,
          plannerTab,
          savedAt: savedAt.toISOString(),
        }),
      );
      setLastSavedAt(savedAt);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [dialogOpen, form, assetLibrary, arcMinutes, plannerTab]);

  const createLessonPlan = async () => {
    const teacherId = localStorage.getItem("userId");

    if (!teacherId || !form.title) {
      return;
    }

    if (form.status !== "Template" && !form.classId) {
      setError("Vui lòng chọn lớp cho lesson plan không phải template.");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const status = form.status;
      const isTemplate = status === "Template";

      const res = await fetchApiFirstOk(
        "/api/lesson-plans",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            teacherId,
            classId: isTemplate ? "" : form.classId,
            title: form.topic ? `${form.title} — ${form.topic}` : form.title,
            date: isTemplate
              ? new Date().toISOString()
              : form.date
                ? form.date.toISOString()
                : new Date().toISOString(),
            status,
            objectives: [
              `Learning Objectives:\n${form.learningObjectives || "-"}`,
              `Standards Alignment:\n${form.standardsAlignment || "-"}`,
            ].join("\n\n"),
            activities: [
              "Lesson Arc (Gradual Release):",
              `Hook / Warm-Up (${arcMinutes.warmUp} mins):\n${form.warmUp || "-"}`,
              `Direct Instruction / I Do (${arcMinutes.directInstruction} mins):\n${form.directInstruction || "-"}`,
              `Guided Practice / We Do (${arcMinutes.guidedPractice} mins):\n${form.guidedPractice || "-"}`,
              `Independent Practice / You Do (${arcMinutes.independentPractice} mins):\n${form.independentPractice || "-"}`,
              `Closure & Assessment (${arcMinutes.closureAssessment} mins):\n${form.closureAssessment || "-"}`,
              `Total Arc Minutes: ${totalArcMinutes}`,
              "Differentiation & Accessibility:",
              `Accommodations:\n${form.accommodations || "-"}`,
              `Extensions:\n${form.extensions || "-"}`,
              `ELL Support:\n${form.ellSupport || "-"}`,
            ].join("\n\n"),
            materials: [
              "Lesson Logistics:",
              `Difficulty (1-5 stars): ${
                form.difficulty
                  ? `${form.difficulty} / 5 (${"★".repeat(Number(form.difficulty))}${"☆".repeat(5 - Number(form.difficulty))})`
                  : "-"
              }`,
              `Duration: ${form.duration || "-"}`,
              "Materials & Assets Library:",
              `Instructional Materials:\n${serializeAssetCategory(assetLibrary.instructionalMaterials)}`,
              `Student Handouts:\n${serializeAssetCategory(assetLibrary.studentHandouts)}`,
              `Assessments - Formative:\n${serializeAssetCategory(assetLibrary.formativeAssessments)}`,
              `Assessments - Summative:\n${serializeAssetCategory(assetLibrary.summativeAssessments)}`,
              `Evaluation Tools:\n${serializeAssetCategory(assetLibrary.evaluationTools)}`,
              `Interactive Activities:\n${serializeAssetCategory(assetLibrary.interactiveActivities)}`,
              `Asset Linker:\n${form.assetLinker || "-"}`,
              `Teacher To-Do List:\n${form.teacherTodoList || "-"}`,
            ].join("\n\n"),
            assessment: [
              `Closure Assessment:\n${form.closureAssessment || "-"}`,
              `Post-Lesson Reflection:\n${form.reflectionNotes || "-"}`,
            ].join("\n\n"),
            template: isTemplate,
          }),
        },
        8000,
      );

      const created = await res.json();
      setLessonPlans((prev) => [created, ...prev]);

      setDialogOpen(false);
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      setForm(defaultForm());
      setAssetLibrary(emptyAssetLibrary());
      setArcMinutes(defaultArcMinutes());
      setPlannerTab("foundation");
      setLastSavedAt(null);

      if (selectedClassId) {
        setSelectedClassId(created.classId || selectedClassId);
      }
    } catch (submitError) {
      console.error(submitError);
      setError("Không thể tạo lesson plan");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteLessonPlan = async (lessonPlanId: string) => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      return;
    }

    try {
      await fetchApiFirstOk(
        `/api/lesson-plans/${lessonPlanId}?teacherId=${teacherId}`,
        {
          method: "DELETE",
        },
        8000,
      );

      setLessonPlans((prev) => prev.filter((plan) => plan.id !== lessonPlanId));
    } catch (deleteError) {
      console.error(deleteError);
      setError("Không thể xóa lesson plan");
    }
  };

  const duplicateLessonPlan = async (lessonPlanId: string) => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) {
      return;
    }

    try {
      const res = await fetchApiFirstOk(
        `/api/lesson-plans/${lessonPlanId}/duplicate?teacherId=${teacherId}`,
        {
          method: "POST",
        },
        8000,
      );

      const duplicated = await res.json();
      setLessonPlans((prev) => [duplicated, ...prev]);
    } catch (duplicateError) {
      console.error(duplicateError);
      setError("Không thể nhân bản lesson plan");
    }
  };

  const renderPlans = (plans: LessonPlan[]) => {
    if (plans.length === 0) {
      return (
        <div className="col-span-full flex min-h-[220px] flex-col items-center justify-center rounded-md border border-dashed px-6 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground" />
          <p className="text-base font-medium">No lesson plans found.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Start planning your next class with a structured lesson template.
          </p>
          <Button className="mt-4" onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Create your first lesson plan
          </Button>
        </div>
      );
    }

    return plans.map((plan) => {
      const lifecycleStatus = normalizedStatus(plan.status, plan.template);
      const canOpenFromCard = Boolean(plan.id);
      const openFromCard = () => {
        if (!canOpenFromCard) {
          return;
        }
        router.push(`/dashboard/teacher/lesson-plans/${plan.id}`);
      };

      const openAssignments = () => {
        if (!plan.classId) {
          return;
        }
        router.push(`/dashboard/teacher/assignments?id=${plan.classId}`);
      };

      return (
        <Card
          key={plan.id}
          role={canOpenFromCard ? "button" : undefined}
          tabIndex={canOpenFromCard ? 0 : undefined}
          onClick={openFromCard}
          onKeyDown={(event) => {
            if (!canOpenFromCard) {
              return;
            }

            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              openFromCard();
            }
          }}
          className={
            canOpenFromCard
              ? "cursor-pointer transition-colors hover:bg-muted/30"
              : undefined
          }
        >
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Badge variant={statusBadgeVariant(lifecycleStatus)}>
                {lifecycleStatus}
              </Badge>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    duplicateLessonPlan(plan.id);
                  }}
                >
                  <Copy className="h-4 w-4" />
                  <span className="sr-only">Duplicate</span>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={(event) => {
                    event.stopPropagation();
                    deleteLessonPlan(plan.id);
                  }}
                >
                  <Trash className="h-4 w-4" />
                  <span className="sr-only">Delete</span>
                </Button>
              </div>
            </div>
            <CardTitle className="text-lg">{plan.title}</CardTitle>
            <CardDescription>
              {classNameById[plan.classId] ??
                (lifecycleStatus === "Template" ? "Template" : "Unknown class")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2 text-sm">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              <span>{format(new Date(plan.date), "yyyy-MM-dd")}</span>
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div>
                <p className="mb-1 font-medium">Objectives</p>
                <p className="text-muted-foreground line-clamp-3">
                  {plan.objectives || "Not specified"}
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium">Lesson Arc</p>
                <p className="text-muted-foreground line-clamp-3">
                  {plan.activities || "Not specified"}
                </p>
              </div>
              <div>
                <p className="mb-1 font-medium">Materials & Assets</p>
                <p className="text-muted-foreground line-clamp-3">
                  {plan.materials || "Not specified"}
                </p>
              </div>
            </div>
            <div className="mt-4 grid w-full gap-2 sm:grid-cols-2">
              <Button
                variant="outline"
                size="sm"
                className="box-border inline-flex h-10 items-center justify-center gap-2 px-4 py-2 leading-normal"
                onClick={(event) => {
                  event.stopPropagation();
                  openAssignments();
                }}
                disabled={!plan.classId}
              >
                <FileText className="h-4 w-4" />
                Open Assignments
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="box-border inline-flex h-10 items-center justify-center gap-2 px-4 py-2 leading-normal"
                onClick={(event) => {
                  event.stopPropagation();
                  router.push(
                    `/dashboard/teacher/lesson-plans/${plan.id}?mode=edit`,
                  );
                }}
              >
                Edit Plan
              </Button>
            </div>
          </CardContent>
        </Card>
      );
    });
  };

  if (loading) {
    return <div className="p-6">Loading lesson plans...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Lesson Plans</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Lesson Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[920px] max-h-[88vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Lesson Plan</DialogTitle>
              <DialogDescription>
                Design a complete lesson using Foundation, Prep & Assets, Arc,
                Differentiation, and Reflection.
              </DialogDescription>
            </DialogHeader>

            <Tabs
              value={plannerTab}
              onValueChange={(value) => setPlannerTab(value as PlannerTab)}
              className="space-y-4"
            >
              <TabsList className="grid grid-cols-5 w-full">
                <TabsTrigger value="foundation">Foundation</TabsTrigger>
                <TabsTrigger value="prep">Prep & Assets</TabsTrigger>
                <TabsTrigger value="arc">Lesson Arc</TabsTrigger>
                <TabsTrigger value="diff">Differentiation</TabsTrigger>
                <TabsTrigger value="reflection">Reflection</TabsTrigger>
              </TabsList>

              <TabsContent value="foundation" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="title">Lesson Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter lesson title"
                    value={form.title}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, title: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="topic">Topic</Label>
                  <Input
                    id="topic"
                    placeholder="What is this lesson about?"
                    value={form.topic}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, topic: e.target.value }))
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="class">Class</Label>
                    <Select
                      value={form.classId || undefined}
                      onValueChange={(value) =>
                        setForm((prev) => ({ ...prev, classId: value }))
                      }
                    >
                      <SelectTrigger id="class">
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
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="w-full justify-start text-left font-normal"
                          id="date"
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {form.date ? format(form.date, "PPP") : "Select date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          selected={form.date}
                          onSelect={(value) =>
                            setForm((prev) => ({ ...prev, date: value }))
                          }
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="difficulty">Difficulty (1-5 stars)</Label>
                    <Select
                      value={form.difficulty || undefined}
                      onValueChange={(value) =>
                        setForm((prev) => ({
                          ...prev,
                          difficulty:
                            value as CreateLessonPlanForm["difficulty"],
                        }))
                      }
                    >
                      <SelectTrigger id="difficulty">
                        <SelectValue placeholder="Select difficulty" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md">
                        {DIFFICULTY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.value} - {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="duration">Duration</Label>
                    <Input
                      id="duration"
                      placeholder="45 mins"
                      value={form.duration}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: e.target.value,
                        }))
                      }
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={form.status}
                      onValueChange={(value) => {
                        const nextStatus = value as LessonStatus;
                        setForm((prev) => ({
                          ...prev,
                          status: nextStatus,
                          classId:
                            nextStatus === "Template" ? "" : prev.classId,
                          date:
                            nextStatus === "Template" ? undefined : prev.date,
                        }));

                        if (nextStatus === "Completed / Taught") {
                          setPlannerTab("reflection");
                        }
                      }}
                    >
                      <SelectTrigger id="status">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border shadow-md">
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
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="learningObjectives">
                    Learning Objectives
                  </Label>
                  <Textarea
                    id="learningObjectives"
                    placeholder="Students will be able to..."
                    rows={3}
                    value={form.learningObjectives}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        learningObjectives: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="standardsAlignment">
                    Standards Alignment
                  </Label>
                  <Textarea
                    id="standardsAlignment"
                    placeholder="Tag standards (e.g., Common Core)"
                    rows={2}
                    value={form.standardsAlignment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        standardsAlignment: e.target.value,
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="prep" className="space-y-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">
                      Materials & Assets Library
                    </CardTitle>
                    <CardDescription>
                      Add materials by upload, link, or generated asset
                      references.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {(
                      Object.keys(ASSET_CATEGORY_LABELS) as AssetCategoryKey[]
                    ).map((category) => (
                      <div
                        key={category}
                        className="rounded-md border p-3 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium">
                            {ASSET_CATEGORY_LABELS[category]}
                          </Label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => addAssetItem(category)}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Add Material
                          </Button>
                        </div>

                        {assetLibrary[category].length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            No assets yet.
                          </p>
                        ) : (
                          <div className="space-y-2">
                            {assetLibrary[category].map((item) => (
                              <div
                                key={item.id}
                                className="flex flex-wrap items-center gap-3 rounded-md border p-2"
                              >
                                <div className="min-w-[150px] flex-1">
                                  <Select
                                    value={item.type}
                                    onValueChange={(value) =>
                                      updateAssetItem(category, item.id, {
                                        type: value as AssetType,
                                        value: "",
                                        uploadedFileName: "",
                                      })
                                    }
                                  >
                                    <SelectTrigger className="h-10 min-h-10 rounded-md">
                                      <SelectValue placeholder="Type" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-background border shadow-md">
                                      <SelectItem value="upload">
                                        Upload
                                      </SelectItem>
                                      <SelectItem value="link">
                                        Google Drive Link
                                      </SelectItem>
                                      <SelectItem value="generated">
                                        Pre-generated
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div className="min-w-[170px] flex-1">
                                  <Input
                                    className="h-10 min-h-10 rounded-md"
                                    placeholder="Asset name"
                                    value={item.label}
                                    onChange={(e) =>
                                      updateAssetItem(category, item.id, {
                                        label: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                                <div className="min-w-[220px] flex-[1.4]">
                                  {item.type === "upload" ? (
                                    <div className="flex h-10 min-h-10 items-center justify-center gap-2 rounded-md border border-dashed px-2">
                                      <input
                                        id={`lesson-asset-upload-${item.id}`}
                                        type="file"
                                        className="hidden"
                                        accept=".pdf,.doc,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
                                        onChange={async (e) => {
                                          const file = e.target.files?.[0];
                                          if (!file) {
                                            return;
                                          }

                                          try {
                                            setError(null);

                                            const formData = new FormData();
                                            formData.append("file", file);

                                            const uploadRes =
                                              await fetchApiFirstOk(
                                                "/api/lesson-plans/assets/upload",
                                                {
                                                  method: "POST",
                                                  body: formData,
                                                },
                                                20000,
                                              );

                                            const uploadData =
                                              await uploadRes.json();
                                            const uploadedUrl =
                                              typeof uploadData?.url ===
                                              "string"
                                                ? uploadData.url
                                                : "";
                                            const uploadedName =
                                              typeof uploadData?.name ===
                                                "string" &&
                                              uploadData.name.trim().length > 0
                                                ? uploadData.name.trim()
                                                : file.name;

                                            if (!uploadedUrl) {
                                              throw new Error(
                                                "Upload did not return URL",
                                              );
                                            }

                                            updateAssetItem(category, item.id, {
                                              value: uploadedUrl,
                                              uploadedFileName: uploadedName,
                                              label: item.label || uploadedName,
                                            });
                                          } catch (uploadError) {
                                            console.error(uploadError);
                                            setError(
                                              "Không thể upload file tài liệu. Vui lòng thử lại.",
                                            );
                                          } finally {
                                            e.currentTarget.value = "";
                                          }
                                        }}
                                      />
                                      <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8"
                                        onClick={() => {
                                          const input = document.getElementById(
                                            `lesson-asset-upload-${item.id}`,
                                          ) as HTMLInputElement | null;
                                          input?.click();
                                        }}
                                      >
                                        <span className="max-w-[180px] truncate">
                                          {item.uploadedFileName ||
                                            "Choose File"}
                                        </span>
                                      </Button>
                                      {item.value ? (
                                        <p className="max-w-[55%] truncate text-xs text-muted-foreground">
                                          Uploaded:{" "}
                                          {item.uploadedFileName ||
                                            item.label ||
                                            "File"}
                                        </p>
                                      ) : null}
                                    </div>
                                  ) : (
                                    <Input
                                      className="h-10 min-h-10 rounded-md"
                                      placeholder={
                                        item.type === "link"
                                          ? "Paste Google Drive / URL"
                                          : "Reference generated asset"
                                      }
                                      value={item.value}
                                      onChange={(e) =>
                                        updateAssetItem(category, item.id, {
                                          value: e.target.value,
                                        })
                                      }
                                    />
                                  )}
                                </div>
                                <div className="ml-auto flex flex-none items-center justify-end">
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    size="icon"
                                    onClick={() =>
                                      removeAssetItem(category, item.id)
                                    }
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only">
                                      Remove material
                                    </span>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <div className="grid gap-2">
                  <Label htmlFor="assetLinker">Asset Linker</Label>
                  <Textarea
                    id="assetLinker"
                    placeholder="Attach links or notes for this specific lesson bundle"
                    rows={2}
                    value={form.assetLinker}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        assetLinker: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="teacherTodoList">Teacher To-Do List</Label>
                  <Textarea
                    id="teacherTodoList"
                    placeholder="Print copies, setup projector, gather materials..."
                    rows={3}
                    value={form.teacherTodoList}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        teacherTodoList: e.target.value,
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="arc" className="space-y-4">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <p className="text-sm font-medium">Total Time</p>
                  <p
                    className={`text-sm font-semibold ${
                      isOverPlanned ? "text-destructive" : "text-foreground"
                    }`}
                  >
                    {totalArcMinutes} / {plannedDurationMinutes || 0} mins
                  </p>
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="warmUp">Hook / Warm-Up</Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={arcMinutes.warmUp}
                      onChange={(e) =>
                        setArcMinutes((prev) => ({
                          ...prev,
                          warmUp: Math.max(0, Number(e.target.value) || 0),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    id="warmUp"
                    rows={2}
                    placeholder="Bell-ringer or short attention-grabber"
                    value={form.warmUp}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, warmUp: e.target.value }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="directInstruction">
                      Direct Instruction / I Do
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={arcMinutes.directInstruction}
                      onChange={(e) =>
                        setArcMinutes((prev) => ({
                          ...prev,
                          directInstruction: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    id="directInstruction"
                    rows={2}
                    placeholder="Presenting and demonstrating new content"
                    value={form.directInstruction}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        directInstruction: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="guidedPractice">
                      Guided Practice / We Do
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={arcMinutes.guidedPractice}
                      onChange={(e) =>
                        setArcMinutes((prev) => ({
                          ...prev,
                          guidedPractice: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    id="guidedPractice"
                    rows={2}
                    placeholder="Practice together with support"
                    value={form.guidedPractice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        guidedPractice: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="independentPractice">
                      Independent Practice / You Do
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={arcMinutes.independentPractice}
                      onChange={(e) =>
                        setArcMinutes((prev) => ({
                          ...prev,
                          independentPractice: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    id="independentPractice"
                    rows={2}
                    placeholder="Students work individually or in groups"
                    value={form.independentPractice}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        independentPractice: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="closureAssessment">
                      Closure & Assessment
                    </Label>
                    <Input
                      type="number"
                      min={0}
                      className="w-24"
                      value={arcMinutes.closureAssessment}
                      onChange={(e) =>
                        setArcMinutes((prev) => ({
                          ...prev,
                          closureAssessment: Math.max(
                            0,
                            Number(e.target.value) || 0,
                          ),
                        }))
                      }
                    />
                  </div>
                  <Textarea
                    id="closureAssessment"
                    rows={2}
                    placeholder="Exit ticket, quiz, or quick recap"
                    value={form.closureAssessment}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        closureAssessment: e.target.value,
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="diff" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="accommodations">Accommodations</Label>
                  <Textarea
                    id="accommodations"
                    rows={3}
                    placeholder="Supports for IEP/504 learners"
                    value={form.accommodations}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        accommodations: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="extensions">Extensions</Label>
                  <Textarea
                    id="extensions"
                    rows={3}
                    placeholder="Advanced challenge tasks"
                    value={form.extensions}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        extensions: e.target.value,
                      }))
                    }
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="ellSupport">ELL Support</Label>
                  <Textarea
                    id="ellSupport"
                    rows={3}
                    placeholder="Vocabulary aids and language support"
                    value={form.ellSupport}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        ellSupport: e.target.value,
                      }))
                    }
                  />
                </div>
              </TabsContent>

              <TabsContent value="reflection" className="space-y-4">
                <div className="grid gap-2">
                  <Label htmlFor="reflectionNotes">
                    Post-Lesson Reflection
                  </Label>
                  <Textarea
                    id="reflectionNotes"
                    rows={5}
                    placeholder="What worked? What flopped? What should change next year?"
                    disabled={!canWriteReflection}
                    value={form.reflectionNotes}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        reflectionNotes: e.target.value,
                      }))
                    }
                  />
                  {!canWriteReflection ? (
                    <p className="text-xs text-muted-foreground">
                      Reflection becomes active after lesson date, or set status
                      to Completed / Taught.
                    </p>
                  ) : null}
                </div>
              </TabsContent>
            </Tabs>

            <DialogFooter>
              <div className="flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousPlannerTab}
                    disabled={PLANNER_TABS.indexOf(plannerTab) === 0}
                  >
                    Previous
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToNextPlannerTab}
                    disabled={
                      PLANNER_TABS.indexOf(plannerTab) ===
                      PLANNER_TABS.length - 1
                    }
                  >
                    Next
                  </Button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">
                    {lastSavedAt
                      ? `Saved ${format(lastSavedAt, "p")}`
                      : "Autosave active"}
                  </span>
                  <Button
                    type="submit"
                    onClick={createLessonPlan}
                    disabled={submitting}
                  >
                    {submitting ? "Saving..." : "Save Draft"}
                  </Button>
                </div>
              </div>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <div className="grid w-full grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Plans</CardDescription>
            <CardTitle className="text-2xl">{summary.total}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Upcoming Sessions</CardDescription>
            <CardTitle className="text-2xl">{summary.upcoming}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ready / Scheduled</CardDescription>
            <CardTitle className="text-2xl">{summary.ready}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Published</CardDescription>
            <CardTitle className="text-2xl">{summary.published}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {selectedClassId ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="space-y-1">
              <Button
                variant="ghost"
                className="h-9 px-2 text-sm"
                onClick={() => {
                  setSelectedClassId(null);
                  setStatusFilter("all");
                  setSearchQuery("");
                  setFilterDate(null);
                }}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to All Classes
              </Button>
              <p className="text-sm text-muted-foreground">
                Viewing lesson plans for{" "}
                <span className="font-medium text-foreground">
                  {selectedClassName}
                </span>
              </p>
            </div>
          </div>

          <Tabs
            value={statusFilter}
            onValueChange={(value) => setStatusFilter(value as StatusFilter)}
            className="space-y-4"
          >
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="draft">Draft</TabsTrigger>
                <TabsTrigger value="ready">Ready</TabsTrigger>
                <TabsTrigger value="published">Published</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="templates">Templates</TabsTrigger>
              </TabsList>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative flex-1 md:max-w-sm">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Search lesson plans..."
                    className="pl-8"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-[180px] justify-start"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {filterDate
                        ? format(filterDate, "yyyy-MM-dd")
                        : "Filter by date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={filterDate ?? undefined}
                      onSelect={(value) => setFilterDate(value ?? null)}
                      initialFocus
                    />
                    <div className="border-t p-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() => setFilterDate(null)}
                      >
                        Clear date filter
                      </Button>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <TabsContent value={statusFilter} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {renderPlans(filteredLessonPlans)}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {classDirectory.map((classItem) => (
            <Card
              key={classItem.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelectedClassId(classItem.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setSelectedClassId(classItem.id);
                }
              }}
              className="cursor-pointer border bg-card shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="space-y-2">
                <CardTitle className="text-lg leading-tight">
                  {classItem.name}
                </CardTitle>
                <CardDescription>
                  {classItem.lessonCount}{" "}
                  {classItem.lessonCount === 1 ? "Lesson" : "Lessons"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Next session:{" "}
                  {classItem.nextLessonDate
                    ? format(new Date(classItem.nextLessonDate), "MMMM do")
                    : "No upcoming session"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
