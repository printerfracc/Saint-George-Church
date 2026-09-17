"use server";

import crypto from "crypto";
import { getRequestInviteUrl } from "@/lib/request-app-url";
import { inviteEmailContent, sendChurchEmail } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/require-admin";
import { isInviteAssignableRole, type InviteAssignableRole } from "@/lib/roles";
import { describeAuthId, resolveSuperAdmin } from "@/lib/session-user";

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

function prismaErrorInfo(error: unknown) {
  if (error && typeof error === "object") {
    const typed = error as {
      code?: string;
      message?: string;
      meta?: unknown;
    };

    return {
      code: typed.code,
      message: typed.message,
      meta: typed.meta,
    };
  }

  return { message: String(error) };
}

export async function inviteAdmin(
  emailInput: string,
  roleInput: string,
): Promise<InviteAdminResult> {
  const session = await requireSuperAdmin();

  if (!session) {
    console.info("[inviteAdmin] blocked: no super-admin session");
    return { success: false, error: "هذه العملية متاحة للمسؤول الأعلى فقط" };
  }

  const creator = await resolveSuperAdmin(session);

  if (!creator) {
    console.info("[inviteAdmin] blocked: session did not resolve to SUPER_ADMIN");
    return { success: false, error: "هذه العملية متاحة للمسؤول الأعلى فقط" };
  }

  const email = emailInput.trim().toLowerCase();

  console.info("[inviteAdmin] start", {
    sessionUser: describeAuthId(session.user.id),
    creator: describeAuthId(creator.id),
    usingCreatorFromDb: creator.id !== session.user.id,
    targetEmailLength: email.length,
    roleInput,
  });

  if (!EMAIL_PATTERN.test(email)) {
    return { success: false, error: "يرجى إدخال بريد إلكتروني صحيح" };
  }

  if (!isInviteAssignableRole(roleInput)) {
    return { success: false, error: "يرجى اختيار صلاحية صحيحة للدعوة" };
  }

  const role: InviteAssignableRole = roleInput;

  let existingUser;

  try {
    existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
  } catch (error) {
    console.error("[inviteAdmin] existing user lookup failed", prismaErrorInfo(error));
    return { success: false, error: "تعذر التحقق من البريد حالياً. حاول مرة أخرى." };
  }

  if (existingUser) {
    return { success: false, error: "هذا البريد مسجّل بالفعل كمسؤول" };
  }

  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000);

  try {
    const created = await prisma.inviteToken.create({
      data: {
        token,
        email,
        role,
        expiresAt,
        used: false,
        creator: {
          connect: { id: creator.id },
        },
      },
      select: { id: true, role: true, createdBy: true },
    });

    console.info("[inviteAdmin] invite created", {
      inviteId: created.id,
      role: created.role,
      createdBy: describeAuthId(created.createdBy),
    });
  } catch (error) {
    console.error("[inviteAdmin] inviteToken.create failed", {
      ...prismaErrorInfo(error),
      creator: describeAuthId(creator.id),
      sessionUser: describeAuthId(session.user.id),
    });
    return { success: false, error: "تعذر إنشاء الدعوة. حاول مرة أخرى." };
  }

  const inviteUrl = await getRequestInviteUrl(token);
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
    console.info("[inviteAdmin] invite email sent");
  } catch (error) {
    emailSent = false;
    console.error("[inviteAdmin] invite email failed", prismaErrorInfo(error));
  }

  return {
    success: true,
    inviteUrl,
    emailSent,
  };
}
