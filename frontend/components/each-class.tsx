"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  GripVertical,
  Link2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { DashboardLayout } from "@/components/dashboard-layout";
import { AddStudentButton } from "@/components/add-student-button";
import { RemoveStudentButton } from "@/components/remove-student-button";
import { fetchApiFirstOk } from "@/lib/api";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassDetail {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description: string;
  room?: string;
  maxStudents?: number;
  startDate?: string;
  endDate?: string;
  studentIds: string[];
  resources?: ClassResource[];
  modules?: ClassModule[];
}

interface ClassResource {
  id: string;
  title: string;
  url: string;
}

interface ClassModule {
  id: string;
  title: string;
  order?: number;
}

export function EachClass() {
  const params = useParams<{ classId: string | string[] }>();
  const routeClassId = Array.isArray(params.classId)
    ? params.classId[0]
    : params.classId;
  const classId = routeClassId || "";
  const router = useRouter();

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [classError, setClassError] = useState<string | null>(null);
  const [resourceTitle, setResourceTitle] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [resourceError, setResourceError] = useState<string | null>(null);
  const [resourceSaving, setResourceSaving] = useState(false);
  const [resourceDeletingId, setResourceDeletingId] = useState<string | null>(
    null,
  );
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleError, setModuleError] = useState<string | null>(null);
  const [moduleSaving, setModuleSaving] = useState(false);
  const [moduleDeletingId, setModuleDeletingId] = useState<string | null>(null);
  const [moduleLoading, setModuleLoading] = useState(false);
  const [moduleLoadError, setModuleLoadError] = useState<string | null>(null);
  const [modules, setModules] = useState<ClassModule[]>([]);

  const [students, setStudents] = useState<Student[]>([]);
  const fetchModules = async (
    showLoading = false,
    sourceClassId: string = classId,
  ) => {
    if (!sourceClassId) {
      setModules([]);
      return;
    }

    if (showLoading) {
      setModuleLoading(true);
    }

    try {
      setModuleLoadError(null);
      const res = await fetchApiFirstOk(`/api/classes/${sourceClassId}/modules`, {
        cache: "no-store",
      });
      const data = await res.json();
      setModules(Array.isArray(data) ? data : []);
    } catch (error) {
      setModules([]);
      setModuleLoadError(
        error instanceof Error
          ? error.message
          : "Failed to load modules in this class.",
      );
    } finally {
      if (showLoading) {
        setModuleLoading(false);
      }
    }
  };

  // Update class
  const fetchClass = async (showLoading = false) => {
    if (showLoading) {
      setLoading(true);
    }

    try {
      setClassError(null);
      const res = await fetchApiFirstOk(`/api/classes/${classId}`, {
        cache: "no-store",
      });
      const data = await res.json();
      setClassData(data);
    } catch (error) {
      setClassError(
        error instanceof Error
          ? error.message
          : "Failed to load class details.",
      );
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  // Update StudentInfo
  const fetchStudents = async (showLoading = false) => {
    if (showLoading) {
      setStudentLoading(true);
    }

    try {
      setStudentError(null);
      const res = await fetchApiFirstOk(
        `/api/classes/${classId}/in-class-students`,
        {
          cache: "no-store",
        },
      );
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : []);
    } catch (error) {
      setStudentError(
        error instanceof Error
          ? error.message
          : "Failed to load students in this class.",
      );
    } finally {
      if (showLoading) {
        setStudentLoading(false);
      }
    }
  };

  useEffect(() => {
    if (!classId) {
      setLoading(false);
      setStudentLoading(false);
      setClassError("Invalid class id.");
      return;
    }

    fetchClass(true);
    fetchStudents(true);
    fetchModules(true, classId);
  }, [classId]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading class...</div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return <div className="p-6">{classError || "Class not found."}</div>;
  }

  const effectiveClassId = classData.id || classId;
  const classResources = classData.resources || [];
  const classModules = [...modules].sort(
    (left, right) =>
      (left.order ?? Number.MAX_SAFE_INTEGER) -
      (right.order ?? Number.MAX_SAFE_INTEGER),
  );

  const handleAddResource = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = resourceTitle.trim();
    const url = resourceUrl.trim();

    if (!title || !url) {
      setResourceError("Please provide both a title and a URL.");
      return;
    }

    try {
      setResourceSaving(true);
      setResourceError(null);

      const res = await fetchApiFirstOk(
        `/api/classes/${effectiveClassId}/resources`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title, url }),
        },
      );

      const updatedClass: ClassDetail = await res.json();
      setClassData(updatedClass);
      setResourceTitle("");
      setResourceUrl("");
    } catch (error) {
      setResourceError(
        error instanceof Error
          ? error.message
          : "Unable to add resource right now.",
      );
    } finally {
      setResourceSaving(false);
    }
  };

  const handleRemoveResource = async (resourceId: string) => {
    try {
      setResourceDeletingId(resourceId);
      setResourceError(null);

      const res = await fetchApiFirstOk(
        `/api/classes/${effectiveClassId}/resources/${resourceId}`,
        {
          method: "DELETE",
        },
      );

      const updatedClass: ClassDetail = await res.json();
      setClassData(updatedClass);
    } catch (error) {
      setResourceError(
        error instanceof Error
          ? error.message
          : "Unable to remove resource right now.",
      );
    } finally {
      setResourceDeletingId(null);
    }
  };

  const handleAddModule = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = moduleTitle.trim();
    if (!title) {
      setModuleError("Please provide a module name.");
      return;
    }

    try {
      setModuleSaving(true);
      setModuleError(null);

      const res = await fetchApiFirstOk(
        `/api/classes/${effectiveClassId}/modules`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ title }),
        },
      );

      const updatedClass: ClassDetail = await res.json();
      setClassData(updatedClass);
      await fetchModules(false, updatedClass.id || effectiveClassId);
      setModuleTitle("");
    } catch (error) {
      setModuleError(
        error instanceof Error
          ? error.message
          : "Unable to add module right now.",
      );
    } finally {
      setModuleSaving(false);
    }
  };

  const handleRemoveModule = async (moduleId: string) => {
    try {
      setModuleDeletingId(moduleId);
      setModuleError(null);

      const res = await fetchApiFirstOk(
        `/api/classes/${effectiveClassId}/modules/${moduleId}`,
        {
          method: "DELETE",
        },
      );

      const updatedClass: ClassDetail = await res.json();
      setClassData(updatedClass);
      await fetchModules(false, updatedClass.id || effectiveClassId);
    } catch (error) {
      setModuleError(
        error instanceof Error
          ? error.message
          : "Unable to remove module right now.",
      );
    } finally {
      setModuleDeletingId(null);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        {/* Left side */}
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => router.push("/dashboard/teacher/classes")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>

          <h1 className="text-2xl font-bold">{classData.name}</h1>
          <Badge variant="outline">{classData.level}</Badge>
        </div>

        {/* Right side actions */}
        <div className="flex gap-2">
          <AddStudentButton
            classId={effectiveClassId}
            onSuccess={() => {
              fetchClass();
              fetchStudents();
            }}
          />
          <RemoveStudentButton
            classId={effectiveClassId}
            onSuccess={() => {
              fetchClass();
              fetchStudents();
            }}
          />
          <Button
            variant="outline"
            disabled={!effectiveClassId}
            onClick={() => {
              if (!effectiveClassId) return;
              router.push(
                `/dashboard/teacher/assignments?id=${effectiveClassId}`,
              );
            }}
          >
            Assignments
          </Button>
        </div>
      </div>

      {/* Top cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Class Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Time</span>
              <span>{classData.time}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Days</span>
              <span>{classData.days}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Students</span>
              <span>{students.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Room</span>
              <span>{classData.room || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Capacity</span>
              <span>{classData.maxStudents ?? "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Start Date</span>
              <span>{classData.startDate || "-"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">End Date</span>
              <span>{classData.endDate || "-"}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Description</CardTitle>
          </CardHeader>
          <CardContent>
            {classData.description || "No description provided."}
          </CardContent>
        </Card>
      </div>

      <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Class Resources</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleAddResource}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Resource Title
              </label>
              <Input
                value={resourceTitle}
                onChange={(event) => setResourceTitle(event.target.value)}
                placeholder="Course Syllabus"
                className="border-gray-200 focus-visible:ring-primary"
              />
            </div>

            <div className="w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Resource URL
              </label>
              <Input
                value={resourceUrl}
                onChange={(event) => setResourceUrl(event.target.value)}
                placeholder="https://zoom.us/..."
                className="border-gray-200 focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={resourceSaving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {resourceSaving ? "Adding..." : "Add Resource"}
            </Button>
          </form>

          {resourceError ? (
            <p className="text-sm text-destructive">{resourceError}</p>
          ) : null}

          <div className="space-y-2">
            {classResources.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No resources added yet.
              </p>
            ) : (
              classResources.map((resource) => (
                <div
                  key={resource.id}
                  className="flex items-start justify-between gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="min-w-0 space-y-1">
                    <p className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                      <Link2 className="h-4 w-4 text-muted-foreground" />
                      <span>{resource.title}</span>
                    </p>
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noreferrer"
                      className="block max-w-[420px] truncate text-xs text-gray-500 hover:underline"
                    >
                      {resource.url}
                    </a>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={resourceDeletingId === resource.id}
                    onClick={() => handleRemoveResource(resource.id)}
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-xl border border-gray-100 bg-white shadow-sm">
        <CardHeader>
          <CardTitle>Manage Modules / Syllabus</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form
            onSubmit={handleAddModule}
            className="flex flex-col gap-3 md:flex-row md:items-end"
          >
            <div className="w-full space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                Module Name
              </label>
              <Input
                value={moduleTitle}
                onChange={(event) => setModuleTitle(event.target.value)}
                placeholder="Week 1: Basics"
                className="border-gray-200 focus-visible:ring-primary"
              />
            </div>

            <Button
              type="submit"
              disabled={moduleSaving}
              className="bg-emerald-600 text-white hover:bg-emerald-700"
            >
              <Plus className="mr-2 h-4 w-4" />
              {moduleSaving ? "Adding..." : "Add Module"}
            </Button>
          </form>

          {moduleError ? (
            <p className="text-sm text-destructive">{moduleError}</p>
          ) : null}

          {moduleLoadError ? (
            <p className="text-sm text-destructive">{moduleLoadError}</p>
          ) : null}

          <div className="space-y-2">
            {moduleLoading ? (
              <p className="text-sm text-muted-foreground">Loading modules...</p>
            ) : classModules.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No modules added yet.
              </p>
            ) : (
              classModules.map((moduleItem) => (
                <div
                  key={moduleItem.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gray-100 p-3"
                >
                  <div className="inline-flex items-center gap-2 text-sm font-medium text-foreground">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span>{moduleItem.title}</span>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    disabled={moduleDeletingId === moduleItem.id}
                    onClick={() => handleRemoveModule(moduleItem.id)}
                    className="text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Class Management</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="students">
            <TabsList className="w-full">
              <TabsTrigger value="students" className="flex-1">
                <Users className="mr-2 h-4 w-4" />
                Students
              </TabsTrigger>
            </TabsList>

            <TabsContent value="students" className="mt-4">
              <div className="flex justify-between mb-4">
                <h3 className="text-lg font-medium">Enrolled Students</h3>
              </div>

              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {studentLoading ? (
                      <TableRow>
                        <TableCell colSpan={2} className="text-center">
                          Loading students...
                        </TableCell>
                      </TableRow>
                    ) : studentError ? (
                      <TableRow>
                        <TableCell
                          colSpan={2}
                          className="text-center text-destructive"
                        >
                          Unable to load students right now.
                        </TableCell>
                      </TableRow>
                    ) : (
                      <>
                        {students.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={2} className="text-center">
                              No students enrolled.
                            </TableCell>
                          </TableRow>
                        ) : (
                          students.map((student) => (
                            <TableRow key={student.id}>
                              <TableCell>
                                {student.firstName} {student.lastName}
                              </TableCell>
                              <TableCell>{student.email}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
