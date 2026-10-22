export const SERVANT_EXPORT_FIELDS = [
  { key: "name", label: "الاسم" },
  { key: "nationalId", label: "الرقم القومي" },
  { key: "phone", label: "رقم الموبايل" },
  { key: "address", label: "العنوان" },
  { key: "bloodType", label: "فصيلة الدم" },
  { key: "deaconRank", label: "الرتبة الشماسية" },
  { key: "graduationYear", label: "سنة التخرج" },
  { key: "jobOrStudy", label: "المهنة / الدراسة" },
  { key: "khedma", label: "الخدمة" },
  { key: "role", label: "الرتبة" },
  { key: "previousKhedmas", label: "الخدمات السابقة" },
  { key: "notes", label: "ملاحظات" },
] as const;

export type ServantExportField = (typeof SERVANT_EXPORT_FIELDS)[number]["key"];

export const DEFAULT_SERVANT_EXPORT_FIELDS: ServantExportField[] = [
  "name",
  "phone",
  "nationalId",
  "khedma",
  "role",
];

const FIELD_KEYS = new Set<string>(SERVANT_EXPORT_FIELDS.map((field) => field.key));

export function isServantExportField(value: unknown): value is ServantExportField {
  return typeof value === "string" && FIELD_KEYS.has(value);
}

export function orderedServantExportFields(values: unknown): ServantExportField[] {
  const raw = Array.isArray(values)
    ? values
    : typeof values === "string"
      ? values.split(",")
      : [];
  const selected = new Set(raw.filter(isServantExportField));

  return SERVANT_EXPORT_FIELDS.map((field) => field.key).filter((key) => selected.has(key));
}

export function servantExportLabel(field: ServantExportField) {
  return SERVANT_EXPORT_FIELDS.find((item) => item.key === field)?.label ?? field;
}
