import fs from "node:fs/promises"
import path from "node:path"
import mongoose from "mongoose"

const defaultMongo = "mongodb://admin:admin@localhost:27017/senior_database?authSource=admin"
const mongoUri = (process.env.MONGODB_URI || defaultMongo).replace("mongo:27017", "localhost:27017")
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000"

const mediaDir = path.resolve(process.cwd(), "public/media")

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    description: String,
    type: String,
    url: String,
    fileSize: Number,
    course: mongoose.Schema.Types.ObjectId,
    tags: [String],
    uploadedBy: mongoose.Schema.Types.ObjectId,
    isPublic: Boolean,
    createdAt: Date,
    updatedAt: Date,
  },
  { collection: "resources", strict: false }
)

const userSchema = new mongoose.Schema({}, { collection: "users", strict: false })
const courseSchema = new mongoose.Schema({}, { collection: "courses", strict: false })

const Resource = mongoose.models.ResourceSeed || mongoose.model("ResourceSeed", resourceSchema)
const User = mongoose.models.UserSeed || mongoose.model("UserSeed", userSchema)
const Course = mongoose.models.CourseSeed || mongoose.model("CourseSeed", courseSchema)

const demoResources = [
  {
    title: "Pinyin Chart PDF",
    description: "Complete pinyin chart with all tones and pronunciation guide",
    fileName: "pinyin-chart.pdf",
    tags: ["pinyin", "pronunciation", "reference"],
  },
  {
    title: "HSK 4 Vocabulary List",
    description: "Complete vocabulary list for HSK 4 with examples",
    fileName: "hsk4-vocabulary.pdf",
    tags: ["hsk4", "vocabulary", "study-guide"],
  },
  {
    title: "Chinese Grammar Essentials",
    description: "Grammar essentials quick reference",
    fileName: "grammar-essentials.pdf",
    tags: ["grammar", "reference"],
  },
  {
    title: "Sample Worksheet",
    description: "Sample PDF worksheet for demo",
    fileName: "sample.pdf",
    tags: ["worksheet", "demo"],
  },
]

async function ingestToAiService({ fileName, courseId, resourceId }) {
  const absPath = path.join(mediaDir, fileName)
  const fileBuffer = await fs.readFile(absPath)
  const form = new FormData()
  form.append("file", new Blob([fileBuffer], { type: "application/pdf" }), fileName)
  form.append("courseId", String(courseId))
  form.append("resourceId", String(resourceId))

  const response = await fetch(`${aiServiceUrl}/upload`, {
    method: "POST",
    body: form,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Upload failed (${response.status})`)
  }

  return payload
}

async function run() {
  await mongoose.connect(mongoUri)

  const firstUser = await User.findOne().lean()
  const firstCourse = await Course.findOne().lean()

  const uploaderId = firstUser?._id || new mongoose.Types.ObjectId("000000000000000000000001")
  const courseId = firstCourse?._id || new mongoose.Types.ObjectId("000000000000000000000002")

  console.log("Using uploader:", String(uploaderId))
  console.log("Using course:", String(courseId))

  for (const item of demoResources) {
    const absPath = path.join(mediaDir, item.fileName)
    try {
      await fs.access(absPath)
    } catch {
      console.warn(`Skip ${item.fileName}: file not found at ${absPath}`)
      continue
    }

    const upserted = await Resource.findOneAndUpdate(
      { title: item.title },
      {
        $set: {
          title: item.title,
          description: item.description,
          type: "pdf",
          url: `/media/${item.fileName}`,
          course: courseId,
          uploadedBy: uploaderId,
          tags: item.tags,
          isPublic: true,
          updatedAt: new Date(),
        },
        $setOnInsert: {
          createdAt: new Date(),
        },
      },
      { upsert: true, new: true }
    )

    try {
      const res = await ingestToAiService({
        fileName: item.fileName,
        courseId,
        resourceId: upserted._id,
      })
      if (res?.url) {
        await Resource.updateOne({ _id: upserted._id }, { $set: { url: res.url } })
      }
      console.log(`Seeded + ingested: ${item.title}`)
    } catch (error) {
      console.error(`Ingestion failed for ${item.title}:`, error.message)
    }
  }

  await mongoose.disconnect()
  console.log("Done seeding MVP PDF resources.")
}

run().catch((error) => {
  console.error("Seed script failed:", error)
  process.exit(1)
})
