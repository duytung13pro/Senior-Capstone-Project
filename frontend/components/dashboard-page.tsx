"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RecentClasses } from "@/components/recent-classes";
import { UpcomingAssignments } from "@/components/upcoming-assignments";
import { StudentAttendance } from "@/components/student-attendance";
import { RecentMessages } from "@/components/recent-messages";
import { AnalyticsDashboard } from "@/components/analytics-dashboard";
import { ChevronRight } from "lucide-react";

export function DashboardPage() {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="space-y-4">
          {/* Stats Cards Section */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* ... (Keep your existing Stats Cards here) */}
          </div>

          {/* Recent Classes */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Recent Classes</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/classes" className="flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <RecentClasses />
            </CardContent>
          </Card>

          {/* Upcoming Assignments */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Upcoming Assignments</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/assignments" className="flex items-center gap-1">
                  View All <ChevronRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <UpcomingAssignments />
            </CardContent>
          </Card>

          {/* Attendance and Messages Row */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-12">
            <Link
              href="/attendance"
              className="col-span-2 lg:col-span-4 block no-underline"
            >
              <Card className="h-full cursor-pointer hover:bg-accent/50 transition-colors">
                <CardHeader>
                  <CardTitle>Student Attendance</CardTitle>
                  <CardDescription>Last 7 days</CardDescription>
                  {/* View button removed here */}
                </CardHeader>
                <CardContent>
                  <StudentAttendance />
                </CardContent>
              </Card>
            </Link>

            <Card className="col-span-2 lg:col-span-8">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Recent Messages</CardTitle>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/messages">Open Inbox</Link>
                </Button>
              </CardHeader>
              <CardContent>
                <RecentMessages />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <AnalyticsDashboard />
        </TabsContent>

        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>System Reports</CardTitle>
              <CardDescription>
                Select a report type to generate detailed data.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link href="/reports/attendance">
                  <span className="font-bold text-lg">Attendance Report</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Export weekly or monthly student logs
                  </span>
                </Link>
              </Button>
              <Button variant="outline" className="h-24 flex-col gap-2" asChild>
                <Link href="/reports/performance">
                  <span className="font-bold text-lg">Performance Report</span>
                  <span className="text-xs text-muted-foreground text-center">
                    Analyze student grades and progress
                  </span>
                </Link>
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
