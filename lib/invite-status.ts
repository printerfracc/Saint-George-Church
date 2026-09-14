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
  const message = `السلام عليكم،
تمت دعوتك للانضمام كمسؤول إلى موقع ${CHURCH_NAME}.
أكمل التسجيل من هذا الرابط خلال 48 ساعة:
${inviteUrl}`;

  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}
