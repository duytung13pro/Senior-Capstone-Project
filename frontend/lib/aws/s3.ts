import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const s3Client = new S3Client({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
})

export async function getPresignedUploadUrl(
  fileName: string,
  fileType: string,
  folderPath = "uploads",
): Promise<string> {
  const key = `${folderPath}/${Date.now()}-${fileName}`

  const command = new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
    ContentType: fileType,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return url
}

export async function getPresignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET_NAME!,
    Key: key,
  })

  const url = await getSignedUrl(s3Client, command, { expiresIn: 3600 })
  return url
}

export function getS3FileUrl(key: string): string {
  return `https://${process.env.AWS_S3_BUCKET_NAME}.s3.${process.env.AWS_REGION || "us-east-1"}.amazonaws.com/${key}`
}
