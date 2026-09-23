import { randomUUID } from "node:crypto";
import { connect } from "@tidbcloud/serverless";
import type { MediaFileType } from "@/lib/cloudinary";
import { parseImageDisplayMode, type ImageDisplayMode } from "@/lib/image-display";
import { parseMediaCategory, type MediaCategory } from "@/lib/media-category";
import { resolveUniqueSlug } from "@/lib/slug";

export type MediaCollectionRecord = {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  imageUrl: string | null;
  imageDisplayMode: ImageDisplayMode;
  category: MediaCategory;
  createdAt: Date;
  itemCount: number;
};

export type MediaItemRecord = {
  id: string;
  collectionId: string;
  title: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
  imageDisplayMode: ImageDisplayMode;
  link: string | null;
  linkLabel: string | null;
  createdAt: Date;
};

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set");
}

function db() {
  return connect({ url: connectionString });
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toSqlDate(value: Date) {
  return value.toISOString().slice(0, 19).replace("T", " ");
}

let tablesReady = false;
let thumbnailColumnReady = false;
let linkColumnsReady = false;
let optionalFileReady = false;
let orderColumnReady = false;
let imageDisplayModeReady = false;
let slugColumnReady = false;
let categoryColumnReady = false;

async function execute(sql: string, args: unknown[] = []) {
  await db().execute(sql, args);
}

async function query<T>(sql: string, args: unknown[] = []) {
  const rows = await db().execute(sql, args);
  return (Array.isArray(rows) ? rows : []) as T[];
}

async function ensureTables() {
  if (!tablesReady) {
    await execute(`
      CREATE TABLE IF NOT EXISTS MediaCollection (
        id VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        description TEXT NOT NULL,
        slug VARCHAR(191) NULL,
        imageUrl TEXT NULL,
        createdAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id),
        UNIQUE KEY MediaCollection_slug_key (slug)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS MediaItem (
        id VARCHAR(191) NOT NULL,
        collectionId VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        fileUrl TEXT NULL,
        fileName VARCHAR(191) NULL,
        fileType VARCHAR(32) NOT NULL,
        thumbnail TEXT NULL,
        createdAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id)
      )
    `);

    try {
      await execute(
        "CREATE INDEX MediaItem_collectionId_idx ON MediaItem (collectionId)",
      );
    } catch {
      // Index may already exist.
    }

    tablesReady = true;
  }

  if (!thumbnailColumnReady) {
    try {
      await execute(
        "ALTER TABLE MediaItem CHANGE COLUMN thumbnailUrl thumbnail TEXT NULL",
      );
    } catch {
      // Column may already be named thumbnail.
    }

    try {
      await execute("ALTER TABLE MediaItem ADD COLUMN thumbnail TEXT NULL");
    } catch {
      // Column may already exist.
    }

    try {
      await execute(
        "UPDATE MediaItem SET thumbnail = thumbnailUrl WHERE (thumbnail IS NULL OR thumbnail = '') AND thumbnailUrl IS NOT NULL",
      );
    } catch {
      // Old thumbnailUrl column may not exist.
    }

    thumbnailColumnReady = true;
  }

  if (!linkColumnsReady) {
    try {
      await execute("ALTER TABLE MediaItem ADD COLUMN link TEXT NULL");
    } catch {
      // Column may already exist.
    }

    try {
      await execute("ALTER TABLE MediaItem ADD COLUMN linkLabel VARCHAR(191) NULL");
    } catch {
      // Column may already exist.
    }

    linkColumnsReady = true;
  }

  if (!optionalFileReady) {
    try {
      await execute("ALTER TABLE MediaItem MODIFY COLUMN fileUrl TEXT NULL");
    } catch {
      // Column may already be nullable.
    }

    optionalFileReady = true;
  }

  if (!orderColumnReady) {
    try {
      await execute(
        "ALTER TABLE MediaCollection ADD COLUMN `order` INT NOT NULL DEFAULT 0",
      );
    } catch {
      // Column may already exist.
    }

    try {
      await execute(
        "ALTER TABLE MediaItem ADD COLUMN `order` INT NOT NULL DEFAULT 0",
      );
    } catch {
      // Column may already exist.
    }

    orderColumnReady = true;
  }

  if (!imageDisplayModeReady) {
    try {
      await execute(
        "ALTER TABLE MediaCollection ADD COLUMN imageDisplayMode VARCHAR(32) NOT NULL DEFAULT 'NORMAL'",
      );
    } catch {
      // Column may already exist.
    }

    imageDisplayModeReady = true;
  }

  if (!slugColumnReady) {
    try {
      await execute("ALTER TABLE MediaCollection ADD COLUMN slug VARCHAR(191) NULL");
    } catch {
      // Column may already exist.
    }

    try {
      await execute(
        "CREATE UNIQUE INDEX MediaCollection_slug_key ON MediaCollection (slug)",
      );
    } catch {
      // Index may already exist.
    }

    slugColumnReady = true;
  }

  try {
    await execute(
      "ALTER TABLE MediaItem ADD COLUMN imageDisplayMode VARCHAR(32) NOT NULL DEFAULT 'NORMAL'",
    );
  } catch {
    // Column may already exist.
  }

  if (!categoryColumnReady) {
    try {
      await execute(
        "ALTER TABLE MediaCollection ADD COLUMN category ENUM('SERMONS', 'BOOKS', 'IMAGES') NOT NULL DEFAULT 'SERMONS'",
      );
    } catch {
      // Column may already exist.
    }

    categoryColumnReady = true;
  }
}

export async function listMediaCollections() {
  await ensureTables();

  const selectSql = `
    SELECT
      c.id,
      c.title,
      c.description,
      c.slug,
      c.imageUrl,
      c.imageDisplayMode,
      c.category,
      c.createdAt,
      (
        SELECT COUNT(*)
        FROM MediaItem i
        WHERE i.collectionId = c.id
      ) AS itemCount
    FROM MediaCollection c
  `;

  let rows: Array<{
    id: string;
    title: string;
    description: string;
    slug?: string | null;
    imageUrl: string | null;
    imageDisplayMode?: string | null;
    category?: string | null;
    createdAt: Date | string;
    itemCount: number | string;
  }>;

  try {
    rows = await query(`${selectSql} ORDER BY c.\`order\` ASC, c.createdAt ASC`);
  } catch {
    rows = await query(`${selectSql} ORDER BY c.createdAt ASC`);
  }

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    slug: row.slug ?? null,
    imageUrl: row.imageUrl,
    imageDisplayMode: parseImageDisplayMode(row.imageDisplayMode),
    category: parseMediaCategory(row.category),
    createdAt: toDate(row.createdAt),
    itemCount: Number(row.itemCount),
  }));
}

async function isMediaSlugTaken(slug: string, excludeId?: string) {
  await ensureTables();

  const rows = excludeId
    ? await query<{ id: string }>(
        "SELECT id FROM MediaCollection WHERE slug = ? AND id != ? LIMIT 1",
        [slug, excludeId],
      )
    : await query<{ id: string }>(
        "SELECT id FROM MediaCollection WHERE slug = ? LIMIT 1",
        [slug],
      );

  return rows.length > 0;
}

export async function getMediaCollection(id: string) {
  await ensureTables();

  const rows = await query<{
    id: string;
    title: string;
    description: string;
    slug?: string | null;
    imageUrl: string | null;
    imageDisplayMode?: string | null;
    category?: string | null;
    createdAt: Date | string;
  }>(
    `
      SELECT id, title, description, slug, imageUrl, imageDisplayMode, category, createdAt
      FROM MediaCollection
      WHERE slug = ? OR id = ?
      LIMIT 1
    `,
    [id, id],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    slug: row.slug ?? null,
    imageUrl: row.imageUrl,
    imageDisplayMode: parseImageDisplayMode(row.imageDisplayMode),
    category: parseMediaCategory(row.category),
    createdAt: toDate(row.createdAt),
    itemCount: 0,
  };
}

export async function createMediaCollection(data: {
  title: string;
  description: string;
  slug?: string | null;
  imageUrl: string | null;
  imageDisplayMode?: string | null;
  category?: string | null;
}) {
  await ensureTables();

  const nextRows = await query<{ nextOrder: number | string }>(
    "SELECT COALESCE(MAX(`order`), -1) + 1 AS nextOrder FROM MediaCollection",
  );
  const order = Number(nextRows[0]?.nextOrder ?? 0);
  const slug = await resolveUniqueSlug(data.slug, data.title, (value) =>
    isMediaSlugTaken(value),
  );

  const created: MediaCollectionRecord = {
    id: randomUUID(),
    title: data.title,
    description: data.description,
    slug,
    imageUrl: data.imageUrl,
    imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    category: parseMediaCategory(data.category),
    createdAt: new Date(),
    itemCount: 0,
  };

  await execute(
    `
      INSERT INTO MediaCollection (id, title, description, slug, imageUrl, imageDisplayMode, category, \`order\`, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      created.id,
      created.title,
      created.description,
      created.slug,
      created.imageUrl,
      created.imageDisplayMode,
      created.category,
      order,
      toSqlDate(created.createdAt),
    ],
  );

  return created;
}

export async function updateMediaCollection(
  id: string,
  data: {
    title: string;
    description: string;
    slug?: string | null;
    imageUrl: string | null;
    imageDisplayMode?: string | null;
    category?: string | null;
  },
) {
  await ensureTables();

  const slug = await resolveUniqueSlug(data.slug, data.title, (value) =>
    isMediaSlugTaken(value, id),
  );

  await execute(
    `
      UPDATE MediaCollection
      SET title = ?, description = ?, slug = ?, imageUrl = ?, imageDisplayMode = ?, category = ?
      WHERE id = ?
    `,
    [
      data.title,
      data.description,
      slug,
      data.imageUrl,
      parseImageDisplayMode(data.imageDisplayMode),
      parseMediaCategory(data.category),
      id,
    ],
  );

  return { slug };
}

export async function deleteMediaCollection(id: string) {
  await ensureTables();

  await execute("DELETE FROM MediaItem WHERE collectionId = ?", [id]);
  await execute("DELETE FROM MediaCollection WHERE id = ?", [id]);
}

export async function listMediaItems(collectionId: string) {
  await ensureTables();

  const selectSql = `
    SELECT id, collectionId, title, fileUrl, fileName, fileType, thumbnail, imageDisplayMode, link, linkLabel, createdAt
    FROM MediaItem
    WHERE collectionId = ?
  `;

  let rows: Array<{
    id: string;
    collectionId: string;
    title: string;
    fileUrl: string | null;
    fileName: string | null;
    fileType: string;
    thumbnail: string | null;
    imageDisplayMode?: string | null;
    link: string | null;
    linkLabel: string | null;
    createdAt: Date | string;
  }>;

  try {
    rows = await query(`${selectSql} ORDER BY \`order\` ASC, createdAt ASC`, [
      collectionId,
    ]);
  } catch {
    rows = await query(`${selectSql} ORDER BY createdAt ASC`, [collectionId]);
  }

  return rows.map((row) => ({
    id: row.id,
    collectionId: row.collectionId,
    title: row.title,
    fileUrl: row.fileUrl || null,
    fileName: row.fileName,
    fileType: (row.fileType || "link") as MediaFileType,
    thumbnail: row.thumbnail ?? null,
    imageDisplayMode: parseImageDisplayMode(row.imageDisplayMode),
    link: row.link ?? null,
    linkLabel: row.linkLabel ?? null,
    createdAt: toDate(row.createdAt),
  }));
}

export async function createMediaItem(data: {
  collectionId: string;
  title: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
  imageDisplayMode?: string | null;
  link: string | null;
  linkLabel: string | null;
}) {
  await ensureTables();

  const nextRows = await query<{ nextOrder: number | string }>(
    "SELECT COALESCE(MAX(`order`), -1) + 1 AS nextOrder FROM MediaItem WHERE collectionId = ?",
    [data.collectionId],
  );
  const order = Number(nextRows[0]?.nextOrder ?? 0);

  const created: MediaItemRecord = {
    id: randomUUID(),
    collectionId: data.collectionId,
    title: data.title,
    fileUrl: data.fileUrl,
    fileName: data.fileName,
    fileType: data.fileType,
    thumbnail: data.thumbnail,
    imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    link: data.link,
    linkLabel: data.linkLabel,
    createdAt: new Date(),
  };

  await execute(
    `
      INSERT INTO MediaItem (id, collectionId, title, fileUrl, fileName, fileType, thumbnail, imageDisplayMode, link, linkLabel, \`order\`, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      created.id,
      created.collectionId,
      created.title,
      created.fileUrl,
      created.fileName,
      created.fileType,
      created.thumbnail,
      created.imageDisplayMode,
      created.link,
      created.linkLabel,
      order,
      toSqlDate(created.createdAt),
    ],
  );

  return created;
}

export async function updateMediaItem(
  id: string,
  data: {
    title: string;
    fileUrl: string | null;
    fileName: string | null;
    fileType: MediaFileType;
    thumbnail: string | null;
    imageDisplayMode?: string | null;
    link: string | null;
    linkLabel: string | null;
  },
) {
  await ensureTables();

  await execute(
    `
      UPDATE MediaItem
      SET title = ?, fileUrl = ?, fileName = ?, fileType = ?, thumbnail = ?, imageDisplayMode = ?, link = ?, linkLabel = ?
      WHERE id = ?
    `,
    [
      data.title,
      data.fileUrl,
      data.fileName,
      data.fileType,
      data.thumbnail,
      parseImageDisplayMode(data.imageDisplayMode),
      data.link,
      data.linkLabel,
      id,
    ],
  );
}

export async function deleteMediaItem(id: string) {
  await ensureTables();

  await execute("DELETE FROM MediaItem WHERE id = ?", [id]);
}

export async function updateMediaCollectionOrders(
  items: { id: string; order: number }[],
) {
  await ensureTables();

  for (const item of items) {
    await execute("UPDATE MediaCollection SET `order` = ? WHERE id = ?", [
      item.order,
      item.id,
    ]);
  }
}

export async function updateMediaItemOrders(
  items: { id: string; order: number }[],
) {
  await ensureTables();

  for (const item of items) {
    await execute("UPDATE MediaItem SET `order` = ? WHERE id = ?", [
      item.order,
      item.id,
    ]);
  }
}
