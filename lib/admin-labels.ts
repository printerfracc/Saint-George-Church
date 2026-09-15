import type { Role } from "@prisma/client";

export const roleLabels: Record<Role, string> = {
  SUPER_ADMIN: "مسؤول أعلى",
  ADMIN: "مسؤول",
};

export function formatAdminDate(value: string | Date) {
  return new Date(value).toLocaleDateString("ar-EG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export type PartialDateParts = {
  year: string;
  month: string;
  day: string;
};

export function emptyPartialDate(): PartialDateParts {
  return { year: "", month: "", day: "" };
}

export function parsePartialDate(value?: string | Date | null): PartialDateParts {
  if (!value) {
    return emptyPartialDate();
  }

  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) {
      return emptyPartialDate();
    }

    return {
      year: String(value.getUTCFullYear()),
      month: String(value.getUTCMonth() + 1).padStart(2, "0"),
      day: String(value.getUTCDate()).padStart(2, "0"),
    };
  }

  const raw = String(value).trim();
  const full = raw.match(/^(\d{4})-(\d{2})-(\d{2})/);

  if (full) {
    return { year: full[1], month: full[2], day: full[3] };
  }

  const yearMonth = raw.match(/^(\d{4})-(\d{2})$/);

  if (yearMonth) {
    return { year: yearMonth[1], month: yearMonth[2], day: "" };
  }

  const yearOnly = raw.match(/^(\d{4})/);

  if (yearOnly) {
    return { year: yearOnly[1], month: "", day: "" };
  }

  return emptyPartialDate();
}

export function storedPartialDate(value?: string | Date | null) {
  const parts = parsePartialDate(value);

  if (!parts.year) {
    return null;
  }

  if (parts.day) {
    return `${parts.year}-${parts.month}-${parts.day}`;
  }

  if (parts.month) {
    return `${parts.year}-${parts.month}`;
  }

  return parts.year;
}

export function priestDateValue(
  stored?: string | null,
  fallback?: string | Date | null,
) {
  return storedPartialDate(stored) ?? storedPartialDate(fallback) ?? null;
}

export function composePartialDate(
  parts: PartialDateParts,
  required: boolean,
  label: string,
) {
  const year = parts.year.trim();
  const month = parts.month.trim();
  const day = parts.day.trim();
  const hasAny = Boolean(year || month || day);

  if (!hasAny) {
    if (required) {
      throw new Error(`يرجى إدخال تاريخ ${label}`);
    }

    return null;
  }

  if (!year) {
    throw new Error(`يرجى إدخال سنة ${label}`);
  }

  if (!/^\d{4}$/.test(year)) {
    throw new Error(`سنة ${label} غير صالحة`);
  }

  if (!month) {
    throw new Error(`يرجى اختيار شهر ${label}`);
  }

  const monthNumber = Number(month);

  if (monthNumber < 1 || monthNumber > 12) {
    throw new Error(`شهر ${label} غير صالح`);
  }

  const paddedMonth = String(monthNumber).padStart(2, "0");

  if (!day) {
    return `${year}-${paddedMonth}`;
  }

  const dayNumber = Number(day);
  const daysInMonth = new Date(Number(year), monthNumber, 0).getDate();

  if (dayNumber < 1 || dayNumber > daysInMonth) {
    throw new Error(`يوم ${label} غير صالح`);
  }

  return `${year}-${paddedMonth}-${String(dayNumber).padStart(2, "0")}`;
}

export function formatPartialDate(value?: string | Date | null) {
  const stored = storedPartialDate(value);

  if (!stored) {
    return "";
  }

  const parts = parsePartialDate(stored);

  if (parts.day && parts.month) {
    return new Date(`${parts.year}-${parts.month}-${parts.day}T12:00:00`).toLocaleDateString(
      "ar-EG",
      { year: "numeric", month: "long", day: "numeric" },
    );
  }

  if (parts.month) {
    return new Date(`${parts.year}-${parts.month}-01T12:00:00`).toLocaleDateString("ar-EG", {
      year: "numeric",
      month: "long",
    });
  }

  return parts.year;
}

export const ARABIC_MONTHS = [
  { value: "01", label: "يناير" },
  { value: "02", label: "فبراير" },
  { value: "03", label: "مارس" },
  { value: "04", label: "أبريل" },
  { value: "05", label: "مايو" },
  { value: "06", label: "يونيو" },
  { value: "07", label: "يوليو" },
  { value: "08", label: "أغسطس" },
  { value: "09", label: "سبتمبر" },
  { value: "10", label: "أكتوبر" },
  { value: "11", label: "نوفمبر" },
  { value: "12", label: "ديسمبر" },
] as const;

export function parseContactNumbers(value: string | null | undefined) {
  if (!value) {
    return [];
  }

  return value
    .split(/[\n,،]+/)
    .map((number) => number.trim())
    .filter(Boolean);
}

export function toPhoneHref(number: string) {
  return `tel:${number.replace(/[^\d+]/g, "")}`;
}

export function toWhatsAppUrl(number: string) {
  const digits = number.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `20${digits.slice(1)}` : digits;

  return `https://wa.me/${international}`;
}

export function toDateInputValue(value: string | Date) {
  return new Date(value).toISOString().slice(0, 10);
}
