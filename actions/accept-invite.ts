"use server";

import { hash } from "bcryptjs";
import { redirect, unstable_rethrow } from "next/navigation";
import { prisma } from "@/lib/prisma";

export type AcceptInviteState = {
  error?: string;
};

export async function acceptInvite(
  _prevState: AcceptInviteState,
  formData: FormData,
): Promise<AcceptInviteState> {
  const token = String(formData.get("token") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  if (!token) {
    return { error: "رابط الدعوة غير صالح" };
  }

  if (!name) {
    return { error: "يرجى إدخال الاسم" };
  }

  if (password.length < 8) {
    return { error: "يجب أن تتكون كلمة المرور من 8 أحرف على الأقل" };
  }

  if (password !== confirmPassword) {
    return { error: "كلمتا المرور غير متطابقتين" };
  }

  try {
    const invite = await prisma.inviteToken.findUnique({
      where: { token },
    });

    if (!invite || invite.used || invite.expiresAt.getTime() < Date.now()) {
      return { error: "هذه الدعوة غير صالحة أو منتهية الصلاحية" };
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: invite.email },
      select: { id: true },
    });

    if (existingUser) {
      return { error: "هذا البريد مسجّل بالفعل" };
    }

    const hashedPassword = await hash(password, 12);

    await prisma.$transaction([
      prisma.user.create({
        data: {
          name,
          email: invite.email,
          password: hashedPassword,
          role: "ADMIN",
        },
      }),
      prisma.inviteToken.update({
        where: { id: invite.id },
        data: { used: true },
      }),
    ]);
  } catch (error) {
    unstable_rethrow(error);
    return { error: "تعذر إكمال التسجيل حالياً. حاول مرة أخرى." };
  }

  redirect("/admin/login");
}
