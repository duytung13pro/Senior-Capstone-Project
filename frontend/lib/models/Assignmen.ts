import mongoose from "mongoose"

export interface IAssignment extends mongoose.Document {
  course: mongoose.Types.ObjectId
  title: string
  description: string
  type: "essay" | "quiz" | "project" | "homework"
  dueDate: Date
  totalPoints: number
  attachments: string[]
  createdBy: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const assignmentSchema = new mongoose.Schema<IAssignment>(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide an assignment title"],
    },
    description: {
      type: String,
      required: [true, "Please provide an assignment description"],
    },
    type: {
      type: String,
      enum: ["essay", "quiz", "project", "homework"],
      default: "homework",
    },
    dueDate: {
      type: Date,
      required: [true, "Please provide a due date"],
    },
    totalPoints: {
      type: Number,
      required: [true, "Please provide total points"],
      default: 100,
    },
    attachments: [String],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
)

export default mongoose.models.Assignment || mongoose.model("Assignment", assignmentSchema)
