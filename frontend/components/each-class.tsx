"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
import { ArrowLeft, Users } from "lucide-react";
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

  const [students, setStudents] = useState<Student[]>([]);
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
