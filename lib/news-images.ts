export function normalizeNewsImageUrls(
  urls?: Array<string | null | undefined> | null,
  fallback?: string | null,
) {
  const list: string[] = [];

  for (const item of urls ?? []) {
    const url = item?.trim() ?? "";
    if (url && !list.includes(url)) {
      list.push(url);
    }
  }

  if (list.length === 0) {
    const url = fallback?.trim() ?? "";
    if (url) {
      list.push(url);
    }
  }

  return list;
}

export function parseStoredNewsImageUrls(value?: string | null, fallback?: string | null) {
  if (value?.trim().startsWith("[")) {
    try {
      const parsed = JSON.parse(value) as unknown;
      if (Array.isArray(parsed)) {
        return normalizeNewsImageUrls(
          parsed.filter((item): item is string => typeof item === "string"),
          fallback,
        );
      }
    } catch {
      // Keep the original cover image when stored JSON is invalid.
    }
  }

  return normalizeNewsImageUrls(null, fallback);
}

export function storedNewsImages(urls: string[]) {
  const imageUrls = normalizeNewsImageUrls(urls);

  return {
    imageUrl: imageUrls[0] ?? null,
    imageUrls: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
  };
}
