"use server";

import { redirect } from "next/navigation";
import { hashForLookup, readServantContact } from "@/lib/crypto";
import { prisma } from "@/lib/prisma";
import {
  clearServantSessionCookie,
  setServantSessionCookie,
} from "@/lib/servant-session";

export type ServantLoginResult = { success: true } | { error: string };

function sanitizePhone(value: string) {
  return value.replace(/[\s-]/g, "").trim();
}

export async function loginServant(formData: FormData): Promise<ServantLoginResult> {
  const trimmedPhone = sanitizePhone(String(formData.get("phone") ?? ""));
  const trimmedLast4 = String(formData.get("nationalIdLast4") ?? "").trim();

  if (!trimmedPhone) {
    return { error: "يرجى إدخال رقم الموبايل" };
  }

  if (!/^\d{4}$/.test(trimmedLast4)) {
    return { error: "يرجى إدخال آخر 4 أرقام من الرقم القومي" };
  }

  try {
    const servant = await prisma.servant.findUnique({
      where: { phoneHash: hashForLookup(trimmedPhone) },
      select: {
        id: true,
        name: true,
        encryptedNationalId: true,
      },
    });

    if (!servant) {
      return {
        error: "رقم الموبايل هذا غير مسجل في قاعدة بيانات الخدام",
      };
    }

    const nationalId = readServantContact(servant).nationalId;

    if (!nationalId) {
      return {
        error:
          "الرقم القومي غير مسجل لهذا الحساب، يرجى مراجعة مسؤول التوزيعة لاستكمال بياناتك",
      };
    }

    if (!nationalId.endsWith(trimmedLast4)) {
      return {
        error:
          "آخر 4 أرقام من الرقم القومي غير صحيحة، يرجى التأكد والمحاولة مرة أخرى",
      };
    }

    await setServantSessionCookie({
      servantId: servant.id,
      name: servant.name,
    });

    return { success: true };
  } catch {
    return { error: "تعذر تسجيل الدخول حالياً. حاول مرة أخرى." };
  }
}

export async function logoutServant() {
  await clearServantSessionCookie();
  redirect("/tawze3a/login");
}
