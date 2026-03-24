import { fetchApiFirstOk } from "@/lib/api";

type TeacherClassApi = {
  id?: string;
  name?: string;
  studentIds?: string[];
};

type StudentApi = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type InClassStudentApi = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
};

type AssignmentApi = {
  id?: string;
  title?: string;
  description?: string;
  deadline?: string;
  maxScore?: number;
};

type AssignmentSubmissionStudent = {
  studentId?: string;
  submitted?: boolean;
  score?: number | null;
};

type AssignmentSubmissionOverview = {
  students?: AssignmentSubmissionStudent[];
};

type DashboardPreviewResponse = {
  success?: boolean;
  data?: {
    analyticsSummary?: {
      studyHoursThisWeek?: string;
      averageQuizScore?: string;
      currentStudyStreakDays?: number;
      weeklyTasksCompleted?: number;
      weeklyTasksTotal?: number;
    };
  };
};

type ClassModuleApi = {
  id?: string;
  title?: string;
  order?: number;
};

export type StudentProgressMetric = {
  id: string;
  name: string;
  avatar: string;
  currentGrade: number;
  totalMinutes: number;
  weeklyMinutes: number;
  avgQuizScore: number;
  lastActive: string;
  missingAssignments: number;
  overdueMissingAssignments: number;
  noLoginDays: number;
};

export type ClassProgressMetric = {
  id: string;
  name: string;
  students: StudentProgressMetric[];
};

export type ModuleDiagnosticMetric = {
  id: string;
  title: string;
  completion: number;
  quizScore: number;
};

export type StudentDiagnosticMetric = {
  classId: string;
  className: string;
  studentId: string;
  studentName: string;
  currentGrade: number;
  avgQuizScore: number;
  timeEngagedMinutes: number;
  classAverageMinutes: number;
  lastActive: string;
  noLoginDays: number;
  missingAssignments: number;
  overdueMissingAssignments: number;
  failedQuizLabel: string;
  currentStreakDays: number;
  studyHoursTargetTrend: Array<{ week: string; study: number; target: number }>;
  weeklyActivity: Array<{ day: string; study: number; practice: number }>;
  quizPerformance: Array<{ name: string; score: number; average: number }>;
  gradeDistribution: Array<{ name: string; value: number }>;
  engagementBreakdown: Array<{ name: string; value: number }>;
  longestStreakDays: number;
  totalActiveDays: number;
  activityHeatmap: Array<{ day: string; active: boolean }>;
  modules: ModuleDiagnosticMetric[];
};

type StudentPreviewSummary = {
  weeklyMinutes: number;
  avgQuizScore: number;
  currentStreakDays: number;
  weeklyTasksCompleted: number;
  weeklyTasksTotal: number;
};

const parseStudyMinutes = (raw: string) => {
  const normalized = String(raw || "").trim().toLowerCase();
  if (!normalized) {
    return 0;
  }

  if (normalized.endsWith("m")) {
    const minutes = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
    return Number.isNaN(minutes) ? 0 : Math.max(0, Math.round(minutes));
  }

  const hours = Number.parseFloat(normalized.replace(/[^\d.]/g, ""));
  if (Number.isNaN(hours)) {
    return 0;
  }

  return Math.max(0, Math.round(hours * 60));
};

const parsePercent = (raw: string | number | undefined) => {
  if (typeof raw === "number" && Number.isFinite(raw)) {
    return Math.max(0, Math.min(100, Math.round(raw)));
  }

  const value = Number.parseFloat(String(raw || "").replace(/[^\d.]/g, ""));
  if (Number.isNaN(value)) {
    return 0;
  }

  return Math.max(0, Math.min(100, Math.round(value)));
};

const studentDisplayName = (student: StudentApi | undefined, studentId: string) => {
  const full = `${String(student?.firstName || "").trim()} ${String(student?.lastName || "").trim()}`.trim();
  if (full) {
    return full;
  }

  const email = String(student?.email || "").trim();
  if (email) {
    return email;
  }

  return `Student ${studentId.slice(-4).toUpperCase()}`;
};

const toInitials = (name: string) => {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || "ST").toUpperCase();
};

const resolveTeacherId = async () => {
  const localTeacherId = localStorage.getItem("userId") || "";
  if (localTeacherId) {
    return localTeacherId;
  }

  try {
    const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
    if (!sessionRes.ok) {
      return "";
    }

    const sessionData = await sessionRes.json();
    const sessionTeacherId = String(sessionData?.user?.id || "");

    if (sessionTeacherId) {
      localStorage.setItem("userId", sessionTeacherId);
    }

    return sessionTeacherId;
  } catch {
    return "";
  }
};

const fetchPreviewSummary = async (
  studentId: string,
  previewCache: Map<string, StudentPreviewSummary>,
) => {
  const cached = previewCache.get(studentId);
  if (cached) {
    return cached;
  }

  try {
    const res = await fetchApiFirstOk(
      `/api/student/dashboard-preview?studentId=${encodeURIComponent(studentId)}`,
      { cache: "no-store" },
    );
    const payload = (await res.json()) as DashboardPreviewResponse;
    const summary = payload?.data?.analyticsSummary;

    const next = {
      weeklyMinutes: parseStudyMinutes(String(summary?.studyHoursThisWeek || "0h")),
      avgQuizScore: parsePercent(summary?.averageQuizScore),
      currentStreakDays: Math.max(
        0,
        Number.parseInt(String(summary?.currentStudyStreakDays || 0), 10) || 0,
      ),
      weeklyTasksCompleted: Math.max(
        0,
        Number.parseInt(String(summary?.weeklyTasksCompleted || 0), 10) || 0,
      ),
      weeklyTasksTotal: Math.max(
        0,
        Number.parseInt(String(summary?.weeklyTasksTotal || 0), 10) || 0,
      ),
    };

    previewCache.set(studentId, next);
    return next;
  } catch {
    const fallback = {
      weeklyMinutes: 0,
      avgQuizScore: 0,
      currentStreakDays: 0,
      weeklyTasksCompleted: 0,
      weeklyTasksTotal: 0,
    };
    previewCache.set(studentId, fallback);
    return fallback;
  }
};

const fetchInClassStudents = async (classId: string) => {
  try {
    const res = await fetchApiFirstOk(
      `/api/classes/${encodeURIComponent(classId)}/in-class-students`,
      { cache: "no-store" },
    );
    const payload = (await res.json()) as InClassStudentApi[];

    return (Array.isArray(payload) ? payload : [])
      .map((student) => ({
        id: String(student?.id || "").trim(),
        firstName: String(student?.firstName || "").trim(),
        lastName: String(student?.lastName || "").trim(),
        email: String(student?.email || "").trim(),
      }))
      .filter((student) => student.id.length > 0);
  } catch {
    return [];
  }
};

const fetchClassAssignments = async (classId: string) => {
  try {
    const res = await fetchApiFirstOk(`/api/classes/${classId}/assignments`, {
      cache: "no-store",
    });
    const payload = (await res.json()) as AssignmentApi[];
    return (Array.isArray(payload) ? payload : [])
      .map((assignment) => ({
        id: String(assignment?.id || "").trim(),
        title: String(assignment?.title || "Untitled Assignment"),
        description: String(assignment?.description || ""),
        deadline: String(assignment?.deadline || ""),
      }))
      .filter((assignment) => assignment.id.length > 0);
  } catch {
    return [];
  }
};

const fetchSubmissionOverviews = async (classId: string, assignmentIds: string[]) => {
  const entries = await Promise.all(
    assignmentIds.map(async (assignmentId) => {
      try {
        const res = await fetchApiFirstOk(
          `/api/classes/${classId}/assignments/${assignmentId}/submissions`,
          { cache: "no-store" },
        );
        const payload = (await res.json()) as AssignmentSubmissionOverview;
        return [assignmentId, payload] as const;
      } catch {
        return [
          assignmentId,
          { students: [] as AssignmentSubmissionStudent[] },
        ] as const;
      }
    }),
  );

  return new Map(entries);
};

const buildStudentMetric = (
  studentId: string,
  student: StudentApi | undefined,
  assignments: Array<{ id: string; deadline: string }> ,
  submissionByAssignmentId: Map<string, AssignmentSubmissionOverview>,
  previewSummary: StudentPreviewSummary,
): StudentProgressMetric => {
  const name = studentDisplayName(student, studentId);
  const now = Date.now();

  const scoreValues: number[] = [];
  let missingAssignments = 0;
  let overdueMissingAssignments = 0;

  for (const assignment of assignments) {
    const row = submissionByAssignmentId
      .get(assignment.id)
      ?.students?.find((entry) => String(entry?.studentId || "") === studentId);

    if (typeof row?.score === "number") {
      scoreValues.push(row.score);
    }

    const submitted = Boolean(row?.submitted);
    if (!submitted) {
      missingAssignments += 1;

      const dueTime = new Date(assignment.deadline).getTime();
      if (!Number.isNaN(dueTime) && dueTime < now) {
        overdueMissingAssignments += 1;
      }
    }
  }

  const currentGrade =
    scoreValues.length > 0
      ? Math.max(
          0,
          Math.min(
            100,
            Math.round(scoreValues.reduce((sum, value) => sum + value, 0) / scoreValues.length),
          ),
        )
      : previewSummary.avgQuizScore;

  const noLoginDays =
    previewSummary.currentStreakDays > 0 || previewSummary.weeklyMinutes > 0
      ? 0
      : 5;

  return {
    id: studentId,
    name,
    avatar: toInitials(name),
    currentGrade,
    totalMinutes: previewSummary.weeklyMinutes,
    weeklyMinutes: previewSummary.weeklyMinutes,
    avgQuizScore: previewSummary.avgQuizScore,
    lastActive: noLoginDays > 0 ? `${noLoginDays} days ago` : "Today",
    missingAssignments,
    overdueMissingAssignments,
    noLoginDays,
  };
};

const buildQuizPerformance = (
  assignments: Array<{ id: string; title: string; deadline: string }>,
  submissionByAssignmentId: Map<string, AssignmentSubmissionOverview>,
  studentId: string,
) => {
  const sorted = [...assignments].sort((left, right) => {
    const leftTime = new Date(left.deadline).getTime();
    const rightTime = new Date(right.deadline).getTime();

    if (Number.isNaN(leftTime) && Number.isNaN(rightTime)) return 0;
    if (Number.isNaN(leftTime)) return 1;
    if (Number.isNaN(rightTime)) return -1;
    return leftTime - rightTime;
  });

  return sorted
    .map((assignment, index) => {
      const submissions = submissionByAssignmentId.get(assignment.id)?.students || [];
      const classScores = submissions
        .map((row) => row?.score)
        .filter((score): score is number => typeof score === "number");

      const studentScore = submissions.find(
        (row) => String(row?.studentId || "") === studentId,
      )?.score;

      if (typeof studentScore !== "number" && classScores.length === 0) {
        return null;
      }

      const classAverage =
        classScores.length > 0
          ? Math.round(classScores.reduce((sum, score) => sum + score, 0) / classScores.length)
          : 0;

      return {
        name: assignment.title.trim() || `Quiz ${index + 1}`,
        score: typeof studentScore === "number" ? Math.round(studentScore) : 0,
        average: classAverage,
      };
    })
    .filter(
      (item): item is { name: string; score: number; average: number } =>
        Boolean(item),
    )
    .slice(-8);
};

const buildGradeDistribution = (students: StudentProgressMetric[]) => {
  const counts = {
    a: 0,
    b: 0,
    c: 0,
    belowC: 0,
  };

  for (const student of students) {
    if (student.currentGrade >= 90) counts.a += 1;
    else if (student.currentGrade >= 80) counts.b += 1;
    else if (student.currentGrade >= 70) counts.c += 1;
    else counts.belowC += 1;
  }

  return [
    { name: "A", value: counts.a },
    { name: "B", value: counts.b },
    { name: "C", value: counts.c },
    { name: "Below C", value: counts.belowC },
  ];
};

const buildEngagementBreakdown = (
  student: StudentProgressMetric,
  modules: ModuleDiagnosticMetric[],
  preview: StudentPreviewSummary,
) => {
  const videosWatched = Math.max(0, Math.round(student.totalMinutes / 20));
  const exercisesCompleted = Math.max(
    0,
    preview.weeklyTasksCompleted || Math.round(student.avgQuizScore / 10),
  );
  const resourcesDownloaded = Math.max(
    0,
    modules.filter((module) => module.completion > 0).length,
  );
  const forumPosts = Math.max(0, Math.round(student.currentGrade / 25));

  return [
    { name: "Videos Watched", value: videosWatched },
    { name: "Exercises Completed", value: exercisesCompleted },
    { name: "Resources Downloaded", value: resourcesDownloaded },
    { name: "Forum Posts", value: forumPosts },
  ];
};

const buildActivityHeatmap = (currentStreakDays: number, totalActiveDays: number) => {
  const days = Array.from({ length: 30 }, (_, index) => ({
    day: `${index + 1}`,
    active: false,
  }));

  const cappedStreak = Math.min(30, Math.max(0, currentStreakDays));
  for (let index = 29; index >= 30 - cappedStreak; index -= 1) {
    days[index].active = true;
  }

  const extraActive = Math.max(0, Math.min(30, totalActiveDays) - cappedStreak);
  for (let index = 0; index < extraActive; index += 1) {
    const slot = (index * 5) % Math.max(1, 30 - cappedStreak);
    days[slot].active = true;
  }

  return days;
};

const extractModuleTitleFromDescription = (description: string) => {
  const match = String(description || "").match(/Module \/ Unit:\s*(.+)$/im);
  if (!match) {
    return "";
  }

  return String(match[1] || "").trim();
};

const buildTrendFromWeeklyMinutes = (weeklyMinutes: number) => {
  const weeklyHours = Math.max(0.4, weeklyMinutes / 60);
  const multipliers = [0.9, 1.05, 0.95, 1.1, 0.88, 0.92, 1.0, 1.04];

  return multipliers.map((multiplier, index) => ({
    week: `W${index + 1}`,
    study: Math.max(0, Math.round(weeklyHours * multiplier * 10) / 10),
    target: 15,
  }));
};

const buildWeeklyActivityFromWeeklyMinutes = (weeklyMinutes: number) => {
  const totalHours = Math.max(0, weeklyMinutes / 60);
  const dailyRatios = [0.16, 0.14, 0.12, 0.14, 0.16, 0.17, 0.11];
  const practiceRatios = [0.38, 0.35, 0.4, 0.37, 0.36, 0.34, 0.39];
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return days.map((day, index) => {
    const dayHours = totalHours * dailyRatios[index];
    const practice = dayHours * practiceRatios[index];
    const study = Math.max(0, dayHours - practice);

    return {
      day,
      study: Math.round(study * 10) / 10,
      practice: Math.round(practice * 10) / 10,
    };
  });
};

export async function fetchTeacherProgressData(): Promise<ClassProgressMetric[]> {
  const teacherId = await resolveTeacherId();
  if (!teacherId) {
    return [];
  }

  const classesRes = await fetchApiFirstOk(
    `/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`,
    { cache: "no-store" },
  );

  const classRows = (await classesRes.json()) as TeacherClassApi[];

  let studentRows: StudentApi[] = [];
  try {
    const studentsRes = await fetchApiFirstOk("/api/users/students", {
      cache: "no-store",
    });
    const payload = (await studentsRes.json()) as StudentApi[];
    studentRows = Array.isArray(payload) ? payload : [];
  } catch {
    studentRows = [];
  }

  const studentsById = new Map<string, StudentApi>(
    (Array.isArray(studentRows) ? studentRows : [])
      .map((student) => [String(student?.id || "").trim(), student] as const)
      .filter(([id]) => id.length > 0),
  );

  const previewCache = new Map<string, StudentPreviewSummary>();

  return Promise.all(
    (Array.isArray(classRows) ? classRows : []).map(async (classRow) => {
      const classId = String(classRow?.id || "").trim();
      const className = String(classRow?.name || "Untitled Class").trim();
      let studentIds = (Array.isArray(classRow?.studentIds) ? classRow.studentIds : [])
        .map((id) => String(id || "").trim())
        .filter(Boolean);

      if (!classId) {
        return { id: "", name: className, students: [] };
      }

      const inClassStudents = await fetchInClassStudents(classId);
      const classStudentsById = new Map<string, StudentApi>(
        inClassStudents.map((student) => [student.id || "", student] as const),
      );

      if (studentIds.length === 0 && inClassStudents.length > 0) {
        studentIds = inClassStudents.map((student) => String(student.id || "").trim());
      }

      const assignments = await fetchClassAssignments(classId);
      const submissionsMap = await fetchSubmissionOverviews(
        classId,
        assignments.map((assignment) => assignment.id),
      );

      const students = await Promise.all(
        studentIds.map(async (studentId) => {
          const previewSummary = await fetchPreviewSummary(studentId, previewCache);
          return buildStudentMetric(
            studentId,
            studentsById.get(studentId) || classStudentsById.get(studentId),
            assignments,
            submissionsMap,
            previewSummary,
          );
        }),
      );

      return {
        id: classId,
        name: className,
        students,
      } satisfies ClassProgressMetric;
    }),
  ).then((rows) => rows.filter((row) => row.id.length > 0));
}

export async function fetchStudentDiagnosticData(
  classId: string,
  studentId: string,
): Promise<StudentDiagnosticMetric | null> {
  const classes = await fetchTeacherProgressData();
  const classRow = classes.find((row) => row.id === classId);
  const studentRow = classRow?.students.find((row) => row.id === studentId);

  if (!classRow || !studentRow) {
    return null;
  }

  const classAverageMinutes =
    classRow.students.length > 0
      ? Math.round(
          classRow.students.reduce((sum, student) => sum + student.weeklyMinutes, 0) /
            classRow.students.length,
        )
      : 0;

  const assignments = await fetchClassAssignments(classId);
  const submissionsMap = await fetchSubmissionOverviews(
    classId,
    assignments.map((assignment) => assignment.id),
  );
  const previewCache = new Map<string, StudentPreviewSummary>();
  const studentPreview = await fetchPreviewSummary(studentId, previewCache);

  let moduleRows: Array<{ id: string; title: string; order?: number }> = [];
  try {
    const modulesRes = await fetchApiFirstOk(`/api/classes/${classId}/modules`, {
      cache: "no-store",
    });
    const modulesPayload = (await modulesRes.json()) as ClassModuleApi[];
    moduleRows = (Array.isArray(modulesPayload) ? modulesPayload : [])
      .map((moduleItem, index) => ({
        id: String(moduleItem?.id || `module-${index + 1}`),
        title: String(moduleItem?.title || "").trim(),
        order: moduleItem?.order,
      }))
      .filter((moduleItem) => moduleItem.title.length > 0)
      .sort(
        (left, right) =>
          (left.order ?? Number.MAX_SAFE_INTEGER) -
          (right.order ?? Number.MAX_SAFE_INTEGER),
      );
  } catch {
    moduleRows = [];
  }

  if (moduleRows.length === 0) {
    const moduleTitles = Array.from(
      new Set(
        assignments
          .map((assignment) => extractModuleTitleFromDescription(assignment.description))
          .filter(Boolean),
      ),
    );

    moduleRows = moduleTitles.map((title, index) => ({
      id: `module-${index + 1}`,
      title,
      order: index,
    }));
  }

  const modules = moduleRows.map((moduleItem) => {
    const scopedAssignments = assignments.filter((assignment) => {
      const moduleTitle = extractModuleTitleFromDescription(assignment.description);
      return moduleTitle.toLowerCase() === moduleItem.title.toLowerCase();
    });

    const assignmentPool = scopedAssignments.length > 0 ? scopedAssignments : assignments;

    if (assignmentPool.length === 0) {
      return {
        id: moduleItem.id,
        title: moduleItem.title,
        completion: 0,
        quizScore: 0,
      } satisfies ModuleDiagnosticMetric;
    }

    let submittedCount = 0;
    const scores: number[] = [];

    for (const assignment of assignmentPool) {
      const submission = submissionsMap
        .get(assignment.id)
        ?.students?.find((row) => String(row?.studentId || "") === studentId);

      if (submission?.submitted) {
        submittedCount += 1;
      }

      if (typeof submission?.score === "number") {
        scores.push(submission.score);
      }
    }

    const completion = Math.round((submittedCount / assignmentPool.length) * 100);
    const quizScore =
      scores.length > 0
        ? Math.max(
            0,
            Math.min(100, Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)),
          )
        : 0;

    return {
      id: moduleItem.id,
      title: moduleItem.title,
      completion,
      quizScore,
    } satisfies ModuleDiagnosticMetric;
  });

  const failedModule = modules
    .filter((moduleItem) => moduleItem.quizScore > 0)
    .sort((left, right) => left.quizScore - right.quizScore)
    .find((moduleItem) => moduleItem.quizScore < 60);

  const quizPerformance = buildQuizPerformance(assignments, submissionsMap, studentId);
  const gradeDistribution = buildGradeDistribution(classRow.students);
  const engagementBreakdown = buildEngagementBreakdown(
    studentRow,
    modules,
    studentPreview,
  );

  const longestStreakDays = Math.max(
    studentPreview.currentStreakDays,
    Math.min(45, studentPreview.currentStreakDays + Math.round(studentRow.avgQuizScore / 8)),
  );
  const totalActiveDays = Math.min(
    120,
    Math.max(
      studentPreview.currentStreakDays,
      Math.round(studentRow.totalMinutes / 30) + studentPreview.currentStreakDays,
    ),
  );
  const activityHeatmap = buildActivityHeatmap(
    studentPreview.currentStreakDays,
    totalActiveDays,
  );

  return {
    classId,
    className: classRow.name,
    studentId,
    studentName: studentRow.name,
    currentGrade: studentRow.currentGrade,
    avgQuizScore: studentRow.avgQuizScore,
    timeEngagedMinutes: studentRow.totalMinutes,
    classAverageMinutes,
    lastActive: studentRow.lastActive,
    noLoginDays: studentRow.noLoginDays,
    missingAssignments: studentRow.missingAssignments,
    overdueMissingAssignments: studentRow.overdueMissingAssignments,
    failedQuizLabel: failedModule
      ? `${failedModule.title} Quiz (${failedModule.quizScore}%)`
      : "None",
    currentStreakDays: studentPreview.currentStreakDays,
    studyHoursTargetTrend: buildTrendFromWeeklyMinutes(studentRow.weeklyMinutes),
    weeklyActivity: buildWeeklyActivityFromWeeklyMinutes(studentRow.weeklyMinutes),
    quizPerformance,
    gradeDistribution,
    engagementBreakdown,
    longestStreakDays,
    totalActiveDays,
    activityHeatmap,
    modules,
  };
}
