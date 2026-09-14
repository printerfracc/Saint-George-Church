import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

export type ServiceRecord = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: Date;
};

export type ServiceRecordInput = {
  title: string;
  description: string;
  imageUrl: string | null;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asImageUrl(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return /^https?:\/\//i.test(text) ? text : null;
}

function toRecord(row: {
  id: string;
  title: string;
  description: string;
  schedule?: string | null;
  imageUrl?: string | null;
  createdAt: Date | string;
}): ServiceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: asImageUrl(row.imageUrl) ?? asImageUrl(row.schedule),
    createdAt: toDate(row.createdAt),
  };
}

export async function listServiceRecords() {
  if (typeof prisma.service?.findMany === "function") {
    const rows = await prisma.service.findMany({
      orderBy: { createdAt: "asc" },
    });

    return rows.map((row) => toRecord(row));
  }

  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      title: string;
      description: string;
      schedule: string | null;
      createdAt: Date;
    }>
  >`
    SELECT id, title, description, schedule, createdAt
    FROM Service
    ORDER BY createdAt ASC
  `;

  return rows.map(toRecord);
}

export async function createServiceRecord(data: ServiceRecordInput) {
  if (typeof prisma.service?.create === "function") {
    return prisma.service.create({
      data: {
        title: data.title,
        description: data.description,
        schedule: data.imageUrl ?? "",
        type: "OTHER",
      },
    });
  }

  const id = randomUUID();
  const now = new Date();

  await prisma.$executeRaw`
    INSERT INTO Service (id, title, description, schedule, type, createdAt, updatedAt)
    VALUES (
      ${id},
      ${data.title},
      ${data.description},
      ${data.imageUrl ?? ""},
      'OTHER',
      ${now},
      ${now}
    )
  `;
}

export async function updateServiceRecord(id: string, data: ServiceRecordInput) {
  if (typeof prisma.service?.update === "function") {
    return prisma.service.update({
      where: { id },
      data: {
        title: data.title,
        description: data.description,
        schedule: data.imageUrl ?? "",
      },
    });
  }

  const now = new Date();

  await prisma.$executeRaw`
    UPDATE Service
    SET title = ${data.title},
        description = ${data.description},
        schedule = ${data.imageUrl ?? ""},
        updatedAt = ${now}
    WHERE id = ${id}
  `;
}

export async function deleteServiceRecord(id: string) {
  if (typeof prisma.service?.delete === "function") {
    return prisma.service.delete({ where: { id } });
  }

  await prisma.$executeRaw`
    DELETE FROM Service
    WHERE id = ${id}
  `;
}
