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
