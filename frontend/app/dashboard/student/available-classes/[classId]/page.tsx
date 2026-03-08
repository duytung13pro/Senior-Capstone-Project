"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Calendar, Clock, Users, MapPin } from "lucide-react";
import { fetchApiFirstOk } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ClassItem = {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description?: string;
  room?: string;
  maxStudents?: number | null;
  startDate?: string;
  endDate?: string;
  teacherId?: string;
  studentIds: string[];
};

export default function StudentClassDetailsPage() {
  const ENROLLMENT_REFRESH_KEY = "studentClassesUpdatedAt";
  const params = useParams();
  const router = useRouter();
  const classId = params.classId as string;

  const [classData, setClassData] = useState<ClassItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [enrolling, setEnrolling] = useState(false);

  const resolveStudentId = async () => {
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
      const sessionStudentId = sessionData?.user?.id || "";

      if (sessionStudentId) {
        localStorage.setItem("userId", sessionStudentId);
      }

      return sessionStudentId;
    } catch {
      return "";
    }
  };

  const loadClass = async () => {
    try {
      setLoading(true);
      setError("");

      const res = await fetchApiFirstOk(`/api/classes/${classId}`, {
        cache: "no-store",
      });
      const data: ClassItem = await res.json();
      setClassData(data);
    } catch (loadError) {
      console.error(loadError);
      setError("Unable to load class details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!classId) {
      return;
    }
    void loadClass();
  }, [classId]);

  const handleEnroll = async () => {
    const studentId = await resolveStudentId();
    if (!studentId) {
      setError("Please log in again to enroll in this class");
      return;
    }

    if (!classData) {
      return;
    }

    const isAlreadyEnrolled = (classData.studentIds || []).includes(studentId);
    if (isAlreadyEnrolled) {
      router.push("/dashboard/student/my-classes");
      return;
    }

    const isFull =
      classData.maxStudents != null &&
      (classData.studentIds?.length || 0) >= classData.maxStudents;

    if (isFull) {
      setError("This class is full");
      return;
    }

    try {
      setEnrolling(true);
      setError("");

      await fetchApiFirstOk("/api/classes/enroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, studentId }),
      });

      localStorage.setItem(ENROLLMENT_REFRESH_KEY, Date.now().toString());
      window.dispatchEvent(new Event("student-classes-updated"));
      router.push("/dashboard/student/my-classes");
    } catch (enrollError) {
      console.error(enrollError);
      setError("Unable to enroll in this class");
    } finally {
      setEnrolling(false);
    }
  };

  if (loading) {
    return <div className="p-6">Loading class details...</div>;
  }

  if (!classData) {
    return <div className="p-6">Class not found.</div>;
  }

  const seatsUsed = classData.studentIds?.length || 0;
  const isFull = classData.maxStudents != null && seatsUsed >= classData.maxStudents;

  return (
    <div className="space-y-6 p-6">
      <div className="space-y-2">
        <Link
          href="/dashboard/student/available-classes"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to available classes
        </Link>
        <h1 className="text-3xl font-bold tracking-tight">{classData.name}</h1>
        <p className="text-muted-foreground">
          Full class information before you enroll.
        </p>
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle>Class Details</CardTitle>
            <Badge variant={isFull ? "destructive" : "outline"}>
              {isFull ? "Full" : "Available"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline">{classData.level}</Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {classData.days}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {classData.time}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {seatsUsed}
              {classData.maxStudents ? ` / ${classData.maxStudents}` : ""}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              {classData.room || "TBD"}
            </Badge>
          </div>

          <div className="space-y-1">
            <p className="text-sm font-medium">Description</p>
            <p className="text-sm text-muted-foreground">
              {classData.description || "No description provided."}
            </p>
          </div>

          <div className="grid gap-2 text-sm text-muted-foreground md:grid-cols-2">
            <p>
              <span className="font-medium text-foreground">Start Date:</span>{" "}
              {classData.startDate || "TBD"}
            </p>
            <p>
              <span className="font-medium text-foreground">End Date:</span>{" "}
              {classData.endDate || "TBD"}
            </p>
            {classData.teacherId ? (
              <p className="md:col-span-2">
                <span className="font-medium text-foreground">Teacher ID:</span>{" "}
                {classData.teacherId}
              </p>
            ) : null}
          </div>

          <Button onClick={handleEnroll} disabled={isFull || enrolling} className="w-full">
            {enrolling ? "Enrolling..." : isFull ? "Class is full" : "Enroll in this class"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
