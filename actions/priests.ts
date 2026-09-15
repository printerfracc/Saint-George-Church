"use server";

import { revalidatePath } from "next/cache";
import { connect } from "@tidbcloud/serverless";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import { composePartialDate, parsePartialDate } from "@/lib/admin-labels";

export type PriestActionResult =
  | { success: true }
  | { success: false; error: string };

export type PriestData = {
  name: string;
  ordinationDate: string;
  confessionSchedule: string;
  cloudinaryImageUrl?: string | null;
  bio?: string | null;
  qommosiyaDegree?: string | null;
  deathDate?: string | null;
  contactNumbers?: string | null;
};

async function ensureAdmin(): Promise<PriestActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

let priestColumnsReady = false;

async function addPriestColumn(sql: string) {
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

export async function ensurePriestColumns() {
  if (priestColumnsReady) {
    return;
  }

  await addPriestColumn(
    "ALTER TABLE Priest ADD COLUMN qommosiyaDegree VARCHAR(191) NULL",
  );
  await addPriestColumn(
    "ALTER TABLE Priest ADD COLUMN deathDate DATETIME(3) NULL",
  );
  await addPriestColumn(
    "ALTER TABLE Priest ADD COLUMN ordinationDateText VARCHAR(32) NULL",
  );
  await addPriestColumn(
    "ALTER TABLE Priest ADD COLUMN deathDateText VARCHAR(32) NULL",
  );

  priestColumnsReady = true;
}

function toDateTime(value: string | null, label: string) {
  if (!value) {
    return null;
  }

  const iso = /^\d{4}-\d{2}$/.test(value) ? `${value}-01` : value;
  const date = new Date(`${iso}T12:00:00.000Z`);

  if (Number.isNaN(date.getTime())) {
    throw new Error(`تاريخ ${label} غير صالح`);
  }

  return date;
}

function parsePriestData(data: PriestData) {
  const name = data.name.trim();
  const confessionSchedule = data.confessionSchedule.trim();
  const cloudinaryImageUrl = data.cloudinaryImageUrl?.trim() || null;
  const bio = data.bio?.trim() || null;
  const qommosiyaDegree = data.qommosiyaDegree?.trim() || null;
  const contactNumbers = data.contactNumbers?.trim() || null;
  const ordinationDateText = composePartialDate(
    parsePartialDate(data.ordinationDate),
    true,
    "الرسامة",
  );
  const deathDateText = composePartialDate(
    parsePartialDate(data.deathDate),
    false,
    "الوفاة",
  );
  const ordinationDate = toDateTime(ordinationDateText, "الرسامة");
  const deathDate = toDateTime(deathDateText, "الوفاة");

  if (!name) {
    throw new Error("يرجى إدخال اسم الكاهن");
  }

  if (!ordinationDate || !ordinationDateText) {
    throw new Error("يرجى إدخال تاريخ الرسامة");
  }

  return {
    name,
    ordinationDate,
    ordinationDateText,
    confessionSchedule,
    cloudinaryImageUrl,
    bio,
    qommosiyaDegree,
    deathDate,
    deathDateText,
    contactNumbers,
  };
}

function revalidatePriests() {
  revalidatePath("/admin/priests");
  revalidatePath("/admin");
  revalidatePath("/priests");
  revalidatePath("/");
}

export async function listPriests() {
  try {
    await ensurePriestColumns();
    return await prisma.priest.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}

export async function createPriest(data: PriestData): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await ensurePriestColumns();
    await prisma.priest.create({
      data: parsePriestData(data),
    });
    revalidatePriests();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ بيانات الكاهن",
    };
  }
}

export async function updatePriest(
  id: string,
  data: PriestData,
): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await ensurePriestColumns();
    await prisma.priest.update({
      where: { id },
      data: parsePriestData(data),
    });
    revalidatePriests();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث بيانات الكاهن",
    };
  }
}

export async function deletePriest(id: string): Promise<PriestActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.priest.delete({ where: { id } });
    revalidatePriests();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف الكاهن" };
  }
}
