"use client";

export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Award,
  BookOpen,
  TrendingUp,
  TrendingDown,
  Minus,
  FileText,
} from "lucide-react";
import { fetchStudentGrades } from "@/app/actions/grades";

interface Assignment {
  id: string;
  name: string;
  type: string;
  score: number;
  maxScore: number;
  weight: number;
  date: string;
  feedback?: string | null;
}
interface Course {
  id: string;
  title: string;
  instructor: string;
  credits: number;
  currentGrade: number;
  letterGrade: string;
  trend: string;
  grades: Assignment[];
}

interface GradesData {
  gpa: number;
  totalCredits: number;
  courses: Course[];
}

const gradeColors: Record<string, string> = {
  "A+": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "A-": "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  "B+": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "B-": "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  "C+": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "C-": "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  "D+": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  D: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  "D-": "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  F: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

export default function StudentGradesPage() {
  const [gradesData, setGradesData] = useState<GradesData | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedGrade, setSelectedGrade] = useState<Assignment | null>(null);
  const [selectedCourseData, setSelectedCourseData] = useState<Course | null>(
    null,
  );
  const [expandedCourses, setExpandedCourses] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    async function loadGrades() {
      try {
        const data = await fetchStudentGrades();
        setGradesData(data);
      } catch (e) {
        setGradesData(null);
      }
    }
    loadGrades();
  }, []);

  const filteredCourses = gradesData?.courses
    ? selectedCourse === "all"
      ? gradesData.courses
      : gradesData.courses.filter((c) => c.id === selectedCourse)
    : [];

  const TrendIcon = ({ trend }: { trend: string }) => {
    if (trend === "up")
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend === "down")
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-muted-foreground" />;
  };

  if (!gradesData) {
    return (
      <div className="flex items-center justify-center h-96">
        <span className="text-muted-foreground">Loading grades...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Grades</h1>
        <p className="text-muted-foreground">
          View your grades and academic performance
        </p>
      </div>

      {/* GPA Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Award className="h-4 w-4 text-primary" />
              Current GPA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold">{gradesData.gpa}</span>
              <span className="text-muted-foreground">/ 4.0</span>
            </div>
            <Progress value={(gradesData.gpa / 4) * 100} className="mt-3" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-blue-500" />
              Total Credits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{gradesData.totalCredits}</div>
            <p className="text-xs text-muted-foreground">This semester</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <FileText className="h-4 w-4 text-green-500" />
              Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {gradesData.courses.length}
            </div>
            <p className="text-xs text-muted-foreground">Enrolled courses</p>
          </CardContent>
        </Card>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <Select value={selectedCourse} onValueChange={setSelectedCourse}>
          <SelectTrigger className="w-64">
            <SelectValue placeholder="Filter by course" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Courses</SelectItem>
            {gradesData.courses.map((course) => (
              <SelectItem key={course.id} value={course.id}>
                {course.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Course Grades */}
      <div className="space-y-6">
        {filteredCourses.map((course) => {
          // Sort assignments by date descending
          const sortedAssignments = [...course.grades].sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
          );
          const isExpanded = expandedCourses[course.id];
          const visibleAssignments = isExpanded
            ? sortedAssignments
            : sortedAssignments.slice(0, 3);
          return (
            <Card key={course.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>{course.title}</CardTitle>
                    <CardDescription>
                      {course.instructor} | {course.credits} credits
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <span className="text-2xl font-bold">
                          {course.currentGrade}%
                        </span>
                        <TrendIcon trend={course.trend} />
                      </div>
                      <Badge className={gradeColors[course.letterGrade]}>
                        {course.letterGrade}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Score</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleAssignments.map((grade) => (
                      <TableRow
                        key={grade.id}
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => {
                          setSelectedGrade(grade);
                          setSelectedCourseData(course);
                        }}
                      >
                        <TableCell className="font-medium">
                          {grade.name}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {grade.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(grade.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {grade.score}/{grade.maxScore}
                          <span className="text-muted-foreground ml-2">
                            ({Math.round((grade.score / grade.maxScore) * 100)}
                            %)
                          </span>
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {grade.weight}%
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
                {/* View All / Show Less Button */}
                {sortedAssignments.length > 3 && (
                  <div className="flex justify-center py-3 border-t border-gray-100">
                    <button
                      className="text-sm font-medium text-gray-500 hover:text-gray-800 transition-colors cursor-pointer bg-transparent border-none outline-none"
                      onClick={() =>
                        setExpandedCourses((prev) => ({
                          ...prev,
                          [course.id]: !isExpanded,
                        }))
                      }
                    >
                      {isExpanded
                        ? `Show less ↑`
                        : `View all ${sortedAssignments.length} assignments ↓`}
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Grade Detail Dialog */}
      <Dialog
        open={!!selectedGrade}
        onOpenChange={() => setSelectedGrade(null)}
      >
        <DialogContent>
          {selectedGrade && selectedCourseData && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedGrade.name}</DialogTitle>
                <DialogDescription>
                  {selectedCourseData.title}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Type</p>
                    <Badge variant="outline" className="capitalize mt-1">
                      {selectedGrade.type}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Date</p>
                    <p className="font-medium">
                      {new Date(selectedGrade.date).toLocaleDateString(
                        "en-US",
                        {
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        },
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Weight</p>
                    <p className="font-medium">{selectedGrade.weight}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Points</p>
                    <p className="font-medium">
                      {selectedGrade.score} / {selectedGrade.maxScore}
                    </p>
                  </div>
                </div>

                <div className="p-4 bg-muted rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Score</span>
                    <span className="text-2xl font-bold">
                      {Math.round(
                        (selectedGrade.score / selectedGrade.maxScore) * 100,
                      )}
                      %
                    </span>
                  </div>
                  <Progress
                    value={(selectedGrade.score / selectedGrade.maxScore) * 100}
                  />
                </div>

                {selectedGrade.feedback && (
                  <div>
                    <p className="text-sm font-medium mb-2">
                      Instructor Feedback
                    </p>
                    <p className="text-sm text-muted-foreground p-3 bg-muted rounded-lg">
                      {selectedGrade.feedback}
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
