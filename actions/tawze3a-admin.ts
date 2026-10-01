"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import type { ServantRoleOption } from "@/lib/servant-roles";
import { calendarYear } from "@/lib/tawze3a-year";

export type Tawze3aActionResult =
  | { success: true }
  | { success: false; error: string };

export type ServantSearchHit = {
  id: string;
  name: string;
  phone: string | null;
};

export type Tawze3aListItem = {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
  createdAtLabel: string;
  khedmaCount: number;
};

export type BuilderAssignment = {
  id: string;
  isDraft: boolean;
  servant: ServantSearchHit;
};

export type BuilderCategory = {
  id: string;
  label: string;
  roleId: string;
  roleName: string;
  order: number;
  assignments: BuilderAssignment[];
};

export type BuilderKhedma = {
  id: string;
  name: string;
  order: number;
  categories: BuilderCategory[];
};

export type BuilderTawze3a = {
  id: string;
  title: string;
  isPublished: boolean;
  khedmat: BuilderKhedma[];
};

function builderCategoryInclude(year: number) {
  return {
    role: { select: { id: true, name: true } },
    assignments: {
      where: { year },
      include: {
        servant: { select: { id: true, name: true, phone: true } },
      },
    },
  };
}

async function ensureTawze3aAdmin(): Promise<true | { success: false; error: string }> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { success: false, error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  return true;
}

function revalidateTawze3aPaths(id?: string, khedmaId?: string) {
  revalidatePath("/tawze3a");
  revalidatePath("/tawze3a/login");
  revalidatePath("/admin/tawze3a");
  revalidatePath("/", "layout");

  if (id) {
    revalidatePath(`/admin/tawze3a/${id}`);
  }

  if (id && khedmaId) {
    revalidatePath(`/admin/tawze3a/${id}/khedma/${khedmaId}`);
  }
}

function mapAssignment(assignment: {
  id: string;
  isDraft: boolean;
  servant: ServantSearchHit;
}): BuilderAssignment {
  return {
    id: assignment.id,
    isDraft: assignment.isDraft,
    servant: assignment.servant,
  };
}

function mapCategory(category: {
  id: string;
  label: string;
  order: number;
  roleId: string | null;
  role: { id: string; name: string } | null;
  assignments: Array<{ id: string; isDraft: boolean; servant: ServantSearchHit }>;
}): BuilderCategory {
  return {
    id: category.id,
    label: category.label,
    roleId: category.roleId ?? category.role?.id ?? "",
    roleName: category.role?.name ?? category.label,
    order: category.order,
    assignments: category.assignments.map(mapAssignment),
  };
}

async function ensureCategoryForRole(
  khedmaId: string,
  role: { id: string; name: string },
) {
  const existing = await prisma.khedmaCategory.findFirst({
    where: { khedmaId, roleId: role.id },
  });

  if (existing) {
    return existing;
  }

  const maxOrder = await prisma.khedmaCategory.aggregate({
    where: { khedmaId },
    _max: { order: true },
  });

  return prisma.khedmaCategory.create({
    data: {
      khedmaId,
      label: role.name,
      roleId: role.id,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });
}

export async function listServantRoles(): Promise<ServantRoleOption[]> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return [];

  try {
    return prisma.servantRole.findMany({
      where: { assignments: { some: {} } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    });
  } catch {
    return [];
  }
}

export async function listTawze3at(): Promise<Tawze3aListItem[]> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return [];

  try {
    const rows = await prisma.tawze3a.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { khedmat: true } } },
    });

    return rows.map((row) => ({
      id: row.id,
      title: row.title,
      isPublished: row.isPublished,
      createdAt: row.createdAt.toISOString(),
      createdAtLabel: row.createdAt.toLocaleDateString("ar-EG", {
        year: "numeric",
        month: "short",
        day: "numeric",
      }),
      khedmaCount: row._count.khedmat,
    }));
  } catch {
    return [];
  }
}

export async function getTawze3a(
  id: string,
  year = calendarYear(),
): Promise<BuilderTawze3a | null> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return null;

  try {
    const row = await prisma.tawze3a.findUnique({
      where: { id },
      include: {
        khedmat: {
          orderBy: { order: "asc" },
          include: {
            categories: {
              orderBy: { order: "asc" },
              include: builderCategoryInclude(year),
            },
          },
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      title: row.title,
      isPublished: row.isPublished,
      khedmat: row.khedmat.map((khedma) => ({
        id: khedma.id,
        name: khedma.name,
        order: khedma.order,
        categories: khedma.categories.map(mapCategory),
      })),
    };
  } catch {
    return null;
  }
}

export async function getKhedma(
  tawze3aId: string,
  khedmaId: string,
  year = calendarYear(),
): Promise<{ tawze3a: { id: string; title: string }; khedma: BuilderKhedma } | null> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return null;

  try {
    const row = await prisma.khedma.findFirst({
      where: { id: khedmaId, tawze3aId },
      include: {
        tawze3a: { select: { id: true, title: true } },
        categories: {
          orderBy: { order: "asc" },
          include: builderCategoryInclude(year),
        },
      },
    });

    if (!row) return null;

    return {
      tawze3a: row.tawze3a,
      khedma: {
        id: row.id,
        name: row.name,
        order: row.order,
        categories: row.categories.map(mapCategory),
      },
    };
  } catch (error) {
    console.error("getKhedma failed", { tawze3aId, khedmaId, year }, error);
    throw error;
  }
}

export async function createTawze3a(title: string): Promise<
  | { success: true; id: string }
  | { success: false; error: string }
> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  const trimmed = title.trim();

  if (!trimmed) {
    return { success: false, error: "يرجى إدخال عنوان التوزيعة" };
  }

  try {
    const created = await prisma.tawze3a.create({
      data: {
        title: trimmed,
        isPublished: false,
      },
    });

    revalidateTawze3aPaths(created.id);
    return { success: true, id: created.id };
  } catch {
    return { success: false, error: "تعذر إنشاء التوزيعة. حاول مرة أخرى." };
  }
}

export async function togglePublishTawze3a(id: string): Promise<
  | { success: true; isPublished: boolean }
  | { success: false; error: string }
> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  try {
    const current = await prisma.tawze3a.findUnique({
      where: { id },
      select: { isPublished: true },
    });

    if (!current) {
      return { success: false, error: "التوزيعة غير موجودة" };
    }

    const updated = await prisma.tawze3a.update({
      where: { id },
      data: { isPublished: !current.isPublished },
    });

    revalidatePath("/tawze3a");
    revalidatePath("/tawze3a/login");
    revalidatePath("/admin/tawze3a");
    revalidatePath(`/admin/tawze3a/${id}`);
    revalidatePath("/", "layout");

    return { success: true, isPublished: updated.isPublished };
  } catch {
    return { success: false, error: "تعذر تحديث حالة النشر. حاول مرة أخرى." };
  }
}

export async function addKhedma(
  tawze3aId: string,
  name: string,
): Promise<{ success: true; khedma: BuilderKhedma } | { success: false; error: string }> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  const trimmed = name.trim();

  if (!trimmed) {
    return { success: false, error: "يرجى إدخال اسم الخدمة" };
  }

  try {
    const tawze3a = await prisma.tawze3a.findUnique({
      where: { id: tawze3aId },
      select: { id: true },
    });

    if (!tawze3a) {
      return { success: false, error: "التوزيعة غير موجودة" };
    }

    const maxOrder = await prisma.khedma.aggregate({
      where: { tawze3aId },
      _max: { order: true },
    });

    const created = await prisma.khedma.create({
      data: {
        tawze3aId,
        name: trimmed,
        order: (maxOrder._max.order ?? -1) + 1,
      },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: builderCategoryInclude(calendarYear()),
        },
      },
    });

    revalidateTawze3aPaths(tawze3aId);

    return {
      success: true,
      khedma: {
        id: created.id,
        name: created.name,
        order: created.order,
        categories: created.categories.map(mapCategory),
      },
    };
  } catch {
    return { success: false, error: "تعذر إضافة الخدمة. حاول مرة أخرى." };
  }
}

export async function deleteKhedma(khedmaId: string): Promise<Tawze3aActionResult> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  try {
    const khedma = await prisma.khedma.findUnique({
      where: { id: khedmaId },
      select: { tawze3aId: true },
    });

    if (!khedma) {
      return { success: false, error: "الخدمة غير موجودة" };
    }

    await prisma.khedma.delete({ where: { id: khedmaId } });
    revalidateTawze3aPaths(khedma.tawze3aId);
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف الخدمة. حاول مرة أخرى." };
  }
}

export async function updateCategoryLabel(
  categoryId: string,
  newLabel: string,
): Promise<Tawze3aActionResult> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  const trimmed = newLabel.trim();

  if (!trimmed) {
    return { success: false, error: "يرجى إدخال اسم التصنيف" };
  }

  try {
    const category = await prisma.khedmaCategory.findUnique({
      where: { id: categoryId },
      select: { khedma: { select: { id: true, tawze3aId: true } } },
    });

    if (!category) {
      return { success: false, error: "التصنيف غير موجود" };
    }

    await prisma.khedmaCategory.update({
      where: { id: categoryId },
      data: { label: trimmed },
    });

    revalidateTawze3aPaths(category.khedma.tawze3aId, category.khedma.id);
    return { success: true };
  } catch {
    return { success: false, error: "تعذر تحديث الاسم. حاول مرة أخرى." };
  }
}

export async function searchServants(query: string): Promise<
  | { success: true; servants: ServantSearchHit[] }
  | { success: false; error: string }
> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  const trimmed = query.trim();

  if (!trimmed) {
    return { success: true, servants: [] };
  }

  try {
    const servants = await prisma.servant.findMany({
      where: { name: { contains: trimmed } },
      select: { id: true, name: true, phone: true },
      orderBy: { name: "asc" },
      take: 12,
    });

    return { success: true, servants };
  } catch {
    return { success: false, error: "تعذر البحث في الخدام حالياً." };
  }
}

export async function assignServant(
  categoryId: string,
  servantId: string,
  roleId?: string,
  year = calendarYear(),
): Promise<{ success: true; assignment: BuilderAssignment } | { success: false; error: string }> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  try {
    const [category, servant] = await Promise.all([
      prisma.khedmaCategory.findUnique({
        where: { id: categoryId },
        select: {
          id: true,
          roleId: true,
          khedma: { select: { id: true, tawze3aId: true } },
        },
      }),
      prisma.servant.findUnique({
        where: { id: servantId },
        select: { id: true, name: true, phone: true },
      }),
    ]);

    if (!category) {
      return { success: false, error: "التصنيف غير موجود" };
    }

    if (!servant) {
      return { success: false, error: "الخادم غير موجود" };
    }

    const selectedRoleId = roleId || category.roleId;

    if (!selectedRoleId) {
      return { success: false, error: "يرجى اختيار رتبة الخادم" };
    }

    const role = await prisma.servantRole.findUnique({
      where: { id: selectedRoleId },
      select: { id: true, name: true },
    });

    if (!role) {
      return { success: false, error: "الرتبة غير موجودة" };
    }

    const targetCategory =
      category.roleId === role.id
        ? category
        : await ensureCategoryForRole(category.khedma.id, role);

    const existing = await prisma.servantAssignment.findFirst({
      where: {
        servantId,
        roleId: role.id,
        year,
        OR: [{ categoryId: targetCategory.id }, { khedmaId: category.khedma.id }],
      },
      select: { id: true },
    });

    if (existing) {
      return { success: false, error: "هذا الخادم مضاف بالفعل بهذه الرتبة في هذه الخدمة" };
    }

    const assignment = await prisma.servantAssignment.create({
      data: {
        categoryId: targetCategory.id,
        khedmaId: category.khedma.id,
        servantId,
        roleId: role.id,
        year,
        isDraft: true,
      },
      include: {
        servant: { select: { id: true, name: true, phone: true } },
      },
    });

    revalidateTawze3aPaths(category.khedma.tawze3aId, category.khedma.id);
    return { success: true, assignment: mapAssignment(assignment) };
  } catch {
    return { success: false, error: "تعذر إضافة الخادم. حاول مرة أخرى." };
  }
}

export async function removeServantAssignment(
  assignmentId: string,
): Promise<Tawze3aActionResult> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  try {
    const assignment = await prisma.servantAssignment.findUnique({
      where: { id: assignmentId },
      select: {
        category: { select: { khedma: { select: { id: true, tawze3aId: true } } } },
      },
    });

    if (!assignment) {
      return { success: false, error: "التعيين غير موجود" };
    }

    await prisma.servantAssignment.delete({ where: { id: assignmentId } });

    if (assignment.category?.khedma) {
      revalidateTawze3aPaths(
        assignment.category.khedma.tawze3aId,
        assignment.category.khedma.id,
      );
    } else {
      revalidateTawze3aPaths();
    }
    return { success: true };
  } catch {
    return { success: false, error: "تعذر إزالة الخادم. حاول مرة أخرى." };
  }
}

export async function publishAssignmentYear(year: number): Promise<Tawze3aActionResult> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    return { success: false, error: "السنة غير صالحة" };
  }

  try {
    const result = await prisma.servantAssignment.updateMany({
      where: { year, isDraft: true },
      data: { isDraft: false },
    });

    if (result.count === 0) {
      return { success: false, error: "لا توجد مسودات في هذه السنة" };
    }

    revalidateTawze3aPaths();
    revalidatePath("/admin/servants");
    return { success: true };
  } catch {
    return { success: false, error: "تعذر نشر تعيينات السنة. حاول مرة أخرى." };
  }
}
