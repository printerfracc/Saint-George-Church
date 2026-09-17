"use server";

import { Prisma } from "@prisma/client";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { servantListWhere } from "@/lib/servant-filters";

export type ServantAssignmentChip = {
  id: string;
  khedmaName: string;
  categoryLabel: string;
};

export type ServantRecord = {
  id: string;
  name: string;
  phone: string | null;
  nationalId: string | null;
  status: string | null;
  newUser: boolean | null;
  createdAt: Date;
  assignments: ServantAssignmentChip[];
};

export type ServantListFilters = {
  roleType?: string;
  khedmaId?: string;
  unassignedOnly?: boolean;
};

export type ServantMutationResult =
  | { success: true; servant: ServantRecord }
  | { error: string };

export type GetServantsResult =
  | {
      success: true;
      servants: ServantRecord[];
      total: number;
      page: number;
      limit: number;
    }
  | { error: string };

function emptyToNull(value?: string | null) {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function isUniquePhoneError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

export async function createServant(input: {
  name: string;
  phone?: string;
  nationalId?: string;
  status?: string;
}): Promise<ServantMutationResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const name = input.name.trim();

  if (!name) {
    return { error: "يرجى إدخال اسم الخادم" };
  }

  const phone = emptyToNull(input.phone);
  const nationalId = emptyToNull(input.nationalId);
  const status = emptyToNull(input.status);

  try {
    const servant = await prisma.servant.create({
      data: {
        name,
        phone,
        nationalId,
        status,
      },
    });

    return { success: true, servant: { ...servant, assignments: [] } };
  } catch (error) {
    if (isUniquePhoneError(error)) {
      return { error: "رقم الموبايل مسجّل بالفعل لخادم آخر" };
    }

    return { error: "تعذر إضافة الخادم حالياً. حاول مرة أخرى." };
  }
}

export async function updateServant(
  id: string,
  data: {
    name?: string;
    phone?: string;
    nationalId?: string;
    status?: string;
  },
): Promise<ServantMutationResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  if (!id.trim()) {
    return { error: "تعذر تحديد الخادم المطلوب تعديله" };
  }

  const payload: {
    name?: string;
    phone?: string | null;
    nationalId?: string | null;
    status?: string | null;
  } = {};

  if (data.name !== undefined) {
    const name = data.name.trim();

    if (!name) {
      return { error: "يرجى إدخال اسم الخادم" };
    }

    payload.name = name;
  }

  if (data.phone !== undefined) {
    payload.phone = emptyToNull(data.phone);
  }

  if (data.nationalId !== undefined) {
    payload.nationalId = emptyToNull(data.nationalId);
  }

  if (data.status !== undefined) {
    payload.status = emptyToNull(data.status);
  }

  try {
    const servant = await prisma.servant.update({
      where: { id },
      data: payload,
    });

    return { success: true, servant: { ...servant, assignments: [] } };
  } catch (error) {
    if (isUniquePhoneError(error)) {
      return { error: "رقم الموبايل مسجّل بالفعل لخادم آخر" };
    }

    return { error: "تعذر تعديل بيانات الخادم حالياً. حاول مرة أخرى." };
  }
}

export async function deleteServant(
  id: string,
): Promise<{ success: true } | { error: string }> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  if (!id.trim()) {
    return { error: "تعذر تحديد الخادم المطلوب حذفه" };
  }

  try {
    await prisma.$transaction([
      prisma.servantAssignment.deleteMany({ where: { servantId: id } }),
      prisma.servant.delete({ where: { id } }),
    ]);

    return { success: true };
  } catch {
    return { error: "تعذر حذف الخادم حالياً. حاول مرة أخرى." };
  }
}

export async function getServants(
  query?: string,
  page?: number,
  limit?: number,
  filters?: ServantListFilters,
): Promise<GetServantsResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const trimmedQuery = query?.trim() ?? "";
  const currentPage = Math.max(1, page ?? 1);
  const pageSize = Math.min(100, Math.max(1, limit ?? 50));
  const where = servantListWhere({
    query: trimmedQuery,
    roleType: filters?.roleType,
    khedmaId: filters?.khedmaId,
    unassignedOnly: filters?.unassignedOnly,
  });

  try {
    const [servants, total] = await Promise.all([
      prisma.servant.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include: {
          assignments: {
            include: {
              category: {
                select: {
                  label: true,
                  khedma: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
      prisma.servant.count({ where }),
    ]);

    return {
      success: true,
      servants: servants.map((servant) => ({
        id: servant.id,
        name: servant.name,
        phone: servant.phone,
        nationalId: servant.nationalId,
        status: servant.status,
        newUser: servant.newUser,
        createdAt: servant.createdAt,
        assignments: servant.assignments.map((assignment) => ({
          id: assignment.id,
          khedmaName: assignment.category.khedma.name,
          categoryLabel: assignment.category.label,
        })),
      })),
      total,
      page: currentPage,
      limit: pageSize,
    };
  } catch {
    return { error: "تعذر تحميل قائمة الخدام حالياً. حاول مرة أخرى." };
  }
}

export async function listKhedmaFilters() {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return [];
  }

  try {
    return prisma.khedma.findMany({
      orderBy: [{ tawze3a: { createdAt: "desc" } }, { order: "asc" }],
      select: {
        id: true,
        name: true,
        tawze3a: {
          select: { title: true },
        },
      },
    });
  } catch {
    return [];
  }
}
