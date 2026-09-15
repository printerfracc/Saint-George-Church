"use client";

import { useState } from "react";
import {
  buildWhatsAppInviteLink,
  getInvitationStatus,
  invitationStatusLabel,
} from "@/lib/invite-status";
import {
  AdminEmptyState,
  AdminMobileCard,
  AdminResponsiveTable,
  adminActionOutline,
} from "@/components/admin/admin-ui";

export type InvitationRow = {
  id: string;
  email: string;
  token: string;
  createdAt: string;
  expiresAt: string;
  used: boolean;
};

export default function InvitationsTable({
  invitations,
  appUrl,
}: {
  invitations: InvitationRow[];
  appUrl: string;
}) {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function copyWhatsAppLink(invitation: InvitationRow) {
    const inviteUrl = `${appUrl}/admin/join?token=${invitation.token}`;
    const whatsappUrl = buildWhatsAppInviteLink(inviteUrl);

    try {
      await navigator.clipboard.writeText(whatsappUrl);
      setCopiedId(invitation.id);
    } catch {
      window.prompt("انسخ رابط واتساب:", whatsappUrl);
    }
  }

  if (invitations.length === 0) {
    return <AdminEmptyState>لا توجد دعوات بعد</AdminEmptyState>;
  }

  return (
    <AdminResponsiveTable
      empty={false}
      emptyLabel="لا توجد دعوات بعد"
      colSpan={4}
      head={
        <>
          <th className="px-4 py-3 font-bold">البريد الإلكتروني</th>
          <th className="px-4 py-3 font-bold">تاريخ الإنشاء</th>
          <th className="px-4 py-3 font-bold">الحالة</th>
          <th className="px-4 py-3 font-bold">الإجراء</th>
        </>
      }
      cards={invitations.map((invitation) => {
        const status = getInvitationStatus(invitation.used, invitation.expiresAt);

        return (
          <AdminMobileCard key={invitation.id}>
            <p className="break-all font-bold text-deep-red" dir="ltr">
              {invitation.email}
            </p>
            <p className="mt-1 text-sm text-deep-red/80">
              {new Date(invitation.createdAt).toLocaleString("ar-EG")}
            </p>
            <p className="mt-2">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  status === "active"
                    ? "bg-green-100 text-green-800"
                    : status === "used"
                      ? "bg-gold/20 text-deep-red"
                      : "bg-coptic-gold-main/15 text-coptic-gold-dark"
                }`}
              >
                {invitationStatusLabel[status]}
              </span>
            </p>
            <button
              type="button"
              onClick={() => void copyWhatsAppLink(invitation)}
              className={`${adminActionOutline} mt-3`}
            >
              {copiedId === invitation.id ? "تم نسخ الرابط" : "نسخ رابط واتساب"}
            </button>
          </AdminMobileCard>
        );
      })}
      rows={invitations.map((invitation) => {
        const status = getInvitationStatus(invitation.used, invitation.expiresAt);

        return (
          <tr key={invitation.id} className="border-t border-gold/20 text-deep-red">
            <td className="px-4 py-3">{invitation.email}</td>
            <td className="whitespace-nowrap px-4 py-3">
              {new Date(invitation.createdAt).toLocaleString("ar-EG")}
            </td>
            <td className="px-4 py-3">
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  status === "active"
                    ? "bg-green-100 text-green-800"
                    : status === "used"
                      ? "bg-gold/20 text-deep-red"
                      : "bg-coptic-gold-main/15 text-coptic-gold-dark"
                }`}
              >
                {invitationStatusLabel[status]}
              </span>
            </td>
            <td className="px-4 py-3">
              <button
                type="button"
                onClick={() => void copyWhatsAppLink(invitation)}
                className={adminActionOutline}
              >
                {copiedId === invitation.id ? "تم نسخ الرابط" : "نسخ رابط واتساب"}
              </button>
            </td>
          </tr>
        );
      })}
    />
  );
}
