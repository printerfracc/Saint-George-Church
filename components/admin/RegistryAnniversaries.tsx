"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AdminEmptyState, AdminResponsiveTable } from "@/components/admin/admin-ui";
import { normalizeArabic } from "@/lib/arabicNormalizer";
import {
  baptismAnniversaryMessage,
  DEPARTED_MEMORIAL_MESSAGE,
  marriageAnniversaryMessage,
  anniversaryCalendarOrder,
  celebrationLabel,
  celebratedYears,
  completedAnniversaryYears,
  dateParts,
  formatMonthDay,
  formatRegistryDate,
  groupAnniversaries,
  isRegistryDateInRange,
  joinPersonNames,
  relativeDayLabel,
  whatsAppRegistryHref,
  type AnniversaryGroup,
  type BaptismRecordItem,
  type DepartedRecordItem,
  type MarriageRecordItem,
} from "@/lib/registry";

const fieldClassName =
  "min-h-11 w-full rounded-xl border border-deep-red/20 bg-white px-4 py-3 text-deep-red outline-none focus:ring-2 focus:ring-gold";

const whatsAppClassName =
  "inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-4 text-sm font-bold text-black";

type DatedRecord = {
  year: number;
  month: number;
  day: number;
  sortName: string;
};

type DatedMarriage = MarriageRecordItem & DatedRecord;
type DatedDeparted = DepartedRecordItem & DatedRecord;
type DatedBaptism = BaptismRecordItem & DatedRecord;
type AnniversaryKind = "baptism" | "marriage" | "departed";

const kindLabel: Record<AnniversaryKind, string> = {
  baptism: "معمودية",
  marriage: "زواج",
  departed: "نياحة",
};

type CombinedAnniversary =
  | { kind: "baptism"; group: AnniversaryGroup<DatedBaptism> }
  | { kind: "marriage"; group: AnniversaryGroup<DatedMarriage> }
  | { kind: "departed"; group: AnniversaryGroup<DatedDeparted> };

type YearRow = {
  id: string;
  kind: AnniversaryKind;
  name: string;
  secondary: string;
  eventDate: string;
  month: number;
  day: number;
  year: number;
};

function mergeAnniversaries(
  baptisms: AnniversaryGroup<DatedBaptism>[],
  marriages: AnniversaryGroup<DatedMarriage>[],
  departed: AnniversaryGroup<DatedDeparted>[],
  direction: "upcoming" | "past",
) {
  const rows: CombinedAnniversary[] = [
    ...baptisms.map((group) => ({ kind: "baptism" as const, group })),
    ...marriages.map((group) => ({ kind: "marriage" as const, group })),
    ...departed.map((group) => ({ kind: "departed" as const, group })),
  ];

  rows.sort((left, right) => {
    const byOffset =
      direction === "upcoming" ? left.group.offset - right.group.offset : right.group.offset - left.group.offset;

    return byOffset || left.group.item.sortName.localeCompare(right.group.item.sortName, "ar");
  });

  return rows;
}

function baptismTitle(record: Pick<BaptismRecordItem, "baptismName" | "birthName">) {
  return record.birthName.trim() || record.baptismName.trim() || "بدون اسم";
}

function matches(values: string[], query: string) {
  const needle = normalizeArabic(query.trim());

  if (!needle) {
    return true;
  }

  return values.some((value) => normalizeArabic(value).includes(needle));
}

function withDate<T extends { sortName: string }>(record: T, iso: string): T & DatedRecord {
  const parts = dateParts(iso);

  return {
    ...record,
    year: parts?.year ?? 0,
    month: parts?.month ?? 0,
    day: parts?.day ?? 0,
  };
}

function yearsLabel(year: number, month: number, day: number, today: Date) {
  if (!year || !month || !day) {
    return "—";
  }

  const years = completedAnniversaryYears(year, month, day, today);

  if (years == null) {
    return "لم يحن بعد";
  }

  if (years === 0) {
    return "أقل من سنة";
  }

  return String(years);
}

function WhatsAppLinks({
  links,
}: {
  links: Array<{ key: string; label: string; phone: string; message: string }>;
}) {
  const available = links.flatMap((link) => {
    const href = whatsAppRegistryHref(link.phone, link.message);
    return href ? [{ ...link, href }] : [];
  });

  if (available.length === 0) {
    return <p className="mt-4 text-xs text-deep-red/60">لا يوجد رقم موبايل</p>;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {available.map((link) => (
        <a key={link.key} href={link.href} target="_blank" rel="noopener noreferrer" className={whatsAppClassName}>
          {link.label}
        </a>
      ))}
    </div>
  );
}

function TypeBadge({ kind }: { kind: AnniversaryKind }) {
  return (
    <span className="shrink-0 rounded-full border border-deep-red/15 bg-deep-red/5 px-2.5 py-0.5 text-xs font-bold text-deep-red">
      {kindLabel[kind]}
    </span>
  );
}

function EventCard({ entry }: { entry: CombinedAnniversary }) {
  if (entry.kind === "baptism") {
    return <BaptismCard group={entry.group} />;
  }

  if (entry.kind === "marriage") {
    return <MarriageCard group={entry.group} />;
  }

  return <DepartedCard group={entry.group} />;
}

function AnniversarySection({ title, entries }: { title: string; entries: CombinedAnniversary[] }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex max-h-[36rem] flex-col overflow-hidden rounded-3xl border border-coptic-gold-main/30 bg-white/50 p-4"
    >
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-bold text-deep-red">{title}</h2>
        <span className="rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-coptic-gold-main">{entries.length}</span>
      </div>
      {entries.length === 0 ? (
        <AdminEmptyState>لا توجد مناسبات في هذه الفترة</AdminEmptyState>
      ) : (
        <div className="min-h-0 flex-auto space-y-3 overflow-y-auto pe-1">
          {entries.map((entry) => (
            <div key={`${entry.kind}-${entry.group.item.id}`}>
              <EventCard entry={entry} />
            </div>
          ))}
        </div>
      )}
    </motion.section>
  );
}

function MarriageCard({
  group,
}: {
  group: AnniversaryGroup<DatedMarriage>;
}) {
  const record = group.item;
  const years = celebratedYears(record.year, group.occurrenceYear);

  return (
    <article
      className={`rounded-2xl border bg-white/90 p-4 shadow-sm ${
        group.offset === 0 ? "border-coptic-gold-main" : "border-coptic-gold-main/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold text-deep-red">{record.sortName}</h3>
        <TypeBadge kind="marriage" />
      </div>
      <div className="mt-2 flex flex-wrap gap-2">
        {record.isHusbandServant ? (
          <span className="rounded-full bg-coptic-gold-main/20 px-2 py-0.5 text-xs font-bold text-coptic-gold-dark">العريس خادم</span>
        ) : null}
        {record.isWifeServant ? (
          <span className="rounded-full bg-coptic-gold-main/20 px-2 py-0.5 text-xs font-bold text-coptic-gold-dark">العروسة خادمة</span>
        ) : null}
      </div>
      <p className="mt-2 text-sm font-bold text-coptic-gold-dark">
        {group.isFutureEvent
          ? formatRegistryDate(record.weddingDate)
          : `${formatMonthDay(record.month, record.day)} ${group.occurrenceYear}`}
      </p>
      <p className="mt-1 text-sm text-deep-red/80">{celebrationLabel("marriage", years, group.isFutureEvent)}</p>
      <p className="mt-1 text-xs text-deep-red/60">{relativeDayLabel(group.offset)}</p>
      <p className="mt-1 text-xs text-deep-red/60">تاريخ الإكليل: {formatRegistryDate(record.weddingDate)}</p>
      {record.weddingChurch ? <p className="mt-1 text-xs text-deep-red/60">{record.weddingChurch}</p> : null}
      <WhatsAppLinks
        links={[
          {
            key: "husband",
            label: "واتساب العريس",
            phone: record.husbandPhone,
            message: marriageAnniversaryMessage(record.husbandName, record.wifeName),
          },
          {
            key: "wife",
            label: "واتساب العروسة",
            phone: record.wifePhone,
            message: marriageAnniversaryMessage(record.husbandName, record.wifeName),
          },
        ]}
      />
    </article>
  );
}

function BaptismCard({ group }: { group: AnniversaryGroup<DatedBaptism> }) {
  const record = group.item;
  const years = celebratedYears(record.year, group.occurrenceYear);

  return (
    <article
      className={`rounded-2xl border bg-white/90 p-4 shadow-sm ${
        group.offset === 0 ? "border-coptic-gold-main" : "border-coptic-gold-main/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold text-deep-red">{record.birthName.trim() || "بدون اسم"}</h3>
        <TypeBadge kind="baptism" />
      </div>
      {record.baptismName.trim() ? (
        <p className="mt-1 text-sm text-deep-red/80">الاسم بالمعمودية: {record.baptismName}</p>
      ) : null}
      {record.fatherName ? <p className="mt-2 text-sm text-deep-red/80">الأب: {record.fatherName}</p> : null}
      <p className="mt-2 text-sm font-bold text-coptic-gold-dark">
        {group.isFutureEvent
          ? formatRegistryDate(record.baptismDate)
          : `${formatMonthDay(record.month, record.day)} ${group.occurrenceYear}`}
      </p>
      <p className="mt-1 text-sm text-deep-red/80">{celebrationLabel("baptism", years, group.isFutureEvent)}</p>
      <p className="mt-1 text-xs text-deep-red/60">{relativeDayLabel(group.offset)}</p>
      <p className="mt-1 text-xs text-deep-red/60">تاريخ المعمودية: {formatRegistryDate(record.baptismDate)}</p>
      <WhatsAppLinks
        links={[
          {
            key: "father",
            label: "واتساب الأب",
            phone: record.fatherPhone,
            message: baptismAnniversaryMessage(record.birthName.trim() || record.baptismName.trim()),
          },
        ]}
      />
    </article>
  );
}

function DepartedCard({ group }: { group: AnniversaryGroup<DatedDeparted> }) {
  const record = group.item;
  const years = celebratedYears(record.year, group.occurrenceYear);

  return (
    <article
      className={`rounded-2xl border bg-white/90 p-4 shadow-sm ${
        group.offset === 0 ? "border-coptic-gold-main" : "border-coptic-gold-main/30"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-base font-bold text-deep-red">{record.sortName}</h3>
        <TypeBadge kind="departed" />
      </div>
      {record.isServant ? (
        <span className="mt-2 inline-flex rounded-full bg-coptic-gold-main/20 px-2 py-0.5 text-xs font-bold text-coptic-gold-dark">
          خادم
        </span>
      ) : null}
      <p className="mt-2 text-sm font-bold text-coptic-gold-dark">
        {group.isFutureEvent
          ? formatRegistryDate(record.funeralDate)
          : `${formatMonthDay(record.month, record.day)} ${group.occurrenceYear}`}
      </p>
      <p className="mt-1 text-sm text-deep-red/80">{celebrationLabel("departed", years, group.isFutureEvent)}</p>
      <p className="mt-1 text-xs text-deep-red/60">{relativeDayLabel(group.offset)}</p>
      <p className="mt-1 text-xs text-deep-red/60">تاريخ التجنيز: {formatRegistryDate(record.funeralDate)}</p>
      {record.ageAtDeath ? <p className="mt-1 text-xs text-deep-red/60">العمر: {record.ageAtDeath}</p> : null}
      {record.contactOwner ? <p className="mt-1 text-xs text-deep-red/60">للتواصل: {record.contactOwner}</p> : null}
      <WhatsAppLinks
        links={[
          {
            key: "contact",
            label: "واتساب",
            phone: record.contactMobile,
            message: DEPARTED_MEMORIAL_MESSAGE,
          },
        ]}
      />
    </article>
  );
}

export default function RegistryAnniversaries({
  baptisms,
  marriages,
  departed,
}: {
  baptisms: BaptismRecordItem[];
  marriages: MarriageRecordItem[];
  departed: DepartedRecordItem[];
}) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState<"all" | AnniversaryKind>("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const today = useMemo(() => new Date(), []);
  const filtersActive = Boolean(query.trim() || kindFilter !== "all" || dateFrom || dateTo);
  const baptismRows = useMemo(
    () =>
      baptisms
        .filter(
          (record) =>
            (kindFilter === "all" || kindFilter === "baptism") &&
            isRegistryDateInRange(record.baptismDate, dateFrom, dateTo) &&
            matches(
              [record.serialNumber, record.birthName, record.baptismName, record.fatherName, record.fatherPhone, record.motherName, record.priest],
              query,
            ),
        )
        .map((record) => withDate({ ...record, sortName: baptismTitle(record) }, record.baptismDate)),
    [baptisms, query, kindFilter, dateFrom, dateTo],
  );
  const marriageRows = useMemo(
    () =>
      marriages
        .filter(
          (record) =>
            (kindFilter === "all" || kindFilter === "marriage") &&
            isRegistryDateInRange(record.weddingDate, dateFrom, dateTo) &&
            matches(
              [record.serialNumber, record.husbandName, record.wifeName, record.husbandPhone, record.wifePhone, record.weddingChurch, record.priest],
              query,
            ),
        )
        .map((record) => withDate({ ...record, sortName: joinPersonNames(record.husbandName, record.wifeName) }, record.weddingDate)),
    [marriages, query, kindFilter, dateFrom, dateTo],
  );
  const departedRows = useMemo(
    () =>
      departed
        .filter(
          (record) =>
            (kindFilter === "all" || kindFilter === "departed") &&
            isRegistryDateInRange(record.funeralDate, dateFrom, dateTo) &&
            matches(
              [record.serialNumber, record.departedName, record.spouseName, record.contactMobile, record.contactOwner, record.burialPlace, record.priest],
              query,
            ),
        )
        .map((record) => withDate({ ...record, sortName: record.departedName.trim() || "بدون اسم" }, record.funeralDate)),
    [departed, query, kindFilter, dateFrom, dateTo],
  );
  const baptismGroups = useMemo(() => groupAnniversaries(baptismRows, today), [baptismRows, today]);
  const marriageGroups = useMemo(() => groupAnniversaries(marriageRows, today), [marriageRows, today]);
  const departedGroups = useMemo(() => groupAnniversaries(departedRows, today), [departedRows, today]);
  const upcoming = useMemo(
    () => mergeAnniversaries(baptismGroups.upcoming, marriageGroups.upcoming, departedGroups.upcoming, "upcoming"),
    [baptismGroups.upcoming, marriageGroups.upcoming, departedGroups.upcoming],
  );
  const past = useMemo(
    () => mergeAnniversaries(baptismGroups.past, marriageGroups.past, departedGroups.past, "past"),
    [baptismGroups.past, marriageGroups.past, departedGroups.past],
  );
  const yearRows = useMemo(() => {
    const rows: YearRow[] = [
      ...baptismRows.map((record) => ({
        id: `baptism-${record.id}`,
        kind: "baptism" as const,
        name: record.birthName.trim() || "بدون اسم",
        secondary: record.baptismName.trim() ? `الاسم بالمعمودية: ${record.baptismName}` : "",
        eventDate: record.baptismDate,
        month: record.month,
        day: record.day,
        year: record.year,
      })),
      ...marriageRows.map((record) => ({
        id: `marriage-${record.id}`,
        kind: "marriage" as const,
        name: record.sortName,
        secondary: "",
        eventDate: record.weddingDate,
        month: record.month,
        day: record.day,
        year: record.year,
      })),
      ...departedRows.map((record) => ({
        id: `departed-${record.id}`,
        kind: "departed" as const,
        name: record.sortName,
        secondary: "",
        eventDate: record.funeralDate,
        month: record.month,
        day: record.day,
        year: record.year,
      })),
    ];

    return rows.sort(
      (left, right) =>
        anniversaryCalendarOrder(left.month, left.day) - anniversaryCalendarOrder(right.month, right.day) ||
        left.name.localeCompare(right.name, "ar"),
    );
  }, [baptismRows, marriageRows, departedRows]);

  return (
    <div className="flex flex-col gap-5">
      <p className="text-sm leading-7 text-deep-red/75">
        كل التذكارات معاً خلال الثلاثين يوماً القادمة والثلاثين يوماً السابقة، مرتبة حسب الموعد، مع نوع كل مناسبة. اليوم يظهر ضمن القادمة.
      </p>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
        <label className="block" htmlFor="anniversary-search">
          <span className="mb-2 block text-sm font-bold text-deep-red">بحث</span>
          <input
            id="anniversary-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="ابحث بالاسم أو رقم الموبايل"
            className={fieldClassName}
          />
        </label>
        <label className="block" htmlFor="anniversary-kind">
          <span className="mb-2 block text-sm font-bold text-deep-red">النوع</span>
          <select
            id="anniversary-kind"
            value={kindFilter}
            onChange={(event) => setKindFilter(event.target.value as "all" | AnniversaryKind)}
            className={fieldClassName}
          >
            <option value="all">كل الأنواع</option>
            <option value="baptism">معمودية</option>
            <option value="marriage">زواج</option>
            <option value="departed">نياحة</option>
          </select>
        </label>
        <label className="block" htmlFor="anniversary-from">
          <span className="mb-2 block text-sm font-bold text-deep-red">من</span>
          <input
            id="anniversary-from"
            type="date"
            dir="ltr"
            value={dateFrom}
            onChange={(event) => setDateFrom(event.target.value)}
            className={fieldClassName}
          />
        </label>
        <label className="block" htmlFor="anniversary-to">
          <span className="mb-2 block text-sm font-bold text-deep-red">إلى</span>
          <input
            id="anniversary-to"
            type="date"
            dir="ltr"
            value={dateTo}
            onChange={(event) => setDateTo(event.target.value)}
            className={fieldClassName}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <AnniversarySection title="القادمة خلال ٣٠ يوماً" entries={upcoming} />
        <AnniversarySection title="السابقة خلال ٣٠ يوماً" entries={past} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold text-deep-red">سجل السنة</h2>
        <AdminResponsiveTable
          empty={yearRows.length === 0}
          emptyLabel={filtersActive ? "لا توجد نتائج مطابقة" : "لا توجد تذكارات"}
          colSpan={5}
          head={
            <>
              <th className="px-4 py-3 font-bold">النوع</th>
              <th className="px-4 py-3 font-bold">الاسم</th>
              <th className="px-4 py-3 font-bold">تاريخ المناسبة</th>
              <th className="px-4 py-3 font-bold">موعد الذكرى</th>
              <th className="px-4 py-3 font-bold">السنوات</th>
            </>
          }
          cards={yearRows.map((record) => (
            <article key={record.id} className="rounded-2xl border border-coptic-gold-main/40 bg-white/80 p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <h3 className="font-bold text-deep-red">{record.name}</h3>
                <TypeBadge kind={record.kind} />
              </div>
              {record.secondary ? <p className="mt-1 text-sm text-deep-red/80">{record.secondary}</p> : null}
              <p className="mt-2 text-sm text-deep-red/80">تاريخ المناسبة: {formatRegistryDate(record.eventDate)}</p>
              <p className="mt-1 text-sm text-deep-red/80">
                موعد الذكرى: {record.month ? formatMonthDay(record.month, record.day) : "—"}
              </p>
              <p className="mt-1 text-sm text-deep-red/80">السنوات: {yearsLabel(record.year, record.month, record.day, today)}</p>
            </article>
          ))}
          rows={yearRows.map((record) => (
            <tr key={record.id} className="border-t border-coptic-gold-main/15">
              <td className="px-4 py-3">
                <TypeBadge kind={record.kind} />
              </td>
              <td className="px-4 py-3 font-bold">
                {record.name}
                {record.secondary ? (
                  <span className="mt-1 block text-xs font-normal text-deep-red/60">{record.secondary}</span>
                ) : null}
              </td>
              <td className="px-4 py-3">{formatRegistryDate(record.eventDate)}</td>
              <td className="px-4 py-3">{record.month ? formatMonthDay(record.month, record.day) : "—"}</td>
              <td className="px-4 py-3">{yearsLabel(record.year, record.month, record.day, today)}</td>
            </tr>
          ))}
        />
      </section>
    </div>
  );
}
