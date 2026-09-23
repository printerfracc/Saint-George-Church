import { Prisma } from "@prisma/client";
import { connect } from "@tidbcloud/serverless";
import { parseImageDisplayMode, type ImageDisplayMode } from "@/lib/image-display";
import { prisma } from "@/lib/prisma";
import { resolveUniqueSlug } from "@/lib/slug";

export type ServiceRecord = {
  id: string;
  title: string;
  description: string;
  slug: string | null;
  imageUrl: string | null;
  imageUrls: string[];
  parentId: string | null;
  childCount: number;
  imageDisplayMode: ImageDisplayMode;
  serviceTime: string | null;
  amenPhone: string | null;
  createdAt: Date;
};

export type ServiceParentOption = {
  id: string;
  title: string;
  depth: number;
};

export type ServiceDetail = ServiceRecord & {
  parent: { id: string; title: string; slug: string | null } | null;
  children: ServiceRecord[];
};

export type ServiceRecordInput = {
  title: string;
  description: string;
  slug?: string | null;
  imageUrl: string | null;
  imageUrls?: string[];
  parentId?: string | null;
  imageDisplayMode?: string | null;
  serviceTime?: string | null;
  amenPhone?: string | null;
};

function toDate(value: Date | string) {
  return value instanceof Date ? value : new Date(value);
}

function asImageUrl(value: string | null | undefined) {
  const text = value?.trim() ?? "";
  return /^https?:\/\//i.test(text) ? text : null;
}

export function normalizeServiceImageUrls(
  urls?: Array<string | null | undefined> | null,
  fallback?: string | null,
) {
  const list: string[] = [];

  for (const item of urls ?? []) {
    const url = asImageUrl(item);
    if (url && !list.includes(url)) {
      list.push(url);
    }
  }

  if (list.length === 0) {
    const url = asImageUrl(fallback);
    if (url) {
      list.push(url);
    }
  }

  return list;
}

function parseStoredImageUrls(value?: string | null, fallback?: string | null) {
  if (value?.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return normalizeServiceImageUrls(
          parsed.filter((item): item is string => typeof item === "string"),
          fallback,
        );
      }
    } catch {
      // Keep the fallback image when stored JSON is invalid.
    }
  }

  return normalizeServiceImageUrls(null, fallback);
}

function toRecord(row: {
  id: string;
  title: string;
  description: string;
  slug?: string | null;
  schedule?: string | null;
  imageUrl?: string | null;
  parentId?: string | null;
  imageDisplayMode?: string | null;
  serviceTime?: string | null;
  amenPhone?: string | null;
  createdAt: Date | string;
  _count?: { children: number };
  children?: unknown[];
}): ServiceRecord {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    slug: row.slug ?? null,
    imageUrl: asImageUrl(row.imageUrl) ?? asImageUrl(row.schedule),
    imageUrls: [],
    parentId: row.parentId ?? null,
    childCount: row._count?.children ?? row.children?.length ?? 0,
    imageDisplayMode: parseImageDisplayMode(row.imageDisplayMode),
    serviceTime: row.serviceTime?.trim() || null,
    amenPhone: row.amenPhone?.trim() || null,
    createdAt: toDate(row.createdAt),
  };
}

let serviceColumnsReady = false;

async function addServiceColumn(sql: string) {
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

export async function ensureServiceColumns() {
  if (serviceColumnsReady) {
    return;
  }

  await addServiceColumn("ALTER TABLE Service ADD COLUMN serviceTime TEXT NULL");
  await addServiceColumn("ALTER TABLE Service ADD COLUMN amenPhone VARCHAR(191) NULL");
  await addServiceColumn("ALTER TABLE Service ADD COLUMN imageUrls TEXT NULL");
  serviceColumnsReady = true;
}

type ServiceExtras = {
  serviceTime: string | null;
  amenPhone: string | null;
  imageUrls: string[];
};

async function loadServiceExtras(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, ServiceExtras>();
  }

  await ensureServiceColumns();
  const rows = await prisma.$queryRaw<
    Array<{
      id: string;
      serviceTime: string | null;
      amenPhone: string | null;
      imageUrls: string | null;
      schedule: string | null;
    }>
  >`
    SELECT id, serviceTime, amenPhone, imageUrls, schedule
    FROM Service
    WHERE id IN (${Prisma.join(ids)})
  `;

  return new Map(
    rows.map((row) => [
      row.id,
      {
        serviceTime: row.serviceTime?.trim() || null,
        amenPhone: row.amenPhone?.trim() || null,
        imageUrls: parseStoredImageUrls(row.imageUrls, row.schedule),
      },
    ]),
  );
}

async function saveServiceExtras(
  id: string,
  data: {
    serviceTime?: string | null;
    amenPhone?: string | null;
    imageUrls?: string[];
    imageUrl?: string | null;
  },
) {
  await ensureServiceColumns();
  const imageUrls = normalizeServiceImageUrls(data.imageUrls, data.imageUrl);
  await prisma.$executeRaw`
    UPDATE Service
    SET serviceTime = ${data.serviceTime?.trim() || null},
        amenPhone = ${data.amenPhone?.trim() || null},
        imageUrls = ${imageUrls.length > 0 ? JSON.stringify(imageUrls) : null}
    WHERE id = ${id}
  `;
}

function withExtras(record: ServiceRecord, extras?: ServiceExtras): ServiceRecord {
  const imageUrls = extras?.imageUrls?.length
    ? extras.imageUrls
    : normalizeServiceImageUrls(record.imageUrls, record.imageUrl);

  return {
    ...record,
    serviceTime: extras?.serviceTime ?? record.serviceTime,
    amenPhone: extras?.amenPhone ?? record.amenPhone,
    imageUrls,
    imageUrl: imageUrls[0] ?? record.imageUrl,
  };
}

async function isServiceSlugTaken(slug: string, excludeId?: string) {
  const existing = await prisma.service.findFirst({
    where: {
      slug,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return Boolean(existing);
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

  if (parent.parentId) {
    throw new Error("لا يمكن إضافة قسم داخل قسم فرعي");
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

export async function listServiceRecords(
  parentId: string | null = null,
  queryText?: string,
) {
  await ensureServiceColumns();
  const q = queryText?.trim() ?? "";
  const rows = await prisma.service.findMany({
    where: {
      parentId,
      ...(q ? { title: { contains: q } } : {}),
    },
    orderBy: [{ order: "asc" }, { createdAt: "asc" }],
    include: serviceListInclude,
  });

  const extras = await loadServiceExtras(rows.map((row) => row.id));
  return rows.map((row) => withExtras(toRecord(row), extras.get(row.id)));
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
  await ensureServiceColumns();
  const row = await prisma.service.findFirst({
    where: { OR: [{ slug: id }, { id }] },
    include: {
      parent: { select: { id: true, title: true, slug: true } },
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

  const extras = await loadServiceExtras([row.id, ...row.children.map((child) => child.id)]);

  return {
    ...withExtras(toRecord(row), extras.get(row.id)),
    parent: row.parent,
    children: row.children.map((child) => withExtras(toRecord(child), extras.get(child.id))),
  };
}

export async function createServiceRecord(data: ServiceRecordInput) {
  await ensureServiceColumns();
  const parentId = await assertValidParent(data.parentId?.trim() || null);
  const maxOrder = await prisma.service.aggregate({
    where: { parentId },
    _max: { order: true },
  });
  const slug = await resolveUniqueSlug(data.slug, data.title, (value) =>
    isServiceSlugTaken(value),
  );

  const created = await prisma.service.create({
    data: {
      title: data.title,
      description: data.description,
      slug,
      schedule: normalizeServiceImageUrls(data.imageUrls, data.imageUrl)[0] ?? "",
      type: "OTHER",
      order: (maxOrder._max.order ?? -1) + 1,
      parentId,
      imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    },
  });

  await saveServiceExtras(created.id, data);
  return created;
}

export async function updateServiceRecord(id: string, data: ServiceRecordInput) {
  await ensureServiceColumns();
  const parentId = await assertValidParent(data.parentId?.trim() || null, id);
  const slug = await resolveUniqueSlug(data.slug, data.title, (value) =>
    isServiceSlugTaken(value, id),
  );

  const updated = await prisma.service.update({
    where: { id },
    data: {
      title: data.title,
      description: data.description,
      slug,
      schedule: normalizeServiceImageUrls(data.imageUrls, data.imageUrl)[0] ?? "",
      parentId,
      imageDisplayMode: parseImageDisplayMode(data.imageDisplayMode),
    },
  });

  await saveServiceExtras(id, data);
  return updated;
}

export async function deleteServiceRecord(id: string) {
  return prisma.service.delete({ where: { id } });
}
