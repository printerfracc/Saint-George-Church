"use server";

import { Prisma } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { uploadImageToCloudinary, type CloudinaryUploadResult } from "@/lib/cloudinary";
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
  address: string | null;
  bloodType: string | null;
  graduationYear: string | null;
  jobOrStudy: string | null;
  previousKhedmas: string | null;
  deaconRank: string | null;
  extraNotes: string | null;
  photoUrl: string | null;
  createdAt: Date;
  assignments: ServantAssignmentChip[];
};

export type ServantListFilters = {
  roleIds?: string[];
  khedmaIds?: string[];
  year?: number;
  assignedToOtherKhedma?: boolean;
  bloodType?: string;
  deaconRank?: string;
};

function optionalText(max: number) {
  return z
    .string()
    .trim()
    .max(max, "النص أطول من المسموح")
    .optional()
    .nullable()
    .transform((value) => {
      const text = value?.trim() ?? "";
      return text.length > 0 ? text : null;
    });
}

const optionalServantText = optionalText(191);
const optionalPhotoUrl = optionalText(2048);

const servantWriteSchema = z.object({
  name: z.string().trim().min(1, "يرجى إدخال اسم الخادم"),
  phone: optionalServantText,
  nationalId: optionalServantText,
  address: optionalServantText,
  bloodType: optionalServantText,
  graduationYear: optionalServantText,
  jobOrStudy: optionalServantText,
  previousKhedmas: optionalServantText,
  deaconRank: optionalServantText,
  extraNotes: optionalServantText,
  photoUrl: optionalPhotoUrl,
});

type ServantWriteData = z.infer<typeof servantWriteSchema>;

type ServantProfile = {
  address: string | null;
  bloodType: string | null;
  graduationYear: string | null;
  jobOrStudy: string | null;
  previousKhedmas: string | null;
  deaconRank: string | null;
  extraNotes: string | null;
  photoUrl: string | null;
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

function profileFromWrite(data: ServantWriteData): ServantProfile {
  return {
    address: data.address,
    bloodType: data.bloodType,
    graduationYear: data.graduationYear,
    jobOrStudy: data.jobOrStudy,
    previousKhedmas: data.previousKhedmas,
    deaconRank: data.deaconRank,
    extraNotes: data.extraNotes,
    photoUrl: data.photoUrl,
  };
}

function parseServantWrite(input: unknown): { data: ServantWriteData } | { error: string } {
  const parsed = servantWriteSchema.safeParse(input);

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "يرجى مراجعة البيانات" };
  }

  return { data: parsed.data };
}

function uniqueSorted(values: Array<string | null | undefined>) {
  const unique = new Set<string>();

  for (const value of values) {
    const text = value?.trim() ?? "";

    if (text) {
      unique.add(text);
    }
  }

  return [...unique].sort((left, right) => left.localeCompare(right, "ar"));
}

function toServantRecord(
  servant: ServantProfile & {
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
    address: servant.address,
    bloodType: servant.bloodType,
    graduationYear: servant.graduationYear,
    jobOrStudy: servant.jobOrStudy,
    previousKhedmas: servant.previousKhedmas,
    deaconRank: servant.deaconRank,
    extraNotes: servant.extraNotes,
    photoUrl: servant.photoUrl,
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

export async function uploadServantPhoto(formData: FormData): Promise<CloudinaryUploadResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { success: false, error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const file = formData.get("file");

  if (!(file instanceof File)) {
    return { success: false, error: "يرجى اختيار صورة للرفع" };
  }

  return uploadImageToCloudinary(file);
}

export async function createServant(input: {
  name: string;
  phone?: string | null;
  nationalId?: string | null;
  status?: string | null;
  address?: string | null;
  bloodType?: string | null;
  graduationYear?: string | null;
  jobOrStudy?: string | null;
  previousKhedmas?: string | null;
  deaconRank?: string | null;
  extraNotes?: string | null;
  photoUrl?: string | null;
}): Promise<ServantMutationResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  const parsed = parseServantWrite(input);

  if ("error" in parsed) {
    return parsed;
  }

  const status = emptyToNull(input.status);

  try {
    const servant = await prisma.servant.create({
      data: {
        name: parsed.data.name,
        status,
        ...profileFromWrite(parsed.data),
        ...phoneSecretFields(parsed.data.phone),
        ...nationalIdSecretFields(parsed.data.nationalId),
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
    phone?: string | null;
    nationalId?: string | null;
    status?: string | null;
    address?: string | null;
    bloodType?: string | null;
    graduationYear?: string | null;
    jobOrStudy?: string | null;
    previousKhedmas?: string | null;
    deaconRank?: string | null;
    extraNotes?: string | null;
    photoUrl?: string | null;
  },
): Promise<ServantMutationResult> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return { error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  if (!id.trim()) {
    return { error: "تعذر تحديد الخادم المطلوب تعديله" };
  }

  const parsed = parseServantWrite({ name: data.name ?? "", ...data });

  if ("error" in parsed) {
    return parsed;
  }

  const payload: Prisma.ServantUpdateInput = {
    name: parsed.data.name,
    ...profileFromWrite(parsed.data),
    ...phoneSecretFields(parsed.data.phone),
    ...nationalIdSecretFields(parsed.data.nationalId),
  };

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
      bloodType: filters?.bloodType,
      deaconRank: filters?.deaconRank,
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

export async function listServantFieldOptions(): Promise<{
  bloodTypes: string[];
  deaconRanks: string[];
}> {
  const session = await requireTawze3aAdmin();

  if (!session) {
    return {
      bloodTypes: [],
      deaconRanks: [],
    };
  }

  try {
    const [bloodRows, rankRows] = await Promise.all([
      prisma.servant.findMany({
        where: { AND: [{ bloodType: { not: null } }, { NOT: { bloodType: "" } }] },
        distinct: ["bloodType"],
        select: { bloodType: true },
      }),
      prisma.servant.findMany({
        where: { AND: [{ deaconRank: { not: null } }, { NOT: { deaconRank: "" } }] },
        distinct: ["deaconRank"],
        select: { deaconRank: true },
      }),
    ]);

    return {
      bloodTypes: uniqueSorted(bloodRows.map((row) => row.bloodType)),
      deaconRanks: uniqueSorted(rankRows.map((row) => row.deaconRank)),
    };
  } catch {
    return {
      bloodTypes: [],
      deaconRanks: [],
    };
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
