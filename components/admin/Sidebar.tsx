"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import ChurchLogo from "@/components/ChurchLogo";
import { roleLabels } from "@/lib/admin-labels";
import { CHURCH_NAME } from "@/lib/church";
import type { Role } from "@prisma/client";

const navItems = [
  { href: "/admin", label: "لوحة التحكم" },
  { href: "/admin/content", label: "إدارة المحتوى" },
  { href: "/admin/eed-content", label: "محتوى عيد الخدام" },
  { href: "/admin/liturgies", label: "إدارة صلوات الكنيسة" },
  { href: "/admin/relics", label: "إدارة المزار والرفات" },
  { href: "/admin/activities", label: "إدارة الأنشطة" },
  { href: "/admin/priests", label: "إدارة الكهنة" },
  { href: "/admin/services", label: "قطاعات الخدمات" },
  { href: "/admin/media", label: "الوسائط والمكتبة" },
  { href: "/admin/gallery", label: "إدارة الصور" },
  { href: "/admin/prayer-requests", label: "طلبات الصلاة والافتقاد" },
  { href: "/admin/news", label: "الأخبار" },
  { href: "/admin/tawze3a", label: "إدارة التوزيعة", tawze3aRolesOnly: true },
  { href: "/admin/servants", label: "إدارة الخدام", tawze3aRolesOnly: true },
  { href: "/admin/birthdays", label: "أعياد الميلاد", tawze3aRolesOnly: true },
  { href: "/admin/invitations", label: "الدعوات", superAdminOnly: true },
  { href: "/admin/users", label: "إدارة الحسابات", superAdminOnly: true },
] as const;

export default function Sidebar({
  userName,
  userRole,
}: {
  userName: string;
  userRole: Role;
}) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const items = navItems.filter((item) => {
    if ("superAdminOnly" in item && item.superAdminOnly) {
      return userRole === "SUPER_ADMIN";
    }

    if ("tawze3aRolesOnly" in item && item.tawze3aRolesOnly) {
      return userRole === "TAWZE3A_ADMIN";
    }

    if (userRole === "TAWZE3A_ADMIN") {
      return item.href === "/admin";
    }

    return true;
  });

  return (
    <>
      <header className="sticky top-0 z-30 flex w-full items-center justify-between border-b border-coptic-gold-main/30 bg-gray-900 px-4 py-3 text-coptic-gold-light lg:hidden">
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 px-3 text-sm font-bold text-coptic-gold-main"
          aria-label="فتح القائمة"
        >
          القائمة
        </button>
        <span className="truncate text-sm font-bold text-coptic-gold-main">
          لوحة التحكم
        </span>
      </header>

      {isOpen ? (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          aria-label="إغلاق القائمة"
          onClick={() => setIsOpen(false)}
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-[min(18rem,100%)] flex-col border-l border-coptic-gold-main/20 bg-gray-900 text-cream transition-transform lg:static lg:w-72 lg:translate-x-0 ${
          isOpen ? "translate-x-0" : "translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex items-center gap-3 border-b border-coptic-gold-main/20 px-4 py-5">
          <span className="overflow-hidden rounded-md bg-cream">
            <ChurchLogo size={48} className="h-12 w-12" priority />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold leading-6 text-coptic-gold-light">
              {CHURCH_NAME}
            </p>
            <p className="text-xs text-coptic-gold-main">لوحة الإدارة</p>
          </div>
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 text-sm font-bold text-coptic-gold-main lg:hidden"
            aria-label="إغلاق القائمة"
            onClick={() => setIsOpen(false)}
          >
            إغلاق
          </button>
        </div>

        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4" aria-label="قائمة لوحة التحكم">
          {items.map((item) => {
            const isActive =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setIsOpen(false)}
                className={`flex min-h-11 items-center rounded-xl px-3 text-sm font-bold transition-colors ${
                  isActive
                    ? "bg-coptic-gold-main/15 text-coptic-gold-main"
                    : "text-cream hover:bg-white/5 hover:text-coptic-gold-light"
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-coptic-gold-main/20 px-4 py-4">
          <p className="text-sm font-bold text-coptic-gold-light">{userName}</p>
          <p className="text-xs text-coptic-gold-main">{roleLabels[userRole]}</p>
          <button
            type="button"
            onClick={() => void signOut({ callbackUrl: "/admin/login" })}
            className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-xl border border-coptic-gold-main/50 px-3 text-sm font-bold text-coptic-gold-main transition-colors hover:bg-coptic-gold-main hover:text-gray-900"
          >
            تسجيل خروج
          </button>
        </div>
      </aside>
    </>
  );
}
