"use server";

import crypto from "crypto";
import { getInviteUrl } from "@/lib/app-url";
import { inviteEmailContent, sendChurchEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-admin";

export type InviteAdminResult =
  | {
      success: true;
      inviteUrl: string;
      emailSent: boolean;
    }
  | {
      success: false;
      error: string;
    };

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function inviteAdmin(emailInput: string): Promise<InviteAdminResult> {
  const session = await requireSuperAdmin();

  if (!session) {
    return { success: false, error: "هذه العملية متاحة للمسؤول الأعلى فقط" };
  }

  const email = emailInput.trim().toLowerCase();

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "يرجى إدخال بريد إلكتروني صحيح" };
  }

  let existingUser;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch {
    return { success: false, error: "تعذر التحقق من البريد حالياً. حاول مرة أخرى." };
  }

  if (existingUser) {
    return { success: false, error: "هذا البريد مسجّل بالفعل كمسؤول" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  try {
    await prisma.inviteToken.create({
      data: {
        token,
        email,
        expiresAt,
        used: false,
        createdBy: session.user.id,
      },
    });
  } catch {
    return { success: false, error: "تعذر إنشاء الدعوة. حاول مرة أخرى." };
  }

  const inviteUrl = getInviteUrl(token);
  const emailContent = inviteEmailContent(inviteUrl);
  let emailSent = false;

  try {
    await sendChurchEmail({
      to: email,
      subject: emailContent.subject,
      text: emailContent.text,
      html: emailContent.html,
    });
    emailSent = true;
  } catch {
    emailSent = false;
  }

  return {
    success: true,
    inviteUrl,
    emailSent,
  };
}
