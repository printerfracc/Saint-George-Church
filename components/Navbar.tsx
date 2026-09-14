"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import ChurchLogo from "@/components/ChurchLogo";
import { CHURCH_NAME } from "@/lib/church";

const navLinks = [
  { href: "/", label: "الرئيسية" },
  { href: "/liturgies", label: "صلوات الكنيسة" },
  { href: "/sectors", label: "قطاعات الخدمات" },
  { href: "/media", label: "الوسائط والمكتبة" },
  { href: "/contact", label: "تواصل معنا" },
] as const;

export default function Navbar({ isLive = false }: { isLive?: boolean }) {
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 z-50 w-full border-b border-coptic-gold-main/40 bg-black/80 text-cream shadow-md backdrop-blur-md">
      <nav
        className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 md:px-6"
        aria-label="القائمة الرئيسية"
      >
        <Link
          href="/"
          className="flex min-w-0 items-center gap-2 text-cream"
        >
          <span className="shrink-0 overflow-hidden rounded-md bg-cream">
            <ChurchLogo size={48} priority className="h-10 w-10 md:h-12 md:w-12" />
          </span>
          <span className="max-w-38 text-xs font-bold leading-tight sm:max-w-none sm:text-sm md:text-base">
            {CHURCH_NAME}
          </span>
        </Link>

        <ul className="hidden items-center gap-6 lg:flex">
          {navLinks.map((link) => {
            const isActive =
              link.href === "/"
                ? pathname === "/"
                : pathname === link.href || pathname.startsWith(`${link.href}/`);

            return (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className={`relative inline-flex min-h-11 items-center text-sm font-medium transition-colors hover:text-coptic-gold-light ${
                    isActive ? "text-coptic-gold-main" : "text-cream"
                  }`}
                >
                  {link.label}
                  {isActive ? (
                    <span className="absolute inset-x-0 -bottom-1 h-0.5 rounded-full bg-coptic-gold-main" />
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="flex items-center gap-2">
          {isLive ? <LiveStreamButton /> : null}

          <button
            type="button"
            className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border border-coptic-gold-main/50 text-cream lg:hidden"
            aria-label={isMenuOpen ? "إغلاق القائمة" : "فتح القائمة"}
            aria-expanded={isMenuOpen}
            onClick={() => setIsMenuOpen((open) => !open)}
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
              {navLinks.map((link) => {
                const isActive =
                  link.href === "/"
                    ? pathname === "/"
                    : pathname === link.href || pathname.startsWith(`${link.href}/`);

                return (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      onClick={() => setIsMenuOpen(false)}
                      className={`flex min-h-11 items-center rounded-md px-3 text-base font-medium transition-colors hover:text-coptic-gold-light ${
                        isActive ? "bg-coptic-gold-main/15 text-coptic-gold-main" : "text-cream"
                      }`}
                    >
                      {link.label}
                    </Link>
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

function LiveStreamButton() {
  return (
    <motion.div
      animate={{
        scale: [1, 1.06, 1],
        boxShadow: [
          "0 0 0 0 rgba(212, 175, 55, 0.75)",
          "0 0 0 10px rgba(139, 30, 63, 0)",
          "0 0 0 0 rgba(212, 175, 55, 0)",
        ],
      }}
      transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
      className="rounded-full"
    >
      <Link
        href="/live"
        className="inline-flex min-h-11 items-center gap-1 rounded-full border border-coptic-gold-main bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-3 text-xs font-bold text-black md:px-4 md:text-sm"
        aria-label="مشاهدة البث المباشر الآن"
      >
        🔴 بث مباشر الآن
      </Link>
    </motion.div>
  );
}
