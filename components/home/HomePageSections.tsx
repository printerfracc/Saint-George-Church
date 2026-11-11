"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import NewsImageRotator from "@/components/public/NewsImageRotator";
import OptionalImage from "@/components/public/OptionalImage";
import LinkButton from "@/components/public/LinkButton";
import ReadMoreText from "@/components/public/ReadMoreText";
import { hasImageSrc } from "@/lib/optional-image";
import {
  formatAdminDate,
  formatPartialDate,
  parseContactNumbers,
  toPhoneHref,
  toWhatsAppShareUrl,
  toWhatsAppUrl,
} from "@/lib/admin-labels";
import { excerptStory, hasFilledText, storyNeedsReadMore } from "@/lib/content";
import { searchItemAnchor } from "@/lib/search";

export type HomeContentSection = {
  title: string;
  content: string;
  imageUrl: string | null;
};

export type HomePriest = {
  id: string;
  name: string;
  cloudinaryImageUrl: string | null;
  ordinationDate: string;
  confessionSchedule: string;
  bio: string | null;
  qommosiyaDegree: string | null;
  deathDate: string | null;
  contactNumbers: string | null;
};

export type HomeNamedItem = {
  id: string;
  name: string;
  description: string;
  imageUrl: string | null;
  link?: string | null;
  linkLabel?: string | null;
};

export type HomeNewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  imageUrls?: string[];
  createdAt: string;
  shareUrl?: string;
};

const fadeIn = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-50px" },
  transition: { duration: 0.5 },
};

function SectionHeading({
  title,
  light = false,
  id,
}: {
  title: string;
  light?: boolean;
  id?: string;
}) {
  return (
    <div className="mb-8 text-center">
      <h2
        id={id}
        className={`text-2xl font-bold md:text-3xl ${
          light
            ? "text-coptic-gold-light"
            : "bg-linear-to-r from-coptic-gold-dark to-coptic-gold-main bg-clip-text text-transparent"
        }`}
      >
        {title}
      </h2>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />
    </div>
  );
}

function EmptyFallback({
  title,
  light = false,
}: {
  title: string;
  light?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl border border-dashed px-4 py-12 text-center ${
        light
          ? "border-coptic-gold-main/40 bg-black/20 text-cream/80"
          : "border-coptic-gold-main/50 bg-white/70 text-deep-red/70"
      }`}
    >
      <p className="text-lg font-bold">{title}</p>
      <p className="mt-2 text-sm">سيتم نشر محتوى هذا القسم قريباً.</p>
    </div>
  );
}

function NewsArrow({
  label,
  onClick,
  side,
  variant,
}: {
  label: string;
  onClick: () => void;
  side: "right" | "left";
  variant: "side" | "bar";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className={
        variant === "side"
          ? "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-coptic-gold-main/60 bg-white text-coptic-gold-dark transition hover:bg-coptic-gold-main hover:text-black focus:ring-2 focus:ring-coptic-gold-main"
          : "inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-coptic-gold-main/50 bg-white text-coptic-gold-dark transition hover:bg-coptic-gold-main hover:text-black focus:ring-2 focus:ring-coptic-gold-main lg:hidden"
      }
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        {side === "right" ? (
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

function NewsSection({
  news,
  canShare = false,
}: {
  news: HomeNewsItem[];
  canShare?: boolean;
}) {
  const [index, setIndex] = useState(0);
  const dotsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function syncNewsFromHash() {
      const raw = window.location.hash.replace(/^#/, "");
      if (!raw) {
        return;
      }

      const targetIndex = news.findIndex((entry) => searchItemAnchor(entry.id) === raw);
      if (targetIndex >= 0) {
        setIndex(targetIndex);
        window.requestAnimationFrame(() => {
          document.getElementById(raw)?.scrollIntoView({ behavior: "smooth", block: "start" });
        });
      }
    }

    syncNewsFromHash();
    window.addEventListener("hashchange", syncNewsFromHash);
    return () => window.removeEventListener("hashchange", syncNewsFromHash);
  }, [news]);

  useEffect(() => {
    const root = dotsRef.current;
    const active = root?.querySelector<HTMLElement>('[aria-current="true"]');
    if (!root || !active) {
      return;
    }

    const delta =
      active.getBoundingClientRect().left -
      root.getBoundingClientRect().left -
      (root.clientWidth - active.offsetWidth) / 2;

    if (Math.abs(delta) < 1) {
      return;
    }

    root.scrollBy({ left: delta });
  }, [index]);

  if (news.length === 0) {
    return (
      <motion.section
        {...fadeIn}
        id="news"
        aria-labelledby="news-heading"
        className="relative bg-[#f3ead3] px-4 py-16 md:px-6 md:py-20"
      >
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-coptic-gold-main to-transparent" />
        <div className="mx-auto w-full max-w-6xl">
          <SectionHeading id="news-heading" title="أخبار الكنيسة" />
          <EmptyFallback title="أخبار الكنيسة" />
        </div>
      </motion.section>
    );
  }

  const count = news.length;
  const item = news[index] ?? news[0];
  const canNavigate = count > 1;
  const itemImages =
    item.imageUrls && item.imageUrls.length > 0
      ? item.imageUrls
      : item.imageUrl
        ? [item.imageUrl]
        : [];

  function goTo(nextIndex: number) {
    setIndex((nextIndex + count) % count);
  }

  return (
    <motion.section
      {...fadeIn}
      id="news"
      aria-labelledby="news-heading"
      className="relative bg-[#f3ead3] px-4 py-16 md:px-6 md:py-20"
    >
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-linear-to-l from-transparent via-coptic-gold-main to-transparent" />

      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading id="news-heading" title="أخبار الكنيسة" />

        <div
          className={
            canNavigate
              ? "grid items-center gap-3 lg:grid-cols-[2.75rem_minmax(0,1fr)_2.75rem]"
              : ""
          }
        >
          {canNavigate ? (
            <div className="hidden lg:flex lg:justify-center">
              <NewsArrow
                variant="side"
                side="right"
                label="الخبر التالي"
                onClick={() => goTo(index + 1)}
              />
            </div>
          ) : null}

          <AnimatePresence mode="wait">
            <motion.article
              key={item.id}
              id={searchItemAnchor(item.id)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="scroll-mt-24 overflow-hidden rounded-3xl border border-coptic-gold-main/50 bg-white/90 shadow-md"
            >
              <div
                className={`flex flex-col ${
                  itemImages.length > 0 ? "lg:flex-row" : ""
                }`}
              >
                <NewsImageRotator
                  images={itemImages}
                  alt={item.title}
                  frameClassName="relative aspect-video w-full min-w-0 overflow-hidden bg-cream lg:min-h-80 lg:w-1/2 lg:aspect-auto"
                />

                <div className={`w-full min-w-0 p-6 md:p-10 ${itemImages.length > 0 ? "lg:w-1/2" : ""}`}>
                  <div className="mb-4 flex flex-wrap items-center gap-2">
                    {index === 0 ? (
                      <span className="rounded-full bg-coptic-gold-main px-3 py-1 text-xs font-bold text-black">
                        أحدث الأخبار
                      </span>
                    ) : null}
                    <time
                      dateTime={item.createdAt}
                      className="text-xs font-bold text-coptic-gold-main"
                    >
                      {formatAdminDate(item.createdAt)}
                    </time>
                    {canShare && item.shareUrl ? (
                      <a
                        href={toWhatsAppShareUrl(`${item.title}\n${item.shareUrl}`)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#25D366] px-3 text-xs font-bold text-white transition hover:brightness-95"
                        aria-label="مشاركة الخبر عبر واتساب"
                      >
                        <WhatsAppIcon className="h-4 w-4" />
                        مشاركة عبر واتساب
                      </a>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-bold leading-9 wrap-break-word text-coptic-gold-dark md:text-2xl">
                    {item.title}
                  </h3>
                  <ReadMoreText
                    text={item.description}
                    lines={6}
                    className="mt-4 whitespace-pre-line text-sm leading-8 wrap-break-word text-deep-red/85 md:text-base"
                    buttonClassName="text-coptic-gold-dark"
                  />
                </div>
              </div>
            </motion.article>
          </AnimatePresence>

          {canNavigate ? (
            <div className="hidden lg:flex lg:justify-center">
              <NewsArrow
                variant="side"
                side="left"
                label="الخبر السابق"
                onClick={() => goTo(index - 1)}
              />
            </div>
          ) : null}
        </div>

        {canNavigate ? (
          <div className="mt-5 flex min-w-0 items-center justify-center gap-3">
            <NewsArrow
              variant="bar"
              side="right"
              label="الخبر التالي"
              onClick={() => goTo(index + 1)}
            />
            <div
              ref={dotsRef}
              className="flex min-w-0 flex-1 items-center justify-[safe_center] gap-1 overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {news.map((entry, entryIndex) => (
                <button
                  key={entry.id}
                  type="button"
                  aria-label={`عرض الخبر ${entryIndex + 1} من ${count}`}
                  aria-current={entryIndex === index ? "true" : undefined}
                  onClick={() => {
                    if (entryIndex === index) {
                      return;
                    }
                    goTo(entryIndex);
                  }}
                  className="inline-flex h-11 w-11 shrink-0 items-center justify-center"
                >
                  <span
                    className={`h-2.5 rounded-full transition ${
                      entryIndex === index
                        ? "w-7 bg-coptic-gold-main"
                        : "w-2.5 bg-coptic-gold-main/35"
                    }`}
                  />
                </button>
              ))}
            </div>
            <NewsArrow
              variant="bar"
              side="left"
              label="الخبر السابق"
              onClick={() => goTo(index - 1)}
            />
          </div>
        ) : null}
      </div>
    </motion.section>
  );
}

function ChurchStorySection({
  section,
}: {
  section: HomeContentSection | null;
}) {
  const content = section?.content ?? "";
  const showReadMore = storyNeedsReadMore(content);

  return (
    <motion.section
      {...fadeIn}
      id="story"
      aria-labelledby="church-story-heading"
      className="bg-cream px-4 py-16 md:px-6 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="church-story-heading"
          title={section?.title ?? "قصة الكنيسة"}
        />

        {!section ? (
          <EmptyFallback title="قصة الكنيسة" />
        ) : (
          <div
            className={
              hasImageSrc(section.imageUrl)
                ? "grid items-center gap-8 lg:grid-cols-2"
                : ""
            }
          >
            <OptionalImage
              src={section.imageUrl}
              alt={section.title}
              fill
              frameClassName="relative aspect-4/3 overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-white/70 shadow-sm"
              className="object-cover"
            />

            <div>
              <p className="whitespace-pre-line text-sm leading-8 text-deep-red/85 md:text-base">
                {excerptStory(content) || "سيتم استكمال نص قصة الكنيسة قريباً."}
              </p>
              {showReadMore ? (
                <Link
                  href="/history"
                  className="mt-6 inline-flex min-h-11 items-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black"
                >
                  اقرأ المزيد
                </Link>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ScrollArrow({
  label,
  onClick,
  disabled,
  side,
  tone,
  className = "",
}: {
  label: string;
  onClick: () => void;
  disabled: boolean;
  side: "right" | "left";
  tone: "dark" | "light";
  className?: string;
}) {
  return (
    <button
      type="button"
      onClick={(event) => {
        event.currentTarget.blur();
        onClick();
      }}
      disabled={disabled}
      aria-label={label}
      className={`absolute z-10 inline-flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border shadow-md backdrop-blur-sm transition hover:bg-coptic-gold-main hover:text-black focus:ring-2 focus:ring-coptic-gold-main disabled:pointer-events-none disabled:opacity-30 ${
        tone === "dark"
          ? "border-coptic-gold-main/70 bg-[#2a0909]/90 text-coptic-gold-light"
          : "border-coptic-gold-main/70 bg-white/95 text-coptic-gold-dark"
      } ${className}`}
    >
      <svg
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        aria-hidden="true"
      >
        {side === "right" ? (
          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
        ) : (
          <path d="M15 5l-7 7 7 7" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </button>
  );
}

const scrollCardWidthClass =
  "w-full shrink-0 basis-full snap-start select-none overflow-hidden md:w-[calc((100%-1.25rem)/2)] md:basis-auto lg:w-[calc((100%-2.5rem)/3)]";

function CardScroller({
  label,
  tone,
  itemCount,
  children,
}: {
  label: string;
  tone: "dark" | "light";
  itemCount: number;
  children: ReactNode;
}) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const [hasOverflow, setHasOverflow] = useState(false);

  useEffect(() => {
    const root = scrollerRef.current;
    if (!root) {
      return;
    }

    function measure() {
      const current = scrollerRef.current;
      if (!current) {
        return;
      }

      const cards = [...current.querySelectorAll<HTMLElement>("[data-scroll-card]")];
      const style = getComputedStyle(current);
      const rootRect = current.getBoundingClientRect();
      const contentRight = rootRect.right - (Number.parseFloat(style.paddingRight) || 0);
      const contentLeft = rootRect.left + (Number.parseFloat(style.paddingLeft) || 0);
      const first = cards[0]?.getBoundingClientRect();
      const last = cards[cards.length - 1]?.getBoundingClientRect();

      if (current.scrollTop !== 0) {
        current.scrollTop = 0;
      }

      setHasOverflow(current.scrollWidth > current.clientWidth + 8);
      setAtStart(!first || first.right <= contentRight + 16);
      setAtEnd(!last || last.left >= contentLeft - 12);
    }

    measure();
    root.addEventListener("scroll", measure, { passive: true });
    const observer = new ResizeObserver(measure);
    observer.observe(root);

    return () => {
      root.removeEventListener("scroll", measure);
      observer.disconnect();
    };
  }, [itemCount]);

  function scrollByCard(direction: "next" | "prev") {
    const root = scrollerRef.current;
    if (!root) {
      return;
    }

    const cards = [...root.querySelectorAll<HTMLElement>("[data-scroll-card]")];
    if (cards.length === 0) {
      return;
    }

    const style = getComputedStyle(root);
    const contentRight =
      root.getBoundingClientRect().right - (Number.parseFloat(style.paddingRight) || 0);
    let current = 0;
    let closest = Number.POSITIVE_INFINITY;

    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().right - contentRight);
      if (distance < closest) {
        closest = distance;
        current = index;
      }
    });

    const nextIndex =
      direction === "next"
        ? Math.min(cards.length - 1, current + 1)
        : Math.max(0, current - 1);
    const card = cards[nextIndex];
    if (!card || nextIndex === current) {
      return;
    }

    const cardRight = card.getBoundingClientRect().right;
    root.scrollTo({
      left: root.scrollLeft + (cardRight - contentRight),
      top: 0,
      behavior: "smooth",
    });
  }

  return (
    <div className="relative">
      {hasOverflow ? (
        <>
          <ScrollArrow
            tone={tone}
            side="right"
            label="السابق"
            disabled={atStart}
            onClick={() => scrollByCard("prev")}
            className="start-1 top-[34vw] md:start-0 md:top-32"
          />
          <ScrollArrow
            tone={tone}
            side="left"
            label="التالي"
            disabled={atEnd}
            onClick={() => scrollByCard("next")}
            className="end-1 top-[34vw] md:end-0 md:top-32"
          />
        </>
      ) : null}

      <div
        ref={scrollerRef}
        role="region"
        aria-label={label}
        className="flex snap-x snap-mandatory gap-0 overflow-x-auto overflow-y-hidden overscroll-x-contain overscroll-y-auto pb-2 [scrollbar-width:none] [touch-action:pan-x_pan-y] md:gap-5 md:px-12 md:[scroll-padding-inline:3rem] [&::-webkit-scrollbar]:hidden"
      >
        {children}
      </div>
    </div>
  );
}

function RelicsSection({ relics }: { relics: HomeNamedItem[] }) {
  return (
    <motion.section
      {...fadeIn}
      id="relics"
      aria-labelledby="relics-heading"
      className="bg-[#3a0d0d] px-4 py-16 text-cream md:px-6 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="relics-heading"
          light
          title="مزار ورفات القديسين بالكنيسة"
        />

        {relics.length === 0 ? (
          <EmptyFallback light title="مزار ورفات القديسين بالكنيسة" />
        ) : (
          <CardScroller label="مزار ورفات القديسين" tone="dark" itemCount={relics.length}>
            {relics.map((relic) => (
              <motion.article
                key={relic.id}
                data-scroll-card
                {...fadeIn}
                className={`${scrollCardWidthClass} rounded-3xl border border-coptic-gold-main/40 bg-black/25 shadow-sm`}
              >
                <OptionalImage
                  src={relic.imageUrl}
                  alt={relic.name}
                  fill
                  draggable={false}
                  frameClassName="relative aspect-4/3 [touch-action:pan-x_pan-y]"
                  className="pointer-events-none object-cover select-none"
                />
                <div className="p-5">
                  <h3
                    id={searchItemAnchor(relic.id)}
                    className="scroll-mt-24 text-xl font-bold text-coptic-gold-light"
                  >
                    {relic.name}
                  </h3>
                  <ReadMoreText
                    text={relic.description}
                    className="mt-2 whitespace-pre-line text-sm leading-7 text-cream/85"
                    buttonClassName="text-coptic-gold-light"
                  />
                </div>
              </motion.article>
            ))}
          </CardScroller>
        )}
      </div>
    </motion.section>
  );
}

function PriestsSection({ priests }: { priests: HomePriest[] }) {
  return (
    <motion.section
      {...fadeIn}
      id="priests"
      aria-labelledby="priests-heading"
      className="bg-cream px-4 py-16 md:px-6 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading id="priests-heading" title="الآباء كهنة الكنيسة" />

        {priests.length === 0 ? (
          <EmptyFallback title="الآباء كهنة الكنيسة" />
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {priests.map((priest) => {
              const phones = parseContactNumbers(priest.contactNumbers);

              return (
                <motion.article
                  key={priest.id}
                  id={searchItemAnchor(priest.id)}
                  {...fadeIn}
                  className="scroll-mt-24 flex flex-col rounded-3xl border border-coptic-gold-main/40 bg-white/85 p-6 text-center shadow-sm"
                >
                  <OptionalImage
                    src={priest.cloudinaryImageUrl}
                    alt={priest.name}
                    width={112}
                    height={112}
                    className="mx-auto h-28 w-28 rounded-full border-4 border-coptic-gold-main object-cover"
                  />

                  <h3 className="mt-4 text-xl font-bold text-coptic-gold-dark">
                    {priest.name}
                  </h3>
                  {hasFilledText(priest.qommosiyaDegree) ? (
                    <p className="mt-1 text-sm font-bold text-coptic-gold-dark">
                      درجة القمصية: {priest.qommosiyaDegree}
                    </p>
                  ) : null}
                  <p className="mt-1 text-sm text-coptic-gold-main">
                    تاريخ الرسامة: {formatPartialDate(priest.ordinationDate)}
                  </p>
                  {priest.deathDate ? (
                    <p className="mt-1 text-sm text-coptic-gold-main">
                      تاريخ النياحة: {formatPartialDate(priest.deathDate)}
                    </p>
                  ) : null}

                  {priest.bio ? (
                    <div className="mt-3 min-h-28">
                      <ReadMoreText
                        text={priest.bio}
                        lines={3}
                        className="text-sm leading-7 text-deep-red/70"
                        buttonClassName="text-coptic-gold-dark"
                      />
                    </div>
                  ) : (
                    <div className="mt-3 min-h-28" />
                  )}

                  {hasFilledText(priest.confessionSchedule) || phones.length > 0 ? (
                    <div className="mt-auto flex flex-col gap-2 border-t border-coptic-gold-main/20 pt-4">
                      {hasFilledText(priest.confessionSchedule) ? (
                        <p className="whitespace-pre-line text-sm font-bold text-coptic-gold-dark">
                          الاعتراف: {priest.confessionSchedule}
                        </p>
                      ) : null}
                    {phones.length > 0 ? (
                      <div className="flex flex-wrap items-center justify-center gap-2">
                        {phones.map((number) => (
                          <div
                            key={number}
                            className="inline-flex items-center gap-2"
                          >
                            <a
                              href={toPhoneHref(number)}
                              dir="ltr"
                              className="font-mono text-sm font-bold tracking-wide text-deep-red"
                            >
                              {number}
                            </a>
                            <a
                              href={toWhatsAppUrl(number)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full bg-[#25D366] text-white"
                              aria-label={`واتساب ${number}`}
                            >
                              <WhatsAppIcon className="h-4 w-4" />
                            </a>
                          </div>
                        ))}
                      </div>
                    ) : null}
                    </div>
                  ) : null}
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </motion.section>
  );
}

function ServicesSection({ activities }: { activities: HomeNamedItem[] }) {
  return (
    <motion.section
      {...fadeIn}
      id="activities"
      aria-labelledby="services-heading"
      className="bg-[#f3ead3] px-4 py-16 md:px-6 md:py-20"
    >
      <div className="mx-auto w-full max-w-6xl">
        <SectionHeading
          id="services-heading"
          title="خدمات وأنشطة الكنيسة المتنوعة"
        />

        {activities.length === 0 ? (
          <EmptyFallback title="خدمات وأنشطة الكنيسة المتنوعة" />
        ) : (
          <CardScroller
            label="خدمات وأنشطة الكنيسة المتنوعة"
            tone="light"
            itemCount={activities.length}
          >
            {activities.map((activity) => {
              const href = activity.link?.trim() || "";

              return (
                <motion.article
                  key={activity.id}
                  data-scroll-card
                  {...fadeIn}
                  className={`${scrollCardWidthClass} flex flex-col rounded-3xl border border-coptic-gold-main/50 bg-white/80 shadow-sm`}
                >
                  <OptionalImage
                    src={activity.imageUrl}
                    alt={activity.name}
                    fill
                    draggable={false}
                    frameClassName="relative aspect-4/3 [touch-action:pan-x_pan-y]"
                    className="pointer-events-none object-cover select-none"
                  />
                  <div className="flex flex-1 flex-col p-5">
                    <h3
                      id={searchItemAnchor(activity.id)}
                      className="scroll-mt-24 text-xl font-bold text-coptic-gold-dark"
                    >
                      {activity.name}
                    </h3>
                    <ReadMoreText
                      text={activity.description}
                      className="mt-2 whitespace-pre-line text-sm leading-7 text-deep-red/75"
                      buttonClassName="text-coptic-gold-dark"
                    />
                    {href ? (
                      <LinkButton href={href} label={activity.linkLabel} />
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </CardScroller>
        )}
      </div>
    </motion.section>
  );
}

export default function HomePageSections({
  news = [],
  churchStory,
  relics = [],
  activities = [],
  priests = [],
  canShareNews = false,
}: {
  news?: HomeNewsItem[];
  churchStory: HomeContentSection | null;
  relics?: HomeNamedItem[];
  activities?: HomeNamedItem[];
  priests?: HomePriest[];
  canShareNews?: boolean;
}) {
  return (
    <>
      <NewsSection news={news} canShare={canShareNews} />
      <ChurchStorySection section={churchStory} />
      <PriestsSection priests={priests} />
      <RelicsSection relics={relics} />
      <ServicesSection activities={activities} />
    </>
  );
}
