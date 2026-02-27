"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { format, formatDistanceToNowStrict } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Search, Calendar, FileText, Users } from "lucide-react";

type TeacherClass = {
  id: string;
  name: string;
};

type Assignment = {
  id: string;
  classId: string;
  className: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  createdAt?: string;
};

type AssignmentForm = {
  classId: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
};

const API_BASE = "http://localhost:8080";

function getStatus(deadlineIso: string): "Open" | "Due Soon" | "Past Due" {
  const deadline = new Date(deadlineIso);
  const now = new Date();

  if (deadline.getTime() <= now.getTime()) {
    return "Past Due";
  }

  const hoursToDeadline =
    (deadline.getTime() - now.getTime()) / (1000 * 60 * 60);
  if (hoursToDeadline <= 48) {
    return "Due Soon";
  }

  return "Open";
}

export function AssignmentsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [classes, setClasses] = useState<TeacherClass[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("details");
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState({ classId: "all", status: "all" });
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedAssignment, setSelectedAssignment] = useState<string | null>(
    null,
  );

  const [form, setForm] = useState<AssignmentForm>({
    classId: "",
    title: "",
    description: "",
    deadline: "",
    maxScore: 100,
  });

  useEffect(() => {
    const assignmentId = searchParams.get("id");
    if (assignmentId) {
      setSelectedAssignment(assignmentId);
    }
  }, [searchParams]);

  useEffect(() => {
    const teacherId = localStorage.getItem("userId");

    if (!teacherId) {
      setError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const classRes = await fetch(
          `${API_BASE}/api/classes/my?teacherId=${teacherId}`,
        );
        if (!classRes.ok) {
          throw new Error("Failed to fetch classes");
        }

        const classData: TeacherClass[] = await classRes.json();
        setClasses(classData);

        const assignmentResponses = await Promise.all(
          classData.map(async (teacherClass) => {
            const res = await fetch(
              `${API_BASE}/api/classes/${teacherClass.id}/assignments`,
            );
            if (!res.ok) {
              return [];
            }
            const classAssignments = await res.json();
            return classAssignments.map((item: any) => ({
              id: item.id,
              classId: teacherClass.id,
              className: teacherClass.name,
              title: item.title ?? "Untitled",
              description: item.description ?? "",
              deadline: item.deadline,
              maxScore: item.maxScore ?? 100,
              createdAt: item.createdAt,
            }));
          }),
        );

        const mergedAssignments = assignmentResponses.flat().sort((a, b) => {
          return (
            new Date(a.deadline).getTime() - new Date(b.deadline).getTime()
          );
        });

        setAssignments(mergedAssignments);
      } catch (fetchError) {
        console.error(fetchError);
        setError("Không thể tải assignments từ backend");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredAssignments = useMemo(() => {
    return assignments.filter((assignment) => {
      const status = getStatus(assignment.deadline);
      const classMatch =
        filter.classId === "all" || assignment.classId === filter.classId;
      const statusMatch = filter.status === "all" || status === filter.status;
      const searchMatch =
        searchQuery === "" ||
        assignment.title.toLowerCase().includes(searchQuery.toLowerCase());

      return classMatch && statusMatch && searchMatch;
    });
  }, [assignments, filter, searchQuery]);

  const selectedAssignmentData = assignments.find(
    (assignment) => assignment.id === selectedAssignment,
  );

  const handleAssignmentClick = (assignmentId: string) => {
    setSelectedAssignment(assignmentId);
    router.push(`/dashboard/teacher/assignments?id=${assignmentId}`, {
      scroll: false,
    });
  };

  const handleCreateAssignment = async () => {
    if (!form.classId || !form.title || !form.deadline) {
      return;
    }

    try {
      setCreating(true);
      setError(null);

      const res = await fetch(
        `${API_BASE}/api/classes/${form.classId}/create-assignment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            classId: form.classId,
            title: form.title,
            description: form.description,
            deadline: form.deadline,
            maxScore: form.maxScore,
          }),
        },
      );

      if (!res.ok) {
        throw new Error("Failed to create assignment");
      }

      const created = await res.json();
      const className =
        classes.find((item) => item.id === form.classId)?.name ??
        "Unknown class";

      const mapped: Assignment = {
        id: created.id,
        classId: form.classId,
        className,
        title: created.title,
        description: created.description,
        deadline: created.deadline,
        maxScore: created.maxScore,
        createdAt: created.createdAt,
      };

      setAssignments((prev) => [mapped, ...prev]);
      setDialogOpen(false);
      setForm({
        classId: "",
        title: "",
        description: "",
        deadline: "",
        maxScore: 100,
      });
    } catch (createError) {
      console.error(createError);
      setError("Không thể tạo assignment");
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading assignments...</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Assignments</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Fill in the details to create a new assignment.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Assignment Title</Label>
                <Input
                  id="title"
                  placeholder="Enter assignment title"
                  value={form.title}
                  onChange={(e) =>
                    setForm((prev) => ({ ...prev, title: e.target.value }))
                  }
                />
              </div>
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
                      <SelectItem key={teacherClass.id} value={teacherClass.id}>
                        {teacherClass.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Enter assignment description"
                  rows={4}
                  value={form.description}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="deadline">Deadline</Label>
                  <Input
                    id="deadline"
                    type="datetime-local"
                    value={form.deadline}
                    onChange={(e) =>
                      setForm((prev) => ({ ...prev, deadline: e.target.value }))
                    }
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="points">Points</Label>
                  <Input
                    id="points"
                    type="number"
                    placeholder="100"
                    value={String(form.maxScore)}
                    onChange={(e) =>
                      setForm((prev) => ({
                        ...prev,
                        maxScore: Number(e.target.value) || 100,
                      }))
                    }
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="submit"
                onClick={handleCreateAssignment}
                disabled={creating}
              >
                {creating ? "Creating..." : "Create Assignment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      {selectedAssignment ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedAssignment(null);
                  router.push("/dashboard/teacher/assignments", {
                    scroll: false,
                  });
                }}
              >
                Back to All Assignments
              </Button>
              <h2 className="text-2xl font-bold">
                {selectedAssignmentData?.title}
              </h2>
              <Badge
                variant={
                  selectedAssignmentData
                    ? getStatus(selectedAssignmentData.deadline) === "Open"
                      ? "default"
                      : getStatus(selectedAssignmentData.deadline) ===
                          "Due Soon"
                        ? "outline"
                        : "destructive"
                    : "outline"
                }
              >
                {selectedAssignmentData
                  ? getStatus(selectedAssignmentData.deadline)
                  : "Unknown"}
              </Badge>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Details</CardTitle>
              </CardHeader>
              <CardContent>
                <dl className="space-y-2">
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Class:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData?.className}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Deadline:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData
                        ? format(
                            new Date(selectedAssignmentData.deadline),
                            "PPpp",
                          )
                        : "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Max Score:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData?.maxScore ?? "-"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-3">
                    <dt className="font-medium">Time left:</dt>
                    <dd className="text-right">
                      {selectedAssignmentData
                        ? formatDistanceToNowStrict(
                            new Date(selectedAssignmentData.deadline),
                            { addSuffix: true },
                          )
                        : "-"}
                    </dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Assignment Management</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                  <TabsList className="w-full">
                    <TabsTrigger value="details" className="flex-1">
                      <FileText className="mr-2 h-4 w-4" />
                      Details
                    </TabsTrigger>
                    <TabsTrigger value="submissions" className="flex-1">
                      <Users className="mr-2 h-4 w-4" />
                      Submissions
                    </TabsTrigger>
                    <TabsTrigger value="schedule" className="flex-1">
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="details" className="mt-4">
                    <div className="space-y-4">
                      <div>
                        <h3 className="mb-2 text-lg font-medium">
                          Description
                        </h3>
                        <p className="whitespace-pre-line text-sm text-muted-foreground">
                          {selectedAssignmentData?.description ||
                            "No description"}
                        </p>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="submissions" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Submission tracking for teacher-level assignment overview
                      is not available from backend yet.
                    </p>
                  </TabsContent>

                  <TabsContent value="schedule" className="mt-4">
                    <p className="text-sm text-muted-foreground">
                      Schedule editing for this view is not available from
                      backend yet.
                    </p>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-center gap-2">
              <div className="relative flex-1 md:max-w-sm">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  type="search"
                  placeholder="Search assignments..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
              <Select
                value={filter.status}
                onValueChange={(value) =>
                  setFilter((prev) => ({ ...prev, status: value }))
                }
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="Open">Open</SelectItem>
                  <SelectItem value="Due Soon">Due Soon</SelectItem>
                  <SelectItem value="Past Due">Past Due</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assignment Title</TableHead>
                  <TableHead className="hidden md:table-cell">Class</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Deadline
                  </TableHead>
                  <TableHead className="hidden md:table-cell">Points</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAssignments.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="h-24 text-center">
                      No assignments found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredAssignments.map((assignment) => {
                    const status = getStatus(assignment.deadline);
                    return (
                      <TableRow
                        key={assignment.id}
                        className="cursor-pointer transition-colors hover:bg-muted/50"
                        onClick={() => handleAssignmentClick(assignment.id)}
                      >
                        <TableCell className="font-medium">
                          {assignment.title}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {assignment.className}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {format(new Date(assignment.deadline), "PPpp")}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {assignment.maxScore}
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            variant={
                              status === "Open"
                                ? "default"
                                : status === "Due Soon"
                                  ? "outline"
                                  : "destructive"
                            }
                          >
                            {status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </>
      )}
    </div>
  );
}
