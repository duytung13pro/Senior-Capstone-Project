

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

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Fetch when the dialog is opened
export function RemoveStudentButton({classId,onSuccess,}: {classId: string; onSuccess: () => void;}) 
{

  const [open, setOpen] = useState(false);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>("");

  // Only fetch when button is clicked
  useEffect(() => {
    console.log("useEffect triggered, open =", open);

  // Does not fetch when page reload
    if(!open) return;
    setLoading(true);
    const teacherId = localStorage.getItem("userId");
    // Check for valid teacherId
    if (!teacherId) {
      setLoading(false);
      return;
    }
    // Send the request to get all students
    fetch(`http://localhost:8080/api/classes/${classId}/in-class-students`)
      .then((res) => res.json())
      .then((data) => {
        setStudents(data); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load classes", err);
        setLoading(false);
      });
  }, [open]);

  const handleRemoveStudent = async () => {
    if (!selectedStudent) return;

    const res = await fetch("http://localhost:8080/api/classes/remove-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId, // Comes from parent who call it
        studentEmail: selectedStudent
      }),
    });
    if (!res.ok) {
      console.error("Failed to remove student");
      return;
    }
  
    if (res.ok) {
      onSuccess();     // notify parent
      setOpen(false);  // close dialog
    }  
  };

  return (
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Remove Student
          </Button>
        </DialogTrigger>

        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove a student from a class</DialogTitle>
          </DialogHeader>

          {loading ? (
            <p className="text-sm text-muted-foreground">Removing students...</p>
          ) : (
            <Select onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>

              <SelectContent>
                {students.map(student => (
                  <SelectItem key={student.id} value={student.email}>
                    {student.firstName} {student.lastName} — {student.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Button
            className="mt-4"
            disabled={!selectedStudent}
            onClick= {handleRemoveStudent}
          >
            Confirm
          </Button>
        </DialogContent>
      </Dialog>
  );
}


