"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteAdminAccount } from "@/actions/admin-management";
import {
  AdminEmptyState,
  AdminMobileCard,
  AdminResponsiveTable,
} from "@/components/admin/admin-ui";
import type { Role } from "@prisma/client";

export type AdminAccountRow = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

const accountRoleLabels: Record<Role, string> = {
  SUPER_ADMIN: "مدير عام",
  ADMIN: "أدمن عام",
  TAWZE3A_ADMIN: "أدمن التوزيعة",
  MONASBAT_ADMIN: "مسئول سجل المناسبات",
};

export default function AdminUsersTable({
  users,
  currentUserId,
}: {
  users: AdminAccountRow[];
  currentUserId: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  function handleDelete(user: AdminAccountRow) {
    if (user.id === currentUserId) {
      setError("لا يمكنك حذف حسابك الشخصي");
      return;
    }

    if (!window.confirm("هل أنت متأكد من حذف هذا الحساب؟")) {
      return;
    }

    setError("");
    setDeletingId(user.id);

    startTransition(() => {
      void deleteAdminAccount(user.id)
        .then((result) => {
          setDeletingId(null);

          if ("error" in result) {
            setError(result.error);
            return;
          }

          router.refresh();
        })
        .catch(() => {
          setDeletingId(null);
          setError("غير مصرح لك بتنفيذ هذه العملية");
        });
    });
  }

  if (users.length === 0) {
    return <AdminEmptyState>لا توجد حسابات بعد</AdminEmptyState>;
  }

  return (
    <div className="space-y-3">
      {error ? (
        <p role="alert" className="text-sm font-medium text-deep-red">
          {error}
        </p>
      ) : null}

      <AdminResponsiveTable
        empty={false}
        emptyLabel="لا توجد حسابات بعد"
        colSpan={4}
        head={
          <>
            <th className="px-4 py-3 font-bold">الاسم</th>
            <th className="px-4 py-3 font-bold">البريد الإلكتروني</th>
            <th className="px-4 py-3 font-bold">الصلاحية</th>
            <th className="px-4 py-3 font-bold">الإجراء</th>
          </>
        }
        cards={users.map((user) => (
          <AdminMobileCard key={user.id}>
            <p className="font-bold text-deep-red">{user.name}</p>
            <p className="mt-1 break-all text-sm text-deep-red/80" dir="ltr">
              {user.email}
            </p>
            <p className="mt-2 text-sm font-bold text-coptic-gold-dark">
              {accountRoleLabels[user.role]}
            </p>
            <div className="mt-4">
              <DeleteAccountButton
                disabled={user.id === currentUserId || (isPending && deletingId === user.id)}
                isOwnAccount={user.id === currentUserId}
                isDeleting={isPending && deletingId === user.id}
                onClick={() => handleDelete(user)}
              />
            </div>
          </AdminMobileCard>
        ))}
        rows={users.map((user) => (
          <tr key={user.id} className="border-t border-coptic-gold-main/20 text-deep-red">
            <td className="px-4 py-3 font-bold">{user.name}</td>
            <td className="px-4 py-3" dir="ltr">
              {user.email}
            </td>
            <td className="px-4 py-3">{accountRoleLabels[user.role]}</td>
            <td className="px-4 py-3">
              <DeleteAccountButton
                disabled={user.id === currentUserId || (isPending && deletingId === user.id)}
                isOwnAccount={user.id === currentUserId}
                isDeleting={isPending && deletingId === user.id}
                onClick={() => handleDelete(user)}
              />
            </td>
          </tr>
        ))}
      />
    </div>
  );
}

function DeleteAccountButton({
  disabled,
  isOwnAccount,
  isDeleting,
  onClick,
}: {
  disabled: boolean;
  isOwnAccount: boolean;
  isDeleting: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={isOwnAccount ? "لا يمكن حذف حسابك الشخصي" : "حذف الحساب"}
      title={isOwnAccount ? "لا يمكنك حذف حسابك الشخصي" : "حذف الحساب"}
      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border border-deep-red/30 text-deep-red transition-colors hover:bg-deep-red hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
    >
      {isDeleting ? (
        <span className="h-4 w-4 animate-spin rounded-full border-2 border-deep-red/30 border-t-deep-red" />
      ) : (
        <TrashIcon />
      )}
    </button>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        d="M5 7h14M10 11v6M14 11v6M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2m7 0-1 12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2L4 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
