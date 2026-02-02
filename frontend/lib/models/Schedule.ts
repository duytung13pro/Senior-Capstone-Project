import mongoose from "mongoose"

export interface IScheduleEvent extends mongoose.Document {
  title: string
  description?: string
  type: "class" | "assignment" | "exam" | "office_hours" | "event"
  course?: mongoose.Types.ObjectId
  assignment?: mongoose.Types.ObjectId
  startTime: Date
  endTime: Date
  location?: string
  recurring: boolean
  recurrenceRule?: string
  color?: string
  createdBy: mongoose.Types.ObjectId
  participants: mongoose.Types.ObjectId[]
  reminders: {
    time: number
    type: "email" | "notification"
  }[]
}

const scheduleEventSchema = new mongoose.Schema<IScheduleEvent>(
  {
    title: {
      type: String,
      required: [true, "Please provide an event title"],
    },
    description: String,
    type: {
      type: String,
      enum: ["class", "assignment", "exam", "office_hours", "event"],
      default: "class",
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Assignment",
    },
    startTime: {
      type: Date,
      required: [true, "Please provide a start time"],
    },
    endTime: {
      type: Date,
      required: [true, "Please provide an end time"],
    },
    location: String,
    recurring: {
      type: Boolean,
      default: false,
    },
    recurrenceRule: String,
    color: {
      type: String,
      default: "#3b82f6",
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    reminders: [
      {
        time: Number,
        type: {
          type: String,
          enum: ["email", "notification"],
          default: "notification",
        },
      },
    ],
  },
  { timestamps: true }
)

// Index for efficient schedule queries
scheduleEventSchema.index({ startTime: 1, endTime: 1 })
scheduleEventSchema.index({ participants: 1, startTime: 1 })

export default mongoose.models.ScheduleEvent || mongoose.model("ScheduleEvent", scheduleEventSchema)
