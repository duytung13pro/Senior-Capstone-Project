import mongoose from "mongoose"

export interface IEnrollment extends mongoose.Document {
  student: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  progress: number
  completedModules: mongoose.Types.ObjectId[]
  enrolledAt: Date
  completedAt?: Date
}

const enrollmentSchema = new mongoose.Schema<IEnrollment>(
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
    progress: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    completedModules: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Module",
      },
    ],
    enrolledAt: {
      type: Date,
      default: Date.now,
    },
    completedAt: Date,
  },
  { timestamps: true },
)

export default mongoose.models.Enrollment || mongoose.model("Enrollment", enrollmentSchema)
