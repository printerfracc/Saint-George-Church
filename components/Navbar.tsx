"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import GlobalSearch, { SearchIcon } from "@/components/GlobalSearch";
import ChurchLogo from "@/components/ChurchLogo";
import { CHURCH_NAME } from "@/lib/church";
import { useLiveStreamStatus } from "@/components/live/useLiveStreamStatus";
import { groupMediaNavItems, type MediaCategory } from "@/lib/media-category";

export type NavSubItem = {
  title: string;
  href: string;
  isOverview?: boolean;
  category?: MediaCategory;
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
      {
        title:
          title === "الرئيسية"
            ? "الصفحة الرئيسية"
            : title === "الوسائط والمكتبة"
              ? "جميع الوسائط"
              : title === "قطاعات الخدمات"
                ? "جميع القطاعات"
                : "نظرة عامة",
        href,
        isOverview: true,
      },
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
    "block p-3 text-sm text-white transition-colors hover:bg-coptic-gold-main/20 hover:text-coptic-gold-main",
    isOverview ? "mb-1 border-b border-gray-700/50 pb-2 font-bold" : "",
  ]
    .filter(Boolean)
    .join(" ");
}

function MediaMenuItems({
  items,
  onSelect,
}: {
  items: NavSubItem[];
  onSelect: () => void;
}) {
  const layout = groupMediaNavItems(items);

  return (
    <div className="flex flex-col gap-2">
      {layout.overview ? (
        <Link
          href={layout.overview.href}
          role="menuitem"
          onClick={onSelect}
          className={subItemClassName(true)}
        >
          {layout.overview.title}
        </Link>
      ) : null}

      <div className="flex items-start gap-3">
        {layout.groups
          .filter((group) => group.category === "SERMONS")
          .map((group) => (
            <div key={group.key} className="min-w-0 flex-1 border-l border-gray-700/50 pl-3 lg:flex-[2]">
              {group.title ? (
                <p className="px-3 pt-2 pb-1 text-right text-sm font-bold text-coptic-gold-light">
                  {group.title}
                </p>
              ) : null}
              <div className="grid grid-cols-1 gap-x-2 lg:grid-cols-2">
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    role="menuitem"
                    onClick={onSelect}
                    className={subItemClassName()}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            </div>
          ))}

        <div className="min-w-0 flex-1 lg:flex-1">
          {layout.groups
            .filter((group) => group.category === "BOOKS" || group.category === "IMAGES")
            .map((group, index) => (
              <div
                key={group.key}
                className={index > 0 ? "mt-3 border-t border-gray-700/50 pt-2" : ""}
              >
                {group.title ? (
                  <p className="px-3 pt-2 pb-1 text-sm font-bold text-coptic-gold-light">
                    {group.title}
                  </p>
                ) : null}
                {group.items.map((item) => (
                  <Link
                    key={item.key}
                    href={item.href}
                    role="menuitem"
                    onClick={onSelect}
                    className={subItemClassName()}
                  >
                    {item.title}
                  </Link>
                ))}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
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

function LiveNowButton({ onClick }: { onClick?: () => void }) {
  return (
    <Link
      href="/live"
      onClick={onClick}
      className="inline-flex min-h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full bg-red-600 px-4 text-center text-sm font-bold text-white lg:min-h-12 lg:px-5 lg:text-base"
      aria-label="مشاهدة البث المباشر الآن"
    >
      <span className="h-2 w-2 animate-pulse rounded-full bg-white" aria-hidden="true" />
      بث مباشر
    </Link>
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
  const isLive = useLiveStreamStatus();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [desktopOpen, setDesktopOpen] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const headerRef = useRef<HTMLElement>(null);
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

  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      const target = event.target;
      if (!(target instanceof Node)) {
        return;
      }

      if (headerRef.current?.contains(target)) {
        return;
      }

      setMobileMenuOpen(false);
      setDesktopOpen(null);
    }

    document.addEventListener("pointerdown", handlePointerDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [isMenuOpen]);

  function setMobileMenuOpen(open: boolean) {
    setIsMenuOpen(open);
    document.body.style.overflow = open ? "hidden" : "";
    if (!open) {
      setExpandedItem(null);
    }
  }

  function closeMenu() {
    setMobileMenuOpen(false);
    setDesktopOpen(null);
  }

  function openSearch() {
    closeMenu();
    setDesktopOpen(null);
    setIsSearchOpen(true);
  }

  function closeSearch() {
    setIsSearchOpen(false);
  }

  function toggleExpanded(title: string) {
    setExpandedItem((current) => (current === title ? null : title));
  }

  return (
    <header
      ref={headerRef}
      className="overflow-visible border-b border-coptic-gold-main/40 bg-black/80 text-cream shadow-md backdrop-blur-md"
    >
      <nav
        className="relative mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6"
        aria-label="القائمة الرئيسية"
      >
        <Link
          href="/"
          className={`min-w-0 items-center gap-2 text-cream ${
            isSearchOpen ? "hidden lg:flex" : "flex"
          }`}
          onClick={closeMenu}
        >
          <span className="shrink-0 overflow-hidden rounded-md bg-cream">
            <ChurchLogo size={48} priority className="h-10 w-10 md:h-12 md:w-12" />
          </span>
          <span className="max-w-38 text-xs font-bold leading-tight sm:max-w-none sm:text-sm md:text-base">
            {CHURCH_NAME}
          </span>
        </Link>

        {isSearchOpen ? (
          <div className="flex min-w-0 flex-1 items-center gap-2 max-lg:absolute max-lg:inset-x-4 max-lg:inset-y-3 max-lg:z-10 lg:justify-center lg:px-2">
            <GlobalSearch
              variant="navbar"
              className="min-w-0 flex-1 lg:w-full lg:max-w-3xl"
              autoFocus
              inputRef={searchInputRef}
              onDismiss={closeSearch}
            />
            <button
              type="button"
              onClick={closeSearch}
              className="inline-flex min-h-11 min-w-11 shrink-0 items-center justify-center rounded-md border border-coptic-gold-main/50 text-cream"
              aria-label="إغلاق البحث"
            >
              <span aria-hidden="true" className="text-xl leading-none">
                ×
              </span>
            </button>
          </div>
        ) : (
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
                  className={`absolute top-full z-50 pt-2 transition-opacity duration-300 ${
                    item.title === "الوسائط والمكتبة"
                      ? "left-1/2 -translate-x-1/2"
                      : "right-0"
                  } ${
                    isOpen
                      ? "visible opacity-100"
                      : "invisible opacity-0 pointer-events-none"
                  }`}
                >
                  <div
                    role="menu"
                    className={`rounded-lg border border-coptic-gold-main/30 bg-black/95 p-1 shadow-2xl backdrop-blur-md ${
                      item.title === "الوسائط والمكتبة" ? "w-2xl" : "w-64"
                    }`}
                  >
                    {item.title === "الوسائط والمكتبة" ? (
                      <MediaMenuItems items={item.subItems} onSelect={closeMenu} />
                    ) : (
                      item.subItems.map((subItem) => (
                        <Link
                          key={subItem.href}
                          href={subItem.href}
                          role="menuitem"
                          onClick={closeMenu}
                          className={subItemClassName(subItem.isOverview)}
                        >
                          {subItem.title}
                        </Link>
                      ))
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
        )}

        <div
          className={`shrink-0 items-center gap-2 ${
            isSearchOpen ? "hidden lg:flex" : "flex"
          }`}
        >
          {isLive ? <LiveNowButton onClick={closeMenu} /> : null}
          {!isSearchOpen ? (
            <button
              type="button"
              onClick={openSearch}
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 text-cream"
              aria-label="فتح البحث في الموقع"
            >
              <SearchIcon className="h-5 w-5" />
            </button>
          ) : null}
          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 text-cream lg:hidden"
            aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMenuOpen}
            onClick={() => {
              closeSearch();
              setMobileMenuOpen(!isMenuOpen);
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
            <ul className="flex max-h-[min(70vh,32rem)] flex-col gap-1 overflow-y-auto overscroll-contain px-4 py-3">
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
                          <div className="mb-2 mr-3 border-r border-coptic-gold-main/25 pr-2">
                            {item.title === "الوسائط والمكتبة" ? (
                              <MediaMenuItems
                                items={item.subItems}
                                onSelect={closeMenu}
                              />
                            ) : (
                              <ul>
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
                            )}
                          </div>
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
