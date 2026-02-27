"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function registerUser(data: {
  email: string
  name: string
  password: string
  role?: "Student" | "Instructor" | "Admin"
}) {
  try {
    await dbConnect()

    // Check if user already exists
    const existingUser = await User.findOne({ email: data.email })
    if (existingUser) {
      return { success: false, message: "Email already registered" }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10)

    // Create user
    const user = await User.create({
      email: data.email,
      name: data.name,
      password: hashedPassword,
      role: data.role || "Student",
    })

    return {
      success: true,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
      },
    }
  } catch (error) {
    console.error("Registration error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Registration failed",
    }
  }
}
