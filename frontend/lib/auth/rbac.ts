import type { IUser } from "@/lib/models/User"

export type UserRole = "Student" | "Instructor" | "Admin"

export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  Student: ["view_course", "enroll_course", "update_own_progress"],
  Instructor: [
    "create_course",
    "view_own_courses",
    "update_own_course",
    "delete_own_course",
    "view_students",
    "create_module",
  ],
  Admin: ["manage_users", "delete_user", "delete_course", "view_all_data", "manage_system"],
}

export function checkPermission(user: IUser | null, permission: string): boolean {
  if (!user) return false
  const userPermissions = ROLE_PERMISSIONS[user.role]
  return userPermissions.includes(permission)
}

export function requireRole(user: IUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false
  return roles.includes(user.role)
}

export function requirePermission(user: IUser | null, permission: string): void {
  if (!checkPermission(user, permission)) {
    throw new Error(`User does not have permission: ${permission}`)
  }
}
