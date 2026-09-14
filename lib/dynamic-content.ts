import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type DynamicContentRecord = {
  id: string;
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string | null;
  updatedAt: Date;
};

type DynamicContentInput = {
  sectionKey: string;
  title: string;
  content: string;
  imageUrl: string | null;
};

function hasDelegate() {
  try {
    return typeof prisma.dynamicContent?.findMany === "function";
  } catch {
    return false;
  }
}

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function toRecord(row: DynamicContentRecord): DynamicContentRecord {
  return {
    ...row,
    updatedAt: toDate(row.updatedAt),
  };
}

export async function listDynamicContent() {
  if (hasDelegate()) {
    return prisma.dynamicContent.findMany({
      orderBy: { updatedAt: "desc" },
    });
  }

  const rows = await prisma.$queryRaw<DynamicContentRecord[]>`
    SELECT id, sectionKey, title, content, imageUrl, updatedAt
    FROM DynamicContent
    ORDER BY updatedAt DESC
  `;

  return rows.map(toRecord);
}

export async function findDynamicContentByKey(sectionKey: string) {
  if (hasDelegate()) {
    return prisma.dynamicContent.findUnique({
      where: { sectionKey },
    });
  }

  const rows = await prisma.$queryRaw<DynamicContentRecord[]>`
    SELECT id, sectionKey, title, content, imageUrl, updatedAt
    FROM DynamicContent
    WHERE sectionKey = ${sectionKey}
    LIMIT 1
  `;

  return rows[0] ? toRecord(rows[0]) : null;
}

export async function saveDynamicContent(data: DynamicContentInput) {
  if (typeof prisma.dynamicContent?.upsert === "function") {
    return prisma.dynamicContent.upsert({
      where: { sectionKey: data.sectionKey },
      create: data,
      update: {
        title: data.title,
        content: data.content,
        imageUrl: data.imageUrl,
      },
    });
  }

  if (hasDelegate()) {
    const existing = await prisma.dynamicContent.findUnique({
      where: { sectionKey: data.sectionKey },
    });

    if (existing) {
      return prisma.dynamicContent.update({
        where: { id: existing.id },
        data: {
          title: data.title,
          content: data.content,
          imageUrl: data.imageUrl,
        },
      });
    }

    return prisma.dynamicContent.create({ data });
  }

  const now = new Date();
  const existing = await findDynamicContentByKey(data.sectionKey);

  if (existing) {
    await prisma.$executeRaw`
      UPDATE DynamicContent
      SET title = ${data.title},
          content = ${data.content},
          imageUrl = ${data.imageUrl},
          updatedAt = ${now}
      WHERE sectionKey = ${data.sectionKey}
    `;
    return { ...existing, ...data, updatedAt: now };
  }

  const created = {
    id: randomUUID(),
    ...data,
    updatedAt: now,
  };

  await prisma.$executeRaw`
    INSERT INTO DynamicContent (id, sectionKey, title, content, imageUrl, updatedAt)
    VALUES (${created.id}, ${created.sectionKey}, ${created.title}, ${created.content}, ${created.imageUrl}, ${created.updatedAt})
  `;

  return created;
}
