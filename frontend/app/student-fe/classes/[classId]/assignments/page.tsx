"use client";
import { useState, useEffect } from "react";
import { useParams,useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus } from "lucide-react";

interface Assignment {
  id: string;
  classId: string;
  title: string;
  description: string;
  deadline: string;
  maxScore: number;
  createdAt: string;
}

export default function AssignmentsPage() {
  const router = useRouter();

  const { classId } = useParams<{ classId: string }>();

  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);

  // form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [maxScore, setMaxScore] = useState(100);
  const [creating, setCreating] = useState(false);

  // fetch assignments
  const fetchAssignments = async () => {
    setLoading(true);
    const res = await fetch(
      `http://localhost:8080/api/classes/${classId}/assignments`
    );
    const data = await res.json();
    setAssignments(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, [classId]);

  const handleCreateAssignment = async () => {
    if (!title || !deadline) return;

    setCreating(true);

    const res = await fetch(`http://localhost:8080/api/classes/${classId}/create-assignment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        title,
        description,
        deadline,
        maxScore,
      }),
    });

    if (!res.ok) {
      setCreating(false);
      throw new Error("Failed to create assignment");
    }

    const newAssignment = await res.json();

    // optimistic update
    setAssignments((prev) => [newAssignment, ...prev]);

    // reset form
    setTitle("");
    setDescription("");
    setDeadline("");
    setMaxScore(100);
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(`/student-fe/classes/${classId}`)}
          >
            Back
          </Button>

          <h1 className="text-3xl font-bold">Assignments</h1>
        </div>        
      </div>

      {loading ? (
        <p>Loading...</p>
      ) : assignments.length === 0 ? (
        <p>No assignments yet.</p>
      ) : (
        <div className="rounded-md border">
        <table className="w-full text-sm">
            <thead className="bg-muted">
            <tr>
                <th className="p-3 text-left">Title</th>
                <th className="p-3 text-left">Description</th>
                <th className="p-3 text-left">Deadline</th>
                <th className="p-3 text-left">Action</th>

            </tr>
            </thead>
            <tbody>
            {assignments.map((assignment) => (
              <tr key={assignment.id} className="border-t hover:bg-muted/50">
              <td className="p-3 font-medium">{assignment.title}</td>
              <td className="p-3">{assignment.description}</td>
              <td className="p-3">{assignment.deadline}</td>

              <td className="p-3">
                <Button
                  size="sm"
                  onClick={() =>
                    router.push(`/student-fe/classes/${classId}/assignments/${assignment.id}`)}
                >
                  View
                </Button>
              </td>
            </tr>

            ))}
            </tbody>
        </table>
        </div>

      )}
    </div>
  );
}
