import fs from "node:fs/promises"
import path from "node:path"
import mongoose from "mongoose"

const defaultMongo = "mongodb://admin:admin@localhost:27017/senior_database?authSource=admin"
const mongoUri = process.env.MONGODB_URI || defaultMongo
const aiServiceUrl = process.env.AI_SERVICE_URL || "http://localhost:8000"
const qdrantUrl = process.env.QDRANT_URL || "http://localhost:6333"
const collection = process.env.QDRANT_COLLECTION_NAME || "course_materials"

const resourceSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    url: String,
    course: mongoose.Schema.Types.ObjectId,
    isPublic: Boolean,
  },
  { collection: "resources", strict: false }
)

const Resource = mongoose.models.ResourceReingest || mongoose.model("ResourceReingest", resourceSchema)

const mediaRoot = path.resolve(process.cwd(), "public")

async function qdrantCollectionExists() {
  try {
    const res = await fetch(`${qdrantUrl}/collections/${collection}/exists`)
    const json = await res.json()
    return !!json?.result?.exists
  } catch {
    return false
  }
}

async function getResourceVectorCount(resourceId) {
  try {
    const res = await fetch(`${qdrantUrl}/collections/${collection}/points/count`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filter: {
          must: [{ key: "resource_id", match: { value: String(resourceId) } }],
        },
      }),
    })
    const json = await res.json()
    return Number(json?.result?.count || 0)
  } catch {
    return 0
  }
}

async function ingestToAiService(resource, absPath) {
  const fileBuffer = await fs.readFile(absPath)
  const fileName = path.basename(absPath)
  const form = new FormData()
  form.append("file", new Blob([fileBuffer], { type: "application/pdf" }), fileName)
  form.append("courseId", String(resource.course))
  form.append("resourceId", String(resource._id))

  const response = await fetch(`${aiServiceUrl}/upload`, {
    method: "POST",
    body: form,
  })

  const payload = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(payload?.detail || payload?.message || `Upload failed (${response.status})`)
  }
}

async function main() {
  await mongoose.connect(mongoUri)

  const resources = await Resource.find({
    isPublic: true,
    type: { $in: ["pdf", "document", "PDF", "DOCUMENT"] },
    url: { $regex: "^/media/" },
  })
    .select("_id title type url course")
    .lean()

  const collectionExists = await qdrantCollectionExists()
  console.log(`Qdrant collection '${collection}' exists: ${collectionExists}`)
  console.log(`Resources to process: ${resources.length}`)

  let ingested = 0
  let skipped = 0
  let failed = 0

  for (const resource of resources) {
    try {
      const rel = String(resource.url || "")
      const abs = path.join(mediaRoot, rel.replace(/^\//, ""))

      await fs.access(abs)

      if (collectionExists) {
        const existing = await getResourceVectorCount(resource._id)
        if (existing > 0) {
          skipped += 1
          console.log(`SKIP  ${resource.title} (${resource._id}) - already indexed (${existing} vectors)`)
          continue
        }
      }

      await ingestToAiService(resource, abs)
      ingested += 1
      console.log(`OK    ${resource.title} (${resource._id})`)
    } catch (err) {
      failed += 1
      console.error(`FAIL  ${resource.title} (${resource._id}): ${err.message}`)
    }
  }

  await mongoose.disconnect()

  console.log("\nDone")
  console.log(`Ingested: ${ingested}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Failed: ${failed}`)

  if (failed > 0) {
    process.exitCode = 1
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
