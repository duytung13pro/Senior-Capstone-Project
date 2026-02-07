import mongoose from "mongoose"

export interface IModule extends mongoose.Document {
  course: mongoose.Types.ObjectId
  title: string
  description: string
  videoUrl?: string
  duration: number
  order: number
  createdAt: Date
  updatedAt: Date
}

const moduleSchema = new mongoose.Schema<IModule>(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
    },
    title: {
      type: String,
      required: [true, "Please provide a module title"],
    },
    description: String,
    videoUrl: String,
    duration: {
      type: Number,
      required: [true, "Please provide module duration"],
    },
    order: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true },
)

export default mongoose.models.Module || mongoose.model("Module", moduleSchema)
