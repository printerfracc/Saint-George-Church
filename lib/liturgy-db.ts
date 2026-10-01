import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { connect } from "@tidbcloud/serverless";
import { prisma } from "@/lib/prisma";
import type { LiturgySectionKey } from "@/lib/liturgies";

export type LiturgyRecord = {
  id: string;
  section: LiturgySectionKey;
  title: string;
  description: string;
  detail: string | null;
  imageUrl: string | null;
  link: string | null;
  linkLabel: string | null;
  order: number;
  createdAt: Date;
};

export type LiturgyRecordInput = {
  section: LiturgySectionKey;
  title: string;
  description: string;
  detail: string | null;
  imageUrl: string | null;
};

export type LiturgyLinkFields = {
  link: string | null;
  linkLabel: string | null;
};

let liturgyColumnsReady = false;

async function addLiturgyColumn(sql: string) {
  const url = process.env.DATABASE_URL;

  if (!url) {
    return;
  }

  try {
    await connect({ url }).execute(sql);
  } catch {
    // Column may already exist.
  }
}

export async function ensureLiturgyColumns() {
  if (liturgyColumnsReady) {
    return;
  }

  await addLiturgyColumn("ALTER TABLE LiturgyEntry ADD COLUMN link TEXT NULL");
  await addLiturgyColumn(
    "ALTER TABLE LiturgyEntry ADD COLUMN linkLabel VARCHAR(191) NULL",
  );

  liturgyColumnsReady = true;
}

async function loadLiturgyLinkFields(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, LiturgyLinkFields>();
  }

  await ensureLiturgyColumns();

  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; link: string | null; linkLabel: string | null }>
    >`
      SELECT id, link, linkLabel
      FROM LiturgyEntry
      WHERE id IN (${Prisma.join(ids)})
    `;

    return new Map(
      rows.map((row) => [
        row.id,
        {
          link: row.link?.trim() || null,
          linkLabel: row.linkLabel?.trim() || null,
        },
      ]),
    );
  } catch {
    return new Map<string, LiturgyLinkFields>();
  }
}

export async function saveLiturgyLinkFields(
  id: string,
  fields: LiturgyLinkFields,
) {
  await ensureLiturgyColumns();
  await prisma.$executeRaw`
    UPDATE LiturgyEntry
    SET link = ${fields.link},
        linkLabel = ${fields.linkLabel}
    WHERE id = ${id}
  `;
}

async function withLinkFields(rows: LiturgyRecord[]) {
  const extras = await loadLiturgyLinkFields(rows.map((row) => row.id));

  return rows.map((row) => ({
    ...row,
    link: extras.get(row.id)?.link ?? row.link ?? null,
    linkLabel: extras.get(row.id)?.linkLabel ?? row.linkLabel ?? null,
  }));
}

function hasDelegate() {
  try {
    return typeof prisma.liturgyEntry?.findMany === "function";
  } catch {
    return false;
  }
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toRecord(row: {
  id: string;
  section: LiturgySectionKey;
  title: string;
  description: string;
  detail: string | null;
  imageUrl: string | null;
  link?: string | null;
  linkLabel?: string | null;
  order?: number | null;
  createdAt: Date | string;
}): LiturgyRecord {
  return {
    id: row.id,
    section: row.section,
    title: row.title,
    description: row.description,
    detail: row.detail,
    imageUrl: row.imageUrl,
    link: row.link?.trim() || null,
    linkLabel: row.linkLabel?.trim() || null,
    order: row.order ?? 0,
    createdAt: toDate(row.createdAt),
  };
}

function isActiveSection(section: string): section is LiturgySectionKey {
  return section === "SCHEDULE" || section === "LIVE" || section === "RITES";
}

export async function listLiturgyRecords() {
  await ensureLiturgyColumns();

  if (hasDelegate()) {
    try {
      const rows = (await prisma.liturgyEntry.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      })) as Array<LiturgyRecord & { order?: number }>;

      return withLinkFields(
        rows.filter((row) => isActiveSection(row.section)).map(toRecord),
      );
    } catch {
      const rows = (await prisma.liturgyEntry.findMany({
        orderBy: { createdAt: "asc" },
      })) as Array<LiturgyRecord & { order?: number }>;

      return withLinkFields(
        rows.filter((row) => isActiveSection(row.section)).map(toRecord),
      );
    }
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      section: LiturgySectionKey;
      title: string;
      description: string;
      detail: string | null;
      imageUrl: string | null;
      order: number;
      createdAt: Date;
    }>
  >`
    SELECT id, section, title, description, detail, imageUrl, \`order\`, createdAt
    FROM LiturgyEntry
    WHERE section IN ('SCHEDULE', 'LIVE', 'RITES')
    ORDER BY \`order\` ASC, createdAt ASC
  `;

  return withLinkFields(rows.map(toRecord));
}

async function nextLiturgyOrder(section: LiturgySectionKey) {
  if (typeof prisma.liturgyEntry?.aggregate === "function") {
    const max = await prisma.liturgyEntry.aggregate({
      where: { section },
      _max: { order: true },
    });
    return (max._max.order ?? -1) + 1;
  }

  const rows = await prisma.$queryRaw<Array<{ nextOrder: number }>>`
    SELECT COALESCE(MAX(\`order\`), -1) + 1 AS nextOrder
    FROM LiturgyEntry
    WHERE section = ${section}
  `;

  return Number(rows[0]?.nextOrder ?? 0);
}

export async function createLiturgyRecord(data: LiturgyRecordInput) {
  const order = await nextLiturgyOrder(data.section);

  if (typeof prisma.liturgyEntry?.create === "function") {
    return prisma.liturgyEntry.create({
      data: { ...data, order },
    });
  }

  const created: LiturgyRecord = {
    id: randomUUID(),
    ...data,
    link: null,
    linkLabel: null,
    order,
    createdAt: new Date(),
  };

  await prisma.$executeRaw`
    INSERT INTO LiturgyEntry (id, section, title, description, detail, imageUrl, \`order\`, createdAt)
    VALUES (
      ${created.id},
      ${created.section},
      ${created.title},
      ${created.description},
      ${created.detail},
      ${created.imageUrl},
      ${created.order},
      ${created.createdAt}
    )
  `;

  return created;
}

export async function updateLiturgyRecord(id: string, data: LiturgyRecordInput) {
  if (typeof prisma.liturgyEntry?.update === "function") {
    return prisma.liturgyEntry.update({
      where: { id },
      data,
    });
  }

  await prisma.$executeRaw`
    UPDATE LiturgyEntry
    SET section = ${data.section},
        title = ${data.title},
        description = ${data.description},
        detail = ${data.detail},
        imageUrl = ${data.imageUrl}
    WHERE id = ${id}
  `;
}

export async function deleteLiturgyRecord(id: string) {
  if (typeof prisma.liturgyEntry?.delete === "function") {
    return prisma.liturgyEntry.delete({ where: { id } });
  }

  await prisma.$executeRaw`
    DELETE FROM LiturgyEntry
    WHERE id = ${id}
  `;
}
