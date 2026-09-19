import { randomUUID } from "node:crypto";

export function slugify(value: string) {
  return value
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export function slugFromInput(
  input: string | null | undefined,
  title: string,
  fallback = `item-${randomUUID().replaceAll("-", "").slice(0, 10)}`,
) {
  return slugify(input ?? "") || slugify(title) || fallback;
}

export function isExplicitSlug(input: string | null | undefined) {
  return Boolean(slugify(input ?? ""));
}

export async function uniquifySlug(
  base: string,
  isTaken: (slug: string) => Promise<boolean>,
  options?: { explicit?: boolean },
) {
  if (!(await isTaken(base))) {
    return base;
  }

  if (options?.explicit) {
    throw new Error("رابط الصفحة مستخدم بالفعل، يرجى اختيار رابط آخر");
  }

  let index = 2;
  let candidate = `${base}-${index}`;

  while (await isTaken(candidate)) {
    index += 1;
    candidate = `${base}-${index}`;
  }

  return candidate;
}

export async function resolveUniqueSlug(
  input: string | null | undefined,
  title: string,
  isTaken: (slug: string) => Promise<boolean>,
) {
  const explicit = isExplicitSlug(input);
  const base = slugFromInput(input, title);
  return uniquifySlug(base, isTaken, { explicit });
}

export function publicItemPath(
  base: "sectors" | "media",
  item: { id: string; slug?: string | null },
) {
  return `/${base}/${item.slug || item.id}`;
}
