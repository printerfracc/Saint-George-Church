import { CHURCH_NAME } from "@/lib/church";

export type InvitationStatus = "active" | "expired" | "used";

export function getInvitationStatus(
  used: boolean,
  expiresAt: Date | string,
): InvitationStatus {
  if (used) {
    return "used";
  }

  const expiry =
    typeof expiresAt === "string" ? new Date(expiresAt).getTime() : expiresAt.getTime();

  if (expiry < Date.now()) {
    return "expired";
  }

  return "active";
}

export const invitationStatusLabel: Record<InvitationStatus, string> = {
  active: "مفعلة",
  expired: "منتهية",
  used: "مستخدمة",
};

export function buildWhatsAppInviteLink(inviteUrl: string) {
  const message = `بركة الرب معكم،
ندعوكم للانضمام كمسؤول على موقع ${CHURCH_NAME}.
أكملوا إنشاء الحساب خلال 48 ساعة من هذا الرابط:
${inviteUrl}

بركة القديس مارجرجس تكون معكم.`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
