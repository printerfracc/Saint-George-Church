import dotenv from "dotenv";
import { DeleteObjectCommand, S3Client } from "@aws-sdk/client-s3";

dotenv.config();

const IMAGE_TYPE = "IMAGE";

const BLOCKED_KEY_PREFIXES = [
  "saint-george-church/khedma-logos",
  "saint-george-church/library",
  "saint-george-church/library-tmp",
];

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function r2Client() {
  return new S3Client({
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

function publicBases() {
  const bases: URL[] = [];

  for (const value of [process.env.R2_PUBLIC_URL, process.env.R2_PUBLIC_DOMAIN]) {
    const trimmed = value?.trim();
    if (!trimmed) {
      continue;
    }

    const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
    bases.push(new URL(withProtocol));
  }

  if (bases.length === 0) {
    throw new Error("Missing R2_PUBLIC_URL or R2_PUBLIC_DOMAIN");
  }

  return bases;
}

function isBlockedKey(key: string) {
  return BLOCKED_KEY_PREFIXES.some(
    (prefix) => key === prefix || key.startsWith(`${prefix}/`),
  );
}

function objectKeyFromUrl(url: string, bases: URL[]) {
  const parsed = new URL(url.trim());
  const base = bases.find((entry) => entry.host.toLowerCase() === parsed.host.toLowerCase());

  if (parsed.protocol !== "https:" || !base) {
    throw new Error("URL is not on the R2 public host");
  }

  const basePath = base.pathname.replace(/^\/+|\/+$/g, "");
  let pathname = parsed.pathname.replace(/^\/+/, "");

  if (basePath) {
    if (pathname !== basePath && !pathname.startsWith(`${basePath}/`)) {
      throw new Error("URL is outside the R2 public path");
    }
    pathname = pathname.slice(basePath.length).replace(/^\/+/, "");
  }

  const key = pathname
    .split("/")
    .map((segment) => decodeURIComponent(segment))
    .join("/");

  if (!key || key.endsWith("/") || key.split("/").some((segment) => !segment || segment === "." || segment === "..")) {
    throw new Error("URL does not contain an object key");
  }

  if (isBlockedKey(key)) {
    throw new Error("Object key belongs to protected website media");
  }

  return key;
}

function isMissingObject(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = "name" in error ? String(error.name) : "";
  return name === "NoSuchKey" || name === "NotFound";
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : "unknown error";
}

async function main() {
  const bucket = requiredEnv("R2_BUCKET_NAME");
  const bases = publicBases();
  const client = r2Client();

  try {
    const { prisma } = await import("./lib/prisma");

    try {
      const images = await prisma.galleryMedia.findMany({
        where: { type: IMAGE_TYPE },
        select: { id: true, url: true },
      });

      console.log(`Found ${images.length} GalleryMedia image records.`);

      let removed = 0;
      let missing = 0;
      let failed = 0;
      let skipped = 0;

      for (const image of images) {
        let key: string;

        try {
          key = objectKeyFromUrl(image.url, bases);
        } catch (error) {
          skipped += 1;
          console.warn(`Skipped ${image.id}: ${errorText(error)}`);
          continue;
        }

        try {
          await client.send(
            new DeleteObjectCommand({
              Bucket: bucket,
              Key: key,
            }),
          );
          removed += 1;
          console.log(`Deleted R2 object ${key}`);
        } catch (error) {
          if (isMissingObject(error)) {
            missing += 1;
            console.warn(`R2 object already missing: ${key}`);
            continue;
          }

          failed += 1;
          console.warn(`R2 delete failed for ${key}: ${errorText(error)}`);
        }
      }

      const deleted = await prisma.galleryMedia.deleteMany({
        where: { type: IMAGE_TYPE },
      });

      console.log(
        `R2 summary: removed ${removed}, already missing ${missing}, failed ${failed}, skipped ${skipped}.`,
      );
      console.log(`Deleted ${deleted.count} gallery photos.`);
    } finally {
      await prisma.$disconnect();
    }
  } finally {
    client.destroy();
  }
}

main().catch((error: unknown) => {
  console.error(errorText(error));
  process.exitCode = 1;
});
