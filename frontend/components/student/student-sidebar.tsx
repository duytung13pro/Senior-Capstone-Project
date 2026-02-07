"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  BookOpen,
  Calendar,
  FileText,
  Home,
  MessageSquare,
  FolderOpen,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  TrendingUp,
  Settings,
  Award,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"

export function StudentSidebar() {
  const pathname = usePathname()
  const [expanded, setExpanded] = useState(false)
  const [pinned, setPinned] = useState(false)

  const navigation = [
    { name: "Dashboard", href: "/student", icon: Home },
    { name: "My Classes", href: "/student/classes", icon: BookOpen },
    { name: "Assignments", href: "/student/assignments", icon: FileText },
    { name: "Grades", href: "/student/grades", icon: Award },
    { name: "Progress", href: "/student/progress", icon: TrendingUp },
    { name: "Schedule", href: "/student/schedule", icon: Calendar },
    { name: "Messages", href: "/student/messages", icon: MessageSquare },
    { name: "Resources", href: "/student/resources", icon: FolderOpen },
    { name: "Analytics", href: "/student/analytics", icon: BarChart3 },
    { name: "Profile & Settings", href: "/student/profile", icon: Settings },
  ]

  return (
    <div
      className={cn(
        "fixed left-0 top-0 z-40 h-screen transition-all duration-300 ease-in-out",
        expanded || pinned ? "w-64" : "w-16",
        "bg-sidebar text-sidebar-foreground border-r border-sidebar-border"
      )}
      onMouseEnter={() => !pinned && setExpanded(true)}
      onMouseLeave={() => !pinned && setExpanded(false)}
    >
      <div className="flex h-16 items-center justify-between border-b border-sidebar-border px-4">
        <div className={cn("flex items-center gap-2", !expanded && !pinned && "hidden")}>
          <GraduationCap className="h-6 w-6 text-primary" />
          <span className="text-lg font-semibold">Student Portal</span>
        </div>
        <div className={cn("flex items-center justify-center", expanded || pinned ? "" : "w-full")}>
          {!expanded && !pinned && <GraduationCap className="h-6 w-6 text-primary" />}
        </div>
        <Button
          variant="ghost"
          size="icon"
          className={cn("ml-auto", !expanded && !pinned && "hidden")}
          onClick={() => setPinned(!pinned)}
        >
          {pinned ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          <span className="sr-only">{pinned ? "Unpin Sidebar" : "Pin Sidebar"}</span>
        </Button>
      </div>
      <nav className="flex flex-col gap-1 p-2 overflow-y-auto max-h-[calc(100vh-4rem)]">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            className={cn(
              "flex h-10 items-center gap-3 rounded-md px-3 transition-colors",
              pathname === item.href
                ? "bg-sidebar-accent text-sidebar-accent-foreground"
                : "hover:bg-sidebar-accent/50 hover:text-sidebar-accent-foreground",
              !expanded && !pinned && "justify-center"
            )}
          >
            <item.icon className="h-5 w-5 shrink-0" />
            <span className={cn("truncate", !expanded && !pinned && "hidden")}>{item.name}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}
