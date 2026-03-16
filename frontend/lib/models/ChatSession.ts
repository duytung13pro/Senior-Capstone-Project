import mongoose from "mongoose"

export interface IChatMessage {
  role: "user" | "assistant" | "system"
  content: string
  createdAt: Date
}

export interface IChatSession extends mongoose.Document {
  student: mongoose.Types.ObjectId
  course?: mongoose.Types.ObjectId
  title: string
  messages: IChatMessage[]
  resourceIds: mongoose.Types.ObjectId[]
  updatedAt: Date
  createdAt: Date
}

const messageSchema = new mongoose.Schema<IChatMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
)

const chatSessionSchema = new mongoose.Schema<IChatSession>(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    title: {
      type: String,
      default: "Cuộc trò chuyện mới",
    },
    messages: {
      type: [messageSchema],
      default: [],
    },
    resourceIds: {
      type: [mongoose.Schema.Types.ObjectId],
      ref: "Resource",
      default: [],
    },
  },
  { timestamps: true }
)

chatSessionSchema.index({ student: 1, updatedAt: -1 })

export default mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema)
