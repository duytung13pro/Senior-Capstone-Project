"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/components/ui/use-toast"; // If you have shadcn/ui toast
// Or use a simple alert for feedback

interface Assignment {
  id: string;
  title: string;
  description: string;
  deadline: string;
  detail: string;
}

interface StudentSubmission {
  studentId: string;
  studentName: string;
  email: string;
  submitted: boolean;
}

export default function StudentAssignmentDetailPage() {
  const { classId, assignmentId } = useParams<{classId: string; assignmentId: string;}>();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [requirements, setRequirements] = useState("");
  const [students, setStudents] = useState<StudentSubmission[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [originalDescription, setOriginalDescription] = useState("");
  console.log("Params:", { classId, assignmentId }); // Debug: check if params are received

  /*Fetch Assignment */
  const fetchAssignment = async () => {
    const res = await fetch(
      `http://localhost:8080/api/assignment/${assignmentId}`
    );
    const data = await res.json();
    setAssignment(data);
    setRequirements(data.detail || "");
    setOriginalDescription(data.detail || "");
  };

  const fetchStudents = async () => {
    // You'll need to implement this endpoint or modify existing one
    const res = await fetch(
      `http://localhost:8080/api/classes/${classId}/assignments/${assignmentId}/submissions`
    );
    if (res.ok) {
      const data = await res.json();
      setStudents(data);
    }
  };

  const loadPage = async () => {
    setLoading(true);
    await Promise.all([fetchAssignment(), fetchStudents()]);
    setLoading(false);
  };

  useEffect(() => {
    loadPage();
  }, [assignmentId]);

  const handleSaveDescription = async () => {
    // Only save if description has changed
    if (requirements === originalDescription) {
      toast({
        title: "No changes",
        description: "The description hasn't been modified.",
        variant: "default",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch(
        `http://localhost:8080/api/assignment/${assignmentId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            detail: requirements,
          }),
        }
      );

      if (response.ok) {
        setOriginalDescription(requirements); 
        alert("Success! Assignment description updated successfully.");

        toast({
          title: "Success",
          description: "Assignment description updated successfully.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error saving description:", error);
      toast({
        title: "Error",
        description: "Failed to update assignment description. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || !assignment) return <p className="p-6">Loading...</p>;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/tutor-fe/classes/${classId}/assignments`)}>
          ← Back to Assignments
        </Button>

        <div className="text-right">
          <h1 className="text-3xl font-bold">{assignment.title}</h1>
          <p className="text-muted-foreground">
            Deadline: {new Date(assignment.deadline).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Requirements Section */}
      <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Assignment Requirements</h2>
          <div className="flex items-center gap-2">
            {requirements !== originalDescription && (
              <span className="text-sm text-amber-600">Unsaved changes</span>
            )}
          </div>
        </div>

        <Textarea
          className="min-h-[200px]"
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Write assignment instructions, rubric, or details..."
          readOnly
        />

      </div>
    </div>
  );
}