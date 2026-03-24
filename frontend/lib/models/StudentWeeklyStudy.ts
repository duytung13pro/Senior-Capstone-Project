import mongoose from "mongoose"

export interface IStudentWeeklyStudy extends mongoose.Document {
  student: mongoose.Types.ObjectId
  weekStart: Date
  trackedMinutes: number
  lastHeartbeatAt?: Date
  createdAt: Date
  updatedAt: Date
}

const studentWeeklyStudySchema = new mongoose.Schema<IStudentWeeklyStudy>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    weekStart: {
      type: Date,
      required: true,
      index: true,
    },
    trackedMinutes: {
      type: Number,
      default: 0,
      min: 0,
    },
    lastHeartbeatAt: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true },
)

studentWeeklyStudySchema.index({ student: 1, weekStart: 1 }, { unique: true })

export default mongoose.models.StudentWeeklyStudy ||
  mongoose.model("StudentWeeklyStudy", studentWeeklyStudySchema)
