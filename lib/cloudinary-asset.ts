const DEFAULT_R2_HOSTNAME = "media.stgeorgemataria.com";

function r2MediaHostname() {
  const domain = process.env.R2_PUBLIC_DOMAIN?.trim();
  if (!domain) {
    return DEFAULT_R2_HOSTNAME;
  }

  try {
    return new URL(domain.includes("://") ? domain : `https://${domain}`).hostname;
  } catch {
    return DEFAULT_R2_HOSTNAME;
  }
}

function isParsableHttpsUrl(value: string) {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

export function normalizeMediaFileUrl(value: string) {
  let current = value.trim();

  for (let pass = 0; pass < 2; pass += 1) {
    const doubleEncoded = current.includes("%25");
    if (isParsableHttpsUrl(current) && !doubleEncoded) {
      break;
    }

    try {
      const decoded = decodeURIComponent(current);
      if (decoded === current) {
        break;
      }
      current = decoded;
    } catch {
      break;
    }
  }

  if (!isParsableHttpsUrl(current)) {
    return current;
  }

  return new URL(current).href;
}

export function isAllowedCloudinaryUrl(value: string) {
  try {
    const url = new URL(normalizeMediaFileUrl(value));
    return url.protocol === "https:" && url.hostname === r2MediaHostname();
  } catch {
    return false;
  }
}

export async function fetchCloudinaryAsset(fileUrl: string) {
  const source = normalizeMediaFileUrl(fileUrl);
  const sourceUrl = new URL(source);

  if (sourceUrl.hostname !== r2MediaHostname()) {
    return null;
  }

  const stored = await fetch(sourceUrl.href, { redirect: "follow" });
  return stored.ok && stored.body ? stored : null;
}
