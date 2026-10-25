export const SERVANT_EXPORT_FIELDS = [
  { key: "name", label: "الاسم", width: 28, kind: "text" },
  { key: "nationalId", label: "الرقم القومي", width: 24, kind: "id" },
  { key: "birthDay", label: "يوم الميلاد", group: "birthdate", width: 12, kind: "number" },
  { key: "birthMonth", label: "شهر الميلاد", group: "birthdate", width: 12, kind: "number" },
  { key: "birthYear", label: "سنة الميلاد", group: "birthdate", width: 14, kind: "number" },
  { key: "phone", label: "رقم الموبايل", width: 18, kind: "id" },
  { key: "address", label: "العنوان", width: 40, kind: "text" },
  { key: "bloodType", label: "فصيلة الدم", width: 14, kind: "text" },
  { key: "deaconRank", label: "الرتبة الشماسية", width: 20, kind: "text" },
  { key: "graduationYear", label: "سنة التخرج", width: 16, kind: "text" },
  { key: "jobOrStudy", label: "المهنة / الدراسة", width: 32, kind: "text" },
  { key: "khedma", label: "الخدمة", width: 32, kind: "text" },
  { key: "role", label: "الرتبة", width: 24, kind: "text" },
  { key: "previousKhedmas", label: "الخدمات السابقة", width: 40, kind: "text" },
  { key: "notes", label: "ملاحظات", width: 40, kind: "text" },
] as const;

export type ServantExportField = (typeof SERVANT_EXPORT_FIELDS)[number]["key"];
export type ServantExportKind = (typeof SERVANT_EXPORT_FIELDS)[number]["kind"];

export const BIRTHDATE_EXPORT_LABEL = "تاريخ الميلاد";

const BIRTHDATE_EXPORT_PARTS = [
  { key: "birthDay", label: "يوم" },
  { key: "birthMonth", label: "شهر" },
  { key: "birthYear", label: "سنة" },
] as const;

export type BirthdateExportField = (typeof BIRTHDATE_EXPORT_PARTS)[number]["key"];

export function isBirthdateExportField(field: ServantExportField): field is BirthdateExportField {
  return field === "birthDay" || field === "birthMonth" || field === "birthYear";
}

export function selectedBirthdateParts(fields: readonly ServantExportField[]) {
  return BIRTHDATE_EXPORT_PARTS.filter((part) => fields.includes(part.key));
}

export function birthdatePartValue(dateOfBirth: Date | null, key: BirthdateExportField) {
  if (!dateOfBirth) {
    return "";
  }

  if (key === "birthDay") {
    return String(dateOfBirth.getDate());
  }

  if (key === "birthMonth") {
    return String(dateOfBirth.getMonth() + 1);
  }

  return String(dateOfBirth.getFullYear());
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
