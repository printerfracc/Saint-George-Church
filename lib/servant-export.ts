export const SERVANT_EXPORT_FIELDS = [
  { key: "name", label: "الاسم" },
  { key: "nationalId", label: "الرقم القومي" },
  { key: "birthDay", label: "يوم الميلاد", group: "birthdate" },
  { key: "birthMonth", label: "شهر الميلاد", group: "birthdate" },
  { key: "birthYear", label: "سنة الميلاد", group: "birthdate" },
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

export const BIRTHDATE_EXPORT_LABEL = "تاريخ الميلاد";

export function isBirthdateExportField(
  field: ServantExportField,
): field is "birthDay" | "birthMonth" | "birthYear" {
  return field === "birthDay" || field === "birthMonth" || field === "birthYear";
}

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
