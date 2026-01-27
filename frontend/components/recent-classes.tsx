"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {useEffect, useState} from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";


export function RecentClasses() {
  const [recentClasses, setRecentClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch real data
  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) return;

    fetch(`http://localhost:8080/api/classes/my?teacherId=${teacherId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch classes");
        return res.json();
      })
      .then((data) => {
        setRecentClasses(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load classes", err);
        setLoading(false);
      });
  }, []);

  // Loading state
  if (loading) {
    return <div className="text-muted-foreground">Loading classes...</div>;
  }

  // Empty state
  if (recentClasses.length === 0) {
    return (
      <div className="text-muted-foreground text-sm">
        No classes created yet.
      </div>
    );
  }


  return (
    <div className="w-full">
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[250px]">Class Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentClasses.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell className="font-medium">{classItem.name}</TableCell>
                <TableCell>{classItem.level}</TableCell>
                <TableCell>{classItem.time}</TableCell>
                <TableCell>{classItem.days}</TableCell>
                <TableCell>{classItem.getStudentCount ?? 0}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
