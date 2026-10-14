"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AdminEmptyState } from "@/components/admin/admin-ui";
import { ARABIC_MONTHS } from "@/lib/admin-labels";
import {
  birthdayDayOffset,
  birthdayOccursBetween,
  daysUntilNextBirthday,
  displayAge,
  formatBirthDate,
  groupBirthdays,
  relativeBirthdayLabel,
  whatsAppBirthdayHref,
  type BirthdayServant,
} from "@/lib/birthdays";

function BirthdayCard({
  servant,
  today,
  showWhatsApp,
}: {
  servant: BirthdayServant;
  today: Date;
  showWhatsApp: boolean;
}) {
  const offset = birthdayDayOffset(servant, today);
  const isToday = offset === 0;
  const href = showWhatsApp && isToday ? whatsAppBirthdayHref(servant) : null;

  return (
    <article className="rounded-2xl border border-coptic-gold-main/30 bg-white/90 p-4 shadow-sm">
      <h3 className="text-base font-bold text-deep-red">{servant.name}</h3>
      <p className="mt-2 text-sm text-deep-red/80">العمر: {displayAge(servant, today)} سنة</p>
      <p className="mt-1 text-sm font-bold text-coptic-gold-dark">
        {formatBirthDate(servant.birthMonth, servant.birthDay, servant.birthYear)}
      </p>
      <p className="mt-1 text-xs text-deep-red/60">{relativeBirthdayLabel(offset)}</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black"
        >
          مراسلة عبر واتساب
        </a>
      ) : showWhatsApp && isToday ? (
        <p className="mt-4 text-xs text-deep-red/60">لا يوجد رقم موبايل</p>
      ) : null}
    </article>
  );
}

function BirthdaySection({
  title,
  servants,
  today,
  showWhatsApp,
  highlighted,
}: {
  title: string;
  servants: BirthdayServant[];
  today: Date;
  showWhatsApp: boolean;
  highlighted?: boolean;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={`flex h-[calc(100dvh-4.5rem)] flex-col overflow-hidden rounded-3xl border p-4 lg:h-dvh ${
        highlighted
          ? "border-coptic-gold-main bg-linear-to-b from-coptic-gold-main/20 to-white shadow-md"
          : "border-coptic-gold-main/30 bg-white/50"
      }`}
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className={`text-lg font-bold ${highlighted ? "text-deep-red" : "text-coptic-gold-dark"}`}>
          {title}
        </h2>
        <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-coptic-gold-main">
          {servants.length}
        </span>
      </div>
      {servants.length === 0 ? (
        <AdminEmptyState>لا توجد أعياد ميلاد في هذه الفترة</AdminEmptyState>
      ) : (
        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-y-contain pe-1">
          {servants.map((servant) => (
            <BirthdayCard
              key={servant.id}
              servant={servant}
              today={today}
              showWhatsApp={showWhatsApp}
            />
          ))}
        </div>
      )}
    </motion.section>
  );
}

function parseDateInput(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return null;
  }

  return date;
}

function birthdayRange(start: string, end: string) {
  const startDate = parseDateInput(start);
  const endDate = parseDateInput(end);

  if (startDate && endDate) {
    return { start: startDate, end: endDate };
  }

  if (startDate) {
    return { start: startDate, end: new Date(startDate.getFullYear(), 11, 31) };
  }

  if (endDate) {
    return { start: new Date(endDate.getFullYear(), 0, 1), end: endDate };
  }

  return null;
}

function matchesSearch(servant: BirthdayServant, search: string) {
  if (servant.name.includes(search)) {
    return true;
  }

  const digits = search.replace(/\D/g, "");

  if (!digits) {
    return false;
  }

  const phone = servant.phone?.replace(/\D/g, "") ?? "";
  const nationalId = servant.nationalId?.replace(/\D/g, "") ?? "";

  return phone.includes(digits) || nationalId.includes(digits);
}

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold";

export default function BirthdaysClientView({ servants }: { servants: BirthdayServant[] }) {
  const [query, setQuery] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");
  const [year, setYear] = useState("");
  const [start, setStart] = useState("");
  const [end, setEnd] = useState("");
  const today = useMemo(() => new Date(), []);
  const search = query.trim();
  const range = birthdayRange(start, end);
  const hasDateFilter = Boolean(month || day || year || range);
  const isCustomView = search.length > 0 || hasDateFilter;
  const years = useMemo(
    () => [...new Set(servants.map((servant) => servant.birthYear))].sort((left, right) => right - left),
    [servants],
  );
  const groups = useMemo(() => groupBirthdays(servants, today), [servants, today]);
  const results = useMemo(() => {
    const monthNumber = Number(month);
    const dayNumber = Number(day);
    const yearNumber = Number(year);

    return servants
      .filter((servant) => {
        if (search && !matchesSearch(servant, search)) {
          return false;
        }

        if (month && servant.birthMonth !== monthNumber) {
          return false;
        }

        if (day && servant.birthDay !== dayNumber) {
          return false;
        }

        if (year && servant.birthYear !== yearNumber) {
          return false;
        }

        if (range && !birthdayOccursBetween(servant, range.start, range.end)) {
          return false;
        }

        return true;
      })
      .sort((left, right) => {
        if (range) {
          const leftDate = birthdayOccursBetween(left, range.start, range.end)?.getTime() ?? 0;
          const rightDate = birthdayOccursBetween(right, range.start, range.end)?.getTime() ?? 0;
          return leftDate - rightDate || left.name.localeCompare(right.name, "ar");
        }

        if (!hasDateFilter) {
          return (
            daysUntilNextBirthday(left, today) - daysUntilNextBirthday(right, today) ||
            left.name.localeCompare(right.name, "ar")
          );
        }

        return (
          left.birthMonth - right.birthMonth ||
          left.birthDay - right.birthDay ||
          left.name.localeCompare(right.name, "ar")
        );
      });
  }, [day, hasDateFilter, month, range, search, servants, today, year]);
  const monthLabel = ARABIC_MONTHS[Number(month) - 1]?.label;
  const resultsTitle = month && !day && !year && !search && !range
    ? `أعياد ميلاد ${monthLabel}`
    : range && !search
      ? "أعياد الميلاد في الفترة المحددة"
      : hasDateFilter
        ? "نتائج التصفية"
        : "نتائج البحث";

  function clearFilters() {
    setQuery("");
    setMonth("");
    setDay("");
    setYear("");
    setStart("");
    setEnd("");
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
        <label className="block" htmlFor="birthday-search">
          <span className="mb-2 block text-sm font-bold text-deep-red">بحث</span>
          <input
            id="birthday-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="الاسم أو رقم الموبايل أو الرقم القومي"
            className={fieldClassName}
          />
        </label>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <label className="block" htmlFor="birthday-month">
            <span className="mb-2 block text-sm font-bold text-deep-red">الشهر</span>
            <select
              id="birthday-month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className={fieldClassName}
            >
              <option value="">كل الشهور</option>
              {ARABIC_MONTHS.map((item, index) => (
                <option key={item.value} value={String(index + 1)}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block" htmlFor="birthday-day">
            <span className="mb-2 block text-sm font-bold text-deep-red">اليوم</span>
            <select
              id="birthday-day"
              value={day}
              onChange={(event) => setDay(event.target.value)}
              className={fieldClassName}
            >
              <option value="">كل الأيام</option>
              {Array.from({ length: 31 }, (_, index) => index + 1).map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="block" htmlFor="birthday-year">
            <span className="mb-2 block text-sm font-bold text-deep-red">سنة الميلاد</span>
            <select
              id="birthday-year"
              value={year}
              onChange={(event) => setYear(event.target.value)}
              className={fieldClassName}
            >
              <option value="">كل السنوات</option>
              {years.map((value) => (
                <option key={value} value={String(value)}>
                  {value}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block" htmlFor="birthday-start">
            <span className="mb-2 block text-sm font-bold text-deep-red">من تاريخ</span>
            <input
              id="birthday-start"
              type="date"
              value={start}
              onChange={(event) => setStart(event.target.value)}
              className={fieldClassName}
            />
          </label>
          <label className="block" htmlFor="birthday-end">
            <span className="mb-2 block text-sm font-bold text-deep-red">إلى تاريخ</span>
            <input
              id="birthday-end"
              type="date"
              value={end}
              onChange={(event) => setEnd(event.target.value)}
              className={fieldClassName}
            />
          </label>
        </div>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-xs leading-6 text-deep-red/70">
            البحث بالاسم أو الموبايل أو الرقم القومي يشمل كل الخدام. يمكنك اختيار الشهر فقط، مثل يوليو، أو تحديد من تاريخ إلى تاريخ. أي حقل واحد يكفي.
          </p>
          {query || month || day || year || start || end ? (
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-coptic-gold-main px-4 text-sm font-bold text-coptic-gold-dark"
            >
              مسح التصفية
            </button>
          ) : null}
        </div>
      </div>

      {isCustomView ? (
        <BirthdaySection
          title={resultsTitle}
          servants={results}
          today={today}
          showWhatsApp
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
          <BirthdaySection
            title="🎂 أعياد ميلاد اليوم"
            servants={groups.today}
            today={today}
            showWhatsApp
            highlighted
          />
          <BirthdaySection title="🔜 قادمة قريباً" servants={groups.upcoming} today={today} showWhatsApp={false} />
          <BirthdaySection
            title="⏪ خلال أخر 30 يوم"
            servants={groups.recent}
            today={today}
            showWhatsApp={false}
          />
        </div>
      )}
    </div>
  );
}
