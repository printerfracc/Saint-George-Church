import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import type { ServantImportRow } from "@/lib/servant-import-schema";
import { getCurrentActiveYear } from "@/lib/tawze3a-year";

export type ServantChunkResult = {
  imported: number;
  skipped: number;
  failed: number;
  details?: string;
};

type RoleRecord = { id: string; name: string };
type KhedmaRecord = { id: string; name: string };

function isUniqueConstraint(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
}

function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : "تعذر حفظ الصف";
}

function revalidateServantImportPaths(tawze3aId?: string) {
  revalidatePath("/admin/servants");
  revalidatePath("/admin/tawze3a");
  revalidatePath("/tawze3a");
  revalidatePath("/tawze3a/login");
  revalidatePath("/", "layout");

  if (tawze3aId) {
    revalidatePath(`/admin/tawze3a/${tawze3aId}`);
  }
}

async function ensureTawze3a() {
  const existing = await prisma.tawze3a.findFirst({
    orderBy: [{ isPublished: "desc" }, { createdAt: "desc" }],
    select: { id: true },
  });

  if (existing) {
    return existing.id;
  }

  const created = await prisma.tawze3a.create({
    data: { title: "توزيعة الخدام", isPublished: false },
    select: { id: true },
  });

  return created.id;
}

async function findExistingServant(input: {
  name: string;
  phone: string | null;
  nationalId: string | null;
}) {
  if (input.nationalId) {
    return prisma.servant.findUnique({ where: { nationalId: input.nationalId } });
  }

  if (input.phone) {
    return prisma.servant.findUnique({ where: { phone: input.phone } });
  }

  return prisma.servant.findFirst({
    where: { name: input.name, nationalId: null, phone: null },
    orderBy: { createdAt: "asc" },
  });
}

async function upsertServant(input: {
  name: string;
  phone: string | null;
  nationalId: string | null;
}) {
  const existing = await findExistingServant(input);

  if (existing) {
    try {
      return await prisma.servant.update({
        where: { id: existing.id },
        data: {
          name: input.name,
          ...(input.phone ? { phone: input.phone } : {}),
          ...(input.nationalId ? { nationalId: input.nationalId } : {}),
        },
      });
    } catch (error) {
      if (!isUniqueConstraint(error)) {
        throw error;
      }

      return prisma.servant.update({
        where: { id: existing.id },
        data: { name: input.name },
      });
    }
  }

  try {
    return await prisma.servant.create({
      data: {
        name: input.name,
        phone: input.phone,
        nationalId: input.nationalId,
      },
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) {
      throw error;
    }

    const raced = await findExistingServant(input);

    if (raced) {
      return prisma.servant.update({
        where: { id: raced.id },
        data: { name: input.name },
      });
    }

    return prisma.servant.create({
      data: {
        name: input.name,
        phone: null,
        nationalId: input.nationalId,
      },
    });
  }
}

async function ensureRole(name: string, cache: Map<string, RoleRecord>) {
  const cached = cache.get(name);

  if (cached) {
    return cached;
  }

  const existing = await prisma.servantRole.findUnique({ where: { name } });

  if (existing) {
    cache.set(name, existing);
    return existing;
  }

  try {
    const created = await prisma.servantRole.create({ data: { name } });
    cache.set(name, created);
    return created;
  } catch (error) {
    if (!isUniqueConstraint(error)) {
      throw error;
    }

    const raced = await prisma.servantRole.findUnique({ where: { name } });

    if (!raced) {
      throw error;
    }

    cache.set(name, raced);
    return raced;
  }
}

async function ensureCategory(
  khedmaId: string,
  role: RoleRecord,
  cache: Map<string, string>,
) {
  const cacheKey = `${khedmaId}:${role.id}`;
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const existing = await prisma.khedmaCategory.findFirst({
    where: { khedmaId, roleId: role.id },
    select: { id: true },
  });

  if (existing) {
    cache.set(cacheKey, existing.id);
    return existing.id;
  }

  const maxOrder = await prisma.khedmaCategory.aggregate({
    where: { khedmaId },
    _max: { order: true },
  });

  const created = await prisma.khedmaCategory.create({
    data: {
      khedmaId,
      label: role.name,
      roleId: role.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    select: { id: true },
  });

  cache.set(cacheKey, created.id);
  return created.id;
}

async function ensureKhedmaByName(
  tawze3aId: string,
  name: string,
  cache: Map<string, KhedmaRecord>,
) {
  const cacheKey = name.toLowerCase();
  const cached = cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const existing = await prisma.khedma.findFirst({
    where: { name, tawze3aId },
    select: { id: true, name: true },
  });

  if (existing) {
    cache.set(cacheKey, existing);
    return existing;
  }

  const maxOrder = await prisma.khedma.aggregate({
    where: { tawze3aId },
    _max: { order: true },
  });

  const created = await prisma.khedma.create({
    data: {
      tawze3aId,
      name,
      order: (maxOrder._max.order ?? -1) + 1,
    },
    select: { id: true, name: true },
  });

  cache.set(cacheKey, created);
  return created;
}

async function ensureRoleOnlyAssignment(servantId: string, roleId: string, year: number) {
  const existing = await prisma.servantAssignment.findFirst({
    where: { servantId, roleId, khedmaId: null, categoryId: null, year },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  try {
    await prisma.servantAssignment.create({
      data: { servantId, roleId, year, isDraft: false },
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) {
      throw error;
    }
  }
}

async function assignToKhedma(
  servantId: string,
  khedma: KhedmaRecord,
  role: RoleRecord,
  categoryCache: Map<string, string>,
  year: number,
) {
  const categoryId = await ensureCategory(khedma.id, role, categoryCache);

  try {
    await prisma.servantAssignment.upsert({
      where: {
        servantId_khedmaId_year_roleId: {
          servantId,
          khedmaId: khedma.id,
          year,
          roleId: role.id,
        },
      },
      create: {
        servantId,
        khedmaId: khedma.id,
        roleId: role.id,
        categoryId,
        year,
        isDraft: false,
      },
      update: {
        categoryId,
      },
    });
  } catch (error) {
    if (!isUniqueConstraint(error)) {
      throw error;
    }
  }

  await prisma.servantAssignment.deleteMany({
    where: { servantId, roleId: role.id, khedmaId: null, categoryId: null, year },
  });
}

async function importRow(
  row: ServantImportRow,
  caches: {
    roles: Map<string, RoleRecord>;
    khedmas: Map<string, KhedmaRecord>;
    categories: Map<string, string>;
    tawze3aId: { current: string | null };
  },
  year: number,
) {
  const servant = await upsertServant({
    name: row.name,
    phone: row.mobilePhone,
    nationalId: row.nationalId,
  });
  const role = await ensureRole(row.role, caches.roles);
  const khedmaNames = row.khedmas ?? [];
  let linked = false;

  async function tawze3aId() {
    if (!caches.tawze3aId.current) {
      caches.tawze3aId.current = await ensureTawze3a();
    }

    return caches.tawze3aId.current;
  }

  if (row.khedmaId) {
    const khedma = await prisma.khedma.findFirst({
      where: { id: row.khedmaId, tawze3aId: await tawze3aId() },
      select: { id: true, name: true },
    });

    if (khedma) {
      caches.khedmas.set(khedma.name.toLowerCase(), khedma);
      await assignToKhedma(servant.id, khedma, role, caches.categories, year);
      linked = true;
    }
  }

  for (const name of khedmaNames) {
    const khedma = await ensureKhedmaByName(await tawze3aId(), name, caches.khedmas);
    await assignToKhedma(servant.id, khedma, role, caches.categories, year);
    linked = true;
  }

  if (!linked) {
    await ensureRoleOnlyAssignment(servant.id, role.id, year);
  }
}

export async function importServantChunk(rows: ServantImportRow[]): Promise<ServantChunkResult> {
  if (rows.length === 0) {
    return { imported: 0, skipped: 0, failed: 0 };
  }

  const year = await getCurrentActiveYear();
  const caches = {
    roles: new Map<string, RoleRecord>(),
    khedmas: new Map<string, KhedmaRecord>(),
    categories: new Map<string, string>(),
    tawze3aId: { current: null as string | null },
  };

  let imported = 0;
  let skipped = 0;
  let failed = 0;
  const failures: string[] = [];

  for (const row of rows) {
    try {
      await importRow(row, caches, year);
      imported += 1;
    } catch (error) {
      if (isUniqueConstraint(error)) {
        skipped += 1;
        continue;
      }

      failed += 1;
      const message = errorMessage(error);
      failures.push(`${row.name} / ${row.role}: ${message}`);
      console.error("Failed to import servant row", { name: row.name, role: row.role, error });
    }
  }

  if (imported > 0) {
    revalidateServantImportPaths(caches.tawze3aId.current ?? undefined);
  }

  return {
    imported,
    skipped,
    failed,
    details: failures.length > 0 ? failures.slice(0, 5).join(" | ") : undefined,
  };
}
