"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { apiEndpointCandidates, fetchWithTimeout } from "@/lib/api";
interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Fetch when the dialog is opened
export function AddStudentButton({
  classId,
  onSuccess,
}: {
  classId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  const fetchJsonFromCandidates = async (path: string) => {
    let lastError: unknown = null;
    for (const endpoint of apiEndpointCandidates(path)) {
      try {
        const res = await fetchWithTimeout(endpoint, undefined, 8000);
        if (!res.ok) {
          lastError = new Error(`HTTP ${res.status} from ${endpoint}`);
          continue;
        }
        return res.json();
      } catch (error) {
        lastError = error;
        continue;
      }
    }
    throw lastError instanceof Error
      ? lastError
      : new Error(`Unable to load ${path}`);
  };

  // Only fetch when button is clicked
  useEffect(() => {
    if (!open) return;

    let canceled = false;
    setLoading(true);
    setErrorMessage("");
    setSelectedStudent("");

    (async () => {
      try {
        const [allStudentsData, classData] = await Promise.all([
          fetchJsonFromCandidates("/api/users/students"),
          fetchJsonFromCandidates(`/api/classes/${classId}`),
        ]);

        const allStudents = Array.isArray(allStudentsData)
          ? (allStudentsData as Student[])
          : [];
        const enrolledStudentIds = Array.isArray(classData?.studentIds)
          ? (classData.studentIds as string[])
          : [];

        const enrolledSet = new Set(
          enrolledStudentIds
            .filter((value) => typeof value === "string")
            .map((value) => value.trim()),
        );

        const loadedStudents = allStudents.filter(
          (student) => !enrolledSet.has(String(student.id || "").trim()),
        );

        if (!canceled) {
          setStudents(loadedStudents);
        }
      } catch (err) {
        if (!canceled) {
          console.error("Failed to load students", err);
          setStudents([]);
          setErrorMessage("Unable to load available students.");
        }
      } finally {
        if (!canceled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      canceled = true;
    };
  }, [open, classId]);

  const handleAddStudent = async () => {
    if (!selectedStudent) return;

    const selected = students.find((student) => student.id === selectedStudent);
    const selectedEmail = selected?.email || "";

    setSubmitting(true);
    setErrorMessage("");
    try {
      const candidates = apiEndpointCandidates("/api/classes/add-student");
      let success = false;
      let lastMessage = "Failed to add student";

      for (const endpoint of candidates) {
        try {
          const res = await fetchWithTimeout(
            endpoint,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                classId,
                studentId: selectedStudent,
                studentEmail: selectedEmail,
              }),
            },
            8000,
          );

          if (res.ok) {
            success = true;
            break;
          }

          lastMessage =
            (await res.text()) || `Failed to add student via ${endpoint}`;
        } catch {
          lastMessage = `Unable to reach ${endpoint}`;
        }
      }

      if (!success) {
        setErrorMessage(lastMessage);
        return;
      }

      onSuccess();
      setOpen(false);
    } catch (error) {
      console.error("Failed to add student", error);
      setErrorMessage("Failed to add student");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Student
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add Student to Class</DialogTitle>
        </DialogHeader>

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading students...</p>
        ) : students.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No available students to add.
          </p>
        ) : (
          <Select onValueChange={setSelectedStudent}>
            <SelectTrigger>
              <SelectValue placeholder="Select a student" />
            </SelectTrigger>

            <SelectContent>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.firstName} {student.lastName} — {student.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {errorMessage ? (
          <p className="text-sm text-destructive">{errorMessage}</p>
        ) : null}

        <Button
          className="mt-4"
          disabled={!selectedStudent || submitting || loading}
          onClick={handleAddStudent}
        >
          {submitting ? "Adding..." : "Confirm"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
