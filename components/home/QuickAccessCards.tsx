"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const cards = [
  {
    href: "/prayers",
    title: "مواعيد القداسات",
    description: "جدول القداس الإلهي والصلوات الأسبوعية",
  },
  {
    href: "/clinics",
    title: "العيادات",
    description: "العيادات والخدمات الطبية للكنيسة",
  },
  {
    href: "/live",
    title: "البث المباشر",
    description: "تابع القداسات والفعاليات لحظة بلحظة",
  },
  {
    href: "/prayer-requests",
    title: "طلبات الصلاة",
    description: "أرسل اسمك وطلبك لنصلي من أجلكم",
  },
] as const;

export default function QuickAccessCards() {
  return (
    <section
      aria-label="الوصول السريع"
      className="bg-cream px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 text-center">
          <h2 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
            الوصول السريع
          </h2>
          <div className="mx-auto mt-3 w-20 border-b-4 border-coptic-gold-main" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          {cards.map((card) => (
            <motion.div
              key={card.href}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5 }}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.98 }}
            >
              <Link
                href={card.href}
                className="group block h-full rounded-2xl border border-coptic-gold-main/50 bg-white/80 p-5 shadow-sm transition-colors hover:border-coptic-gold-main hover:bg-coptic-gold-light/15"
              >
                <h3 className="text-lg font-bold text-coptic-gold-dark transition-colors group-hover:text-coptic-gold-main">
                  {card.title}
                </h3>
                <p className="mt-2 text-sm leading-7 text-coptic-gold-dark/80">
                  {card.description}
                </p>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
