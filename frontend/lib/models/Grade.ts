import mongoose from "mongoose"

export interface IGrade extends mongoose.Document {
  student: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  assignment: mongoose.Types.ObjectId
  score: number
  maxScore: number
  percentage: number
  letterGrade: string
  weight: number
  category: "assignment" | "quiz" | "exam" | "project" | "participation"
  feedback?: string
  gradedBy: mongoose.Types.ObjectId
  gradedAt: Date
}

const gradeSchema = new mongoose.Schema<IGrade>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
      required: true,
    },
    score: {
      type: Number,
      required: true,
      min: 0,
    },
    maxScore: {
      type: Number,
      required: true,
      min: 1,
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    letterGrade: {
      type: String,
      enum: ["A+", "A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D+", "D", "D-", "F"],
    },
    weight: {
      type: Number,
      default: 1,
      min: 0,
    },
    category: {
      type: String,
      enum: ["assignment", "quiz", "exam", "project", "participation"],
      default: "assignment",
    },
    feedback: String,
    gradedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    gradedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
)

// Compound index for unique grade per student per assignment
gradeSchema.index({ student: 1, assignment: 1 }, { unique: true })

export default mongoose.models.Grade || mongoose.model("Grade", gradeSchema)
