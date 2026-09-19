import { parseImageDisplayMode, type ImageDisplayMode } from "@/lib/image-display";
import { prisma } from "@/lib/prisma";

export type ServiceRecord = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  parentId: string | null;
  childCount: number;
  imageDisplayMode: ImageDisplayMode;
  createdAt: Date;
};

export type ServiceParentOption = {
  id: string;
  title: string;
  depth: number;
};

export type ServiceDetail = ServiceRecord & {
  parent: { id: string; title: string } | null;
  children: ServiceRecord[];
};

export type ServiceRecordInput = {
  title: string;
  description: string;
  imageUrl: string | null;
  parentId?: string | null;
  imageDisplayMode?: string | null;
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
  parentId?: string | null;
  imageDisplayMode?: string | null;
  createdAt: Date | string;
  _count?: { children: number };
  children?: unknown[];
}): ServiceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    imageUrl: asImageUrl(row.imageUrl) ?? asImageUrl(row.schedule),
    parentId: row.parentId ?? null,
    childCount: row._count?.children ?? row.children?.length ?? 0,
    imageDisplayMode: parseImageDisplayMode(row.imageDisplayMode),
    createdAt: toDate(row.createdAt),
  };
}

const serviceListInclude = {
  _count: { select: { children: true } },
} as const;

async function assertValidParent(parentId: string | null, currentId?: string) {
  if (!parentId) {
    return null;
  }

  if (currentId && parentId === currentId) {
    throw new Error("لا يمكن جعل القطاع قسماً فرعياً لنفسه");
  }

  const parent = await prisma.service.findUnique({
    where: { id: parentId },
    select: { id: true, parentId: true },
  });

  if (!parent) {
    throw new Error("القسم الرئيسي غير موجود");
  }

  if (!currentId) {
    return parentId;
  }

  let cursor: string | null = parent.parentId;

  while (cursor) {
    if (cursor === currentId) {
      throw new Error("لا يمكن نقل القطاع إلى أحد الأقسام التابعة له");
    }

    const next = await prisma.service.findUnique({
      where: { id: cursor },
      select: { parentId: true },
    });
    cursor = next?.parentId ?? null;
  }

  return parentId;
}

function flattenParentOptions(
  rows: Array<{ id: string; title: string; parentId: string | null; order: number }>,
): ServiceParentOption[] {
  const childrenByParent = new Map<string | null, typeof rows>();

  for (const row of rows) {
    const key = row.parentId;
    const list = childrenByParent.get(key) ?? [];
    list.push(row);
    childrenByParent.set(key, list);
  }

  const options: ServiceParentOption[] = [];

  function walk(parentId: string | null, depth: number) {
    const children = [...(childrenByParent.get(parentId) ?? [])].sort(
      (left, right) => left.order - right.order,
    );

    for (const child of children) {
      options.push({ id: child.id, title: child.title, depth });
      walk(child.id, depth + 1);
    }
  }

  walk(null, 0);
  return options;
}

export async function listServiceRecords(parentId: string | null = null) {
  const rows = await prisma.service.findMany({
    where: { parentId },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: serviceListInclude,
  });

  return rows.map(toRecord);
}

export async function listTopLevelServiceRecords() {
  return listServiceRecords(null);
}

export async function listServiceParentOptions() {
  const rows = await prisma.service.findMany({
    select: { id: true, title: true, parentId: true, order: true },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
  });

  return flattenParentOptions(rows);
}

export async function getServiceRecord(id: string): Promise<ServiceDetail | null> {
  const row = await prisma.service.findUnique({
    where: { id },
    include: {
      parent: { select: { id: true, title: true } },
      children: {
        orderBy: [{ order: "asc" }, { createdAt: "asc" }],
        include: serviceListInclude,
      },
      _count: { select: { children: true } },
    },
  });

  if (!row) {
    return null;
  }

  return {
    ...toRecord(row),
    parent: row.parent,
    children: row.children.map(toRecord),
  };
}

export async function createServiceRecord(data: ServiceRecordInput) {
  const parentId = await assertValidParent(data.parentId?.trim() || null);
  const maxOrder = await prisma.service.aggregate({
    where: { parentId },
    _max: { order: true },
  });

  return prisma.service.create({
    data: {
      title: data.title,
      description: data.description,
      schedule: data.imageUrl ?? "",
      type: "OTHER",
      order: (maxOrder._max.order ?? -1) + 1,
      parentId,
      imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    },
  });
}

export async function updateServiceRecord(id: string, data: ServiceRecordInput) {
  const parentId = await assertValidParent(data.parentId?.trim() || null, id);

  return prisma.service.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      schedule: data.imageUrl ?? "",
      parentId,
      imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    },
  });
}

export async function deleteServiceRecord(id: string) {
  return prisma.service.delete({ where: { id } });
}
