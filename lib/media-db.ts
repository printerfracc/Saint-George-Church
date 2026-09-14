import { randomUUID } from "node:crypto";
import { connect } from "@tidbcloud/serverless";
import type { MediaFileType } from "@/lib/cloudinary";

export type MediaCollectionRecord = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
  itemCount: number;
};

export type MediaItemRecord = {
  id: string;
  collectionId: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
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
        imageUrl TEXT NULL,
        createdAt DATETIME(3) NOT NULL,
        PRIMARY KEY (id)
      )
    `);

    await execute(`
      CREATE TABLE IF NOT EXISTS MediaItem (
        id VARCHAR(191) NOT NULL,
        collectionId VARCHAR(191) NOT NULL,
        title VARCHAR(191) NOT NULL,
        fileUrl TEXT NOT NULL,
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
}

export async function listMediaCollections() {
  await ensureTables();

  const rows = await query<{
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    createdAt: Date | string;
    itemCount: number | string;
  }>(`
    SELECT
      c.id,
      c.title,
      c.description,
      c.imageUrl,
      c.createdAt,
      (
        SELECT COUNT(*)
        FROM MediaItem i
        WHERE i.collectionId = c.id
      ) AS itemCount
    FROM MediaCollection c
    ORDER BY c.createdAt ASC
  `);

  return rows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: toDate(row.createdAt),
    itemCount: Number(row.itemCount),
  }));
}

export async function getMediaCollection(id: string) {
  await ensureTables();

  const rows = await query<{
    id: string;
    title: string;
    description: string;
    imageUrl: string | null;
    createdAt: Date | string;
  }>(
    `
      SELECT id, title, description, imageUrl, createdAt
      FROM MediaCollection
      WHERE id = ?
      LIMIT 1
    `,
    [id],
  );

  const row = rows[0];
  if (!row) {
    return null;
  }

  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: row.imageUrl,
    createdAt: toDate(row.createdAt),
    itemCount: 0,
  };
}

export async function createMediaCollection(data: {
  title: string;
  description: string;
  imageUrl: string | null;
}) {
  await ensureTables();

  const created: MediaCollectionRecord = {
    id: randomUUID(),
    ...data,
    createdAt: new Date(),
    itemCount: 0,
  };

  await execute(
    `
      INSERT INTO MediaCollection (id, title, description, imageUrl, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `,
    [
      created.id,
      created.title,
      created.description,
      created.imageUrl,
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
    imageUrl: string | null;
  },
) {
  await ensureTables();

  await execute(
    `
      UPDATE MediaCollection
      SET title = ?, description = ?, imageUrl = ?
      WHERE id = ?
    `,
    [data.title, data.description, data.imageUrl, id],
  );
}

export async function deleteMediaCollection(id: string) {
  await ensureTables();

  await execute("DELETE FROM MediaItem WHERE collectionId = ?", [id]);
  await execute("DELETE FROM MediaCollection WHERE id = ?", [id]);
}

export async function listMediaItems(collectionId: string) {
  await ensureTables();

  const rows = await query<{
    id: string;
    collectionId: string;
    title: string;
    fileUrl: string;
    fileName: string | null;
    fileType: string;
    thumbnail: string | null;
    createdAt: Date | string;
  }>(
    `
      SELECT id, collectionId, title, fileUrl, fileName, fileType, thumbnail, createdAt
      FROM MediaItem
      WHERE collectionId = ?
      ORDER BY createdAt ASC
    `,
    [collectionId],
  );

  return rows.map((row) => ({
    id: row.id,
    collectionId: row.collectionId,
    title: row.title,
    fileUrl: row.fileUrl,
    fileName: row.fileName,
    fileType: row.fileType as MediaFileType,
    thumbnail: row.thumbnail ?? null,
    createdAt: toDate(row.createdAt),
  }));
}

export async function createMediaItem(data: {
  collectionId: string;
  title: string;
  fileUrl: string;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
}) {
  await ensureTables();

  const created: MediaItemRecord = {
    id: randomUUID(),
    ...data,
    createdAt: new Date(),
  };

  await execute(
    `
      INSERT INTO MediaItem (id, collectionId, title, fileUrl, fileName, fileType, thumbnail, createdAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      created.id,
      created.collectionId,
      created.title,
      created.fileUrl,
      created.fileName,
      created.fileType,
      created.thumbnail,
      toSqlDate(created.createdAt),
    ],
  );

  return created;
}

export async function updateMediaItem(
  id: string,
  data: {
    title: string;
    fileUrl: string;
    fileName: string | null;
    fileType: MediaFileType;
    thumbnail: string | null;
  },
) {
  await ensureTables();

  await execute(
    `
      UPDATE MediaItem
      SET title = ?, fileUrl = ?, fileName = ?, fileType = ?, thumbnail = ?
      WHERE id = ?
    `,
    [
      data.title,
      data.fileUrl,
      data.fileName,
      data.fileType,
      data.thumbnail,
      id,
    ],
  );
}

export async function deleteMediaItem(id: string) {
  await ensureTables();

  await execute("DELETE FROM MediaItem WHERE id = ?", [id]);
}
