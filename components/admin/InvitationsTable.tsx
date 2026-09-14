"use client";

import { useState } from "react";
import {
  buildWhatsAppInviteLink,
  getInvitationStatus,
  invitationStatusLabel,
} from "@/lib/invite-status";

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
    return (
      <p className="rounded-2xl border border-dashed border-gold/50 bg-white/60 px-4 py-8 text-center text-sm text-deep-red/70">
        لا توجد دعوات بعد
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-gold/50 bg-white/80 shadow-sm">
      <table className="min-w-full text-right text-sm">
        <caption className="sr-only">قائمة دعوات المسؤولين</caption>
        <thead className="bg-gray-900 text-coptic-gold-main">
          <tr>
            <th className="px-4 py-3 font-bold">البريد الإلكتروني</th>
            <th className="px-4 py-3 font-bold">تاريخ الإنشاء</th>
            <th className="px-4 py-3 font-bold">الحالة</th>
            <th className="px-4 py-3 font-bold">الإجراء</th>
          </tr>
        </thead>
        <tbody>
          {invitations.map((invitation) => {
            const status = getInvitationStatus(
              invitation.used,
              invitation.expiresAt,
            );

            return (
              <tr
                key={invitation.id}
                className="border-t border-gold/20 text-deep-red"
              >
                <td className="px-4 py-3">{invitation.email}</td>
                <td className="px-4 py-3 whitespace-nowrap">
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
                    className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main bg-cream px-3 text-xs font-bold text-coptic-gold-dark transition hover:bg-coptic-gold-main/15"
                  >
                    {copiedId === invitation.id
                      ? "تم نسخ الرابط"
                      : "نسخ رابط واتساب"}
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
