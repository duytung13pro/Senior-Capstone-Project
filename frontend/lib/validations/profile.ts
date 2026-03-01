import { z } from "zod"

export const profileInfoSchema = z.object({
  name: z.string().trim().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().trim().max(30, "Phone is too long").optional().or(z.literal("")),
  location: z.string().trim().max(120, "Location is too long").optional().or(z.literal("")),
  bio: z.string().trim().max(500, "Bio is too long").optional().or(z.literal("")),
  avatar: z.string().trim().url("Avatar must be a valid URL").optional().or(z.literal("")),
})

export const notificationSettingsSchema = z.object({
  emailAssignments: z.boolean(),
  emailGrades: z.boolean(),
  emailMessages: z.boolean(),
  emailAnnouncements: z.boolean(),
  pushAssignments: z.boolean(),
  pushGrades: z.boolean(),
  pushMessages: z.boolean(),
  pushReminders: z.boolean(),
})

export const preferenceSettingsSchema = z.object({
  language: z.enum(["en", "vi", "zh"]),
  timezone: z.string().trim().min(1, "Timezone is required"),
  theme: z.enum(["light", "dark", "system"]),
  accessibility: z.object({
    largeText: z.boolean(),
    highContrast: z.boolean(),
    reducedMotion: z.boolean(),
  }),
})

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Please confirm your new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match",
  })

export type ProfileInfoInput = z.infer<typeof profileInfoSchema>
export type NotificationSettingsInput = z.infer<typeof notificationSettingsSchema>
export type PreferenceSettingsInput = z.infer<typeof preferenceSettingsSchema>
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>
