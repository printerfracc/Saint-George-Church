import { ARABIC_MONTHS } from "@/lib/admin-labels";
import { formatEgyptianWhatsAppPhone } from "@/lib/birthdays";

export const REGISTRY_SHORT_TEXT = 191;
export const REGISTRY_LONG_TEXT = 4000;

export const MARRIAGE_ANNIVERSARY_MESSAGE =
  "كل سنة وأنتم طيبين بمناسبة عيد زواجكم، وعقبال سنين كتير حلوة مع ربنا 💍🎉";

function firstName(name: string) {
  return name.trim().split(/\s+/)[0] ?? "";
}

export function marriageAnniversaryMessage(husbandName: string, wifeName: string) {
  const names = [firstName(husbandName), firstName(wifeName)].filter(Boolean);

  if (names.length === 0) {
    return MARRIAGE_ANNIVERSARY_MESSAGE;
  }

  return `كل سنة وأنتم طيبين يا ${names.join(" و ")} بمناسبة عيد زواجكم، وعقبال سنين كتير حلوة مع ربنا 💍🎉`;
}

export const BAPTISM_ANNIVERSARY_MESSAGE =
  "كل سنة وأنتم طيبين بمناسبة عيد المعمودية، ربنا يبارك ابنكم ويحفظه في حضن الكنيسة 🕊️";

export function baptismAnniversaryMessage(name: string) {
  const childName = firstName(name);

  if (!childName) {
    return BAPTISM_ANNIVERSARY_MESSAGE;
  }

  return `كل سنة وأنتم طيبين بمناسبة عيد معمودية ${childName}، ربنا يبارك ابنكم ويحفظه في حضن الكنيسة 🕊️`;
}

export const DEPARTED_MEMORIAL_MESSAGE = "تعيشوا وتفتكروا، ربنا يعزيكم ويسندكم 🙏";

export type RegistryTab = "baptisms" | "marriages" | "departed";
export type RegistryPageTab = RegistryTab | "anniversaries";
export type AnniversaryTab = "baptisms" | "marriages" | "departed";

export type RegistryActionResult = { success: true } | { success: false; error: string };

export type RegistryServantMatch = {
  id: string;
  name: string;
  phone: string | null;
};

export type BaptismFormValues = {
  serialNumber: string;
  baptismDate: string;
  birthName: string;
  baptismName: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  priest: string;
  receivedCertificate: boolean;
};

export type MarriageFormValues = {
  serialNumber: string;
  weddingDate: string;
  weddingTime: string;
  husbandName: string;
  wifeName: string;
  husbandPhone: string;
  wifePhone: string;
  weddingChurch: string;
  priest: string;
  isHusbandServant: boolean;
  isWifeServant: boolean;
};

export type DepartedFormValues = {
  serialNumber: string;
  departedName: string;
  ageAtDeath: string;
  familyAddress: string;
  spouseName: string;
  childrenNames: string;
  contactMobile: string;
  contactOwner: string;
  funeralDate: string;
  funeralTime: string;
  funeralPlace: string;
  causeOfDeath: string;
  burialPlace: string;
  priest: string;
  thirdDayPrayerTime: string;
  notes: string;
  isServant: boolean;
};

export type BaptismRecordItem = BaptismFormValues & { id: string; createdAt: string };
export type MarriageRecordItem = MarriageFormValues & { id: string; createdAt: string };
export type DepartedRecordItem = DepartedFormValues & { id: string; createdAt: string };

export const emptyBaptismForm: BaptismFormValues = {
  serialNumber: "",
  baptismDate: "",
  birthName: "",
  baptismName: "",
  fatherName: "",
  fatherPhone: "",
  motherName: "",
  priest: "",
  receivedCertificate: false,
};

export const emptyMarriageForm: MarriageFormValues = {
  serialNumber: "",
  weddingDate: "",
  weddingTime: "",
  husbandName: "",
  wifeName: "",
  husbandPhone: "",
  wifePhone: "",
  weddingChurch: "",
  priest: "",
  isHusbandServant: false,
  isWifeServant: false,
};

export const emptyDepartedForm: DepartedFormValues = {
  serialNumber: "",
  departedName: "",
  ageAtDeath: "",
  familyAddress: "",
  spouseName: "",
  childrenNames: "",
  contactMobile: "",
  contactOwner: "",
  funeralDate: "",
  funeralTime: "",
  funeralPlace: "",
  causeOfDeath: "",
  burialPlace: "",
  priest: "",
  thirdDayPrayerTime: "",
  notes: "",
  isServant: false,
};

export function nextRegistrySerial(current: Array<string | null | undefined>) {
  let max = 0;

  for (const value of current) {
    const parsed = Number(value);

    if (Number.isInteger(parsed) && parsed > max) {
      max = parsed;
    }
  }

  return String(max + 1);
}

export function parseRegistryTab(value: string | undefined): RegistryPageTab {
  if (value === "marriages" || value === "departed" || value === "baptisms" || value === "anniversaries") {
    return value;
  }

  return "baptisms";
}

export function parseAnniversaryTab(value: string | undefined): AnniversaryTab {
  if (value === "marriages" || value === "departed") {
    return value;
  }

  return "baptisms";
}

export function toDateOnly(value: Date | null | undefined) {
  if (!value || Number.isNaN(value.getTime())) {
    return "";
  }

  return value.toISOString().slice(0, 10);
}

export function parseDateOnly(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());

  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (month < 1 || month > 12) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));

  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) {
    return null;
  }

  return date;
}

export function isRegistryDateInRange(iso: string, from: string, to: string) {
  if (!from && !to) {
    return true;
  }

  if (!dateParts(iso)) {
    return false;
  }

  const start = from && to && from > to ? to : from;
  const end = from && to && from > to ? from : to;

  if (start && iso < start) {
    return false;
  }

  if (end && iso > end) {
    return false;
  }

  return true;
}

export function dateParts(iso: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

export function formatRegistryDate(iso: string) {
  const parts = dateParts(iso);

  if (!parts) {
    return "—";
  }

  const label = ARABIC_MONTHS[parts.month - 1]?.label ?? "";
  return `${parts.day} ${label} ${parts.year}`.trim();
}

export function formatMonthDay(month: number, day: number) {
  const label = ARABIC_MONTHS[month - 1]?.label ?? "";
  return `${day} ${label}`.trim();
}

function isLeapYear(year: number) {
  return (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0;
}

function occurrenceInYear(year: number, month: number, day: number) {
  const celebratedDay = month === 2 && day === 29 && !isLeapYear(year) ? 28 : day;
  return new Date(year, month - 1, celebratedDay);
}

function dayDiff(from: Date, to: Date) {
  const start = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const end = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((end - start) / 86_400_000);
}

export function closestAnniversary(month: number, day: number, today: Date) {
  const year = today.getFullYear();
  const candidates = [year - 1, year, year + 1].map((candidate) => ({
    year: candidate,
    offset: dayDiff(today, occurrenceInYear(candidate, month, day)),
  }));

  return candidates.reduce((closest, candidate) =>
    Math.abs(candidate.offset) < Math.abs(closest.offset) ? candidate : closest,
  );
}

export function classifyAnniversary(year: number, month: number, day: number, today: Date) {
  const actualOffset = dayDiff(today, new Date(year, month - 1, day));

  if (actualOffset > 0) {
    return {
      offset: actualOffset,
      occurrenceYear: year,
      isFutureEvent: true,
    };
  }

  const closest = closestAnniversary(month, day, today);
  return {
    offset: closest.offset,
    occurrenceYear: closest.year,
    isFutureEvent: false,
  };
}

export type AnniversaryGroup<T> = {
  item: T;
  offset: number;
  occurrenceYear: number;
  isFutureEvent: boolean;
};

export function groupAnniversaries<T extends { year: number; month: number; day: number; sortName: string }>(
  items: T[],
  today: Date,
) {
  const upcoming: AnniversaryGroup<T>[] = [];
  const past: AnniversaryGroup<T>[] = [];

  for (const item of items) {
    if (!item.month || !item.day || !item.year) {
      continue;
    }

    const classified = classifyAnniversary(item.year, item.month, item.day, today);

    if (classified.offset >= 0 && classified.offset <= 30) {
      upcoming.push({ item, ...classified });
    } else if (classified.offset < 0 && classified.offset >= -30) {
      past.push({ item, ...classified });
    }
  }

  upcoming.sort(
    (left, right) =>
      left.offset - right.offset || left.item.sortName.localeCompare(right.item.sortName, "ar"),
  );
  past.sort(
    (left, right) =>
      right.offset - left.offset || left.item.sortName.localeCompare(right.item.sortName, "ar"),
  );

  return { upcoming, past };
}

export function anniversaryCalendarOrder(month: number, day: number) {
  if (!month || !day) {
    return 10_000;
  }

  return month * 100 + day;
}

export function celebratedYears(originalYear: number, occurrenceYear: number) {
  if (!originalYear || !occurrenceYear) {
    return 0;
  }

  return Math.max(0, occurrenceYear - originalYear);
}

export function completedAnniversaryYears(originalYear: number, month: number, day: number, today: Date) {
  if (!originalYear || !month || !day) {
    return null;
  }

  const actualOffset = dayDiff(today, new Date(originalYear, month - 1, day));

  if (actualOffset > 0) {
    return null;
  }

  let years = today.getFullYear() - originalYear;
  const thisYearOccurrence = occurrenceInYear(today.getFullYear(), month, day);

  if (dayDiff(today, thisYearOccurrence) > 0) {
    years -= 1;
  }

  return Math.max(0, years);
}

export function celebrationLabel(
  kind: "marriage" | "departed" | "baptism",
  years: number,
  isFutureEvent = false,
) {
  if (isFutureEvent) {
    if (kind === "marriage") {
      return "موعد الإكليل";
    }

    if (kind === "baptism") {
      return "موعد المعمودية";
    }

    return "موعد التجنيز";
  }

  if (kind === "marriage") {
    if (years <= 0) {
      return "سنة الزفاف";
    }

    if (years === 1) {
      return "عيد الزواج الأول";
    }

    return `عيد الزواج رقم ${years}`;
  }

  if (kind === "baptism") {
    if (years <= 0) {
      return "سنة المعمودية";
    }

    if (years === 1) {
      return "عيد المعمودية الأول";
    }

    return `عيد المعمودية رقم ${years}`;
  }

  if (years <= 0) {
    return "سنة النياحة";
  }

  if (years === 1) {
    return "السنوية الأولى";
  }

  return `السنوية رقم ${years}`;
}

export function relativeDayLabel(offset: number) {
  if (offset === 0) {
    return "اليوم";
  }

  if (offset === 1) {
    return "غداً";
  }

  if (offset === -1) {
    return "أمس";
  }

  if (offset > 1) {
    return `بعد ${offset} أيام`;
  }

  return `منذ ${Math.abs(offset)} أيام`;
}

export function whatsAppRegistryHref(phone: string | null | undefined, message: string) {
  const formattedPhone = formatEgyptianWhatsAppPhone(phone ?? null);

  if (!formattedPhone) {
    return null;
  }

  return `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(message)}`;
}

export function sortByEventDateDesc<T extends { createdAt: string }>(
  items: T[],
  eventDate: (item: T) => string,
) {
  return [...items].sort((left, right) => {
    const leftDate = eventDate(left);
    const rightDate = eventDate(right);

    if (leftDate !== rightDate) {
      if (!leftDate) {
        return 1;
      }

      if (!rightDate) {
        return -1;
      }

      return rightDate.localeCompare(leftDate);
    }

    return right.createdAt.localeCompare(left.createdAt);
  });
}

export function displayText(value: string) {
  const trimmed = value.trim();
  return trimmed || "—";
}

export function joinPersonNames(left: string, right: string) {
  const husband = left.trim();
  const wife = right.trim();

  if (husband && wife) {
    return `${husband} و ${wife}`;
  }

  return husband || wife || "بدون اسم";
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function optionalText(value: unknown, label: string, max = REGISTRY_SHORT_TEXT) {
  const trimmed = asString(value).trim();

  if (!trimmed) {
    return null;
  }

  if (trimmed.length > max) {
    throw new Error(`${label} أطول من الحد المسموح (${max} حرفاً)`);
  }

  return trimmed;
}

function optionalDate(value: unknown, label: string) {
  const trimmed = asString(value).trim();

  if (!trimmed) {
    return null;
  }

  const parsed = parseDateOnly(trimmed);

  if (!parsed) {
    throw new Error(`${label} غير صالح`);
  }

  return parsed;
}

function assertHasContent(data: Record<string, unknown>) {
  const hasValue = Object.values(data).some((value) => {
    if (typeof value === "boolean") {
      return value;
    }

    if (value instanceof Date) {
      return true;
    }

    return typeof value === "string" && value.trim().length > 0;
  });

  if (!hasValue) {
    throw new Error("يرجى إدخال بيان واحد على الأقل");
  }
}

export function toBaptismCreateData(input: BaptismFormValues) {
  const data = {
    baptismDate: optionalDate(input?.baptismDate, "تاريخ المعمودية"),
    birthName: optionalText(input?.birthName, "الاسم بالميلاد"),
    baptismName: optionalText(input?.baptismName, "الاسم بالمعمودية"),
    fatherName: optionalText(input?.fatherName, "اسم الأب"),
    fatherPhone: optionalText(input?.fatherPhone, "تليفون الأب"),
    motherName: optionalText(input?.motherName, "اسم الأم"),
    priest: optionalText(input?.priest, "الأب الكاهن"),
    receivedCertificate: input?.receivedCertificate === true,
  };

  assertHasContent(data);
  return data;
}

export function toMarriageCreateData(input: MarriageFormValues) {
  const data = {
    weddingDate: optionalDate(input?.weddingDate, "تاريخ صلاة الإكليل"),
    weddingTime: optionalText(input?.weddingTime, "الساعة"),
    husbandName: optionalText(input?.husbandName, "اسم العريس"),
    wifeName: optionalText(input?.wifeName, "اسم العروسة"),
    husbandPhone: optionalText(input?.husbandPhone, "موبايل العريس"),
    wifePhone: optionalText(input?.wifePhone, "موبايل العروسة"),
    weddingChurch: optionalText(input?.weddingChurch, "كنيسة الزفاف"),
    priest: optionalText(input?.priest, "الأب الكاهن"),
    isHusbandServant: input?.isHusbandServant === true,
    isWifeServant: input?.isWifeServant === true,
  };

  assertHasContent(data);
  return data;
}

export function toDepartedCreateData(input: DepartedFormValues) {
  const data = {
    departedName: optionalText(input?.departedName, "اسم المنتقل"),
    ageAtDeath: optionalText(input?.ageAtDeath, "العمر عند الوفاة"),
    familyAddress: optionalText(input?.familyAddress, "عنوان الأسرة", REGISTRY_LONG_TEXT),
    spouseName: optionalText(input?.spouseName, "الزوج أو الزوجة"),
    childrenNames: optionalText(input?.childrenNames, "الأولاد", REGISTRY_LONG_TEXT),
    contactMobile: optionalText(input?.contactMobile, "رقم الموبايل"),
    contactOwner: optionalText(input?.contactOwner, "صاحب الموبايل"),
    funeralDate: optionalDate(input?.funeralDate, "تاريخ صلاة التجنيز"),
    funeralTime: optionalText(input?.funeralTime, "موعد الصلاة"),
    funeralPlace: optionalText(input?.funeralPlace, "مكان الصلاة"),
    causeOfDeath: optionalText(input?.causeOfDeath, "سبب الوفاة", REGISTRY_LONG_TEXT),
    burialPlace: optionalText(input?.burialPlace, "مكان المدفن"),
    priest: optionalText(input?.priest, "الكاهن"),
    thirdDayPrayerTime: optionalText(input?.thirdDayPrayerTime, "موعد صلاة الثالث"),
    notes: optionalText(input?.notes, "الملاحظات", REGISTRY_LONG_TEXT),
    isServant: input?.isServant === true,
  };

  assertHasContent(data);
  return data;
}

type BaptismSource = {
  id: string;
  serialNumber: string | null;
  baptismDate: Date | null;
  birthName: string | null;
  baptismName: string | null;
  fatherName: string | null;
  fatherPhone: string | null;
  motherName: string | null;
  priest: string | null;
  receivedCertificate: boolean;
  createdAt: Date;
};

type MarriageSource = {
  id: string;
  serialNumber: string | null;
  weddingDate: Date | null;
  weddingTime: string | null;
  husbandName: string | null;
  wifeName: string | null;
  husbandPhone: string | null;
  wifePhone: string | null;
  weddingChurch: string | null;
  priest: string | null;
  isHusbandServant: boolean;
  isWifeServant: boolean;
  createdAt: Date;
};

type DepartedSource = {
  id: string;
  serialNumber: string | null;
  departedName: string | null;
  ageAtDeath: string | null;
  familyAddress: string | null;
  spouseName: string | null;
  childrenNames: string | null;
  contactMobile: string | null;
  contactOwner: string | null;
  funeralDate: Date | null;
  funeralTime: string | null;
  funeralPlace: string | null;
  causeOfDeath: string | null;
  burialPlace: string | null;
  priest: string | null;
  thirdDayPrayerTime: string | null;
  notes: string | null;
  isServant: boolean;
  createdAt: Date;
};

function text(value: string | null | undefined) {
  return value ?? "";
}

export function serializeBaptism(record: BaptismSource): BaptismRecordItem {
  return {
    id: record.id,
    serialNumber: text(record.serialNumber),
    baptismDate: toDateOnly(record.baptismDate),
    birthName: text(record.birthName),
    baptismName: text(record.baptismName),
    fatherName: text(record.fatherName),
    fatherPhone: text(record.fatherPhone),
    motherName: text(record.motherName),
    priest: text(record.priest),
    receivedCertificate: record.receivedCertificate,
    createdAt: record.createdAt.toISOString(),
  };
}

export function serializeMarriage(record: MarriageSource): MarriageRecordItem {
  return {
    id: record.id,
    serialNumber: text(record.serialNumber),
    weddingDate: toDateOnly(record.weddingDate),
    weddingTime: text(record.weddingTime),
    husbandName: text(record.husbandName),
    wifeName: text(record.wifeName),
    husbandPhone: text(record.husbandPhone),
    wifePhone: text(record.wifePhone),
    weddingChurch: text(record.weddingChurch),
    priest: text(record.priest),
    isHusbandServant: record.isHusbandServant,
    isWifeServant: record.isWifeServant,
    createdAt: record.createdAt.toISOString(),
  };
}

export function serializeDeparted(record: DepartedSource): DepartedRecordItem {
  return {
    id: record.id,
    serialNumber: text(record.serialNumber),
    departedName: text(record.departedName),
    ageAtDeath: text(record.ageAtDeath),
    familyAddress: text(record.familyAddress),
    spouseName: text(record.spouseName),
    childrenNames: text(record.childrenNames),
    contactMobile: text(record.contactMobile),
    contactOwner: text(record.contactOwner),
    funeralDate: toDateOnly(record.funeralDate),
    funeralTime: text(record.funeralTime),
    funeralPlace: text(record.funeralPlace),
    causeOfDeath: text(record.causeOfDeath),
    burialPlace: text(record.burialPlace),
    priest: text(record.priest),
    thirdDayPrayerTime: text(record.thirdDayPrayerTime),
    notes: text(record.notes),
    isServant: record.isServant,
    createdAt: record.createdAt.toISOString(),
  };
}
