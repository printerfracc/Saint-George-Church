import axios from "axios";
import dotenv from "dotenv";
import { v2 as cloudinary } from "cloudinary";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import type { PrismaClient } from "@prisma/client";

dotenv.config();

type CloudinaryResource = {
  public_id: string;
  format?: string;
  secure_url: string;
  url?: string;
  resource_type: string;
  type?: string;
};

type CloudinaryPage = {
  resources?: CloudinaryResource[];
  next_cursor?: string;
};

type ModelName =
  | "priest"
  | "sermon"
  | "service"
  | "newsEvent"
  | "dynamicContent"
  | "relic"
  | "churchActivity"
  | "liturgyEntry"
  | "mediaCollection"
  | "mediaItem";

type TrackedRow = {
  model: ModelName;
  id: string;
  current: Record<string, string | null>;
  saved: Record<string, string | null>;
};

type UrlFieldKind = "string" | "json";

type UrlField = {
  name: string;
  kind: UrlFieldKind;
};

type RowDelegate = {
  findMany: (args: {
    where?: { OR: Array<Record<string, { contains: string }>> };
    select: Record<string, boolean>;
  }) => Promise<Array<{ id: string } & Record<string, unknown>>>;
  update: (args: {
    where: { id: string };
    data: Record<string, string | null>;
  }) => Promise<unknown>;
};

const RESOURCE_TYPES = ["image", "video", "raw"] as const;
const DELIVERY_TYPES = ["upload", "private", "authenticated"] as const;

const URL_FIELDS: Record<ModelName, readonly UrlField[]> = {
  priest: [
    { name: "cloudinaryImageUrl", kind: "string" },
    { name: "bio", kind: "string" },
  ],
  sermon: [{ name: "mediaUrl", kind: "string" }],
  service: [
    { name: "schedule", kind: "string" },
    { name: "description", kind: "string" },
  ],
  newsEvent: [
    { name: "imageUrl", kind: "string" },
    { name: "description", kind: "string" },
  ],
  dynamicContent: [
    { name: "imageUrl", kind: "string" },
    { name: "content", kind: "string" },
  ],
  relic: [
    { name: "imageUrl", kind: "string" },
    { name: "description", kind: "string" },
  ],
  churchActivity: [
    { name: "imageUrl", kind: "string" },
    { name: "link", kind: "string" },
    { name: "description", kind: "string" },
  ],
  liturgyEntry: [
    { name: "imageUrl", kind: "string" },
    { name: "description", kind: "string" },
    { name: "detail", kind: "string" },
  ],
  mediaCollection: [
    { name: "imageUrl", kind: "string" },
    { name: "description", kind: "string" },
  ],
  mediaItem: [
    { name: "fileUrl", kind: "string" },
    { name: "thumbnail", kind: "string" },
    { name: "link", kind: "string" },
  ],
};

const CONTENT_TYPES: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  gif: "image/gif",
  webp: "image/webp",
  svg: "image/svg+xml",
  bmp: "image/bmp",
  tif: "image/tiff",
  tiff: "image/tiff",
  heic: "image/heic",
  pdf: "application/pdf",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  mp4: "video/mp4",
  webm: "video/webm",
  mov: "video/quicktime",
  mp3: "audio/mpeg",
  wav: "audio/wav",
  m4a: "audio/mp4",
  ogg: "audio/ogg",
};

function requiredEnv(name: string) {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }
  return value;
}

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    return status ? `HTTP ${status} ${error.message}` : error.message;
  }
  return error instanceof Error ? error.message : String(error);
}

function contentTypeFor(resource: CloudinaryResource) {
  const format = resource.format?.toLowerCase();
  if (format && CONTENT_TYPES[format]) {
    return CONTENT_TYPES[format];
  }
  if (resource.resource_type === "image" && format) {
    return `image/${format === "jpg" ? "jpeg" : format}`;
  }
  if (resource.resource_type === "video" && format) {
    return `video/${format}`;
  }
  return "application/octet-stream";
}

function objectKey(resource: CloudinaryResource) {
  const segments = resource.public_id
    .split("/")
    .map((segment) => segment.trim().replace(/[?#%\\<>:"|*]/g, "-").replace(/\s+/g, "-"))
    .filter(Boolean);
  const safeId = segments.join("/");
  const format = resource.format?.replace(/^\./, "").trim();

  if (!format || safeId.toLowerCase().endsWith(`.${format.toLowerCase()}`)) {
    return safeId;
  }

  return `${safeId}.${format}`;
}

function publicObjectUrl(key: string) {
  const base = requiredEnv("R2_PUBLIC_DOMAIN").replace(/\/+$/, "");
  const path = key
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
  return `${base}/${path}`;
}

function isTransformSegment(segment: string) {
  if (segment.startsWith("s--") && segment.endsWith("--")) {
    return true;
  }
  return /^(?:[a-z]{1,3}_|e_|fl_|pg_|t_)/.test(segment) || segment.includes(",");
}

function cloudinaryPublicId(fileUrl: string) {
  let url: URL;
  try {
    url = new URL(fileUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "res.cloudinary.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);
  if (parts.length < 4) {
    return null;
  }

  const identity = parts.slice(3).filter((segment) => {
    if (/^v\d+$/.test(segment)) {
      return false;
    }
    return !isTransformSegment(segment);
  });

  if (identity.length === 0) {
    return null;
  }

  const last = identity[identity.length - 1];
  const dot = last.lastIndexOf(".");
  if (dot <= 0) {
    return { publicId: identity.join("/"), format: null as string | null };
  }

  return {
    publicId: [...identity.slice(0, -1), last.slice(0, dot)].join("/"),
    format: last.slice(dot + 1),
  };
}

function urlMatchesResource(fileUrl: string, resource: CloudinaryResource) {
  const parsed = cloudinaryPublicId(fileUrl);
  if (!parsed) {
    return false;
  }
  if (parsed.publicId === resource.public_id) {
    return true;
  }
  return Boolean(
    parsed.format && `${parsed.publicId}.${parsed.format}` === resource.public_id,
  );
}

function rewriteStoredValue(
  value: string | null,
  resource: CloudinaryResource,
  newUrl: string,
) {
  if (!value || !value.includes("cloudinary.com")) {
    return value;
  }

  let next = value.split(resource.secure_url).join(newUrl);
  if (resource.url) {
    next = next.split(resource.url).join(newUrl);
  }

  next = next.replace(/https?:\/\/res\.cloudinary\.com\/[^\s"'<>\\]+/gi, (match) =>
    urlMatchesResource(match, resource) ? newUrl : match,
  );

  return next;
}

async function listAssets() {
  const assets: CloudinaryResource[] = [];
  const seen = new Set<string>();

  for (const resourceType of RESOURCE_TYPES) {
    for (const type of DELIVERY_TYPES) {
      let nextCursor: string | undefined;
      let count = 0;

      try {
        do {
          const page = (await cloudinary.api.resources({
            resource_type: resourceType,
            type,
            max_results: 500,
            ...(nextCursor ? { next_cursor: nextCursor } : {}),
          })) as CloudinaryPage;

          for (const resource of page.resources ?? []) {
            if (!resource.secure_url || !resource.public_id) {
              continue;
            }
            const id = `${resource.resource_type}:${resource.type ?? type}:${resource.public_id}`;
            if (seen.has(id)) {
              continue;
            }
            seen.add(id);
            assets.push({ ...resource, type: resource.type ?? type });
            count += 1;
          }

          nextCursor = page.next_cursor;
        } while (nextCursor);

        console.log(`Cloudinary ${resourceType}/${type}: ${count} asset(s)`);
      } catch (error) {
        console.warn(
          `Skipped Cloudinary ${resourceType}/${type}: ${errorMessage(error)}`,
        );
      }
    }
  }

  return assets.sort((left, right) => right.public_id.length - left.public_id.length);
}

async function downloadAsset(resource: CloudinaryResource) {
  const response = await axios.get<ArrayBuffer>(resource.secure_url, {
    responseType: "arraybuffer",
    timeout: 120_000,
    maxContentLength: Infinity,
    maxBodyLength: Infinity,
  });
  return Buffer.from(response.data);
}

async function downloadWithSignedFallback(resource: CloudinaryResource) {
  try {
    return await downloadAsset(resource);
  } catch (error) {
    const status = axios.isAxiosError(error) ? error.response?.status : undefined;
    if (status !== 401 && status !== 403) {
      throw error;
    }

    const signedUrl = cloudinary.url(resource.public_id, {
      resource_type: resource.resource_type,
      type: resource.type || "upload",
      format: resource.format,
      sign_url: true,
      secure: true,
    });
    const response = await axios.get<ArrayBuffer>(signedUrl, {
      responseType: "arraybuffer",
      timeout: 120_000,
      maxContentLength: Infinity,
      maxBodyLength: Infinity,
    });
    return Buffer.from(response.data);
  }
}

function delegate(client: PrismaClient, model: ModelName) {
  return client[model] as unknown as RowDelegate;
}

function fieldsOfKind(model: ModelName, kind: UrlFieldKind) {
  return URL_FIELDS[model].filter((field) => field.kind === kind).map((field) => field.name);
}

function textValue(value: unknown) {
  if (typeof value === "string") {
    return value;
  }
  if (value == null) {
    return null;
  }
  return JSON.stringify(value);
}

function rememberRow(
  rows: TrackedRow[],
  model: ModelName,
  id: string,
  field: string,
  value: string | null,
) {
  const existing = rows.find((row) => row.model === model && row.id === id);
  if (existing) {
    existing.current[field] = value;
    existing.saved[field] = value;
    return;
  }

  rows.push({
    model,
    id,
    current: { [field]: value },
    saved: { [field]: value },
  });
}

async function loadStringFields(client: PrismaClient, model: ModelName, rows: TrackedRow[]) {
  const fields = fieldsOfKind(model, "string");
  if (fields.length === 0) {
    return;
  }

  const records = await delegate(client, model).findMany({
    where: {
      OR: fields.map((field) => ({ [field]: { contains: "cloudinary.com" } })),
    },
    select: {
      id: true,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    },
  });

  for (const record of records) {
    for (const field of fields) {
      const value = textValue(record[field]);
      if (value?.includes("cloudinary.com")) {
        rememberRow(rows, model, record.id, field, value);
      }
    }
  }
}

async function loadJsonFields(client: PrismaClient, model: ModelName, rows: TrackedRow[]) {
  const fields = fieldsOfKind(model, "json");
  if (fields.length === 0) {
    return;
  }

  const records = await delegate(client, model).findMany({
    select: {
      id: true,
      ...Object.fromEntries(fields.map((field) => [field, true])),
    },
  });

  for (const record of records) {
    for (const field of fields) {
      const value = textValue(record[field]);
      if (value?.includes("cloudinary.com")) {
        rememberRow(rows, model, record.id, field, value);
      }
    }
  }
}

async function loadServiceImageUrls(client: PrismaClient, rows: TrackedRow[]) {
  const records = await client.$queryRaw<Array<{ id: string; imageUrls: string | null }>>`
    SELECT id, imageUrls
    FROM Service
    WHERE imageUrls LIKE ${"%cloudinary.com%"}
  `;

  for (const record of records) {
    const value = textValue(record.imageUrls);
    if (value?.includes("cloudinary.com")) {
      rememberRow(rows, "service", record.id, "imageUrls", value);
    }
  }
}

async function loadCloudinaryRows(client: PrismaClient) {
  const rows: TrackedRow[] = [];

  for (const model of Object.keys(URL_FIELDS) as ModelName[]) {
    try {
      await loadStringFields(client, model, rows);
    } catch (error) {
      console.error(`Skipped ${model} string fields: ${errorMessage(error)}`);
    }

    try {
      await loadJsonFields(client, model, rows);
    } catch (error) {
      console.error(`Skipped ${model} JSON fields: ${errorMessage(error)}`);
    }
  }

  try {
    await loadServiceImageUrls(client, rows);
  } catch (error) {
    console.error(`Skipped Service.imageUrls: ${errorMessage(error)}`);
  }

  return rows;
}

async function saveRow(client: PrismaClient, row: TrackedRow) {
  const data: Record<string, string | null> = {};
  for (const [field, value] of Object.entries(row.current)) {
    if (value !== row.saved[field]) {
      data[field] = value;
    }
  }

  if (Object.keys(data).length === 0) {
    return false;
  }

  if (row.model === "service" && "imageUrls" in data) {
    await client.$executeRaw`
      UPDATE Service
      SET imageUrls = ${data.imageUrls}
      WHERE id = ${row.id}
    `;
    delete data.imageUrls;
  }

  if (Object.keys(data).length > 0) {
    await delegate(client, row.model).update({
      where: { id: row.id },
      data,
    });
  }

  row.saved = { ...row.current };
  return true;
}

async function replaceUrls(
  client: PrismaClient,
  rows: TrackedRow[],
  resource: CloudinaryResource,
  newUrl: string,
) {
  const rowsByModel = new Map<ModelName, TrackedRow[]>();
  for (const row of rows) {
    const modelRows = rowsByModel.get(row.model) ?? [];
    modelRows.push(row);
    rowsByModel.set(row.model, modelRows);
  }

  let updated = 0;

  for (const [model, modelRows] of rowsByModel) {
    try {
      for (const row of modelRows) {
        let touched = false;
        for (const [field, value] of Object.entries(row.current)) {
          const next = rewriteStoredValue(value, resource, newUrl);
          if (next !== value) {
            row.current[field] = next;
            touched = true;
          }
        }
        if (touched && (await saveRow(client, row))) {
          updated += 1;
        }
      }
    } catch (error) {
      console.error(`Skipped ${model} updates: ${errorMessage(error)}`);
    }
  }

  return updated;
}

async function migrate() {
  const required = [
    "DATABASE_URL",
    "CLOUDINARY_CLOUD_NAME",
    "CLOUDINARY_API_KEY",
    "CLOUDINARY_API_SECRET",
    "R2_ACCOUNT_ID",
    "R2_ACCESS_KEY_ID",
    "R2_SECRET_ACCESS_KEY",
    "R2_BUCKET_NAME",
    "R2_PUBLIC_DOMAIN",
  ];
  required.forEach(requiredEnv);

  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });

  const r2 = new S3Client({
    region: "auto",
    endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: requiredEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requiredEnv("R2_SECRET_ACCESS_KEY"),
    },
  });

  const bucket = requiredEnv("R2_BUCKET_NAME");
  const { prisma } = await import("../lib/prisma");

  let uploaded = 0;
  let failed = 0;
  let dbRows = 0;
  const usedKeys = new Map<string, string>();

  try {
    console.log(`R2 bucket: ${bucket}`);
    console.log(`Public domain: ${requiredEnv("R2_PUBLIC_DOMAIN")}`);

    const assets = await listAssets();
    const rows = await loadCloudinaryRows(prisma);
    console.log(`Found ${assets.length} Cloudinary asset(s) and ${rows.length} database row(s).`);

    for (let index = 0; index < assets.length; index += 1) {
      const resource = assets[index];
      const label = `[${index + 1}/${assets.length}] ${resource.public_id}`;

      try {
        let key = objectKey(resource);
        const existing = usedKeys.get(key);
        if (existing && existing !== resource.secure_url) {
          key = `${resource.resource_type}/${resource.type ?? "upload"}/${key}`;
        }
        usedKeys.set(key, resource.secure_url);

        const body = await downloadWithSignedFallback(resource);
        await r2.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: body,
            ContentType: contentTypeFor(resource),
          }),
        );

        const newUrl = publicObjectUrl(key);
        const updated = await replaceUrls(prisma, rows, resource, newUrl);
        uploaded += 1;
        dbRows += updated;
        console.log(`${label} -> ${newUrl} (${updated} row(s))`);
      } catch (error) {
        failed += 1;
        console.error(`${label} failed: ${errorMessage(error)}`);
      }
    }

    console.log(
      `Done. Uploaded ${uploaded}, failed ${failed}, updated ${dbRows} database row(s).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

migrate().catch((error: unknown) => {
  console.error(`Migration failed: ${errorMessage(error)}`);
  process.exitCode = 1;
});

// Run the migration with: npx tsx scripts/migrate-r2.ts
