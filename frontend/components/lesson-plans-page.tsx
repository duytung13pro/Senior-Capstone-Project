"use client";

import { useEffect, useMemo, useState } from "react";
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
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type TeacherClass = {
  id: string;
  name: string;
};

type LessonPlan = {
  id: string;
  title: string;
  classId: string;
  date: string;
  status: "Upcoming" | "Draft" | "Template";
  objectives?: string;
  activities?: string;
  materials?: string;
  assessment?: string;
  template: boolean;
};

type CreateLessonPlanForm = {
  title: string;
  classId: string;
  date?: Date;
  status: "Upcoming" | "Draft";
  objectives: string;
  activities: string;
  materials: string;
  assessment: string;
  template: boolean;
};

const API_BASE = "http://localhost:8080";

export function LessonPlansPage() {
  const [filter, setFilter] = useState<{ classId: string; date: Date | null }>({
    classId: "all",
    date: null,
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [lessonPlans, setLessonPlans] = useState<LessonPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<CreateLessonPlanForm>({
    title: "",
    classId: "",
    date: new Date(),
    status: "Draft",
    objectives: "",
    activities: "",
    materials: "",
    assessment: "",
    template: false,
  });

  const classNameById = useMemo(() => {
    return classes.reduce<Record<string, string>>((acc, item) => {
      acc[item.id] = item.name;
      return acc;
    }, {});
  }, [classes]);

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
          fetch(`${API_BASE}/api/classes/my?teacherId=${teacherId}`),
          fetch(`${API_BASE}/api/lesson-plans?teacherId=${teacherId}`),
        ]);

        if (!classesRes.ok || !lessonPlansRes.ok) {
          throw new Error("Không thể tải dữ liệu lesson plans");
        }

        const classesData = await classesRes.json();
        const lessonPlansData = await lessonPlansRes.json();

        setClasses(classesData);
        setLessonPlans(lessonPlansData);
      } catch (loadError) {
        console.error(loadError);
        setError("Không thể tải lesson plans từ backend");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const filteredLessonPlans = lessonPlans.filter((plan) => {
    const classMatch =
      filter.classId === "all" || plan.classId === filter.classId;
    const searchMatch =
      searchQuery === "" ||
      plan.title.toLowerCase().includes(searchQuery.toLowerCase());
    const dateMatch =
      !filter.date ||
      format(new Date(plan.date), "yyyy-MM-dd") ===
        format(filter.date, "yyyy-MM-dd");

    return classMatch && searchMatch && dateMatch;
  });

  const createLessonPlan = async () => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId || !form.title || !form.classId) {
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const res = await fetch(`${API_BASE}/api/lesson-plans`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          teacherId,
          classId: form.classId,
          title: form.title,
          date: form.date ? form.date.toISOString() : new Date().toISOString(),
          status: form.template ? "Template" : form.status,
          objectives: form.objectives,
          activities: form.activities,
          materials: form.materials,
          assessment: form.assessment,
          template: form.template,
        }),
      });

      if (!res.ok) {
        throw new Error("Create lesson plan failed");
      }

      const created = await res.json();
      setLessonPlans((prev) => [created, ...prev]);
      setDialogOpen(false);
      setForm({
        title: "",
        classId: "",
        date: new Date(),
        status: "Draft",
        objectives: "",
        activities: "",
        materials: "",
        assessment: "",
        template: false,
      });
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
      const res = await fetch(
        `${API_BASE}/api/lesson-plans/${lessonPlanId}?teacherId=${teacherId}`,
        {
          method: "DELETE",
        },
      );

      if (!res.ok) {
        throw new Error("Delete lesson plan failed");
      }

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
      const res = await fetch(
        `${API_BASE}/api/lesson-plans/${lessonPlanId}/duplicate?teacherId=${teacherId}`,
        {
          method: "POST",
        },
      );

      if (!res.ok) {
        throw new Error("Duplicate lesson plan failed");
      }

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
        <div className="col-span-full flex h-24 items-center justify-center rounded-md border">
          <p className="text-muted-foreground">No lesson plans found.</p>
        </div>
      );
    }

    return plans.map((plan) => (
      <Card key={plan.id}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <Badge
              variant={
                plan.status === "Upcoming"
                  ? "default"
                  : plan.status === "Draft"
                    ? "outline"
                    : "secondary"
              }
            >
              {plan.status}
            </Badge>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => duplicateLessonPlan(plan.id)}
              >
                <Copy className="h-4 w-4" />
                <span className="sr-only">Duplicate</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => deleteLessonPlan(plan.id)}
              >
                <Trash className="h-4 w-4" />
                <span className="sr-only">Delete</span>
              </Button>
            </div>
          </div>
          <CardTitle className="text-lg">{plan.title}</CardTitle>
          <CardDescription>
            {classNameById[plan.classId] ?? "Unknown class"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm">
            <CalendarIcon className="h-4 w-4 text-muted-foreground" />
            <span>{format(new Date(plan.date), "yyyy-MM-dd")}</span>
          </div>
          <div className="mt-4 flex justify-end">
            <Button variant="outline" size="sm" className="w-full" disabled>
              <FileText className="mr-2 h-4 w-4" />
              {plan.status === "Template" ? "Use Template" : "Edit Plan"}
            </Button>
          </div>
        </CardContent>
      </Card>
    ));
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
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Create New Lesson Plan</DialogTitle>
              <DialogDescription>
                Create a new lesson plan or use a template.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
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

              <div className="grid gap-2">
                <Label htmlFor="status">Status</Label>
                <Select
                  value={form.template ? "Template" : form.status}
                  onValueChange={(value) => {
                    if (value === "Template") {
                      setForm((prev) => ({
                        ...prev,
                        template: true,
                        status: "Draft",
                      }));
                      return;
                    }
                    setForm((prev) => ({
                      ...prev,
                      template: false,
                      status: value as "Upcoming" | "Draft",
                    }));
                  }}
                >
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Upcoming">Upcoming</SelectItem>
                    <SelectItem value="Draft">Draft</SelectItem>
                    <SelectItem value="Template">Template</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="objectives">Learning Objectives</Label>
                <Textarea
                  id="objectives"
                  placeholder="Enter learning objectives"
                  rows={2}
                  value={form.objectives}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, objectives: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="activities">Activities</Label>
                <Textarea
                  id="activities"
                  placeholder="Enter lesson activities"
                  rows={4}
                  value={form.activities}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, activities: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="materials">Materials Needed</Label>
                <Textarea
                  id="materials"
                  placeholder="Enter required materials"
                  rows={2}
                  value={form.materials}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, materials: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="assessment">Assessment</Label>
                <Textarea
                  id="assessment"
                  placeholder="Enter assessment methods"
                  rows={2}
                  value={form.assessment}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, assessment: e.target.value }))
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={createLessonPlan}
                disabled={submitting}
              >
                {submitting ? "Creating..." : "Create Lesson Plan"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Tabs defaultValue="all" className="space-y-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <TabsList>
            <TabsTrigger value="all">All Plans</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="drafts">Drafts</TabsTrigger>
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
            <Select
              value={filter.classId}
              onValueChange={(value) =>
                setFilter((prev) => ({ ...prev, classId: value }))
              }
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by class" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map((teacherClass) => (
                  <SelectItem key={teacherClass.id} value={teacherClass.id}>
                    {teacherClass.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <TabsContent value="all" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(filteredLessonPlans)}
          </div>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(
              filteredLessonPlans.filter((plan) => plan.status === "Upcoming"),
            )}
          </div>
        </TabsContent>

        <TabsContent value="drafts" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(
              filteredLessonPlans.filter((plan) => plan.status === "Draft"),
            )}
          </div>
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {renderPlans(
              filteredLessonPlans.filter((plan) => plan.status === "Template"),
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
