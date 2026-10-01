"use server";

import { Prisma } from "@prisma/client";
import { connect } from "@tidbcloud/serverless";
import { revalidatePath } from "next/cache";
import { parseOptionalHref } from "@/lib/link-button";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type ActivityActionResult =
  | { success: true }
  | { success: false; error: string };

export type ActivityData = {
  name: string;
  description: string;
  imageUrl?: string | null;
  link?: string | null;
  linkLabel?: string | null;
};

async function ensureAdmin(): Promise<ActivityActionResult | true> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  return true;
}

let activityColumnsReady = false;

async function addActivityColumn(sql: string) {
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

export async function ensureActivityColumns() {
  if (activityColumnsReady) {
    return;
  }

  await addActivityColumn(
    "ALTER TABLE ChurchActivity ADD COLUMN linkLabel VARCHAR(191) NULL",
  );

  activityColumnsReady = true;
}

function parseActivityData(data: ActivityData) {
  const name = data.name.trim();
  const description = data.description.trim();
  const imageUrl = data.imageUrl?.trim() || null;
  const link = parseOptionalHref(data.link);
  const linkLabel = link ? data.linkLabel?.trim() || null : null;

  if (!name) {
    throw new Error("يرجى إدخال الاسم");
  }

  if (!description) {
    throw new Error("يرجى إدخال الوصف");
  }

  return { name, description, imageUrl, link, linkLabel };
}

async function saveActivityLinkLabel(id: string, linkLabel: string | null) {
  await ensureActivityColumns();
  await prisma.$executeRaw`
    UPDATE ChurchActivity
    SET linkLabel = ${linkLabel}
    WHERE id = ${id}
  `;
}

async function loadActivityLinkLabels(ids: string[]) {
  if (ids.length === 0) {
    return new Map<string, string | null>();
  }

  await ensureActivityColumns();

  try {
    const rows = await prisma.$queryRaw<
      Array<{ id: string; linkLabel: string | null }>
    >`
      SELECT id, linkLabel
      FROM ChurchActivity
      WHERE id IN (${Prisma.join(ids)})
    `;

    return new Map(rows.map((row) => [row.id, row.linkLabel?.trim() || null]));
  } catch {
    return new Map<string, string | null>();
  }
}

function revalidateActivities() {
  revalidatePath("/admin/activities");
  revalidatePath("/admin");
  revalidatePath("/");
}

export async function listActivities() {
  try {
    await ensureActivityColumns();
    const rows = await prisma.churchActivity.findMany({
      orderBy: { order: "asc" },
    });
    const labels = await loadActivityLinkLabels(rows.map((row) => row.id));

    return rows.map((row) => ({
      ...row,
      linkLabel: labels.get(row.id) ?? null,
    }));
  } catch {
    return [];
  }
}

export async function createActivity(
  data: ActivityData,
): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await ensureActivityColumns();
    const maxOrder = await prisma.churchActivity.aggregate({
      _max: { order: true },
    });
    const { linkLabel, ...record } = parseActivityData(data);
    const created = await prisma.churchActivity.create({
      data: {
        ...record,
        order: (maxOrder._max.order ?? -1) + 1,
      },
    });
    await saveActivityLinkLabel(created.id, linkLabel);
    revalidateActivities();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر حفظ بيانات النشاط",
    };
  }
}

export async function updateActivity(
  id: string,
  data: ActivityData,
): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await ensureActivityColumns();
    const { linkLabel, ...record } = parseActivityData(data);
    await prisma.churchActivity.update({
      where: { id },
      data: record,
    });
    await saveActivityLinkLabel(id, linkLabel);
    revalidateActivities();
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "تعذر تحديث بيانات النشاط",
    };
  }
}

export async function deleteActivity(id: string): Promise<ActivityActionResult> {
  const auth = await ensureAdmin();
  if (auth !== true) return auth;

  try {
    await prisma.churchActivity.delete({ where: { id } });
    revalidateActivities();
    return { success: true };
  } catch {
    return { success: false, error: "تعذر حذف النشاط" };
  }
}
