import mongoose from "mongoose"

export interface IUser extends mongoose.Document {
  email: string
  name: string
  password: string
  role: "Student" | "Instructor" | "Admin"
  avatar?: string
  bio?: string
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
      enum: ["Student", "Instructor", "Admin"],
      default: "Student",
    },
    avatar: String,
    bio: String,
  },
  { timestamps: true },
)

export default mongoose.models.User || mongoose.model("User", userSchema)
