"use client";
import { useRouter } from "next/navigation";

import Link from "next/link";
import {
  Bell,
  Globe,
  Moon,
  Sun,
  LogOut,
  UserIcon,
  Settings,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "next-themes";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { NotificationsPanel } from "@/components/notifications-panel";
import {useEffect, useState} from "react";

export function Header() {
  const { setTheme } = useTheme();
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [banner,setBanner] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  // Fetch data from backend to load personal info
  useEffect(() => {
    const userId = localStorage.getItem("userId")
    const role = localStorage.getItem("role")
    if (!userId) return

    if (role == "STUDENT"){
      setBanner("Student") 
    }
    else if (role == "TEACHER"){
      setBanner("Teacher") 
    }

    fetch(`http://localhost:8080/api/users/${userId}`)
      .then(res => {
        if (!res.ok) throw new Error("Failed to load profile")
        return res.json()
      })
      .then(data => {
        setProfile(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [])
    // Loading state
    if (loading) {
      return <div className="text-muted-foreground">Loading info...</div>;
    }
  
  // When user click logout, clear localStorage and redirect to homepage
  const handleLogout = () => {
    localStorage.removeItem("userId");
    localStorage.removeItem("role");
    router.push("/");
  };
  
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center border-b bg-background px-4 md:px-6">
      <div className="flex w-full max-w-7xl mx-auto items-center">
        <div className="ml-2 pl-16">
          <Link href="/tutor-fe" className="flex items-center gap-2 font-semibold">
            <span className="text-xl text-primary">汉语学习</span>
            <span className="text-lg">{banner} Portal</span>
          </Link>
        </div>
        <div className="ml-auto flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Globe className="h-5 w-5" />
                <span className="sr-only">Language</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>English</DropdownMenuItem>
              <DropdownMenuItem>中文 (Chinese)</DropdownMenuItem>
              <DropdownMenuItem>Español (Spanish)</DropdownMenuItem>
              <DropdownMenuItem>Français (French)</DropdownMenuItem>
              <DropdownMenuItem>日本語 (Japanese)</DropdownMenuItem>
              <DropdownMenuItem>한국어 (Korean)</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Toggle theme</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setTheme("light")}>
                Light
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                Dark
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                System
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Sheet open={notificationsOpen} onOpenChange={setNotificationsOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="notification-badge">3</span>
                <span className="sr-only">Notifications</span>
              </Button>
            </SheetTrigger>
            <SheetContent className="w-full sm:max-w-md">
              <NotificationsPanel />
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                <AvatarImage src={profile.avatarUrl
                                  ? `http://localhost:8080${profile.avatarUrl}`
                                  : "/placeholder.svg"
                                  }alt="User Avatar"/>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{profile.firstName} {profile.lastName}</p>
                  <p className="text-xs leading-none text-muted-foreground">
                    {profile.email}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/tutor-fe/profile" className="flex items-center">
                  <UserIcon className="mr-2 h-4 w-4" />
                  <span>Profile</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center cursor-pointer"
                                onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
