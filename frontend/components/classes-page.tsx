"use client";

import { Textarea } from "@/components/ui/textarea";
import { useEffect } from "react";

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

export function ClassesPage() {

  const [searchQuery, setSearchQuery] = useState("");
  // Holds classes fetched from database
  const [classes, setClasses] = useState<any[]>([]);

  // Loading indicator
  const [loading, setLoading] = useState(true);

  // We'll run everytime the page is loaded.
  // Look at the database and fetch the Class data
  // based on teacherID
  useEffect(() => {
    const teacherId = localStorage.getItem("userId");

    // Check for valid teacherId
    if (!teacherId) {
      console.error("No teacherId found");
      setLoading(false);
      return;
    }
    // Send the request
    fetch(`http://localhost:8080/api/classes/my?teacherId=${teacherId}`)
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

  // Filter by search
  const filteredClasses = classes.filter((c) =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 🔹oading UI. Load this while waiting for data
  if (loading) {
    return <div className="p-6">Loading classes...</div>;
  }

  return (
    <div className="flex flex-col gap-4 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">My Classes</h1>

        <Button>
          <Plus className="mr-2 h-4 w-4" />
          New Class
        </Button>
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
                    {/* View button – routing comes later */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => console.log("View class", c.id)}
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