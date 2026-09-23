"use client";

import { useEffect, useState } from "react";
import { searchItemAnchor } from "@/lib/search";
import { AnimatePresence, motion } from "framer-motion";
import type { MediaFileType } from "@/lib/cloudinary";
import OptionalImage from "@/components/public/OptionalImage";
import { imageDisplayFrameClass, isPortraitDisplay } from "@/lib/image-display";
import {
  mediaDownloadFileName,
  mediaDownloadUrl,
  mediaExternalLinkLabel,
  mediaFileTypeLabel,
  mediaGalleryImage,
  mediaOpenUrl,
} from "@/lib/media";
import { isYouTubeUrl } from "@/lib/youtube";

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

function FileBadge({
  fileType,
  onLight = false,
  compact = false,
}: {
  fileType: string;
  onLight?: boolean;
  compact?: boolean;
}) {
  const size = compact
    ? "px-2 py-0.5 text-[10px] md:px-3 md:py-1 md:text-xs"
    : "px-3 py-1 text-xs";

  return (
    <span
      className={
        onLight
          ? `rounded-full bg-coptic-gold-main/20 ${size} font-bold text-coptic-gold-dark`
          : `rounded-full bg-black/55 ${size} font-bold text-cream`
      }
    >
      {mediaFileTypeLabel(fileType)}
    </span>
  );
}

function ExternalLinkButton({
  href,
  label,
  compact = false,
}: {
  href: string;
  label?: string | null;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={
        compact
          ? "inline-flex items-center rounded-full border border-deep-red/20 bg-deep-red px-2 py-1 text-xs font-bold text-cream md:min-h-11 md:px-4"
          : "inline-flex min-h-11 items-center rounded-full border border-deep-red/20 bg-deep-red px-4 text-xs font-bold text-cream"
      }
      aria-label={mediaExternalLinkLabel(label, href)}
    >
      {mediaExternalLinkLabel(label, href)}
    </a>
  );
}

function YouTubePlayOverlay({ compact = false }: { compact?: boolean }) {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      <span
        className={`flex items-center justify-center rounded-full bg-deep-red/90 text-cream shadow-lg ${
          compact ? "h-8 w-8 md:h-12 md:w-12" : "h-12 w-12"
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          className={`ms-0.5 fill-current ${compact ? "h-4 w-4 md:h-6 md:w-6" : "h-6 w-6"}`}
          aria-hidden
        >
          <path d="M8 5.14v13.72L19.5 12 8 5.14Z" />
        </svg>
      </span>
    </span>
  );
}

export default function MediaGallery({
  items,
  layout,
}: {
  items: GalleryItem[];
  layout?: string | null;
}) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const active = items.find((item) => item.id === activeId) ?? null;

  useEffect(() => {
    const id = window.location.hash.replace(/^#/, "");
    if (!id) {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [items]);
  const activePreview = active ? mediaGalleryImage(active) : null;
  const activeIsBook = isPortraitDisplay(active?.imageDisplayMode);
  const collectionIsBook = isPortraitDisplay(layout);
  const bookItems = collectionIsBook
    ? items
    : items.filter((item) => isPortraitDisplay(item.imageDisplayMode));
  const normalItems = collectionIsBook
    ? []
    : items.filter((item) => !isPortraitDisplay(item.imageDisplayMode));

  function renderBookCard(item: GalleryItem) {
    const preview = mediaGalleryImage(item);
    const label = item.title.trim();
    const youtubeLink = isYouTubeUrl(item.link) || isYouTubeUrl(item.fileUrl);
    const typeLabel = mediaFileTypeLabel(youtubeLink ? "youtube" : item.fileType);

    return (
      <li key={item.id} id={searchItemAnchor(item.id)} className="scroll-mt-24">
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
            aria-label={label || typeLabel}
          >
            <OptionalImage
              src={preview}
              alt={label || typeLabel}
              fill
              frameClassName="relative aspect-[45/73] w-full overflow-hidden bg-[#1A0A10] md:mx-auto md:aspect-[450/640] md:max-w-[450px]"
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            >
              {youtubeLink ? <YouTubePlayOverlay compact /> : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 to-transparent p-2 md:p-3">
                <FileBadge fileType={youtubeLink ? "youtube" : item.fileType} compact />
              </div>
            </OptionalImage>
            <div className="p-2 sm:p-3 md:px-3 md:pt-3">
              {preview ? null : (
                <FileBadge
                  fileType={youtubeLink ? "youtube" : item.fileType}
                  onLight
                  compact
                />
              )}
              {label ? (
                <p
                  className={`${preview ? "" : "mt-1 md:mt-2 "}text-xs font-bold leading-tight text-deep-red line-clamp-2 sm:text-sm md:text-sm`}
                >
                  {label}
                </p>
              ) : null}
              <p className="text-[10px] text-gray-500 line-clamp-1 sm:text-xs md:hidden">
                {typeLabel}
              </p>
            </div>
          </button>
          <div className="flex flex-wrap gap-1.5 p-2 pt-0 sm:p-3 sm:pt-0 md:gap-2 md:p-3">
            {item.fileUrl ? (
              <>
                <a
                  href={mediaOpenUrl(item.fileUrl, item.fileType)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-full border border-coptic-gold-main px-2 py-1 text-xs font-bold text-coptic-gold-dark md:min-h-11 md:px-3"
                  aria-label="فتح الملف في تبويب جديد"
                >
                  فتح
                </a>
                <a
                  href={mediaDownloadUrl(item.fileUrl, item.fileName, item.fileType)}
                  download={mediaDownloadFileName(item.fileName, item.fileType)}
                  className="inline-flex items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-2 py-1 text-xs font-bold text-black md:min-h-11 md:px-3"
                  aria-label="تحميل الملف"
                >
                  تحميل
                </a>
              </>
            ) : null}
            {item.link ? (
              <ExternalLinkButton href={item.link} label={item.linkLabel} compact />
            ) : null}
          </div>
        </motion.article>
      </li>
    );
  }

  function renderNormalCard(item: GalleryItem) {
    const preview = mediaGalleryImage(item);
    const label = item.title.trim();
    const youtubeLink = isYouTubeUrl(item.link) || isYouTubeUrl(item.fileUrl);

    return (
      <li key={item.id} id={searchItemAnchor(item.id)} className="scroll-mt-24">
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
            <OptionalImage
              src={preview}
              alt={label || mediaFileTypeLabel(item.fileType)}
              fill
              frameClassName={`${imageDisplayFrameClass(item.imageDisplayMode, "relative aspect-4/3")} bg-[#1A0A10]`}
              className="object-cover transition duration-300 group-hover:scale-105"
            >
              {youtubeLink ? <YouTubePlayOverlay /> : null}
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-linear-to-t from-black/70 to-transparent p-3">
                <FileBadge fileType={youtubeLink ? "youtube" : item.fileType} />
              </div>
            </OptionalImage>
            <div className="px-3 pt-3">
              {preview ? null : (
                <FileBadge
                  fileType={youtubeLink ? "youtube" : item.fileType}
                  onLight
                />
              )}
              {label ? (
                <p className={`${preview ? "" : "mt-2 "}text-sm font-bold text-deep-red`}>
                  {label}
                </p>
              ) : null}
            </div>
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
                  download={mediaDownloadFileName(item.fileName, item.fileType)}
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
  }

  return (
    <>
      {normalItems.length > 0 ? (
        <ul className="mt-10 grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {normalItems.map((item) => renderNormalCard(item))}
        </ul>
      ) : null}
      {bookItems.length > 0 ? (
        <ul className="mt-10 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
          {bookItems.map((item) => renderBookCard(item))}
        </ul>
      ) : null}

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
              className={`flex max-h-[90vh] w-full flex-col overflow-hidden rounded-3xl bg-cream shadow-2xl ${
                activeIsBook ? "max-w-sm md:max-w-lg" : "max-w-3xl overflow-y-auto"
              }`}
              onClick={(event) => event.stopPropagation()}
            >
              <OptionalImage
                src={activePreview}
                alt={active.title.trim() || mediaFileTypeLabel(active.fileType)}
                fill
                frameClassName={
                  activeIsBook
                    ? "relative mx-auto aspect-[450/730] h-[48vh] w-auto max-w-full overflow-hidden bg-[#1A0A10] md:h-[62vh]"
                    : `${imageDisplayFrameClass(active.imageDisplayMode, "relative aspect-video")} bg-[#1A0A10]`
                }
                className="object-contain"
              />
              <div
                className={`flex shrink-0 flex-col ${
                  activeIsBook ? "gap-3 p-4 md:p-5" : "gap-4 p-5"
                }`}
              >
                <div>
                  {active.title.trim() ? (
                    <h2 className="text-lg font-bold text-deep-red">
                      {active.title.trim()}
                    </h2>
                  ) : null}
                  <p className="text-xs font-bold text-coptic-gold-dark">
                    {mediaFileTypeLabel(
                      isYouTubeUrl(active.link) || isYouTubeUrl(active.fileUrl)
                        ? "youtube"
                        : active.fileType,
                    )}
                  </p>
                </div>
                <div className="flex flex-row flex-wrap items-center justify-center gap-2 md:flex-nowrap">
                  {active.fileUrl ? (
                    <>
                      <a
                        href={mediaOpenUrl(active.fileUrl, active.fileType)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 w-auto shrink-0 items-center rounded-full border border-coptic-gold-main px-4 text-xs font-bold text-coptic-gold-dark"
                      >
                        فتح
                      </a>
                      <a
                        href={mediaDownloadUrl(active.fileUrl, active.fileName, active.fileType)}
                        download={mediaDownloadFileName(active.fileName, active.fileType)}
                        className="inline-flex min-h-11 w-auto shrink-0 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
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
                    className="inline-flex min-h-11 w-auto shrink-0 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-xs font-bold text-black"
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
