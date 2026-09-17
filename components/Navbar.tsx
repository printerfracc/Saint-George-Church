"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ChurchLogo from "@/components/ChurchLogo";
import { CHURCH_NAME } from "@/lib/church";

export type NavSubItem = {
  title: string;
  href: string;
  isOverview?: boolean;
};

type NavItem = {
  title: string;
  subItems: NavSubItem[];
};

function withOverview(
  title: string,
  href: string,
  extraItems: NavSubItem[],
): NavItem {
  return {
    title,
    subItems: [
      { title: title === "الرئيسية" ? "الصفحة الرئيسية" : "نظرة عامة", href, isOverview: true },
      ...extraItems,
    ],
  };
}

function buildNavItems(
  sectorItems: NavSubItem[],
  mediaItems: NavSubItem[],
  showTawze3a: boolean,
): NavItem[] {
  return [
    withOverview("الرئيسية", "/", [
      { title: "أخبار الكنيسة", href: "/#news" },
      { title: "قصة الكنيسة", href: "/#story" },
      { title: "الآباء الكهنة", href: "/#priests" },
      { title: "مزار ورفات القديسين", href: "/#relics" },
      { title: "الأنشطة والخدمات", href: "/#activities" },
    ]),
    withOverview("صلوات الكنيسة", "/liturgies", [
      { title: "جدول القداسات", href: "/liturgies#schedule" },
      { title: "البث المباشر", href: "/liturgies#live" },
      { title: "طقوس وأسرار", href: "/liturgies#rites" },
    ]),
    withOverview("قطاعات الخدمات", "/sectors", sectorItems),
    withOverview("الوسائط والمكتبة", "/media", mediaItems),
    ...(showTawze3a
      ? [
          withOverview("توزيعة الخدام", "/tawze3a", [
            { title: "دخول الخدام", href: "/tawze3a/login" },
          ]),
        ]
      : []),
    withOverview("تواصل معنا", "/contact", [
      { title: "حجز المواعيد", href: "/contact#booking" },
      { title: "طلب صلاة أو زيارة افتقاد", href: "/contact#prayer-request" },
      { title: "المساهمات والتبرعات", href: "/contact#donations" },
      { title: "العنوان والتواصل", href: "/contact#location" },
    ]),
  ];
}

function overviewHref(item: NavItem) {
  return item.subItems.find((subItem) => subItem.isOverview)?.href ?? "/";
}

function isItemActive(item: NavItem, pathname: string) {
  const href = overviewHref(item);

  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

function subItemClassName(isOverview?: boolean) {
  return [
    "hover:bg-coptic-gold-main/20 hover:text-coptic-gold-main text-white p-3 block text-sm transition-colors",
    isOverview ? "border-b border-gray-700/50 mb-1 pb-2 font-bold" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 20 20"
      fill="currentColor"
      className={className}
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z"
        clipRule="evenodd"
      />
    </svg>
  );
}

export default function Navbar({
  sectorItems = [],
  mediaItems = [],
  showTawze3a = false,
}: {
  sectorItems?: NavSubItem[];
  mediaItems?: NavSubItem[];
  showTawze3a?: boolean;
}) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const navItems = useMemo(
    () => buildNavItems(sectorItems, mediaItems, showTawze3a),
    [sectorItems, mediaItems, showTawze3a],
  );

  useEffect(() => {
    function scrollToHash() {
      const hash = window.location.hash.replace(/^#/, "");
      if (!hash) {
        return;
      }

      document.getElementById(hash)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }

    const timeout = window.setTimeout(scrollToHash, 80);
    window.addEventListener("hashchange", scrollToHash);

    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("hashchange", scrollToHash);
    };
  }, [pathname]);

  function closeMenu() {
    setIsMenuOpen(false);
    setExpandedItem(null);
    setDesktopOpen(null);
  }

  function toggleExpanded(title: string) {
    setExpandedItem((current) => (current === title ? null : title));
  }

  return (
    <header className="overflow-visible border-b border-coptic-gold-main/40 bg-black/80 text-cream shadow-md backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6"
        aria-label="القائمة الرئيسية"
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-cream"
          onClick={closeMenu}
        >
          <span className="shrink-0 overflow-hidden rounded-md bg-cream">
            <ChurchLogo size={48} priority className="h-10 w-10 md:h-12 md:w-12" />
          </span>
          <span className="max-w-38 text-xs font-bold leading-tight sm:max-w-none sm:text-sm md:text-base">
            {CHURCH_NAME}
          </span>
        </Link>

        <ul className="hidden items-center gap-5 lg:flex">
          {navItems.map((item) => {
            const isActive = isItemActive(item, pathname);
            const isOpen = desktopOpen === item.title;

            return (
              <li
                key={item.title}
                className="relative group"
                onMouseEnter={() => setDesktopOpen(item.title)}
                onMouseLeave={() => setDesktopOpen(null)}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  aria-haspopup="menu"
                  className={`relative inline-flex min-h-11 items-center gap-1 text-sm font-medium transition-colors hover:text-coptic-gold-light ${
                    isActive ? "text-coptic-gold-main" : "text-cream"
                  }`}
                >
                  {item.title}
                  <ChevronIcon
                    className={`h-4 w-4 transition-transform duration-200 ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-coptic-gold-main" />
                  ) : null}
                </button>

                <div
                  className={`absolute top-full right-0 z-50 pt-2 origin-top-right transition-all duration-300 ${
                    isOpen
                      ? "visible translate-y-0 opacity-100"
                      : "invisible translate-y-2 opacity-0 pointer-events-none"
                  }`}
                >
                  <div
                    role="menu"
                    className="w-64 overflow-hidden rounded-lg border border-coptic-gold-main/30 bg-black/95 p-1 shadow-2xl backdrop-blur-md"
                  >
                    {item.subItems.map((subItem) => (
                      <Link
                        key={subItem.href}
                        href={subItem.href}
                        role="menuitem"
                        onClick={closeMenu}
                        className={subItemClassName(subItem.isOverview)}
                      >
                        {subItem.title}
                      </Link>
                    ))}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 text-cream lg:hidden"
            aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMenuOpen}
            onClick={() => {
              setIsMenuOpen((open) => !open);
              setExpandedItem(null);
            }}
          >
            {isMenuOpen ? (
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            ) : (
              <span aria-hidden="true" className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-5 bg-cream" />
                <span className="block h-0.5 w-5 bg-cream" />
              </span>
            )}
          </button>
        </div>
      </nav>

      <AnimatePresence>
        {isMenuOpen ? (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden border-t border-coptic-gold-main/30 bg-black/90 backdrop-blur-md lg:hidden"
          >
            <ul className="flex flex-col gap-1 px-4 py-3">
              {navItems.map((item) => {
                const isActive = isItemActive(item, pathname);
                const isExpanded = expandedItem === item.title;

                return (
                  <li key={item.title}>
                    <button
                      type="button"
                      className={`flex min-h-11 w-full items-center justify-between gap-2 rounded-md px-3 text-base font-medium transition-colors hover:text-coptic-gold-light ${
                        isActive
                          ? "bg-coptic-gold-main/15 text-coptic-gold-main"
                          : "text-cream"
                      }`}
                      aria-expanded={isExpanded}
                      aria-controls={`mobile-subnav-${item.title}`}
                      onClick={() => toggleExpanded(item.title)}
                    >
                      <span>{item.title}</span>
                      <ChevronIcon
                        className={`h-5 w-5 shrink-0 transition-transform duration-200 ${
                          isExpanded ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {isExpanded ? (
                        <motion.div
                          id={`mobile-subnav-${item.title}`}
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.22, ease: "easeOut" }}
                          className="overflow-hidden"
                        >
                          <ul className="mb-2 mr-3 border-r border-coptic-gold-main/25 pr-2">
                            {item.subItems.map((subItem) => (
                              <li key={subItem.href}>
                                <Link
                                  href={subItem.href}
                                  onClick={closeMenu}
                                  className={`flex min-h-11 items-center rounded-md ${subItemClassName(subItem.isOverview)}`}
                                >
                                  {subItem.title}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </li>
                );
              })}
            </ul>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </header>
  );
}
