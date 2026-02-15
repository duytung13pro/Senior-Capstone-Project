"use client";

import type React from "react";
import { Header } from "@/components/header";
import { TeacherSidebar } from "@/components/teacher-sidebar";
import { StudentSidebar } from "@/components/student-sidebar";
import { useEffect, useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {

  const [role, setRole] = useState<string | null>(null);
  let SidebarComponent: React.ElementType | null = null;

  // Read localStorage AFTER page loads (client only)
  useEffect(() => {
    const storedRole = localStorage.getItem("role");
    setRole(storedRole);
  }, []);
  if (role === "STUDENT") {
    SidebarComponent = StudentSidebar;
  } else if (role === "TEACHER") {
    SidebarComponent = TeacherSidebar;
  }
  // Choose component DURING RENDER


  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <div className="flex flex-1 relative">

        {/* Only render when role is known */}
        {SidebarComponent && <SidebarComponent />}

        <div className="w-full pl-16 bg-background">
          <main className="max-w-7xl mx-auto px-4 py-6 md:px-6 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
