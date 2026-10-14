"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { nationalIdSecretFields, phoneSecretFields, readServantContact } from "@/lib/crypto";
import { requireTawze3aAdmin } from "@/lib/require-admin";
import { prisma } from "@/lib/prisma";
import { OTHER_KHEDMA_STATUS_ROLES } from "@/lib/servant-import-schema";
import { servantListWhere, servantMatchesSearchQuery, type ServantQueryFilters } from "@/lib/servant-filters";
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
  assignedToOtherKhedma?: boolean;
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

function encryptionConfigMessage(error: unknown) {
  if (error instanceof Error && error.message.includes("APP_ENCRYPTION_KEY")) {
    return "تعذر حفظ البيانات لأن مفتاح التشفير غير مُعد";
  }

  return null;
}

function toServantRecord(
  servant: {
    id: string;
    name: string;
    encryptedPhone: string | null;
    encryptedNationalId: string | null;
    status: string | null;
    newUser: boolean | null;
    createdAt: Date;
  },
  assignments: ServantAssignmentChip[] = [],
): ServantRecord {
  const contact = readServantContact(servant);

  return {
    id: servant.id,
    name: servant.name,
    phone: contact.phone,
    nationalId: contact.nationalId,
    status: servant.status,
    newUser: servant.newUser,
    createdAt: servant.createdAt,
    assignments,
  };
}

function mapServantAssignments(
  assignments: Array<{
    id: string;
    khedmaId: string | null;
    khedma: { id: string; name: string } | null;
    roleId: string;
    role: { name: string } | null;
    year: number;
    isDraft: boolean;
    category: { khedmaId: string; khedma: { name: string } | null } | null;
  }>,
): ServantAssignmentChip[] {
  return assignments.map((assignment) => ({
    id: assignment.id,
    khedmaId: assignment.khedmaId ?? assignment.khedma?.id ?? assignment.category?.khedmaId ?? "",
    khedmaName: assignment.khedma?.name ?? assignment.category?.khedma?.name ?? "",
    roleId: assignment.roleId,
    roleName: assignment.role?.name ?? "",
    year: assignment.year,
    isDraft: assignment.isDraft,
  }));
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
        status,
        ...phoneSecretFields(phone),
        ...nationalIdSecretFields(nationalId),
      },
    });

    return { success: true, servant: toServantRecord(servant) };
  } catch (error) {
    const uniqueMessage = encryptionConfigMessage(error) ?? uniqueConstraintMessage(error);

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

  const payload: Prisma.ServantUpdateInput = {};

  if (data.name !== undefined) {
    const name = data.name.trim();

    if (!name) {
      return { error: "يرجى إدخال اسم الخادم" };
    }

    payload.name = name;
  }

  if (data.phone !== undefined) {
    Object.assign(payload, phoneSecretFields(emptyToNull(data.phone)));
  }

  if (data.nationalId !== undefined) {
    Object.assign(payload, nationalIdSecretFields(emptyToNull(data.nationalId)));
  }

  if (data.status !== undefined) {
    payload.status = emptyToNull(data.status);
  }

  try {
    const servant = await prisma.servant.update({
      where: { id },
      data: payload,
    });

    return { success: true, servant: toServantRecord(servant) };
  } catch (error) {
    const uniqueMessage = encryptionConfigMessage(error) ?? uniqueConstraintMessage(error);

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

async function resolveServantListWhere(
  filters: ServantQueryFilters,
): Promise<ServantQueryFilters> {
  if (!filters.assignedToOtherKhedma) {
    return filters;
  }

  const roles = await prisma.servantRole.findMany({
    where: { name: { in: OTHER_KHEDMA_STATUS_ROLES.map((role) => role.name) } },
    select: { id: true },
  });
  const statusRoleIds = roles
    .map((role) => role.id)
    .filter((roleId) => filters.roleIds.includes(roleId));

  if (statusRoleIds.length === 0) {
    return { ...filters, assignedToOtherKhedma: false };
  }

  return { ...filters, statusRoleIds };
}

export async function clearServantStatusRole(
  servantId: string,
  year: number,
  roleName: string,
): Promise<{ success: true } | { error: string }> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const allowed = OTHER_KHEDMA_STATUS_ROLES.some((role) => role.name === roleName);

  if (!servantId.trim() || !Number.isInteger(year) || !allowed) {
    return { error: "تعذر تحديد الخادم المطلوب" };
  }

  try {
    await prisma.servantAssignment.deleteMany({
      where: {
        servantId,
        year,
        role: { name: roleName },
      },
    });

    revalidatePath("/admin/servants");
    revalidatePath("/admin/tawze3a");
    revalidatePath("/tawze3a");
    revalidatePath("/tawze3a/login");

    return { success: true };
  } catch (error) {
    console.error("clearServantStatusRole failed", error);
    return { error: "تعذر إزالة الصفة حالياً. حاول مرة أخرى." };
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
  const where = servantListWhere(
    await resolveServantListWhere({
      roleIds: filters?.roleIds ?? [],
      khedmaIds: filters?.khedmaIds ?? [],
      year,
      assignedToOtherKhedma: filters?.assignedToOtherKhedma,
    }),
  );
  const include = {
    assignments: {
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
  } as const;

  try {
    if (trimmedQuery) {
      const servants = await prisma.servant.findMany({
        where,
        orderBy: { name: "asc" },
        include,
      });
      const matched = servants
        .map((servant) => toServantRecord(servant, mapServantAssignments(servant.assignments)))
        .filter((servant) => servantMatchesSearchQuery(servant, trimmedQuery));
      const start = (currentPage - 1) * pageSize;

      return {
        success: true,
        servants: matched.slice(start, start + pageSize),
        total: matched.length,
        page: currentPage,
        limit: pageSize,
      };
    }

    const [servants, total] = await Promise.all([
      prisma.servant.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (currentPage - 1) * pageSize,
        take: pageSize,
        include,
      }),
      prisma.servant.count({ where }),
    ]);

    return {
      success: true,
      servants: servants.map((servant) =>
        toServantRecord(servant, mapServantAssignments(servant.assignments)),
      ),
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
