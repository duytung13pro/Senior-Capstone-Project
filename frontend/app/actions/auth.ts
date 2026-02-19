"use server"

import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"
import { cookies } from "next/headers"

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

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set("userId", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    cookieStore.set("userRole", user.role.toLowerCase(), {
      httpOnly: false, // Allow client-side access for routing
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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

export async function loginUser(email: string, password: string) {
  try {
    await dbConnect()

    // Find user with password field
    const user = await User.findOne({ email }).select("+password")
    if (!user) {
      return { success: false, message: "Invalid email or password" }
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password)
    if (!isValidPassword) {
      return { success: false, message: "Invalid email or password" }
    }

    // Set session cookies
    const cookieStore = await cookies()
    cookieStore.set("userId", user._id.toString(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })
    cookieStore.set("userRole", user.role.toLowerCase(), {
      httpOnly: false, // Allow client-side access for routing
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7,
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
    console.error("Login error:", error)
    return {
      success: false,
      message: error instanceof Error ? error.message : "Login failed",
    }
  }
}

export async function logoutUser() {
  try {
    const cookieStore = await cookies()
    cookieStore.delete("userId")
    cookieStore.delete("userRole")
    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: false, message: "Logout failed" }
  }
}

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies()
    const userId = cookieStore.get("userId")?.value

    if (!userId) {
      return null
    }

    await dbConnect()
    const user = await User.findById(userId).select("-password")

    if (!user) {
      return null
    }

    return {
      id: user._id.toString(),
      email: user.email,
      name: user.name,
      role: user.role,
      avatar: user.avatar,
      bio: user.bio,
    }
  } catch (error) {
    console.error("Get current user error:", error)
    return null
  }
}
