import mongoose from "mongoose"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const defaultUri = "mongodb://admin:admin@localhost:27017/senior_database?authSource=admin"
const rawUri = process.env.MONGODB_URI || defaultUri
const uri = rawUri.replace("mongo:27017", "localhost:27017")

const allowedExtensions = [".pdf", ".doc", ".docx", ".ppt", ".pptx"]

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    url: String,
    isPublic: Boolean,
  },
  { collection: "resources" }
)

const Resource = mongoose.models.Resource || mongoose.model("Resource", resourceSchema)

const extFromUrl = (url) => {
  if (!url) return ""
  const lower = url.toLowerCase()
  const match = allowedExtensions.find((ext) => lower.endsWith(ext))
  return match || ""
}

const typeFromExt = (ext) => (ext === ".pdf" ? "pdf" : "document")

async function cleanup() {
  await mongoose.connect(uri)

  const legacy = await Resource.find({ type: { $nin: ["pdf", "document"] } }).lean()
  const convertible = []
  const deletable = []

  for (const r of legacy) {
    const ext = extFromUrl(r.url)
    if (ext) {
      convertible.push({ id: r._id, type: typeFromExt(ext) })
    } else {
      deletable.push(r._id)
    }
  }

  let converted = 0
  for (const item of convertible) {
    await Resource.updateOne({ _id: item.id }, { $set: { type: item.type } })
    converted += 1
  }

  let deleted = 0
  if (deletable.length > 0) {
    const res = await Resource.deleteMany({ _id: { $in: deletable } })
    deleted = res.deletedCount || 0
  }

  console.log(`Legacy resources found: ${legacy.length}`)
  console.log(`Converted to document/pdf: ${converted}`)
  console.log(`Deleted (non-document URLs): ${deleted}`)

  await mongoose.disconnect()
}

cleanup().catch((err) => {
  console.error("Cleanup failed:", err)
  process.exit(1)
})
