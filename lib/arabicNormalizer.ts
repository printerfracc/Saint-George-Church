export function normalizeArabic(text: string | null | undefined): string {
  if (text == null) {
    return "";
  }

  return text
    .replace(/[\u064B-\u0652]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .toLowerCase()
    .trim();
}
