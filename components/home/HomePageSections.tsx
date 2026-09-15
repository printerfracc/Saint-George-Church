"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import ReadMoreText from "@/components/public/ReadMoreText";
import {
  formatAdminDate,
  formatPartialDate,
  parseContactNumbers,
  toPhoneHref,
  toWhatsAppUrl,
} from "@/lib/admin-labels";
import { excerptStory, hasFilledText, storyNeedsReadMore } from "@/lib/content";

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
};

export type HomeNewsItem = {
  id: string;
  title: string;
  description: string;
  imageUrl: string | null;
  createdAt: string;
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

function NewsSection({ news }: { news: HomeNewsItem[] }) {
  const [index, setIndex] = useState(0);

  if (news.length === 0) {
    return null;
  }

  const count = news.length;
  const item = news[index] ?? news[0];
  const canNavigate = count > 1;

  function goTo(nextIndex: number) {
    setIndex((nextIndex + count) % count);
  }

  return (
    <motion.section
      {...fadeIn}
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
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="overflow-hidden rounded-3xl border border-coptic-gold-main/50 bg-white/90 shadow-md"
            >
              <div
                className={`flex flex-col ${
                  item.imageUrl ? "lg:flex-row" : ""
                }`}
              >
                {item.imageUrl ? (
                  <div className="relative aspect-video w-full min-w-0 overflow-hidden bg-cream lg:min-h-80 lg:w-1/2 lg:aspect-auto">
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                ) : null}

                <div className="w-full min-w-0 p-6 md:p-10 lg:w-1/2">
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
          <div className="mt-5 flex items-center justify-center gap-3">
            <NewsArrow
              variant="bar"
              side="right"
              label="الخبر التالي"
              onClick={() => goTo(index + 1)}
            />
            <div className="flex items-center justify-center gap-1">
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
                  className="inline-flex h-11 min-w-11 items-center justify-center"
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
          <div className="grid items-center gap-8 lg:grid-cols-2">
            <div className="relative aspect-4/3 overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-white/70 shadow-sm">
              {section.imageUrl ? (
                <Image
                  src={section.imageUrl}
                  alt={section.title}
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm font-bold text-coptic-gold-dark">
                  صورة القسم قيد الإعداد
                </div>
              )}
            </div>

            <div>
              <p className="text-sm leading-8 text-deep-red/85 md:text-base">
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

function RelicsSection({ relics }: { relics: HomeNamedItem[] }) {
  return (
    <motion.section
      {...fadeIn}
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
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {relics.map((relic) => (
              <motion.article
                key={relic.id}
                {...fadeIn}
                className="overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-black/25 shadow-sm"
              >
                <div className="relative aspect-4/3 bg-black/30">
                  {relic.imageUrl ? (
                    <Image
                      src={relic.imageUrl}
                      alt={relic.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-coptic-gold-light">
                      بدون صورة
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-xl font-bold text-coptic-gold-light">
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
          </div>
        )}
      </div>
    </motion.section>
  );
}

function PriestsSection({ priests }: { priests: HomePriest[] }) {
  return (
    <motion.section
      {...fadeIn}
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
                  {...fadeIn}
                  className="flex flex-col rounded-3xl border border-coptic-gold-main/40 bg-white/85 p-6 text-center shadow-sm"
                >
                  {priest.cloudinaryImageUrl ? (
                    <Image
                      src={priest.cloudinaryImageUrl}
                      alt={priest.name}
                      width={112}
                      height={112}
                      unoptimized
                      className="mx-auto h-28 w-28 rounded-full border-4 border-coptic-gold-main object-cover"
                    />
                  ) : (
                    <div className="mx-auto flex h-28 w-28 items-center justify-center rounded-full border-4 border-coptic-gold-main/40 bg-cream text-xl font-bold text-coptic-gold-dark">
                      {priest.name.slice(0, 1)}
                    </div>
                  )}

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
                      تاريخ الوفاة: {formatPartialDate(priest.deathDate)}
                    </p>
                  ) : null}

                  {priest.bio ? (
                    <ReadMoreText
                      text={priest.bio}
                      lines={3}
                      className="mt-3 text-sm leading-7 text-deep-red/70"
                      buttonClassName="text-coptic-gold-dark"
                    />
                  ) : null}

                  {hasFilledText(priest.confessionSchedule) || phones.length > 0 ? (
                    <div className="mt-auto flex flex-col gap-2 border-t border-coptic-gold-main/20 pt-4">
                      {hasFilledText(priest.confessionSchedule) ? (
                        <p className="text-sm font-bold text-coptic-gold-dark">
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {activities.map((activity) => (
              <motion.article
                key={activity.id}
                {...fadeIn}
                whileHover={{ scale: 1.04, y: -4 }}
                whileTap={{ scale: 0.98 }}
                className="overflow-hidden rounded-2xl border border-coptic-gold-main/50 bg-white/80 shadow-sm"
              >
                <div className="relative aspect-16/10 bg-cream">
                  {activity.imageUrl ? (
                    <Image
                      src={activity.imageUrl}
                      alt={activity.name}
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-sm font-bold text-coptic-gold-dark">
                      بدون صورة
                    </div>
                  )}
                </div>
                <div className="p-5">
                  <h3 className="text-lg font-bold text-coptic-gold-dark">
                    {activity.name}
                  </h3>
                  <ReadMoreText
                    text={activity.description}
                    className="mt-2 whitespace-pre-line text-sm leading-7 text-deep-red/75"
                    buttonClassName="text-coptic-gold-dark"
                  />
                </div>
              </motion.article>
            ))}
          </div>
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
}: {
  news?: HomeNewsItem[];
  churchStory: HomeContentSection | null;
  relics?: HomeNamedItem[];
  activities?: HomeNamedItem[];
  priests?: HomePriest[];
}) {
  return (
    <>
      <NewsSection news={news} />
      <ChurchStorySection section={churchStory} />
      <PriestsSection priests={priests} />
      <RelicsSection relics={relics} />
      <ServicesSection activities={activities} />
    </>
  );
}
