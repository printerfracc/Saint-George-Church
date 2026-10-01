"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { servantListWhere } from "@/lib/servant-filters";
import { wipeServantRolesAndCategories } from "@/lib/tawze3a-wipe";
import { calendarYear } from "@/lib/tawze3a-year";

export type ServantAssignmentChip = {
  id: string;
  khedmaId: string;
  khedmaName: string;
  roleId: string;
  roleName: string;
  year: number;
  isDraft: boolean;
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
  roleIds?: string[];
  khedmaIds?: string[];
  year?: number;
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

function uniqueConstraintText(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    const target = error.meta?.target;
    const fields = (Array.isArray(target) ? target : target != null ? [target] : []).map(String);
    return fields.join(" ");
  }

  if (!(error instanceof Error)) {
    return null;
  }

  const message = error.message;
  const isDuplicate =
    message.includes("1062") ||
    message.includes("Duplicate entry") ||
    message.includes("P2002");

  return isDuplicate ? message : null;
}

function uniqueConstraintMessage(error: unknown) {
  const text = uniqueConstraintText(error);

  if (!text) {
    return null;
  }

  const joined = text.toLowerCase();

  if (joined.includes("national")) {
    return "الرقم القومي مسجل بالفعل لخادم آخر";
  }

  if (joined.includes("phone")) {
    return "رقم الموبايل مسجل بالفعل لخادم آخر";
  }

  return null;
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
    const uniqueMessage = uniqueConstraintMessage(error);

    if (uniqueMessage) {
      return { error: uniqueMessage };
    }

    console.error("createServant failed", error);
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
    const uniqueMessage = uniqueConstraintMessage(error);

    if (uniqueMessage) {
      return { error: uniqueMessage };
    }

    console.error("updateServant failed", error);
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

export async function deleteAllServants(): Promise<
  { success: true; count: number } | { error: string }
> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  try {
    await wipeServantRolesAndCategories();
    const deletedServants = await prisma.servant.deleteMany();

    revalidatePath("/admin/servants");
    revalidatePath("/admin/tawze3a");
    revalidatePath("/tawze3a");
    revalidatePath("/", "layout");

    return { success: true, count: deletedServants.count };
  } catch (error) {
    console.error("deleteAllServants failed", error);
    return { error: "تعذر حذف جميع الخدام حالياً. حاول مرة أخرى." };
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
  const year = filters?.year ?? calendarYear();
  const where = servantListWhere({
    query: trimmedQuery,
    roleIds: filters?.roleIds ?? [],
    khedmaIds: filters?.khedmaIds ?? [],
    year,
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
            where: { year },
            include: {
              khedma: true,
              role: true,
              category: {
                include: {
                  khedma: true,
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
          khedmaId: assignment.khedmaId ?? assignment.khedma?.id ?? assignment.category?.khedmaId ?? "",
          khedmaName: assignment.khedma?.name ?? assignment.category?.khedma?.name ?? "",
          roleId: assignment.roleId,
          roleName: assignment.role?.name ?? "",
          year: assignment.year,
          isDraft: assignment.isDraft,
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
      where: { assignments: { some: {} } },
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
