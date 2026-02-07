import mongoose from "mongoose"

export interface INotification extends mongoose.Document {
  user: mongoose.Types.ObjectId
  title: string
  message: string
  type: "assignment" | "grade" | "announcement" | "message" | "reminder" | "system"
  read: boolean
  link?: string
  relatedId?: mongoose.Types.ObjectId
  relatedModel?: string
  createdAt: Date
}

const notificationSchema = new mongoose.Schema<INotification>(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a notification title"],
    },
    message: {
      type: String,
      required: [true, "Please provide a notification message"],
    },
    type: {
      type: String,
      enum: ["assignment", "grade", "announcement", "message", "reminder", "system"],
      default: "system",
    },
    read: {
      type: Boolean,
      default: false,
    },
    link: String,
    relatedId: mongoose.Schema.Types.ObjectId,
    relatedModel: String,
  },
  { timestamps: true }
)

// Index for efficient notification queries
notificationSchema.index({ user: 1, read: 1, createdAt: -1 })

export default mongoose.models.Notification || mongoose.model("Notification", notificationSchema)
