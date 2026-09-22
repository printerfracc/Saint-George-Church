import {
  PutBucketCorsCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const IMAGE_FOLDER = "saint-george-church";
const LIBRARY_FOLDER = "saint-george-church/library";

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
};

export type DirectUploadTarget = {
  uploadUrl: string;
  publicUrl: string;
  contentType: string;
  fileName: string;
};

let client: S3Client | null = null;
let corsReady: Promise<void> | null = null;

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error("إعدادات التخزين غير مكتملة");
  }
  return value;
}

function r2Client() {
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${requiredEnv("R2_ACCOUNT_ID")}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
        secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
      },
      requestChecksumCalculation: "WHEN_REQUIRED",
      responseChecksumValidation: "WHEN_REQUIRED",
    });
  }

  return client;
}

function bucketName() {
  return requiredEnv("R2_BUCKET_NAME");
}

export function contentTypeForUpload(fileName: string, provided?: string | null) {
  const declared = provided?.trim().toLowerCase();
  if (declared === "image/jpg") {
    return "image/jpeg";
  }

  const extension = fileName.toLowerCase().match(/\.([a-z0-9]+)$/)?.[1];
  const fromName = extension ? CONTENT_TYPES[extension] : undefined;

  if (declared && declared !== "application/octet-stream") {
    return declared;
  }

  return fromName || "application/octet-stream";
}

function safeFileName(fileName: string) {
  const cleaned = fileName
    .trim()
    .replace(/[/\\]/g, "")
    .replace(/[?#%\\<>:"|*]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 140);

  return cleaned || "file";
}

function objectKey(folder: string, fileName: string) {
  return `${folder}/${crypto.randomUUID()}-${safeFileName(fileName)}`;
}

export function r2PublicUrl(key: string) {
  const base = requiredEnv("R2_PUBLIC_DOMAIN").replace(/\/+$/, "");
  const path = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/${path}`;
}

async function ensureUploadCors() {
  if (!corsReady) {
    corsReady = r2Client()
      .send(
        new PutBucketCorsCommand({
          Bucket: bucketName(),
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedOrigins: ["*"],
                AllowedMethods: ["GET", "PUT", "HEAD"],
                AllowedHeaders: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3600,
              },
            ],
          },
        }),
      )
      .then(() => undefined)
      .catch((error: unknown) => {
        corsReady = null;
        const message = error instanceof Error ? error.message : "unknown error";
        console.error(`R2 upload CORS was not updated: ${message}`);
      });
  }

  await corsReady;
}

async function putObject(key: string, body: Buffer, contentType: string) {
  await r2Client().send(
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: key,
      Body: body,
      ContentType: contentType,
    }),
  );

  return r2PublicUrl(key);
}

export async function storeImageFile(file: File) {
  return putObject(
    objectKey(IMAGE_FOLDER, file.name || "image"),
    Buffer.from(await file.arrayBuffer()),
    contentTypeForUpload(file.name, file.type),
  );
}

export async function storeLibraryFile(file: File) {
  return putObject(
    objectKey(LIBRARY_FOLDER, file.name || "file"),
    Buffer.from(await file.arrayBuffer()),
    contentTypeForUpload(file.name, file.type),
  );
}

export async function createLibraryUploadTarget(
  fileName: string,
  providedType?: string | null,
): Promise<DirectUploadTarget> {
  const safeName = safeFileName(fileName);
  const contentType = contentTypeForUpload(safeName, providedType);
  const key = objectKey(LIBRARY_FOLDER, safeName);

  await ensureUploadCors();

  const uploadUrl = await getSignedUrl(
    r2Client(),
    new PutObjectCommand({
      Bucket: bucketName(),
      Key: key,
      ContentType: contentType,
    }),
    { expiresIn: 10 * 60 },
  );

  return {
    uploadUrl,
    publicUrl: r2PublicUrl(key),
    contentType,
    fileName: safeName,
  };
}
