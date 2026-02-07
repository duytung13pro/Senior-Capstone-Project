"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { requireRole } from "@/lib/auth/rbac"

export async function deleteUser(adminId: string, userId: string) {
  try {
    await dbConnect()

    const admin = await User.findById(adminId)
    if (!admin || !requireRole(admin, "Admin")) {
      throw new Error("Only admins can delete users")
    }

    const user = await User.findById(userId)
    if (!user) throw new Error("User not found")

    await User.deleteOne({ _id: userId })

    return { success: true, message: "User deleted" }
  } catch (error) {
    console.error("Error deleting user:", error)
    throw error
  }
}

export async function updateUserRole(adminId: string, userId: string, newRole: string) {
  try {
    await dbConnect()

    const admin = await User.findById(adminId)
    if (!admin || !requireRole(admin, "Admin")) {
      throw new Error("Only admins can update user roles")
    }

    if (!["Student", "Instructor", "Admin"].includes(newRole)) {
      throw new Error("Invalid role")
    }

    const user = await User.findByIdAndUpdate(userId, { role: newRole }, { new: true })

    return { success: true, user }
  } catch (error) {
    console.error("Error updating user role:", error)
    throw error
  }
}
