"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";
import {
  updateMediaCollectionOrders,
  updateMediaItemOrders,
} from "@/lib/media-db";

export type ReorderModel =
  | "Priest"
  | "Relic"
  | "ChurchActivity"
  | "LiturgyEntry"
  | "Service"
  | "NewsEvent"
  | "MediaCollection"
  | "MediaItem";

export type ReorderActionResult =
  | { success: true }
  | { success: false; error: string };

export async function updateItemOrder(
  model: ReorderModel,
  items: { id: string; order: number }[],
): Promise<ReorderActionResult> {
  const session = await requireAdmin();

  if (!session) {
    return { success: false, error: "يجب تسجيل الدخول للمتابعة" };
  }

  if (items.length === 0) {
    return { success: true };
  }

  try {
    if (model === "Priest") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.priest.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "Relic") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.relic.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "ChurchActivity") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.churchActivity.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "LiturgyEntry") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.liturgyEntry.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "Service") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.service.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "NewsEvent") {
      await prisma.$transaction(
        items.map((item) =>
          prisma.newsEvent.update({
            where: { id: item.id },
            data: { order: item.order },
          }),
        ),
      );
    } else if (model === "MediaCollection") {
      await updateMediaCollectionOrders(items);
    } else {
      await updateMediaItemOrders(items);
    }
  } catch {
    return { success: false, error: "تعذر حفظ الترتيب" };
  }

  revalidatePath("/");
  revalidatePath("/admin");

  if (model === "Priest") {
    revalidatePath("/admin/priests");
    revalidatePath("/priests");
  } else if (model === "Relic") {
    revalidatePath("/admin/relics");
  } else if (model === "ChurchActivity") {
    revalidatePath("/admin/activities");
  } else if (model === "LiturgyEntry") {
    revalidatePath("/admin/liturgies");
    revalidatePath("/liturgies");
    revalidatePath("/prayers");
  } else if (model === "Service") {
    revalidatePath("/admin/services");
    revalidatePath("/sectors");
    revalidatePath("/services");
  } else if (model === "NewsEvent") {
    revalidatePath("/admin/news");
  } else {
    revalidatePath("/admin/media");
    revalidatePath("/admin/media", "layout");
    revalidatePath("/media");
    revalidatePath("/media", "layout");
  }

  return { success: true };
}
