import mongoose from "mongoose"

export interface IMessage extends mongoose.Document {
  sender: mongoose.Types.ObjectId
  recipient: mongoose.Types.ObjectId
  subject: string
  content: string
  course?: mongoose.Types.ObjectId
  read: boolean
  starred: boolean
  archived: boolean
  attachments: string[]
  parentMessage?: mongoose.Types.ObjectId
  createdAt: Date
  updatedAt: Date
}

const messageSchema = new mongoose.Schema<IMessage>(
  {
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subject: {
      type: String,
      required: [true, "Please provide a subject"],
    },
    content: {
      type: String,
      required: [true, "Please provide message content"],
    },
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
    },
    read: {
      type: Boolean,
      default: false,
    },
    starred: {
      type: Boolean,
      default: false,
    },
    archived: {
      type: Boolean,
      default: false,
    },
    attachments: [String],
    parentMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  { timestamps: true }
)

// Index for efficient message queries
messageSchema.index({ recipient: 1, read: 1, createdAt: -1 })
messageSchema.index({ sender: 1, createdAt: -1 })

export default mongoose.models.Message || mongoose.model("Message", messageSchema)
