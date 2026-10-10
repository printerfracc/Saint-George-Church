"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { YouTubeMediaCard } from "@/components/public/YouTubeMedia";
import { GALLERY_MEDIA_IMAGE, GALLERY_MEDIA_YOUTUBE } from "@/lib/eed-constants";

export type PublicGalleryItem = {
  id: string;
  type: string;
  url: string;
};

function photoDownloadHref(id: string) {
  return `/tawze3a/gallery/download?id=${encodeURIComponent(id)}`;
}

export default function PublicGallery({ items }: { items: PublicGalleryItem[] }) {
  const [activeImage, setActiveImage] = useState<PublicGalleryItem | null>(null);

  return (
    <>
      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {items.map((item, index) => (
          <motion.li
            key={item.id}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.35, delay: Math.min(index, 8) * 0.03 }}
            className="overflow-hidden rounded-xl border border-coptic-gold-main/40 bg-white/80 shadow-sm"
          >
            {item.type === GALLERY_MEDIA_YOUTUBE ? (
              <YouTubeMediaCard
                url={item.url}
                title="مشاهدة الفيديو على يوتيوب"
                className="aspect-square"
              />
            ) : item.type === GALLERY_MEDIA_IMAGE ? (
              <div className="relative aspect-square">
                <button
                  type="button"
                  onClick={() => setActiveImage(item)}
                  className="group absolute inset-0 block overflow-hidden"
                  aria-label="عرض الصورة"
                >
                  <Image
                    src={item.url}
                    alt="صورة من معرض الكنيسة"
                    fill
                    unoptimized
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                    className="object-cover transition duration-300 group-hover:scale-[1.03]"
                  />
                </button>
                <a
                  href={photoDownloadHref(item.id)}
                  className="absolute bottom-2 start-2 z-10 inline-flex min-h-9 items-center rounded-full bg-cream/95 px-3 text-[11px] font-bold text-deep-red shadow-sm"
                >
                  تحميل
                </a>
              </div>
            ) : null}
          </motion.li>
        ))}
      </ul>

      <AnimatePresence>
        {activeImage ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4"
            onClick={() => setActiveImage(null)}
          >
            <motion.article
              initial={{ scale: 0.96, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.96, opacity: 0 }}
              className="flex max-h-[90vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="عرض الصورة"
            >
              <div className="relative min-h-0 flex-1 overflow-auto bg-[#1A0A10]">
                <Image
                  src={activeImage.url}
                  alt="صورة من معرض الكنيسة"
                  width={1600}
                  height={1200}
                  unoptimized
                  className="mx-auto h-auto max-h-[75vh] w-auto max-w-full object-contain"
                />
              </div>
              <div className="flex flex-wrap justify-center gap-3 p-4">
                <a
                  href={photoDownloadHref(activeImage.id)}
                  className="inline-flex min-h-11 items-center rounded-full bg-deep-red px-4 text-xs font-bold text-cream"
                >
                  تحميل الصورة
                </a>
                <button
                  type="button"
                  onClick={() => setActiveImage(null)}
                  className="inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
                >
                  إغلاق
                </button>
              </div>
            </motion.article>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}
