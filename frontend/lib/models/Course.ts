import mongoose from "mongoose"

export interface ICourse extends mongoose.Document {
  title: string
  description: string
  instructor: mongoose.Types.ObjectId
  thumbnail?: string
  videoUrl?: string
  level: "Beginner" | "Intermediate" | "Advanced"
  price: number
  duration: number
  enrollmentCount: number
  createdAt: Date
  updatedAt: Date
}

const courseSchema = new mongoose.Schema<ICourse>(
  {
    title: {
      type: String,
      required: [true, "Please provide a course title"],
    },
    description: {
      type: String,
      required: [true, "Please provide a course description"],
    },
    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    thumbnail: String,
    videoUrl: String,
    level: {
      type: String,
      enum: ["Beginner", "Intermediate", "Advanced"],
      default: "Beginner",
    },
    price: {
      type: Number,
      default: 0,
    },
    duration: {
      type: Number,
      required: [true, "Please provide course duration in minutes"],
    },
    enrollmentCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true },
)

export default mongoose.models.Course || mongoose.model("Course", courseSchema)
