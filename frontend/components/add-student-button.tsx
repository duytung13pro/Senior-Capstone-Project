

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
import { DashboardLayout } from "@/components/dashboard-layout";

interface Student {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

// Fetch when the dialog is opened
export function AddStudentButton() {

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
    fetch(`http://localhost:8080/api/users/students`)
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

  const handleAddStudent = async () => {
    console.log("Student added successfully");
    const classId = "697832b48818c014a3756bcc";
    if (!selectedStudent) return;

    const res = await fetch("http://localhost:8080/api/classes/add-student", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        classId,
        studentEmail: selectedStudent
      }),
    });
    if (!res.ok) {
      console.error("Failed to add student");
      return;
    }
  
    console.log("Student added successfully");
  
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
          ) : (
            <Select onValueChange={setSelectedStudent}>
              <SelectTrigger>
                <SelectValue placeholder="Select a student" />
              </SelectTrigger>

              <SelectContent>
                {students.map((student) => (
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
            onClick= {handleAddStudent}
          >
            Confirm
          </Button>
        </DialogContent>
      </Dialog>
  );
}


