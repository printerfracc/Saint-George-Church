import { normalizeArabic } from "@/lib/arabicNormalizer";

export const SERVANT_ROLE_DISPLAY_ORDER = [
  "أمين عام التربية الكنسية",
  "أمين عام أسر ابتدائي",
  "أمين عام المسرح والكورال والموسيقى والكمبيوتر",
  "أمين",
  "أمينة",
  "نائب أمين عام الخدمة",
  "نائب امين",
  "نائبة امينة",
  "نائب الامين للمتابعة والافتقاد",
  "نائبة الامين للمتابعة والافتقاد",
  "نائب الأمين لغرفة المسرح",
  "نائب الأمين للكنترول",
  "قائد المجموعة",
  "نائب قائد المجموعة",
  "محاسب الفيلا",
  "مسئول شمامسة حضانة",
  "مسئول شمامسة أولى وثانية",
  "مسئول شمامسة ثالثة ورابعة",
  "مسئول شمامسة خامسة وسادسة",
  "مسئول شمامسة إعدادي",
  "مسئول شمامسة ثانوي",
  "مسئول شمامسة كبار",
  "مسئول قطاع B مدرسة الكتاب",
  "مسئول قطاع C مدرسة الكتاب",
  "مساعد قائد كشافة",
  "خادم",
  "خادمة",
  "خادم موقوف",
  "مساعد خادم",
] as const;

function roleKey(name: string) {
  return normalizeArabic(name).replace(/ئ/g, "ي").replace(/ؤ/g, "و");
}

const roleIndex = new Map(
  SERVANT_ROLE_DISPLAY_ORDER.map((name, index) => [roleKey(name), index]),
);

function fallbackRank(name: string) {
  const deputy = name.includes("نايب");
  const secretary = name.includes("امين");

  if (secretary && !deputy) return 0;
  if (deputy && name.includes("قايد")) return 210;
  if (deputy) return 100;
  if (
    name.includes("مسئول") ||
    name.includes("مسؤول") ||
    name.includes("قائد") ||
    name.includes("محاسب")
  ) {
    return 200;
  }
  if (name.includes("مساعد") && name.includes("خادم")) return 450;
  if (name.includes("مساعد")) return 300;
  if (name.includes("موقوف")) return 420;
  if (name.includes("خادم")) return 400;
  return 350;
}

export function roleDisplayIndex(name: string) {
  const normalized = roleKey(name);
  const known = roleIndex.get(normalized);

  if (known !== undefined) {
    return known;
  }

  return SERVANT_ROLE_DISPLAY_ORDER.length + fallbackRank(normalized);
}

export function isAmenRole(name: string) {
  const normalized = roleKey(name);

  return normalized.includes("امين") && !normalized.includes("نايب");
}
