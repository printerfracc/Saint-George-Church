"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatAdminDate } from "@/lib/admin-labels";

export type HomeSermon = {
  id: string;
  title: string;
  mediaUrl: string;
  date: string;
  priestName: string;
};

function isDownloadable(url: string) {
  return !/youtube\.com|youtu\.be/i.test(url);
}

export default function LatestSermons({
  sermons,
  title = "أحدث العظات والأخبار",
  showArchiveLink = true,
}: {
  sermons: HomeSermon[];
  title?: string;
  showArchiveLink?: boolean;
}) {
  return (
    <section
      aria-label="أحدث العظات والأخبار"
      className="bg-white/40 px-4 py-12 md:px-6 md:py-16"
    >
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-8 flex flex-col items-center justify-between gap-4 text-center sm:flex-row sm:text-right">
          <div>
            <h2 className="bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-2xl font-bold text-transparent md:text-3xl">
              {title}
            </h2>
            <div className="mx-auto mt-3 w-20 border-b-4 border-coptic-gold-main sm:mx-0" />
          </div>
          {showArchiveLink ? (
            <Link
              href="/sermons"
              className="text-sm font-bold text-coptic-gold-dark underline decoration-coptic-gold-main underline-offset-4 transition-colors hover:text-coptic-gold-main"
            >
              عرض الأرشيف
            </Link>
          ) : null}
        </div>

        {sermons.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-coptic-gold-main/50 bg-cream px-4 py-10 text-center text-sm text-coptic-gold-dark/70">
            لا توجد عظات منشورة حالياً
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {sermons.map((sermon) => (
              <motion.article
                key={sermon.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                whileHover={{ scale: 1.03 }}
                className="flex flex-col rounded-2xl border border-coptic-gold-main/40 bg-cream p-5 shadow-sm"
              >
                <p className="text-xs font-bold text-coptic-gold-main">
                  {formatAdminDate(sermon.date)}
                </p>
                <h3 className="mt-2 text-lg font-bold text-coptic-gold-dark transition-colors hover:text-coptic-gold-main">
                  {sermon.title}
                </h3>
                <p className="mt-2 text-sm text-coptic-gold-dark/70">{sermon.priestName}</p>
                <div className="mt-5 flex flex-wrap gap-2">
                  <a
                    href={sermon.mediaUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
                  >
                    استماع
                  </a>
                  {isDownloadable(sermon.mediaUrl) ? (
                    <a
                      href={sermon.mediaUrl}
                      download
                      className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-4 text-xs font-bold text-coptic-gold-dark transition-colors hover:text-coptic-gold-main"
                    >
                      تحميل
                    </a>
                  ) : (
                    <a
                      href={sermon.mediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-4 text-xs font-bold text-coptic-gold-dark transition-colors hover:text-coptic-gold-main"
                    >
                      فتح على يوتيوب
                    </a>
                  )}
                </div>
              </motion.article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
