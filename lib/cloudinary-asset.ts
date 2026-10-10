const DEFAULT_R2_HOSTNAME = "media.stgeorgemataria.com";

function r2MediaHostnames() {
  const hosts = new Set<string>([DEFAULT_R2_HOSTNAME]);

  for (const raw of [process.env.R2_PUBLIC_URL, process.env.R2_PUBLIC_DOMAIN]) {
    const domain = raw?.trim();
    if (!domain) {
      continue;
    }

    try {
      hosts.add(new URL(domain.includes("://") ? domain : `https://${domain}`).hostname);
    } catch {
      // Keep the default media host when an env value is not a URL.
    }
  }

  return hosts;
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
    return url.protocol === "https:" && r2MediaHostnames().has(url.hostname);
  } catch {
    return false;
  }
}

export async function fetchCloudinaryAsset(fileUrl: string) {
  const source = normalizeMediaFileUrl(fileUrl);
  const sourceUrl = new URL(source);

  if (!r2MediaHostnames().has(sourceUrl.hostname)) {
    return null;
  }

  const stored = await fetch(sourceUrl.href, { redirect: "follow" });
  return stored.ok && stored.body ? stored : null;
}
