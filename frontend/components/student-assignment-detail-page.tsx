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


export function StudentAssignmentDetailPage() {
  const { classId, assignmentId } = useParams<{classId: string; assignmentId: string;}>();
  const router = useRouter();

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [requirements, setRequirements] = useState("");
  const [submission, setSubmission] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [originalSubmission, setOriginalSubmission] = useState("");

  
  /*Fetch Assignment */
  const fetchAssignment = async () => {
    const res = await fetch(
      `http://localhost:8080/api/assignment/${assignmentId}`
    );
    const data = await res.json();
    setAssignment(data);
    setRequirements(data.detail || "");
  };
  const fetchSubmission = async () => {
    const userId = localStorage.getItem("userId")

    const response = await fetch(`http://localhost:8080/api/submission/get-detail/${assignmentId}/${userId}`,);
    
    const data = await response.json();
    setSubmission(data.content ?? "");
    setOriginalSubmission(data.content ?? "");
    };
  // Fetch submission detail

  const loadPage = async () => {
    setLoading(true);
    await Promise.all([fetchAssignment(),fetchSubmission()]);
    setLoading(false);
  };
  const handleSubmit = async () => {
    // Only save if description has changed

    setSubmitting(true);
    try {
      const userId = localStorage.getItem("userId")

      const response = await fetch(
        `http://localhost:8080/api/submission/${assignmentId}/submit`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            content: submission,
            studentId: userId
          }),
        }
      );

      if (response.ok) {
        setOriginalSubmission(submission);        
        toast({
          title: "Success",
          description: "Submit assignment successfully.",
          variant: "default",
        });
      } else {
        throw new Error("Failed to update");
      }
    } catch (error) {
      console.error("Error submitting assignment", error);
      toast({
        title: "Error",
        description: "Failed to update assignment description. Please try again.",
        variant: "destructive",
      });
    } finally {
        setSubmitting(false);
    }
  };
  useEffect(() => {
    loadPage();
  }, [assignmentId]);


  if (loading || !assignment) return <p className="p-6">Loading...</p>;

  return (
    <div className="space-y-6 p-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push(`/student-fe/classes/${classId}/assignments`)}>
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
        </div>

        <Textarea
          className="min-h-[200px]"
          value={requirements}
          placeholder="assignment instructions, rubric, or details..."
          readOnly
        />

      </div>

        {/* Submission Section */}
        <div className="border rounded-lg p-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Assignment Submission</h2>
          <Button 
              onClick={handleSubmit} 
              disabled={submitting || submission === originalSubmission}
              className="min-w-[80px]"
            >
              {submitting ? "Submitting..." : "Submit"}
            </Button>
        </div>

        <Textarea
          className="min-h-[200px]"
          value={submission}
          onChange={(e) => setSubmission(e.target.value)}
          placeholder="Enter submission for this assignment"
        />

      </div>

    </div>
  );
}