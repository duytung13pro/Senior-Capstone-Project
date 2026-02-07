import mongoose from "mongoose"

export interface IStudyAnalytics extends mongoose.Document {
  student: mongoose.Types.ObjectId
  course: mongoose.Types.ObjectId
  date: Date
  studyMinutes: number
  modulesCompleted: number
  quizzesTaken: number
  averageQuizScore: number
  assignmentsSubmitted: number
  resourcesViewed: number
}

const studyAnalyticsSchema = new mongoose.Schema<IStudyAnalytics>(
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
    date: {
      type: Date,
      required: true,
    },
    studyMinutes: {
      type: Number,
      default: 0,
    },
    modulesCompleted: {
      type: Number,
      default: 0,
    },
    quizzesTaken: {
      type: Number,
      default: 0,
    },
    averageQuizScore: {
      type: Number,
      default: 0,
    },
    assignmentsSubmitted: {
      type: Number,
      default: 0,
    },
    resourcesViewed: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
)

// Compound index for unique analytics per student per course per day
studyAnalyticsSchema.index({ student: 1, course: 1, date: 1 }, { unique: true })

export default mongoose.models.StudyAnalytics || mongoose.model("StudyAnalytics", studyAnalyticsSchema)
