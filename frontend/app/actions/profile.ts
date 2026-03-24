"use server"

import bcrypt from "bcryptjs"
import { revalidatePath } from "next/cache"
import { auth } from "@/auth"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import {
  changePasswordSchema,
  notificationSettingsSchema,
  preferenceSettingsSchema,
  profileInfoSchema,
  type ChangePasswordInput,
  type NotificationSettingsInput,
  type PreferenceSettingsInput,
  type ProfileInfoInput,
} from "@/lib/validations/profile"

const defaultNotifications = {
  emailAssignments: true,
  emailGrades: true,
  emailMessages: true,
  emailAnnouncements: true,
  pushAssignments: true,
  pushGrades: true,
  pushMessages: true,
  pushReminders: true,
}

const defaultPreferences = {
  language: "en" as const,
  timezone: "UTC",
  theme: "system" as const,
  accessibility: {
    largeText: false,
    highContrast: false,
    reducedMotion: false,
  },
}

export type CurrentProfileSettings = {
  id: string
  role: string
  email: string
  name: string
  avatar: string
  phone: string
  location: string
  bio: string
  studentId: string
  teacherId: string
  notifications: NotificationSettingsInput
  preferences: PreferenceSettingsInput
}

function splitDisplayName(name: string) {
  const parts = String(name || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)

  if (parts.length === 0) {
    return { firstName: "", lastName: "" }
  }

  if (parts.length === 1) {
    return { firstName: parts[0], lastName: "" }
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(" "),
  }
}

function normalizeProfile(user: any): CurrentProfileSettings {
  const firstName = String((user as any).firstName ?? "").trim()
  const lastName = String((user as any).lastName ?? "").trim()
  const combinedName = `${firstName} ${lastName}`.trim()
  const fallbackName = String(user.name ?? "").trim()

  return {
    id: user._id.toString(),
    role: user.role ?? "",
    email: user.email ?? "",
    name: combinedName || fallbackName,
    avatar: user.avatar ?? "",
    phone: user.phone ?? "",
    location: user.location ?? "",
    bio: user.bio ?? "",
    studentId: user.studentId ?? "",
    teacherId: user.teacherId ?? "",
    notifications: {
      ...defaultNotifications,
      ...(user.notifications ?? {}),
    },
    preferences: {
      ...defaultPreferences,
      ...(user.preferences ?? {}),
      accessibility: {
        ...defaultPreferences.accessibility,
        ...(user.preferences?.accessibility ?? {}),
      },
    },
  }
}

async function getAuthedUserOrThrow(selectPassword = false) {
  const session = await auth()

  if (!session?.user?.id) {
    throw new Error("Unauthorized")
  }

  await dbConnect()

  const query = User.findById(session.user.id)
  if (selectPassword) {
    query.select("+password")
  }

  const user = await query
  if (!user) {
    throw new Error("User not found")
  }

  return user
}

function revalidateProfileRoutes() {
  revalidatePath("/dashboard/student/profile")
  revalidatePath("/dashboard/teacher/profile")
}

export async function getCurrentUserProfileSettings(): Promise<CurrentProfileSettings> {
  const user = await getAuthedUserOrThrow(false)
  return normalizeProfile(user)
}

export async function updateCurrentUserProfile(data: ProfileInfoInput) {
  try {
    const parsed = profileInfoSchema.parse(data)
    const user = await getAuthedUserOrThrow(false)
    const nextName = String(parsed.name || "").trim()
    const { firstName, lastName } = splitDisplayName(nextName)

    user.name = nextName
    ;(user as any).firstName = firstName
    ;(user as any).lastName = lastName
    user.phone = parsed.phone || ""
    user.location = parsed.location || ""
    user.bio = parsed.bio || ""
    user.avatar = parsed.avatar || ""

    await user.save()
    revalidateProfileRoutes()

    return { success: true, profile: normalizeProfile(user) }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update profile",
    }
  }
}

export async function updateCurrentUserNotifications(data: NotificationSettingsInput) {
  try {
    const parsed = notificationSettingsSchema.parse(data)
    const user = await getAuthedUserOrThrow(false)

    user.notifications = parsed

    await user.save()
    revalidateProfileRoutes()

    return { success: true, profile: normalizeProfile(user) }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update notifications",
    }
  }
}

export async function updateCurrentUserPreferences(data: PreferenceSettingsInput) {
  try {
    const parsed = preferenceSettingsSchema.parse(data)
    const user = await getAuthedUserOrThrow(false)

    user.preferences = parsed

    await user.save()
    revalidateProfileRoutes()

    return { success: true, profile: normalizeProfile(user) }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to update preferences",
    }
  }
}

export async function changeCurrentUserPassword(data: ChangePasswordInput) {
  try {
    const parsed = changePasswordSchema.parse(data)
    const user = await getAuthedUserOrThrow(true)

    const validCurrentPassword = await bcrypt.compare(parsed.currentPassword, user.password)
    if (!validCurrentPassword) {
      return { success: false, message: "Current password is incorrect" }
    }

    const hashedPassword = await bcrypt.hash(parsed.newPassword, 10)
    user.password = hashedPassword

    await user.save()

    return { success: true }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : "Failed to change password",
    }
  }
}
