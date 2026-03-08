import mongoose from "mongoose"

export interface IUser extends mongoose.Document {
  email: string
  name: string
  password: string
  role: "Student" | "Instructor" | "Teacher" | "Admin" | "Center"
  avatar?: string
  bio?: string
  phone?: string
  location?: string
  studentId?: string
  teacherId?: string
  notifications: {
    emailAssignments: boolean
    emailGrades: boolean
    emailMessages: boolean
    emailAnnouncements: boolean
    pushAssignments: boolean
    pushGrades: boolean
    pushMessages: boolean
    pushReminders: boolean
  }
  preferences: {
    language: "en" | "vi" | "zh"
    timezone: string
    theme: "light" | "dark" | "system"
    accessibility: {
      largeText: boolean
      highContrast: boolean
      reducedMotion: boolean
    }
  }
  createdAt: Date
  updatedAt: Date
}

const userSchema = new mongoose.Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Please provide an email"],
      unique: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, "Please provide a valid email"],
    },
    name: {
      type: String,
      required: [true, "Please provide a name"],
    },
    password: {
      type: String,
      required: [true, "Please provide a password"],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ["Student", "Instructor", "Teacher", "Admin", "Center"],
      default: "Student",
    },
    avatar: String,
    bio: String,
    phone: String,
    location: String,
    studentId: String,
    teacherId: String,
    notifications: {
      emailAssignments: { type: Boolean, default: true },
      emailGrades: { type: Boolean, default: true },
      emailMessages: { type: Boolean, default: true },
      emailAnnouncements: { type: Boolean, default: true },
      pushAssignments: { type: Boolean, default: true },
      pushGrades: { type: Boolean, default: true },
      pushMessages: { type: Boolean, default: true },
      pushReminders: { type: Boolean, default: true },
    },
    preferences: {
      language: { type: String, enum: ["en", "vi", "zh"], default: "en" },
      timezone: { type: String, default: "UTC" },
      theme: { type: String, enum: ["light", "dark", "system"], default: "system" },
      accessibility: {
        largeText: { type: Boolean, default: false },
        highContrast: { type: Boolean, default: false },
        reducedMotion: { type: Boolean, default: false },
      },
    },
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model("User", userSchema)
