"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {AddStudentButton} from "@/components/add-student-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export function ClassDetailPage() {
  const { classId } = useParams();
  const [classData, setClassData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [studentEmail, setStudentEmail] = useState("");
  const [loading, setLoading] = useState(true);

  // 1Load class info
  useEffect(() => {
    fetch(`http://localhost:8080/api/classes/${classId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load class");
        return res.json();
      })
      .then(data => {
        setClassData(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [classId]);

  if (loading) return <div>Loading class...</div>;
  if (!classData) return <div>Class not found</div>;

  return (
    <div className="space-y-6">
      {/* Class Info */}
      <div>
        <h1 className="text-3xl font-bold">{classData.name}</h1>
        <p className="text-muted-foreground">
          {classData.level} · {classData.days} · {classData.time}
        </p>
      </div>

      {/* Add Student */}
      <div className="flex gap-2 max-w-md">
        <Input
          placeholder="Student email"
          value={studentEmail}
          onChange={(e) => setStudentEmail(e.target.value)}
        />
        <AddStudentButton>Add Student</AddStudentButton>
      </div>

      {/* Student List */}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Email</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.length === 0 ? (
            <TableRow>
              <TableCell>No students yet</TableCell>
            </TableRow>
          ) : (
            students.map((s) => (
              <TableRow key={s.id}>
                <TableCell>{s.email}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
