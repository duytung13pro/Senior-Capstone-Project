"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Download,
  MessageSquare,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

import {
  fetchStudentDiagnosticData,
  type StudentDiagnosticMetric,
} from "@/lib/teacher-progress-data";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

const gradeToLetter = (grade: number) => {
  if (grade >= 90) return "A";
  if (grade >= 80) return "B";
  if (grade >= 70) return "C";
  if (grade >= 60) return "D";
  return "F";
};

const gradeTone = (grade: number) => {
  if (grade >= 85) return "text-emerald-600";
  if (grade >= 70) return "text-amber-600";
  return "text-rose-600";
};

const formatDuration = (minutes: number) => {
  const safe = Math.max(0, Math.round(minutes));
  const hours = Math.floor(safe / 60);
  const remainder = safe % 60;
  return `${hours}h ${String(remainder).padStart(2, "0")}m`;
};

const formatDiff = (minutes: number) => {
  const abs = Math.abs(minutes);
  const hours = Math.floor(abs / 60);
  const remainder = abs % 60;
  const timeLabel = `${hours}h ${String(remainder).padStart(2, "0")}m`;

  if (minutes === 0) {
    return "On class average";
  }

  if (minutes > 0) {
    return `↑ ${timeLabel} above average`;
  }

  return `↓ ${timeLabel} below average`;
};

const getQuizTone = (score: number) => {
  if (score >= 80) return "border-emerald-200 bg-emerald-100 text-emerald-800";
  if (score >= 65) return "border-amber-200 bg-amber-100 text-amber-800";
  return "border-rose-200 bg-rose-100 text-rose-800";
};

const TAB_OPTIONS = [
  { id: "overview", label: "Overview" },
  { id: "performance", label: "Performance" },
  { id: "engagement", label: "Engagement" },
] as const;

const GRADE_COLORS = ["#3B82F6", "#22C55E", "#EAB308", "#EF4444"];
const CHART_COLORS = ["#3b82f6", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

export function StudentDiagnosticReportPage() {
  const params = useParams();
  const classId = String(params.classId || "").trim();
  const studentId = String(params.studentId || "").trim();

  const [data, setData] = useState<StudentDiagnosticMetric | null>(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadReport = async () => {
      try {
        setLoading(true);
        setError("");

        const payload = await fetchStudentDiagnosticData(classId, studentId);
        if (!cancelled) {
          if (!payload) {
            setError("Student report not found for this route.");
            setData(null);
          } else {
            setData(payload);
          }
        }
      } catch (loadError) {
        console.error(loadError);
        if (!cancelled) {
          setError("Unable to load student diagnostic report.");
          setData(null);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    void loadReport();

    return () => {
      cancelled = true;
    };
  }, [classId, studentId]);

  if (loading) {
    return <div className="p-6">Loading report...</div>;
  }

  if (!data) {
    return (
      <div className="min-h-full space-y-4 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
        <Link
          href="/dashboard/teacher/student-progress"
          className="inline-flex items-center text-sm font-medium text-primary hover:underline"
        >
          ← Back to Student Progress
        </Link>
        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">
              {error || "Student report not found for this route."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const engagementDiff = data.timeEngagedMinutes - data.classAverageMinutes;
  const alerts = [
    ...(data.missingAssignments > 0
      ? [
          {
            id: "missing",
            text: `${data.missingAssignments} Missing Assignment${data.missingAssignments === 1 ? "" : "s"}`,
            tone: "border-rose-200 bg-rose-50 text-rose-800",
          },
        ]
      : []),
    ...(data.failedQuizLabel !== "None"
      ? [
          {
            id: "failed-quiz",
            text: data.failedQuizLabel,
            tone: "border-rose-200 bg-rose-50 text-rose-800",
          },
        ]
      : []),
    ...(data.noLoginDays >= 5
      ? [
          {
            id: "no-login",
            text: `No login in ${data.noLoginDays} days`,
            tone: "border-amber-200 bg-amber-50 text-amber-800",
          },
        ]
      : []),
  ];

  return (
    <div className="min-h-full space-y-6 rounded-lg bg-[#FCF9F0] p-4 md:p-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Link
            href="/dashboard/teacher/student-progress"
            className="inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            ← Back to {data.className} Roster
          </Link>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {data.studentName}
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => window.print()}
            className="border-[#E5E7EB]"
          >
            <Download className="mr-2 h-4 w-4" />
            Download Report
          </Button>
          <Button asChild className="bg-primary text-white hover:bg-primary/90">
            <Link
              href={`/dashboard/teacher/messages?classId=${encodeURIComponent(data.classId)}&studentId=${encodeURIComponent(data.studentId)}`}
            >
              <MessageSquare className="mr-2 h-4 w-4" />
              Message Student
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Grade
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-3xl font-bold ${gradeTone(data.currentGrade)}`}>
              {data.currentGrade}% ({gradeToLetter(data.currentGrade)})
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Quiz Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {data.avgQuizScore}%
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Time Engaged
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {formatDuration(data.timeEngagedMinutes)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {formatDiff(engagementDiff)}
            </p>
          </CardContent>
        </Card>

        <Card className="border border-[#E5E7EB] bg-white shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Current Streak
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {data.currentStreakDays} days
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Longest: {data.longestStreakDays} days
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="inline-flex rounded-full border border-gray-200 bg-white px-2 py-1.5 shadow-sm">
        <div className="flex flex-wrap gap-1">
          {TAB_OPTIONS.map((tab) => {
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                  active
                    ? "bg-primary text-white"
                    : "text-muted-foreground hover:bg-[#F3F4F6]"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4 transition-all duration-200">
        {activeTab === "overview" ? (
          <>
            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  Action Items & Alerts
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="rounded-md border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
                    No urgent alerts. Student is on track this week.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className={`flex items-start gap-2 rounded-md border p-3 text-sm ${alert.tone}`}
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                        <span>{alert.text}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              <Card className="border border-[#E5E7EB] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Study Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={data.studyHoursTargetTrend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="study"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Study Hours"
                      />
                      <Line
                        type="monotone"
                        dataKey="target"
                        stroke="#ef4444"
                        strokeDasharray="5 5"
                        name="Target"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="border border-[#E5E7EB] bg-white shadow-sm">
                <CardHeader>
                  <CardTitle>Weekly Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart data={data.weeklyActivity}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="study" fill="#3b82f6" name="Study (hrs)" />
                      <Bar dataKey="practice" fill="#22c55e" name="Practice (hrs)" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Curriculum Mastery</CardTitle>
              </CardHeader>
              <CardContent>
                {data.modules.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No module data available for this class.
                  </p>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {data.modules.map((module, index) => (
                      <AccordionItem key={module.id} value={module.id}>
                        <AccordionTrigger className="hover:no-underline">
                          <div className="flex flex-1 items-center gap-3 text-left">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">
                                Module {index + 1}: {module.title}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {module.completion}% completion
                              </p>
                            </div>
                            <Badge className={getQuizTone(module.quizScore)}>
                              Quiz: {module.quizScore}%
                            </Badge>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="space-y-2 rounded-md border border-[#E5E7EB] bg-[#FAFAFA] p-3">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Completion Progress
                              </span>
                              <span className="font-medium text-foreground">
                                {module.completion}%
                              </span>
                            </div>
                            <Progress value={module.completion} className="h-2" />
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Quiz Score
                              </span>
                              <span className="font-medium text-foreground">
                                {module.quizScore}%
                              </span>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </CardContent>
            </Card>
          </>
        ) : null}

        {activeTab === "performance" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Quiz Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {data.quizPerformance.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    No graded quiz data available yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={320}>
                    <LineChart data={data.quizPerformance} margin={{ bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="name"
                        tickMargin={10}
                        tickFormatter={(str) =>
                          String(str).length > 12
                            ? `${String(str).substring(0, 12)}...`
                            : String(str)
                        }
                      />
                      <YAxis domain={[0, 100]} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Student Score"
                      />
                      <Line
                        type="monotone"
                        dataKey="average"
                        stroke="#94a3b8"
                        strokeDasharray="5 5"
                        name="Class Average"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Grade Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {data.gradeDistribution.every((item) => item.value === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    No class grade distribution available yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.gradeDistribution}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={4}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {data.gradeDistribution.map((_, index) => (
                          <Cell
                            key={`distribution-cell-${index}`}
                            fill={GRADE_COLORS[index % GRADE_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        ) : null}

        {activeTab === "engagement" ? (
          <div className="grid gap-4 lg:grid-cols-2">
            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Engagement Activities</CardTitle>
              </CardHeader>
              <CardContent>
                {data.engagementBreakdown.every((item) => item.value === 0) ? (
                  <p className="text-sm text-muted-foreground">
                    No engagement activity recorded yet.
                  </p>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={data.engagementBreakdown}
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {data.engagementBreakdown.map((_, index) => (
                          <Cell
                            key={`engagement-cell-${index}`}
                            fill={CHART_COLORS[index % CHART_COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend verticalAlign="bottom" align="center" />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="border border-[#E5E7EB] bg-white shadow-sm">
              <CardHeader>
                <CardTitle>Learning Streaks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-[#E5E7EB] p-4">
                    <p className="text-sm text-muted-foreground">Current Streak</p>
                    <p className="text-2xl font-bold text-foreground">
                      {data.currentStreakDays} days
                    </p>
                  </div>
                  <div className="rounded-lg border border-[#E5E7EB] p-4">
                    <p className="text-sm text-muted-foreground">Longest Streak</p>
                    <p className="text-2xl font-bold text-foreground">
                      {data.longestStreakDays} days
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border border-[#E5E7EB] p-4">
                  <p className="text-sm text-muted-foreground">Total Active Days</p>
                  <p className="text-2xl font-bold text-foreground">
                    {data.totalActiveDays} days
                  </p>
                </div>

                <div>
                  <p className="mb-2 text-sm text-muted-foreground">Last 30 days</p>
                  <div className="grid grid-cols-10 gap-1">
                    {data.activityHeatmap.map((cell, index) => (
                      <div
                        key={`heatmap-${cell.day}-${index}`}
                        className={`h-5 rounded ${
                          cell.active ? "bg-emerald-500" : "bg-[#E5E7EB]"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : null}
      </div>
    </div>
  );
}
