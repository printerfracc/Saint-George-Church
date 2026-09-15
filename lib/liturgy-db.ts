import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import type { LiturgySectionKey } from "@/lib/liturgies";

export type LiturgyRecord = {
  id: string;
  section: LiturgySectionKey;
  title: string;
  description: string;
  detail: string | null;
  imageUrl: string | null;
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
    order: row.order ?? 0,
    createdAt: toDate(row.createdAt),
  };
}

function isActiveSection(section: string): section is LiturgySectionKey {
  return section === "SCHEDULE" || section === "LIVE" || section === "RITES";
}

export async function listLiturgyRecords() {
  if (hasDelegate()) {
    try {
      const rows = (await prisma.liturgyEntry.findMany({
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
      })) as Array<LiturgyRecord & { order?: number }>;

      return rows.filter((row) => isActiveSection(row.section)).map(toRecord);
    } catch {
      const rows = (await prisma.liturgyEntry.findMany({
        orderBy: { createdAt: "asc" },
      })) as Array<LiturgyRecord & { order?: number }>;

      return rows.filter((row) => isActiveSection(row.section)).map(toRecord);
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

  return rows.map(toRecord);
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
