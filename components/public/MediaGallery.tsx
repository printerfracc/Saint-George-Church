"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaFileType } from "@/lib/cloudinary";
import { imageDisplayFrameClass } from "@/lib/image-display";
import {
  mediaDownloadUrl,
  mediaExternalLinkLabel,
  mediaFileTypeLabel,
  mediaGalleryImage,
  mediaOpenUrl,
} from "@/lib/media";

export type GalleryItem = {
  id: string;
  title: string;
  fileUrl: string | null;
  fileName: string | null;
  fileType: MediaFileType;
  thumbnail: string | null;
  imageDisplayMode?: string | null;
  link: string | null;
  linkLabel: string | null;
};

function FileBadge({ fileType }: { fileType: string }) {
  return (
    <span className="rounded-full bg-black/55 px-3 py-1 text-xs font-bold text-cream">
      {mediaFileTypeLabel(fileType)}
    </span>
  );
}

function GalleryPlaceholder({ fileType }: { fileType: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center bg-gray-900 text-center">
      <span className="text-3xl text-coptic-gold-main">✦</span>
      <span className="mt-2 text-sm font-bold text-coptic-gold-light">
        {mediaFileTypeLabel(fileType)}
      </span>
    </div>
  );
}

function ExternalLinkButton({
  href,
  label,
}: {
  href: string;
  label?: string | null;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center rounded-full border border-deep-red/20 bg-deep-red px-3 text-xs font-bold text-cream"
      aria-label={mediaExternalLinkLabel(label)}
    >
      {mediaExternalLinkLabel(label)}
    </a>
  );
}

export default function MediaGallery({ items }: { items: GalleryItem[] }) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId) ?? null;
  const activePreview = active ? mediaGalleryImage(active) : null;

  return (
    <>
      <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        {items.map((item) => {
          const preview = mediaGalleryImage(item);
          const label = item.title.trim();

          return (
            <li key={item.id}>
              <motion.article
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5 }}
                className="overflow-hidden rounded-2xl border border-coptic-gold-main/40 bg-white/80 shadow-sm transition hover:-translate-y-0.5 hover:border-coptic-gold-main"
              >
                <button
                  type="button"
                  onClick={() => setActiveId(item.id)}
                  className="group block w-full text-right"
                  aria-label={label || mediaFileTypeLabel(item.fileType)}
                >
                  <div className={`${imageDisplayFrameClass(item.imageDisplayMode, "relative aspect-4/3")} bg-[#1A0A10]`}>
                    {preview ? (
                      <Image
                        src={preview}
                        alt={label || mediaFileTypeLabel(item.fileType)}
                        fill
                        unoptimized
                        className="object-cover transition duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <GalleryPlaceholder fileType={item.fileType} />
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 to-transparent p-3">
                      <FileBadge fileType={item.fileType} />
                    </div>
                  </div>
                  {label ? (
                    <p className="px-3 pt-3 text-sm font-bold text-deep-red">
                      {label}
                    </p>
                  ) : null}
                </button>
                <div className="flex flex-wrap gap-2 p-3">
                  {item.fileUrl ? (
                    <>
                      <a
                        href={mediaOpenUrl(item.fileUrl, item.fileType)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-3 text-xs font-bold text-coptic-gold-dark"
                        aria-label="فتح الملف في تبويب جديد"
                      >
                        فتح
                      </a>
                      <a
                        href={mediaDownloadUrl(item.fileUrl, item.fileName, item.fileType)}
                        className="inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-3 text-xs font-bold text-black"
                        aria-label="تحميل الملف"
                      >
                        تحميل
                      </a>
                    </>
                  ) : null}
                  {item.link ? (
                    <ExternalLinkButton href={item.link} label={item.linkLabel} />
                  ) : null}
                </div>
              </motion.article>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {active ? (
          <motion.div
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={() => setActiveId(null)}
          >
            <motion.article
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-3xl bg-cream shadow-2xl"
              onClick={(event) => event.stopPropagation()}
            >
              <div className={`${imageDisplayFrameClass(active.imageDisplayMode, "relative aspect-video")} bg-[#1A0A10]`}>
                {activePreview ? (
                  <Image
                    src={activePreview}
                    alt={active.title.trim() || mediaFileTypeLabel(active.fileType)}
                    fill
                    unoptimized
                    className="object-contain"
                  />
                ) : (
                  <GalleryPlaceholder fileType={active.fileType} />
                )}
              </div>
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  {active.title.trim() ? (
                    <h2 className="text-lg font-bold text-deep-red">
                      {active.title.trim()}
                    </h2>
                  ) : null}
                  <p className="text-xs font-bold text-coptic-gold-dark">
                    {mediaFileTypeLabel(active.fileType)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {active.fileUrl ? (
                    <>
                      <a
                        href={mediaOpenUrl(active.fileUrl, active.fileType)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center rounded-full border border-coptic-gold-main px-4 text-xs font-bold text-coptic-gold-dark"
                      >
                        فتح في تبويب جديد
                      </a>
                      <a
                        href={mediaDownloadUrl(active.fileUrl, active.fileName, active.fileType)}
                        className="inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
                      >
                        تحميل
                      </a>
                    </>
                  ) : null}
                  {active.link ? (
                    <ExternalLinkButton href={active.link} label={active.linkLabel} />
                  ) : null}
                  <button
                    type="button"
                    onClick={() => setActiveId(null)}
                    className="inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
                  >
                    إغلاق
                  </button>
                </div>
              </div>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
