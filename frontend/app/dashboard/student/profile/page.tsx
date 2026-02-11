"use client"

export const dynamic = 'force-dynamic';

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { Camera, Mail, Phone, MapPin, Calendar, GraduationCap, Bell, Lock, Globe, Palette, Save } from "lucide-react"

export default function StudentProfilePage() {
  const [profile, setProfile] = useState({
    name: "Alex Chen",
    email: "alex.chen@example.com",
    phone: "+1 (555) 123-4567",
    location: "San Francisco, CA",
    bio: "Passionate language learner with a focus on Mandarin Chinese. Currently preparing for HSK 4 examination.",
    enrolledSince: "September 2023",
    studentId: "STU-2023-1234",
  })

  const [notifications, setNotifications] = useState({
    emailAssignments: true,
    emailGrades: true,
    emailMessages: true,
    emailAnnouncements: false,
    pushAssignments: true,
    pushGrades: true,
    pushMessages: true,
    pushReminders: true,
  })

  const [preferences, setPreferences] = useState({
    language: "en",
    timezone: "America/Los_Angeles",
    theme: "system",
    accessibility: {
      largeText: false,
      highContrast: false,
      reducedMotion: false,
    },
  })

  const handleSaveProfile = () => {
    alert("Profile saved successfully!")
  }

  const handleChangePassword = () => {
    alert("Password change functionality would be implemented here.")
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account and preferences</p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <div className="relative">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">AC</AvatarFallback>
                  </Avatar>
                  <Button size="icon" variant="outline" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-transparent">
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <div>
                  <h3 className="text-lg font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">Student ID: {profile.studentId}</p>
                  <Badge variant="outline" className="mt-2">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Enrolled since {profile.enrolledSince}
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Form Fields */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={profile.name}
                    onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={profile.phone}
                      onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="location"
                      value={profile.location}
                      onChange={(e) => setProfile({ ...profile, location: e.target.value })}
                      className="pl-10"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profile.bio}
                  onChange={(e) => setProfile({ ...profile, bio: e.target.value })}
                  rows={4}
                />
              </div>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>Configure which emails you want to receive</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Assignment Reminders</p>
                  <p className="text-sm text-muted-foreground">Get notified about upcoming deadlines</p>
                </div>
                <Switch
                  checked={notifications.emailAssignments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailAssignments: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Grade Updates</p>
                  <p className="text-sm text-muted-foreground">Get notified when grades are posted</p>
                </div>
                <Switch
                  checked={notifications.emailGrades}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailGrades: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified about new messages from instructors</p>
                </div>
                <Switch
                  checked={notifications.emailMessages}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailMessages: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Announcements</p>
                  <p className="text-sm text-muted-foreground">Get notified about course announcements</p>
                </div>
                <Switch
                  checked={notifications.emailAnnouncements}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, emailAnnouncements: checked })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Push Notifications
              </CardTitle>
              <CardDescription>Configure in-app notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Assignment Alerts</p>
                  <p className="text-sm text-muted-foreground">Real-time alerts for assignment updates</p>
                </div>
                <Switch
                  checked={notifications.pushAssignments}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushAssignments: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Grade Alerts</p>
                  <p className="text-sm text-muted-foreground">Instant notification when grades are posted</p>
                </div>
                <Switch
                  checked={notifications.pushGrades}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushGrades: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Message Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified of new messages instantly</p>
                </div>
                <Switch
                  checked={notifications.pushMessages}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushMessages: checked })}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Class Reminders</p>
                  <p className="text-sm text-muted-foreground">Reminders before classes start</p>
                </div>
                <Switch
                  checked={notifications.pushReminders}
                  onCheckedChange={(checked) => setNotifications({ ...notifications, pushReminders: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Preferences Tab */}
        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>Set your language and timezone preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Language</Label>
                  <Select value={preferences.language} onValueChange={(v) => setPreferences({ ...preferences, language: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="zh">中文</SelectItem>
                      <SelectItem value="es">Español</SelectItem>
                      <SelectItem value="fr">Français</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Timezone</Label>
                  <Select value={preferences.timezone} onValueChange={(v) => setPreferences({ ...preferences, timezone: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="America/Los_Angeles">Pacific Time (PT)</SelectItem>
                      <SelectItem value="America/Denver">Mountain Time (MT)</SelectItem>
                      <SelectItem value="America/Chicago">Central Time (CT)</SelectItem>
                      <SelectItem value="America/New_York">Eastern Time (ET)</SelectItem>
                      <SelectItem value="Asia/Shanghai">China Standard Time (CST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="h-5 w-5" />
                Appearance
              </CardTitle>
              <CardDescription>Customize how the app looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select value={preferences.theme} onValueChange={(v) => setPreferences({ ...preferences, theme: v })}>
                  <SelectTrigger className="w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="light">Light</SelectItem>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Accessibility</CardTitle>
              <CardDescription>Adjust accessibility settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Large Text</p>
                  <p className="text-sm text-muted-foreground">Increase the default text size</p>
                </div>
                <Switch
                  checked={preferences.accessibility.largeText}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      accessibility: { ...preferences.accessibility, largeText: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">High Contrast</p>
                  <p className="text-sm text-muted-foreground">Increase contrast for better visibility</p>
                </div>
                <Switch
                  checked={preferences.accessibility.highContrast}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      accessibility: { ...preferences.accessibility, highContrast: checked },
                    })
                  }
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Reduced Motion</p>
                  <p className="text-sm text-muted-foreground">Minimize animations and transitions</p>
                </div>
                <Switch
                  checked={preferences.accessibility.reducedMotion}
                  onCheckedChange={(checked) =>
                    setPreferences({
                      ...preferences,
                      accessibility: { ...preferences.accessibility, reducedMotion: checked },
                    })
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Current Password</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">New Password</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirm New Password</Label>
                <Input id="confirm-password" type="password" />
              </div>
              <Button onClick={handleChangePassword}>Change Password</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Two-Factor Authentication</CardTitle>
              <CardDescription>Add an extra layer of security to your account</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">2FA Status</p>
                  <p className="text-sm text-muted-foreground">Currently disabled</p>
                </div>
                <Button variant="outline">Enable 2FA</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Active Sessions</CardTitle>
              <CardDescription>Manage your active login sessions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium">Current Session</p>
                  <p className="text-sm text-muted-foreground">Chrome on MacOS - San Francisco, CA</p>
                  <p className="text-xs text-muted-foreground">Last active: Just now</p>
                </div>
                <Badge variant="secondary">Current</Badge>
              </div>
              <div className="flex items-center justify-between p-3 border rounded-lg">
                <div>
                  <p className="font-medium">Mobile App</p>
                  <p className="text-sm text-muted-foreground">iPhone 14 Pro - San Francisco, CA</p>
                  <p className="text-xs text-muted-foreground">Last active: 2 hours ago</p>
                </div>
                <Button variant="ghost" size="sm">
                  Revoke
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
