"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type DeleteAdminAccountResult =
  | { success: true }
  | { error: string };

export async function deleteAdminAccount(
  userId: string,
): Promise<DeleteAdminAccountResult> {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "SUPER_ADMIN") {
    throw new Error("Unauthorized");
  }

  if (userId === session.user.id) {
    return { error: "لا يمكنك حذف حسابك الشخصي" };
  }

  try {
    const target = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!target) {
      return { error: "الحساب غير موجود" };
    }

    await prisma.user.delete({ where: { id: userId } });
    revalidatePath("/admin/users");
    return { success: true };
  } catch {
    return { error: "تعذر حذف الحساب. حاول مرة أخرى." };
  }
}
