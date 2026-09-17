"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireTawze3aAdmin } from "@/lib/require-admin";

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
  servant: ServantSearchHit;
};

export type BuilderCategory = {
  id: string;
  label: string;
  roleType: string;
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

const DEFAULT_KHEDMA_CATEGORIES = [
  { label: "أمين الخدمة", roleType: "AMEN", order: 0 },
  { label: "أمينة الخدمة", roleType: "AMEN", order: 1 },
  { label: "نائب الأمين", roleType: "NA2EB", order: 2 },
  { label: "نائبة الأمينة", roleType: "NA2EB", order: 3 },
  { label: "خدام", roleType: "KHADEM", order: 4 },
  { label: "خادمات", roleType: "KHADEM", order: 5 },
] as const;

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
  servant: ServantSearchHit;
}): BuilderAssignment {
  return {
    id: assignment.id,
    servant: assignment.servant,
  };
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

export async function getTawze3a(id: string): Promise<BuilderTawze3a | null> {
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
              include: {
                assignments: {
                  include: {
                    servant: {
                      select: { id: true, name: true, phone: true },
                    },
                  },
                },
              },
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
        categories: khedma.categories.map((category) => ({
          id: category.id,
          label: category.label,
          roleType: category.roleType,
          order: category.order,
          assignments: category.assignments.map(mapAssignment),
        })),
      })),
    };
  } catch {
    return null;
  }
}

export async function getKhedma(
  tawze3aId: string,
  khedmaId: string,
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
          include: {
            assignments: {
              include: {
                servant: {
                  select: { id: true, name: true, phone: true },
                },
              },
            },
          },
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
        categories: row.categories.map((category) => ({
          id: category.id,
          label: category.label,
          roleType: category.roleType,
          order: category.order,
          assignments: category.assignments.map(mapAssignment),
        })),
      },
    };
  } catch {
    return null;
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
        categories: {
          create: DEFAULT_KHEDMA_CATEGORIES.map((category) => ({ ...category })),
        },
      },
      include: {
        categories: {
          orderBy: { order: "asc" },
          include: {
            assignments: {
              include: {
                servant: { select: { id: true, name: true, phone: true } },
              },
            },
          },
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
        categories: created.categories.map((category) => ({
          id: category.id,
          label: category.label,
          roleType: category.roleType,
          order: category.order,
          assignments: category.assignments.map(mapAssignment),
        })),
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
): Promise<{ success: true; assignment: BuilderAssignment } | { success: false; error: string }> {
  const auth = await ensureTawze3aAdmin();
  if (auth !== true) return auth;

  try {
    const [category, servant, existing] = await Promise.all([
      prisma.khedmaCategory.findUnique({
        where: { id: categoryId },
        select: { khedma: { select: { id: true, tawze3aId: true } } },
      }),
      prisma.servant.findUnique({
        where: { id: servantId },
        select: { id: true, name: true, phone: true },
      }),
      prisma.servantAssignment.findFirst({
        where: { categoryId, servantId },
        select: { id: true },
      }),
    ]);

    if (!category) {
      return { success: false, error: "التصنيف غير موجود" };
    }

    if (!servant) {
      return { success: false, error: "الخادم غير موجود" };
    }

    if (existing) {
      return { success: false, error: "هذا الخادم مضاف بالفعل إلى هذا التصنيف" };
    }

    const assignment = await prisma.servantAssignment.create({
      data: { categoryId, servantId },
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
    revalidateTawze3aPaths(
      assignment.category.khedma.tawze3aId,
      assignment.category.khedma.id,
    );
    return { success: true };
  } catch {
    return { success: false, error: "تعذر إزالة الخادم. حاول مرة أخرى." };
  }
}
