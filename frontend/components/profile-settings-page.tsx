"use client";

import { useTransition } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  changeCurrentUserPassword,
  updateCurrentUserNotifications,
  updateCurrentUserPreferences,
  updateCurrentUserProfile,
  type CurrentProfileSettings,
} from "@/app/actions/profile";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  changePasswordSchema,
  notificationSettingsSchema,
  preferenceSettingsSchema,
  profileInfoSchema,
  type ChangePasswordInput,
  type NotificationSettingsInput,
  type PreferenceSettingsInput,
  type ProfileInfoInput,
} from "@/lib/validations/profile";
import { Bell, Globe, Lock, Palette, Save } from "lucide-react";

type ProfileSettingsPageProps = {
  initialData: CurrentProfileSettings;
};

function buildInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  return (parts[0]?.[0] ?? "U").toUpperCase();
}

export function ProfileSettingsPage({ initialData }: ProfileSettingsPageProps) {
  const { toast } = useToast();
  const [isSavingProfile, startSavingProfile] = useTransition();
  const [isSavingNotifications, startSavingNotifications] = useTransition();
  const [isSavingPreferences, startSavingPreferences] = useTransition();
  const [isChangingPassword, startChangingPassword] = useTransition();

  const profileForm = useForm<ProfileInfoInput>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      name: initialData.name,
      phone: initialData.phone,
      location: initialData.location,
      bio: initialData.bio,
      avatar: initialData.avatar,
    },
  });

  const notificationsForm = useForm<NotificationSettingsInput>({
    resolver: zodResolver(notificationSettingsSchema),
    defaultValues: initialData.notifications,
  });

  const preferencesForm = useForm<PreferenceSettingsInput>({
    resolver: zodResolver(preferenceSettingsSchema),
    defaultValues: initialData.preferences,
  });

  const passwordForm = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const roleKey = (initialData.role || "").toLowerCase();
  const isStudent = roleKey.includes("student");
  const roleIdLabel = isStudent ? "Student ID" : "Teacher ID";
  const roleIdValue = isStudent ? initialData.studentId : initialData.teacherId;
  const liveName = profileForm.watch("name") || initialData.name;
  const liveAvatar = profileForm.watch("avatar") || "";

  const onSubmitProfile = (values: ProfileInfoInput) => {
    startSavingProfile(async () => {
      const result = await updateCurrentUserProfile(values);
      if (!result.success) {
        toast({
          title: "Unable to save profile",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      profileForm.reset({
        name: result.profile.name,
        phone: result.profile.phone,
        location: result.profile.location,
        bio: result.profile.bio,
        avatar: result.profile.avatar,
      });

      toast({ title: "Profile updated successfully" });
    });
  };

  const onSubmitNotifications = (values: NotificationSettingsInput) => {
    startSavingNotifications(async () => {
      const result = await updateCurrentUserNotifications(values);
      if (!result.success) {
        toast({
          title: "Unable to save notifications",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      notificationsForm.reset(result.profile.notifications);
      toast({ title: "Notification settings updated" });
    });
  };

  const onSubmitPreferences = (values: PreferenceSettingsInput) => {
    startSavingPreferences(async () => {
      const result = await updateCurrentUserPreferences(values);
      if (!result.success) {
        toast({
          title: "Unable to save preferences",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      preferencesForm.reset(result.profile.preferences);
      toast({ title: "Preferences updated" });
    });
  };

  const onSubmitPassword = (values: ChangePasswordInput) => {
    startChangingPassword(async () => {
      const result = await changeCurrentUserPassword(values);
      if (!result.success) {
        toast({
          title: "Unable to change password",
          description: result.message,
          variant: "destructive",
        });
        return;
      }

      passwordForm.reset();
      toast({ title: "Password changed successfully" });
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Profile & Settings
        </h1>
        <p className="text-muted-foreground">
          Manage your account and preferences
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>Update your personal details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={liveAvatar || undefined} alt={liveName} />
                  <AvatarFallback className="text-xl">
                    {buildInitials(liveName)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-medium">{liveName}</h3>
                  <p className="text-sm text-muted-foreground">
                    {roleIdLabel}: {roleIdValue || "N/A"}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {initialData.role}
                  </Badge>
                </div>
              </div>

              <Separator />

              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={profileForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input value={initialData.email} disabled readOnly />
                      </FormControl>
                    </FormItem>

                    <FormField
                      control={profileForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={profileForm.control}
                      name="location"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Location</FormLabel>
                          <FormControl>
                            <Input {...field} value={field.value ?? ""} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={profileForm.control}
                    name="avatar"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Avatar URL</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            value={field.value ?? ""}
                            placeholder="https://example.com/avatar.png"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            value={field.value ?? ""}
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingProfile}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSavingProfile ? "Saving..." : "Save Changes"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Notification Settings
              </CardTitle>
              <CardDescription>
                Configure your email and push alerts
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...notificationsForm}>
                <form
                  onSubmit={notificationsForm.handleSubmit(
                    onSubmitNotifications,
                  )}
                  className="space-y-4"
                >
                  {[
                    ["emailAssignments", "Email: Assignment reminders"],
                    ["emailGrades", "Email: Grade updates"],
                    ["emailMessages", "Email: New messages"],
                    ["emailAnnouncements", "Email: Announcements"],
                    ["pushAssignments", "Push: Assignment alerts"],
                    ["pushGrades", "Push: Grade alerts"],
                    ["pushMessages", "Push: Message alerts"],
                    ["pushReminders", "Push: Class reminders"],
                  ].map(([name, label], index) => (
                    <div key={name}>
                      <FormField
                        control={notificationsForm.control}
                        name={name as keyof NotificationSettingsInput}
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <FormLabel className="mb-0 font-normal">
                              {label}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      {index < 7 ? <Separator className="my-3" /> : null}
                    </div>
                  ))}

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingNotifications}>
                      {isSavingNotifications
                        ? "Saving..."
                        : "Save Notifications"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Language & Region
              </CardTitle>
              <CardDescription>
                Set your language, timezone, theme and accessibility options
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...preferencesForm}>
                <form
                  onSubmit={preferencesForm.handleSubmit(onSubmitPreferences)}
                  className="space-y-6"
                >
                  <div className="grid gap-4 md:grid-cols-2">
                    <FormField
                      control={preferencesForm.control}
                      name="language"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Language</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={field.onChange}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="en">English</SelectItem>
                              <SelectItem value="vi">Tiếng Việt</SelectItem>
                              <SelectItem value="zh">中文</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={preferencesForm.control}
                      name="timezone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Timezone</FormLabel>
                          <FormControl>
                            <Input {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={preferencesForm.control}
                    name="theme"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-2">
                          <Palette className="h-4 w-4" />
                          Theme
                        </FormLabel>
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <FormControl>
                            <SelectTrigger className="w-48">
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="light">Light</SelectItem>
                            <SelectItem value="dark">Dark</SelectItem>
                            <SelectItem value="system">System</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <h3 className="text-base font-medium">Accessibility</h3>
                    {[
                      ["largeText", "Large text"],
                      ["highContrast", "High contrast"],
                      ["reducedMotion", "Reduced motion"],
                    ].map(([key, label]) => (
                      <FormField
                        key={key}
                        control={preferencesForm.control}
                        name={
                          `accessibility.${key}` as
                            | "accessibility.largeText"
                            | "accessibility.highContrast"
                            | "accessibility.reducedMotion"
                        }
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-4">
                            <FormLabel className="mb-0 font-normal">
                              {label}
                            </FormLabel>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    ))}
                  </div>

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isSavingPreferences}>
                      {isSavingPreferences ? "Saving..." : "Save Preferences"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Password
              </CardTitle>
              <CardDescription>Change your password</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="current-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            type="password"
                            autoComplete="new-password"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end">
                    <Button type="submit" disabled={isChangingPassword}>
                      {isChangingPassword ? "Changing..." : "Change Password"}
                    </Button>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
