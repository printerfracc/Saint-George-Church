"use server";

import { revalidatePath } from "next/cache";
import { readServantContact } from "@/lib/crypto";
import { normalizeArabic } from "@/lib/arabicNormalizer";
import { prisma } from "@/lib/prisma";
import { requireRegistryAdmin } from "@/lib/require-admin";
import {
  toBaptismCreateData,
  toDepartedCreateData,
  toMarriageCreateData,
  nextRegistrySerial,
  type BaptismFormValues,
  type DepartedFormValues,
  type MarriageFormValues,
  type RegistryActionResult,
  type RegistryServantMatch,
} from "@/lib/registry";

const SERVANT_CACHE_MS = 30_000;

let servantDirectoryCache: { expiresAt: number; entries: RegistryServantMatch[] } | null = null;

async function ensureRegistryAdmin(): Promise<true | { success: false; error: string }> {
  const session = await requireRegistryAdmin();

  if (!session) {
    return { success: false, error: "غير مصرح لك بتنفيذ هذه العملية" };
  }

  return true;
}

function revalidateRegistry() {
  revalidatePath("/admin/registry");
  revalidatePath("/admin/anniversaries");
  revalidatePath("/admin");
}

function registryErrorMessage(error: unknown, fallback: string) {
  if (error instanceof Error && /[\u0600-\u06FF]/.test(error.message)) {
    return error.message;
  }

  return fallback;
}

function assertRecordId(id: string) {
  if (typeof id !== "string" || id.length < 8 || id.length > 64) {
    throw new Error("السجل غير موجود");
  }
}

async function loadServantDirectory() {
  const now = Date.now();

  if (servantDirectoryCache && servantDirectoryCache.expiresAt > now) {
    return servantDirectoryCache.entries;
  }

  const servants = await prisma.servant.findMany({
    select: { id: true, name: true, encryptedPhone: true },
    orderBy: { name: "asc" },
  });

  const entries = servants.map((servant) => ({
    id: servant.id,
    name: servant.name,
    phone: readServantContact({ encryptedPhone: servant.encryptedPhone }).phone,
  }));

  servantDirectoryCache = { expiresAt: now + SERVANT_CACHE_MS, entries };
  return entries;
}

export async function searchRegistryServants(query: string): Promise<
  | { success: true; servants: RegistryServantMatch[] }
  | { success: false; error: string }
> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  if (typeof query !== "string") {
    return { success: false, error: "تعذر البحث في الخدام حالياً." };
  }

  const trimmed = query.trim().slice(0, 80);

  if (!trimmed) {
    return { success: true, servants: [] };
  }

  try {
    const needle = normalizeArabic(trimmed);
    const servants = await loadServantDirectory();
    const matches = servants
      .filter((servant) => normalizeArabic(servant.name).includes(needle))
      .slice(0, 8);

    return { success: true, servants: matches };
  } catch {
    return { success: false, error: "تعذر البحث في الخدام حالياً." };
  }
}

async function allocateSerial(
  readSerials: () => Promise<Array<{ serialNumber: string | null }>>,
) {
  const rows = await readSerials();
  return nextRegistrySerial(rows.map((row) => row.serialNumber));
}

export async function createBaptismRecord(input: BaptismFormValues): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    const serialNumber = await allocateSerial(() =>
      prisma.baptismRecord.findMany({ select: { serialNumber: true } }),
    );
    await prisma.baptismRecord.create({ data: { ...toBaptismCreateData(input), serialNumber } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل المعمودية. حاول مرة أخرى.") };
  }
}

export async function updateBaptismRecord(
  id: string,
  input: BaptismFormValues,
): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    const existing = await prisma.baptismRecord.findUnique({
      where: { id },
      select: { id: true, serialNumber: true },
    });

    if (!existing) {
      return { success: false, error: "السجل غير موجود" };
    }

    const serialNumber =
      existing.serialNumber ??
      (await allocateSerial(() => prisma.baptismRecord.findMany({ select: { serialNumber: true } })));
    await prisma.baptismRecord.update({
      where: { id },
      data: { ...toBaptismCreateData(input), serialNumber },
    });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل المعمودية. حاول مرة أخرى.") };
  }
}

export async function deleteBaptismRecord(id: string): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    await prisma.baptismRecord.delete({ where: { id } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حذف سجل المعمودية.") };
  }
}

export async function createMarriageRecord(input: MarriageFormValues): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    const serialNumber = await allocateSerial(() =>
      prisma.marriageRecord.findMany({ select: { serialNumber: true } }),
    );
    await prisma.marriageRecord.create({ data: { ...toMarriageCreateData(input), serialNumber } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل الزواج. حاول مرة أخرى.") };
  }
}

export async function updateMarriageRecord(
  id: string,
  input: MarriageFormValues,
): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    const existing = await prisma.marriageRecord.findUnique({
      where: { id },
      select: { id: true, serialNumber: true },
    });

    if (!existing) {
      return { success: false, error: "السجل غير موجود" };
    }

    const serialNumber =
      existing.serialNumber ??
      (await allocateSerial(() => prisma.marriageRecord.findMany({ select: { serialNumber: true } })));
    await prisma.marriageRecord.update({
      where: { id },
      data: { ...toMarriageCreateData(input), serialNumber },
    });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل الزواج. حاول مرة أخرى.") };
  }
}

export async function deleteMarriageRecord(id: string): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    await prisma.marriageRecord.delete({ where: { id } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حذف سجل الزواج.") };
  }
}

export async function createDepartedRecord(input: DepartedFormValues): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    const serialNumber = await allocateSerial(() =>
      prisma.departedRecord.findMany({ select: { serialNumber: true } }),
    );
    await prisma.departedRecord.create({ data: { ...toDepartedCreateData(input), serialNumber } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل النياحة. حاول مرة أخرى.") };
  }
}

export async function updateDepartedRecord(
  id: string,
  input: DepartedFormValues,
): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    const existing = await prisma.departedRecord.findUnique({
      where: { id },
      select: { id: true, serialNumber: true },
    });

    if (!existing) {
      return { success: false, error: "السجل غير موجود" };
    }

    const serialNumber =
      existing.serialNumber ??
      (await allocateSerial(() => prisma.departedRecord.findMany({ select: { serialNumber: true } })));
    await prisma.departedRecord.update({
      where: { id },
      data: { ...toDepartedCreateData(input), serialNumber },
    });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حفظ سجل النياحة. حاول مرة أخرى.") };
  }
}

export async function deleteDepartedRecord(id: string): Promise<RegistryActionResult> {
  const auth = await ensureRegistryAdmin();
  if (auth !== true) return auth;

  try {
    assertRecordId(id);
    await prisma.departedRecord.delete({ where: { id } });
    revalidateRegistry();
    return { success: true };
  } catch (error) {
    return { success: false, error: registryErrorMessage(error, "تعذر حذف سجل النياحة.") };
  }
}
