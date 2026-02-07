import mongoose from "mongoose"

export interface IResource extends mongoose.Document {
  title: string
  description?: string
  type: "pdf" | "video" | "link" | "document" | "image" | "other"
  url: string
  fileSize?: number
  course: mongoose.Types.ObjectId
  module?: mongoose.Types.ObjectId
  tags: string[]
  uploadedBy: mongoose.Types.ObjectId
  downloadCount: number
  isPublic: boolean
  createdAt: Date
  updatedAt: Date
}

const resourceSchema = new mongoose.Schema<IResource>(
  {
    title: {
      type: String,
      required: [true, "Please provide a resource title"],
    },
    description: String,
    type: {
      type: String,
      enum: ["pdf", "video", "link", "document", "image", "other"],
      default: "document",
    },
    url: {
      type: String,
      required: [true, "Please provide a resource URL"],
    },
    fileSize: Number,
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Module",
    },
    tags: [String],
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    downloadCount: {
      type: Number,
      default: 0,
    },
    isPublic: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
)

// Index for efficient resource queries
resourceSchema.index({ course: 1, type: 1 })
resourceSchema.index({ tags: 1 })

export default mongoose.models.Resource || mongoose.model("Resource", resourceSchema)
