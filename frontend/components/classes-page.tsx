"use client";

import { Textarea } from "@/components/ui/textarea";
import { useRouter } from "next/navigation";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Plus,
  Search,
  Users,
  BookOpen,
  Calendar,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fetchApiFirstOk } from "@/lib/api";

type CreateClassPayload = {
  name: string;
  level: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "ALL_LEVEL";
  time: string;
  days: string;
  description: string | null;
  room: string | null;
  maxStudents: number | null;
  startDate: string | null;
  endDate: string | null;
  teacherId: string;
};

export function ClassesPage() {
  const router = useRouter();

  const [searchQuery, setSearchQuery] = useState("");
  // Holds classes fetched from database
  const [classes, setClasses] = useState<any[]>([]);
  // Loading indicator
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [level, setLevel] = useState<CreateClassPayload["level"] | "">("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");
  const [description, setDescription] = useState("");
  const [room, setRoom] = useState("");
  const [maxStudents, setMaxStudents] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [formError, setFormError] = useState("");

  const resolveTeacherContext = async () => {
    const localTeacherId = localStorage.getItem("userId") || "";
    const localTeacherEmail = localStorage.getItem("userEmail") || "";

    if (localTeacherId && localTeacherEmail) {
      return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
    }

    try {
      const sessionRes = await fetch("/api/auth/session", {
        cache: "no-store",
      });
      if (!sessionRes.ok) {
        return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
      }

      const sessionData = await sessionRes.json();
      const sessionTeacherId = sessionData?.user?.id || localTeacherId;
      const sessionTeacherEmail = sessionData?.user?.email || localTeacherEmail;

      if (sessionTeacherId) {
        localStorage.setItem("userId", sessionTeacherId);
      }

      if (sessionTeacherEmail) {
        localStorage.setItem("userEmail", sessionTeacherEmail);
      }

      return {
        teacherId: sessionTeacherId,
        teacherEmail: sessionTeacherEmail,
      };
    } catch {
      return { teacherId: localTeacherId, teacherEmail: localTeacherEmail };
    }
  };
  // We'll run everytime the page is loaded.
  // Look at the database and fetch the Class data
  // based on teacherID
  useEffect(() => {
    const loadClasses = async () => {
      try {
        const { teacherId, teacherEmail } = await resolveTeacherContext();

        if (!teacherId && !teacherEmail) {
          console.error("No teacher context found");
          setFormError("Teacher account is not found. Please log in again.");
          setLoading(false);
          return;
        }

        const queryParams = new URLSearchParams();
        if (teacherId) {
          queryParams.set("teacherId", teacherId);
        }
        if (teacherEmail) {
          queryParams.set("teacherEmail", teacherEmail);
        }

        const res = await fetchApiFirstOk(
          `/api/classes/my?${queryParams.toString()}`,
          {
            cache: "no-store",
          },
        );

        const data = await res.json();
        setClasses(data);
      } catch (err) {
        console.error("Failed to load classes", err);
        setFormError(
          "Failed to load classes. Please check backend connection.",
        );
      } finally {
        setLoading(false);
      }
    };

    loadClasses();
  }, []);

  const handleCreateClass = async () => {
    setFormError("");

    if (!name.trim() || !level || !time.trim() || !days.trim()) {
      setFormError("Please fill in Class Name, Level, Time, and Days.");
      return;
    }

    if (maxStudents && Number(maxStudents) <= 0) {
      setFormError("Max students must be greater than 0.");
      return;
    }

    const { teacherId } = await resolveTeacherContext();
    if (!teacherId) {
      setFormError("Teacher account is not found. Please log in again.");
      return;
    }

    const normalizedName = name.trim();
    const normalizedTime = time.trim();
    const normalizedDays = days.trim();
    const normalizedDescription = description.trim();
    const normalizedRoom = room.trim();

    if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
      setFormError("End date must be after or equal to start date.");
      return;
    }

    const payload: CreateClassPayload = {
      name: normalizedName,
      level: level as CreateClassPayload["level"],
      time: normalizedTime,
      days: normalizedDays,
      description: normalizedDescription || null,
      room: normalizedRoom || null,
      maxStudents: maxStudents ? Number(maxStudents) : null,
      startDate: startDate || null,
      endDate: endDate || null,
      teacherId,
    };

    setIsCreating(true);

    try {
      const res = await fetchApiFirstOk(
        "/api/classes/create",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
        8000,
      );

      const newClass = await res.json();

      // Immediately update UI without refresh
      setClasses((prev) => [newClass, ...prev]);

      // Reset form
      setName("");
      setLevel("");
      setTime("");
      setDays("");
      setDescription("");
      setRoom("");
      setMaxStudents("");
      setStartDate("");
      setEndDate("");
      setIsDialogOpen(false);
    } catch (error) {
      console.error("Failed to create class", error);
      setFormError(
        error instanceof Error
          ? error.message
          : "Failed to create class. Please check backend connection.",
      );
    } finally {
      setIsCreating(false);
    }
  };

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Loading UI. Load this while waiting for data
  if (loading) {
    return <div className="p-6">Loading classes...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Classes</h1>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Class
            </Button>
          </DialogTrigger>

          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Class</DialogTitle>
              <DialogDescription>
                Fill in the details to create a class.
              </DialogDescription>
            </DialogHeader>

            <div className="grid gap-4 py-4">
              <div>
                <Label>Class Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <Label>Level</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                    <SelectItem value="ALL_LEVEL">All Levels</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Time</Label>
                <Input
                  placeholder="9:00AM - 10:10AM"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                />
              </div>

              <div>
                <Label>Days</Label>
                <Input
                  placeholder="Mon / Wed / Fri"
                  value={days}
                  onChange={(e) => setDays(e.target.value)}
                />
              </div>

              <div>
                <Label>Description</Label>
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div>
                <Label>Room</Label>
                <Input
                  placeholder="Room A-201"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                />
              </div>

              <div>
                <Label>Max Students</Label>
                <Input
                  type="number"
                  min={1}
                  placeholder="25"
                  value={maxStudents}
                  onChange={(e) => setMaxStudents(e.target.value)}
                />
              </div>

              <div>
                <Label>Start Date</Label>
                <Input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>

              <div>
                <Label>End Date</Label>
                <Input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>

              {formError ? (
                <p className="text-sm text-destructive">{formError}</p>
              ) : null}
            </div>

            <DialogFooter>
              <Button onClick={handleCreateClass} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Class"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search classes..."
          className="pl-8"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {/* Classes table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Class Name</TableHead>
              <TableHead>Level</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Days</TableHead>
              <TableHead>Room</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center">
                  No classes found.
                </TableCell>
              </TableRow>
            ) : (
              filteredClasses.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{c.level}</Badge>
                  </TableCell>
                  <TableCell>{c.time}</TableCell>
                  <TableCell>{c.days}</TableCell>
                  <TableCell>{c.room || "-"}</TableCell>
                  <TableCell>{c.maxStudents ?? "-"}</TableCell>
                  <TableCell className="text-right">
                    {/* View button – */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() =>
                        router.push(`/dashboard/teacher/classes/${c.id}`)
                      }
                    >
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
