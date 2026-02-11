"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
import { AddStudentButton } from "@/components/add-student-button"
import { RemoveStudentButton } from "@/components/remove-student-button"

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
  studentIds: string[];
}

export function EachClass() {
  const { classId } = useParams();
  const router = useRouter();

  const [classData, setClassData] = useState<ClassDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [studentLoading, setStudentLoading] = useState(true);

  const [students, setStudents] = useState<Student[]>([]);
  // Update class
  const fetchClass = async () => {
    setLoading(true);
    const res = await fetch(`http://localhost:8080/api/classes/${classId}`);
    const data = await res.json();
    setClassData(data);
    setLoading(false);
  };

  // Update StudentInfo
  const fetchStudents = async () => {
    setStudentLoading(true);
    const res = await fetch(`http://localhost:8080/api/classes/${classId}/in-class-students`);
    const data = await res.json();
    console.log("students response:", data);
    console.log("isArray:", Array.isArray(data));
    setStudents(data);
    setStudentLoading(false);

  };
  
  useEffect(() => {
    fetchClass();
    fetchStudents()
  }, [classId]);

  if (loading || studentLoading) {
    return (
      <DashboardLayout>
        <div className="p-6">Loading class...</div>
      </DashboardLayout>
    );
  }

  if (!classData) {
    return (
        <div className="p-6">Class not found.</div>
    );
  }

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
          <AddStudentButton classId={classData.id} onSuccess={() => {fetchClass();fetchStudents();}}/>
          <RemoveStudentButton classId={classData.id} onSuccess={() => {fetchClass();fetchStudents();}}/>
          <Button variant="outline" onClick={() => router.push(`/dashboard/teacher/classes/${classData.id}/assignments`)}>
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