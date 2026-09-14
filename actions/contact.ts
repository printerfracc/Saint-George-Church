"use server";

import nodemailer from "nodemailer";
import { CHURCH_NAME } from "@/lib/church";
import { prayerRequestEmailTemplate } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/require-admin";

export type ContactActionResult =
  | { success: true }
  | { success: false; error: string };

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const PRAYER_REQUEST_RECIPIENTS =
  "fracc2009@gmail.com, bishowesa@gmail.com";

export async function submitPrayerRequest(
  formData: FormData,
): Promise<ContactActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();

  if (!name) {
    return { success: false, error: "يرجى إدخال الاسم" };
  }

  if (!message) {
    return { success: false, error: "يرجى كتابة الرسالة أو الطلب" };
  }

  try {
    await prisma.prayerRequest.create({
      data: { name, message },
    });
  } catch {
    return { success: false, error: "تعذر حفظ الطلب. حاول مرة أخرى." };
  }

  try {
    await transporter.sendMail({
      from: `${CHURCH_NAME} <${process.env.SMTP_FROM ?? process.env.SMTP_USER}>`,
      to: PRAYER_REQUEST_RECIPIENTS,
      subject: `طلب صلاة/افتقاد جديد من: ${name}`,
      text: `الاسم: ${name}\n\nالرسالة / الطلب:\n${message}`,
      html: prayerRequestEmailTemplate(name, message),
    });
  } catch {
    // The request is already saved for the admin dashboard.
  }

  return { success: true };
}

export async function listPrayerRequests() {
  const session = await requireAdmin();

  if (!session) {
    return [];
  }

  try {
    return await prisma.prayerRequest.findMany({
      orderBy: { createdAt: "desc" },
    });
  } catch {
    return [];
  }
}
