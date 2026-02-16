"use client";

import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useState } from "react";
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

export function StudentClassesPage() {
  const router = useRouter();


  const [searchQuery, setSearchQuery] = useState("");
  // Holds classes fetched from database
  const [classes, setClasses] = useState<any[]>([]);
  // Loading indicator
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [level, setLevel] = useState("");
  const [time, setTime] = useState("");
  const [days, setDays] = useState("");
  const [description, setDescription] = useState("");
  // We'll run everytime the page is loaded.
  // Look at the database and fetch the Class data
  // based on teacherID
  useEffect(() => {
    const studentId = localStorage.getItem("userId");

    // Check for valid teacherId
    if (!studentId) {
      console.error("No teacherId found");
      setLoading(false);
      return;
    }
    // Send the request
    fetch(`http://localhost:8080/api/classes/student/${studentId}`)
      .then((res) => res.json())
      .then((data) => {
        setClasses(data); 
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load classes", err);
        setLoading(false);
      });
  }, []);

  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
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

        <Dialog>
          <DialogTrigger asChild>
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
                <Select onValueChange={setLevel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BEGINNER">Beginner</SelectItem>
                    <SelectItem value="INTERMEDIATE">Intermediate</SelectItem>
                    <SelectItem value="ADVANCED">Advanced</SelectItem>
                    <SelectItem value="ALL">All Levels</SelectItem>
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
                <Input
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>

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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {filteredClasses.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center">
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
                  <TableCell className="text-right">
                    {/* View button – */}
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/tutor-fe/classes/${c.id}`)}>
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