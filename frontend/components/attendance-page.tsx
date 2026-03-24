"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Check } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { fetchApiFirstOk } from "@/lib/api";

type AttendanceStatus = "Present" | "Late" | "Absent" | "Excused";

type Student = {
  id: string;
  name: string;
  avatar: string;
};

type AttendanceClass = {
  id: string;
  name: string;
  averageAttendance: number;
  students: Student[];
};

type TeacherClassApi = {
  id: string;
  name: string;
  studentIds?: string[];
};

type StudentApi = {
  id: string;
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

type AttendanceRecord = {
  id: string;
  date: string;
  classId: string;
  studentId: string;
  status: AttendanceStatus;
};

type AttendanceEntryApi = {
  id?: string;
  classId?: string;
  studentId?: string;
  date?: string;
  status?: string;
};

const statusOptions: AttendanceStatus[] = [
  "Present",
  "Late",
  "Absent",
  "Excused",
];

const rosterKey = (classId: string, dateIso: string, studentId: string) =>
  `${classId}|${dateIso}|${studentId}`;

const historyBadgeTone = (status: AttendanceStatus) => {
  if (status === "Present") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }
  if (status === "Absent") {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }
  if (status === "Late") {
    return "border-orange-200 bg-orange-50 text-orange-700";
  }
  return "border-sky-200 bg-sky-50 text-sky-700";
};

const activeSegmentTone = (status: AttendanceStatus) => {
  if (status === "Present") {
    return "text-emerald-700";
  }
  if (status === "Absent") {
    return "text-rose-700";
  }
  if (status === "Late") {
    return "text-orange-700";
  }
  return "text-sky-700";
};

const toInitials = (value: string) => {
  const parts = value.trim().split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0] || ""}${parts[1][0] || ""}`.toUpperCase();
  }

  return (parts[0]?.slice(0, 2) || "ST").toUpperCase();
};

const estimatedAttendance = (studentCount: number) => {
  if (studentCount <= 0) {
    return 0;
  }

  return Math.max(80, Math.min(98, 100 - Math.round(studentCount * 0.8)));
};

export function AttendancePage() {
  const today = new Date();
  const todayIso = format(today, "yyyy-MM-dd");

  const [classes, setClasses] = useState<AttendanceClass[]>([]);
  const [loadingClasses, setLoadingClasses] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeClassId, setActiveClassId] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [activeTab, setActiveTab] = useState<"take" | "history">("take");
  const [attendanceRecords, setAttendanceRecords] = useState<
    AttendanceRecord[]
  >([]);

  const selectedDateIso = format(selectedDate, "yyyy-MM-dd");

  const normalizeAttendanceStatus = (raw: unknown): AttendanceStatus => {
    const value = String(raw || "")
      .trim()
      .toLowerCase();
    if (value === "present") return "Present";
    if (value === "late") return "Late";
    if (value === "absent") return "Absent";
    return "Excused";
  };

  const mapAttendanceApiToRecord = (
    row: AttendanceEntryApi,
  ): AttendanceRecord | null => {
    const classId = String(row.classId || "").trim();
    const studentId = String(row.studentId || "").trim();
    const date = String(row.date || "").trim();

    if (!classId || !studentId || !date) {
      return null;
    }

    return {
      id: String(row.id || `${classId}|${date}|${studentId}`),
      classId,
      studentId,
      date,
      status: normalizeAttendanceStatus(row.status),
    };
  };

  const mergeAttendanceRecords = (incoming: AttendanceRecord[]) => {
    setAttendanceRecords((previous) => {
      const merged = new Map<string, AttendanceRecord>();

      previous.forEach((item) => {
        merged.set(rosterKey(item.classId, item.date, item.studentId), item);
      });

      incoming.forEach((item) => {
        merged.set(rosterKey(item.classId, item.date, item.studentId), item);
      });

      return Array.from(merged.values());
    });
  };

  useEffect(() => {
    const loadClassesAndStudents = async () => {
      const resolveTeacherId = async () => {
        const storedTeacherId = localStorage.getItem("userId") || "";
        if (storedTeacherId) {
          return storedTeacherId;
        }

        try {
          const sessionRes = await fetch("/api/auth/session", {
            cache: "no-store",
          });

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

      try {
        setLoadingClasses(true);
        setLoadError(null);

        const teacherId = await resolveTeacherId();
        if (!teacherId) {
          setClasses([]);
          setLoadError("Không tìm thấy teacherId. Vui lòng đăng nhập lại.");
          return;
        }

        const classesRes = await fetchApiFirstOk(
          `/api/classes/my?teacherId=${encodeURIComponent(teacherId)}`,
          {
            cache: "no-store",
          },
        );

        const classRows: TeacherClassApi[] = await classesRes.json();

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
            .filter(
              (student) =>
                typeof student?.id === "string" && student.id.length > 0,
            )
            .map((student) => [student.id, student]),
        );

        const nextClasses = await Promise.all(
          (Array.isArray(classRows) ? classRows : []).map(async (teacherClass) => {
            const studentIds = Array.isArray(teacherClass.studentIds)
              ? teacherClass.studentIds
              : [];

            let inClassStudents: InClassStudentApi[] = [];
            try {
              const inClassStudentsRes = await fetchApiFirstOk(
                `/api/classes/${encodeURIComponent(String(teacherClass.id || ""))}/in-class-students`,
                { cache: "no-store" },
              );
              const payload =
                (await inClassStudentsRes.json()) as InClassStudentApi[];
              inClassStudents = Array.isArray(payload) ? payload : [];
            } catch {
              inClassStudents = [];
            }

            const inClassStudentsById = new Map<string, InClassStudentApi>(
              inClassStudents
                .map((student) => [String(student?.id || "").trim(), student] as const)
                .filter(([id]) => id.length > 0),
            );

            const resolvedStudentIds =
              studentIds.length > 0
                ? studentIds
                : inClassStudents
                    .map((student) => String(student?.id || "").trim())
                    .filter(Boolean);

            const mappedStudents: Student[] = resolvedStudentIds.map((studentId) => {
              const student = studentsById.get(studentId) || inClassStudentsById.get(studentId);
              const fullName =
                `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
              const resolvedName =
                fullName || student?.email || "Unknown Student";

              return {
                id: studentId,
                name: resolvedName,
                avatar: toInitials(resolvedName),
              };
            });

            return {
              id: teacherClass.id,
              name: teacherClass.name,
              averageAttendance: estimatedAttendance(mappedStudents.length),
              students: mappedStudents,
            };
          }),
        );

        setClasses(nextClasses);

        if (nextClasses.length > 0) {
          const todayAttendanceResponses = await Promise.all(
            nextClasses.map(async (teacherClass) => {
              try {
                const res = await fetchApiFirstOk(
                  `/api/classes/${teacherClass.id}/attendance?date=${todayIso}`,
                  { cache: "no-store" },
                );
                const payload: AttendanceEntryApi[] = await res.json();
                return (Array.isArray(payload) ? payload : [])
                  .map(mapAttendanceApiToRecord)
                  .filter((item): item is AttendanceRecord => Boolean(item));
              } catch {
                return [];
              }
            }),
          );

          mergeAttendanceRecords(todayAttendanceResponses.flat());
        }
      } catch (error) {
        console.error(error);
        setClasses([]);
        setLoadError("Không thể tải danh sách lớp và học viên.");
      } finally {
        setLoadingClasses(false);
      }
    };

    loadClassesAndStudents();
  }, [todayIso]);

  useEffect(() => {
    const loadSelectedDateAttendance = async () => {
      if (!activeClassId) {
        return;
      }

      try {
        const res = await fetchApiFirstOk(
          `/api/classes/${activeClassId}/attendance?date=${selectedDateIso}`,
          { cache: "no-store" },
        );

        const payload: AttendanceEntryApi[] = await res.json();
        const mapped = (Array.isArray(payload) ? payload : [])
          .map(mapAttendanceApiToRecord)
          .filter((item): item is AttendanceRecord => Boolean(item));

        mergeAttendanceRecords(mapped);
      } catch (error) {
        console.error(error);
      }
    };

    loadSelectedDateAttendance();
  }, [activeClassId, selectedDateIso]);

  useEffect(() => {
    const loadAttendanceHistory = async () => {
      if (!activeClassId) {
        return;
      }

      try {
        const res = await fetchApiFirstOk(
          `/api/classes/${activeClassId}/attendance/history`,
          { cache: "no-store" },
        );

        const payload: AttendanceEntryApi[] = await res.json();
        const mapped = (Array.isArray(payload) ? payload : [])
          .map(mapAttendanceApiToRecord)
          .filter((item): item is AttendanceRecord => Boolean(item));

        mergeAttendanceRecords(mapped);
      } catch (error) {
        console.error(error);
      }
    };

    loadAttendanceHistory();
  }, [activeClassId]);

  const classById = useMemo(() => {
    return classes.reduce<Record<string, AttendanceClass>>(
      (acc, currentClass) => {
        acc[currentClass.id] = currentClass;
        return acc;
      },
      {},
    );
  }, [classes]);

  const studentDirectory = useMemo(() => {
    const entries = classes.flatMap((teacherClass) =>
      teacherClass.students.map((student) => [student.id, student] as const),
    );
    return Object.fromEntries(entries) as Record<string, Student>;
  }, [classes]);

  const getStatusForStudent = (
    classId: string,
    dateIso: string,
    studentId: string,
  ): AttendanceStatus | null => {
    const key = rosterKey(classId, dateIso, studentId);

    const fromRecords = attendanceRecords.find(
      (record) =>
        record.classId === classId &&
        record.date === dateIso &&
        record.studentId === studentId,
    );

    return fromRecords?.status ?? null;
  };

  const classCards = useMemo(() => {
    return classes.map((teacherClass) => {
      const takenCount = teacherClass.students.filter(
        (student) =>
          getStatusForStudent(teacherClass.id, todayIso, student.id) !== null,
      ).length;

      const isTaken = takenCount === teacherClass.students.length;

      return {
        ...teacherClass,
        isTaken,
      };
    });
  }, [classes, todayIso, attendanceRecords]);

  const activeClass = activeClassId ? classById[activeClassId] : null;

  const scopedHistory = useMemo(() => {
    if (!activeClassId) {
      return [];
    }

    return attendanceRecords
      .filter((record) => record.classId === activeClassId)
      .sort((a, b) => {
        if (a.date !== b.date) {
          return b.date.localeCompare(a.date);
        }

        const studentA = studentDirectory[a.studentId]?.name || "";
        const studentB = studentDirectory[b.studentId]?.name || "";
        return studentA.localeCompare(studentB);
      });
  }, [activeClassId, attendanceRecords, studentDirectory]);

  const markStudentStatus = async (
    studentId: string,
    status: AttendanceStatus,
  ) => {
    if (!activeClassId) {
      return;
    }

    setSaveError(null);

    const optimisticRecord: AttendanceRecord = {
      id: rosterKey(activeClassId, selectedDateIso, studentId),
      classId: activeClassId,
      studentId,
      date: selectedDateIso,
      status,
    };
    mergeAttendanceRecords([optimisticRecord]);

    try {
      const res = await fetchApiFirstOk(
        `/api/classes/${activeClassId}/attendance`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDateIso,
            studentId,
            status,
          }),
        },
      );

      const payload: AttendanceEntryApi = await res.json();
      const mapped = mapAttendanceApiToRecord(payload);
      if (mapped) {
        mergeAttendanceRecords([mapped]);
      }
    } catch (error) {
      console.error(error);
      setSaveError("Unable to save attendance change right now.");
    }
  };

  const markAllPresent = async () => {
    if (!activeClass) {
      return;
    }

    setSaveError(null);

    const optimisticRecords = activeClass.students.map((student) => ({
      id: rosterKey(activeClass.id, selectedDateIso, student.id),
      classId: activeClass.id,
      studentId: student.id,
      date: selectedDateIso,
      status: "Present" as AttendanceStatus,
    }));

    mergeAttendanceRecords(optimisticRecords);

    try {
      const res = await fetchApiFirstOk(
        `/api/classes/${activeClass.id}/attendance/batch`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: selectedDateIso,
            records: activeClass.students.map((student) => ({
              studentId: student.id,
              status: "Present",
            })),
          }),
        },
      );

      const payload: AttendanceEntryApi[] = await res.json();
      const mapped = (Array.isArray(payload) ? payload : [])
        .map(mapAttendanceApiToRecord)
        .filter((item): item is AttendanceRecord => Boolean(item));

      mergeAttendanceRecords(mapped);
    } catch (error) {
      console.error(error);
      setSaveError("Unable to save attendance changes right now.");
    }
  };

  if (loadingClasses) {
    return <div className="p-6">Loading attendance classes...</div>;
  }

  if (!activeClass) {
    return (
      <div className="space-y-6 bg-[#FCF9F0] p-4 md:p-5 rounded-lg">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold tracking-tight">
            Attendance Tracker
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {loadError ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-[#E5E7EB] bg-white p-4 text-sm text-destructive">
              {loadError}
            </div>
          ) : null}
          {classCards.length === 0 && !loadError ? (
            <div className="md:col-span-2 xl:col-span-3 rounded-lg border border-[#E5E7EB] bg-white p-8 text-center text-sm text-muted-foreground">
              No classes found.
            </div>
          ) : null}
          {classCards.map((teacherClass) => (
            <Card
              key={teacherClass.id}
              role="button"
              tabIndex={0}
              onClick={() => {
                setActiveClassId(teacherClass.id);
                setActiveTab("take");
                setSelectedDate(today);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setActiveClassId(teacherClass.id);
                  setActiveTab("take");
                  setSelectedDate(today);
                }
              }}
              className="cursor-pointer border-[#E5E7EB] bg-white transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <CardHeader className="space-y-3">
                <div className="flex items-start justify-between">
                  <CardTitle className="text-xl">{teacherClass.name}</CardTitle>
                  <Badge
                    className={cn(
                      "self-start border font-medium",
                      teacherClass.isTaken
                        ? "border-emerald-200 bg-emerald-100 text-emerald-800"
                        : "border-orange-200 bg-orange-100 text-[#9A3412]",
                    )}
                  >
                    {teacherClass.isTaken ? "Taken" : "Pending"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {teacherClass.averageAttendance}% Average Attendance
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 bg-[#FCF9F0] p-4 md:p-5 rounded-lg">
      <div className="space-y-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-1"
          onClick={() => setActiveClassId(null)}
        >
          ← Back to Classes
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">
          {activeClass.name}
        </h1>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(nextTab) => setActiveTab(nextTab as "take" | "history")}
        className="space-y-4"
      >
        <TabsList className="bg-white border border-[#E5E7EB]">
          <TabsTrigger value="take">Take Attendance</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        <TabsContent value="take" className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start border border-[#E5E7EB] bg-[#F9FAFB] text-left font-normal md:w-[220px]"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, "PPP")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => setSelectedDate(date ?? today)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>

            <Button
              className="bg-emerald-600 text-white hover:bg-emerald-700"
              onClick={markAllPresent}
            >
              <Check className="mr-2 h-4 w-4" />
              Mark All Present
            </Button>
          </div>

          {saveError ? (
            <p className="text-sm text-destructive">{saveError}</p>
          ) : null}

          <div className="space-y-3">
            {activeClass.students.map((student) => {
              const currentStatus = getStatusForStudent(
                activeClass.id,
                selectedDateIso,
                student.id,
              );

              return (
                <div
                  key={student.id}
                  className="flex flex-col gap-3 rounded-lg border border-[#E5E7EB] bg-white p-4 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border border-[#E5E7EB] bg-[#F3F4F6]">
                      <AvatarImage
                        src={`/placeholder.svg?height=40&width=40`}
                        alt={student.name}
                      />
                      <AvatarFallback className="flex items-center justify-center bg-[#F3F4F6] font-medium text-foreground">
                        {student.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <p className="font-medium text-foreground">
                      {student.name}
                    </p>
                  </div>

                  <div className="inline-flex items-center gap-1 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] p-1">
                    {statusOptions.map((statusOption) => {
                      const isActive = currentStatus === statusOption;

                      return (
                        <button
                          key={statusOption}
                          type="button"
                          onClick={() =>
                            markStudentStatus(student.id, statusOption)
                          }
                          className={cn(
                            "cursor-pointer rounded-full bg-transparent px-3 py-1.5 text-xs transition-all",
                            isActive
                              ? cn(
                                  "bg-white font-semibold shadow-sm",
                                  activeSegmentTone(statusOption),
                                )
                              : "text-[#6B7280] hover:bg-white/70",
                          )}
                        >
                          {statusOption}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <div className="rounded-lg border border-[#E5E7EB] bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {scopedHistory.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">
                      No attendance records found for this class.
                    </TableCell>
                  </TableRow>
                ) : (
                  scopedHistory.map((record) => {
                    const student = studentDirectory[record.studentId];

                    return (
                      <TableRow key={`${record.date}-${record.studentId}`}>
                        <TableCell>{record.date}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <Avatar className="h-8 w-8">
                              <AvatarImage
                                src={`/placeholder.svg?height=32&width=32`}
                                alt={student?.name || "Student"}
                              />
                              <AvatarFallback>
                                {student?.avatar || "ST"}
                              </AvatarFallback>
                            </Avatar>
                            <div>{student?.name || "Unknown Student"}</div>
                          </div>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          <Badge
                            className={cn(
                              "border",
                              historyBadgeTone(record.status),
                            )}
                          >
                            {record.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
