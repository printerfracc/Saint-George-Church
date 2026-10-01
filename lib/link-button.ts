export const DEFAULT_LINK_BUTTON_LABEL = "اضغط هنا";

export function linkButtonLabel(label?: string | null) {
  const trimmed = label?.trim() ?? "";
  return trimmed || DEFAULT_LINK_BUTTON_LABEL;
}

export function parseOptionalHref(value?: string | null) {
  const trimmed = value?.trim() || null;

  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("/") && !trimmed.startsWith("//")) {
    return trimmed;
  }

  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }

  throw new Error("يمكنك كتابة رابط داخلي يبدأ بـ / أو رابط خارجي كامل.");
}
