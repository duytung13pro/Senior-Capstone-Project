"use client";
import { useRouter } from "next/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { fetchApiFirstOk } from "@/lib/api";
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
  const router = useRouter();

  // Fetch real data
  useEffect(() => {
    const teacherId = localStorage.getItem("userId");
    if (!teacherId) return;

    fetchApiFirstOk(`/api/classes/my?teacherId=${teacherId}`, {
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        setRecentClasses(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load classes", err);
        setLoading(false);
      });
  }, []);

  const visibleClasses = useMemo(() => {
    return [...recentClasses]
      .sort((a, b) => {
        const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      })
      .slice(0, 6);
  }, [recentClasses]);

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
              <TableHead>Room</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Students</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {visibleClasses.map((classItem) => (
              <TableRow key={classItem.id}>
                <TableCell className="font-medium">{classItem.name}</TableCell>
                <TableCell>{classItem.level}</TableCell>
                <TableCell>{classItem.time}</TableCell>
                <TableCell>{classItem.days}</TableCell>
                <TableCell>{classItem.room || "-"}</TableCell>
                <TableCell>{classItem.maxStudents ?? "-"}</TableCell>
                <TableCell>
                  {Array.isArray(classItem.studentIds)
                    ? classItem.studentIds.length
                    : 0}
                </TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      router.push(`/dashboard/teacher/classes/${classItem.id}`)
                    }
                  >
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
