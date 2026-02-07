"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Course {
  id: string;
  name: string;
  level: string;
  time: string;
  days: string;
  description: string;
}

export default function StudentCoursesPage() {

  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/classes/all");

      if (!res.ok) throw new Error("Failed to fetch courses");

      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  if (loading) return <p className="p-6">Loading courses...</p>;

  return (
    <div className="p-6 space-y-6">

      <h1 className="text-3xl font-bold">Available Courses</h1>
      <p className="text-muted-foreground">
        Browse and choose a class you would like to join.
      </p>

      {courses.length === 0 && (
        <p>No courses available yet.</p>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {courses.map((course) => (
          <Card key={course.id} className="hover:shadow-lg transition">

            <CardHeader>
              <CardTitle>{course.name}</CardTitle>
              <CardDescription>
                {course.days} • {course.time}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">

              <Badge>{course.level}</Badge>

              <p className="text-sm text-muted-foreground">
                {course.description}
              </p>

              {/* DO NOT IMPLEMENT YET */}
              <Button className="w-full">
                Enroll
              </Button>

            </CardContent>

          </Card>
        ))}
      </div>
    </div>
  );
}
