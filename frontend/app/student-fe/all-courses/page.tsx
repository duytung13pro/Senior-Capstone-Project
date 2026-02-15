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
  const [fetchAllCourseLoading, setFetchAllCourseLoading] = useState(true);
  const [fetchEnrolledCourseLoading, setFetchEnrolledCourseLoading] = useState(true);
  const [enrolledCourses, setEnrolledCourses] = useState<string[]>([]);
  const [enrollingId, setEnrollingId] = useState<string | null>(null); // Track which course is being enrolled in

  // Show all courses
  const fetchCourses = async () => {
    try {
      const res = await fetch("http://localhost:8080/api/classes/all");
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setCourses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setFetchAllCourseLoading(false);
    }
  };

  // Show all enrolled course of a student
  const fetchEnrolledCourse = async () => {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
      setEnrolledCourses([]);
      setFetchEnrolledCourseLoading(false);
      return;
    }

    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}/enrolled-course`);
      if (!res.ok) throw new Error("Failed to fetch courses");
      const data = await res.json();
      setEnrolledCourses(data);
    } catch (err) {
      console.error(err);
      setEnrolledCourses([]);
    } finally {
      setFetchEnrolledCourseLoading(false);
    }
  };

  const handleEnrollStudent = async (classId: string) => {
    const userId = localStorage.getItem("userId");
    
    if (!userId) {
      console.error("No user ID found");
      // You could show a toast notification here
      return;
    }

    // Set loading state for this specific button
    setEnrollingId(classId);

    try {
      const res = await fetch(`http://localhost:8080/api/users/${userId}/${classId}/enroll`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!res.ok) {
        console.error("Failed to enroll student", res.status);
        // You could show an error message to the user here
        return;
      }

      // Success! Refresh the enrolled courses list
      await fetchEnrolledCourse();
      
      // Show success message
      console.log("Successfully enrolled in course");
      
    } catch (error) {
      console.error("Error enrolling student:", error);
    } finally {
      setEnrollingId(null);
    }
  };

  const isCourseEnrolled = (courseId: string) => {
    return enrolledCourses.includes(courseId);
  };

  useEffect(() => {
    fetchCourses();
    fetchEnrolledCourse();
  }, []);

  if (fetchAllCourseLoading || fetchEnrolledCourseLoading) {
    return <p className="p-6">Loading courses...</p>;
  }

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

              <Button 
                className="w-full"  
                disabled={isCourseEnrolled(course.id) || enrollingId === course.id} 
                variant={isCourseEnrolled(course.id) ? "secondary" : "default"}
                onClick={() => handleEnrollStudent(course.id)}
              >
                {enrollingId === course.id 
                  ? "Enrolling..." 
                  : isCourseEnrolled(course.id) 
                    ? "Already Enrolled" 
                    : "Enroll"}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}