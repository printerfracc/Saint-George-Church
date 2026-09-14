export const LITURGY_SECTION_KEYS = [
  "SCHEDULE",
  "LIVE",
  "RITES",
] as const;

export type LiturgySectionKey = (typeof LITURGY_SECTION_KEYS)[number];

export const ADMIN_LITURGY_SECTIONS: {
  key: Exclude<LiturgySectionKey, "LIVE">;
  label: string;
  addLabel: string;
}[] = [
  { key: "SCHEDULE", label: "جدول القداسات", addLabel: "إضافة موعد قداس" },
  { key: "RITES", label: "طقوس وأسرار", addLabel: "إضافة طقس أو سر" },
];

export const PUBLIC_LITURGY_SECTIONS = ADMIN_LITURGY_SECTIONS;

export type AdminLiturgySectionKey = (typeof ADMIN_LITURGY_SECTIONS)[number]["key"];

export function isLiturgySection(value: string): value is LiturgySectionKey {
  return LITURGY_SECTION_KEYS.includes(value as LiturgySectionKey);
}

export function isAdminLiturgySection(
  value: string,
): value is AdminLiturgySectionKey {
  return ADMIN_LITURGY_SECTIONS.some((section) => section.key === value);
}
