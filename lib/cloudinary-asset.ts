import { cloudinary } from "@/lib/cloudinary";

export type CloudinaryResourceType = "image" | "raw" | "video";

export type ParsedCloudinaryUrl = {
  cloudName: string;
  resourceType: CloudinaryResourceType;
  deliveryType: string;
  publicId: string;
  format: string;
};

export type CloudinaryAssetRef = {
  publicId: string;
  format: string;
  resourceType: CloudinaryResourceType;
  deliveryType: string;
};

type CloudinaryUtils = typeof cloudinary.utils & {
  private_download_url: (
    publicId: string,
    format: string,
    options?: Record<string, unknown>,
  ) => string;
};

const RESOURCE_TYPES = new Set<CloudinaryResourceType>(["image", "raw", "video"]);
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

function isVersionSegment(segment: string) {
  return /^v\d+$/.test(segment);
}

function isTransformSegment(segment: string) {
  if (segment.startsWith("s--") && segment.endsWith("--")) {
    return true;
  }

  return /^(?:[a-z]{1,3}_|e_|fl_|pg_|t_)/.test(segment) || segment.includes(",");
}

export function isAllowedCloudinaryUrl(value: string) {
  try {
    const url = new URL(normalizeMediaFileUrl(value));
    if (url.protocol !== "https:") {
      return false;
    }

    if (url.hostname === r2MediaHostname()) {
      return true;
    }

    if (url.hostname !== "res.cloudinary.com") {
      return false;
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const pathCloud = url.pathname.split("/").filter(Boolean)[0];

    return !cloudName || pathCloud === cloudName;
  } catch {
    return false;
  }
}

export function parseCloudinaryUrl(fileUrl: string): ParsedCloudinaryUrl | null {
  let url: URL;

  try {
    url = new URL(fileUrl);
  } catch {
    return null;
  }

  if (url.hostname !== "res.cloudinary.com") {
    return null;
  }

  const parts = url.pathname.split("/").filter(Boolean);

  if (parts.length < 4) {
    return null;
  }

  const [cloudName, resourceType, deliveryType, ...rest] = parts;

  if (!RESOURCE_TYPES.has(resourceType as CloudinaryResourceType)) {
    return null;
  }

  let index = 0;

  while (index < rest.length - 1 && isTransformSegment(rest[index])) {
    index += 1;
  }

  if (index < rest.length && isVersionSegment(rest[index])) {
    index += 1;
  }

  const publicPath = rest.slice(index).join("/");

  if (!publicPath) {
    return null;
  }

  const extensionMatch = publicPath.match(/\.([a-zA-Z0-9]+)$/);
  const format = extensionMatch?.[1]?.toLowerCase() ?? "";
  const publicId = format
    ? publicPath.slice(0, -(format.length + 1))
    : publicPath;

  return {
    cloudName,
    resourceType: resourceType as CloudinaryResourceType,
    deliveryType,
    publicId,
    format,
  };
}

function pushCandidate(
  candidates: CloudinaryAssetRef[],
  seen: Set<string>,
  candidate: CloudinaryAssetRef,
) {
  const key = `${candidate.resourceType}:${candidate.deliveryType}:${candidate.publicId}:${candidate.format}`;

  if (seen.has(key) || !candidate.publicId) {
    return;
  }

  seen.add(key);
  candidates.push(candidate);
}

function buildCandidates(parsed: ParsedCloudinaryUrl): CloudinaryAssetRef[] {
  const format = parsed.format;
  const withoutExt = parsed.publicId;
  const withExt =
    format && !withoutExt.toLowerCase().endsWith(`.${format}`)
      ? `${withoutExt}.${format}`
      : withoutExt;

  const resourceOrder: CloudinaryResourceType[] =
    parsed.resourceType === "raw"
      ? ["raw", "image"]
      : parsed.resourceType === "video"
        ? ["video", "raw", "image"]
        : ["image", "raw"];

  const candidates: CloudinaryAssetRef[] = [];
  const seen = new Set<string>();

  for (const resourceType of resourceOrder) {
    if (resourceType === "raw") {
      pushCandidate(candidates, seen, {
        publicId: withExt,
        format: "",
        resourceType,
        deliveryType: parsed.deliveryType,
      });
      pushCandidate(candidates, seen, {
        publicId: withExt,
        format,
        resourceType,
        deliveryType: parsed.deliveryType,
      });
    }

    pushCandidate(candidates, seen, {
      publicId: withoutExt,
      format,
      resourceType,
      deliveryType: parsed.deliveryType,
    });
  }

  return candidates;
}

async function assetExists(candidate: CloudinaryAssetRef) {
  try {
    await cloudinary.api.resource(candidate.publicId, {
      resource_type: candidate.resourceType,
      type: candidate.deliveryType,
    });
    return true;
  } catch {
    return false;
  }
}

export async function resolveCloudinaryAsset(
  fileUrl: string,
): Promise<CloudinaryAssetRef | null> {
  const parsed = parseCloudinaryUrl(fileUrl);

  if (!parsed) {
    return null;
  }

  const candidates = buildCandidates(parsed);

  for (const candidate of candidates) {
    if (await assetExists(candidate)) {
      return candidate;
    }
  }

  return {
    publicId: parsed.publicId,
    format: parsed.format,
    resourceType: parsed.resourceType,
    deliveryType: parsed.deliveryType,
  };
}

function privateDownloadUrl(
  publicId: string,
  format: string,
  options: Record<string, unknown>,
) {
  return (cloudinary.utils as CloudinaryUtils).private_download_url(
    publicId,
    format,
    options,
  );
}

export function cloudinaryPrivateDownloadUrl(
  asset: CloudinaryAssetRef,
  options?: { attachment?: string; expiresInSeconds?: number },
) {
  return privateDownloadUrl(asset.publicId, asset.format, {
    resource_type: asset.resourceType,
    type: asset.deliveryType,
    attachment: options?.attachment || undefined,
    expires_at: Math.floor(Date.now() / 1000) + (options?.expiresInSeconds ?? 300),
  });
}

export async function fetchCloudinaryAsset(fileUrl: string) {
  const source = normalizeMediaFileUrl(fileUrl);
  const sourceUrl = new URL(source);

  if (sourceUrl.hostname === r2MediaHostname()) {
    const stored = await fetch(sourceUrl.href, { redirect: "follow" });
    return stored.ok && stored.body ? stored : null;
  }

  const asset = await resolveCloudinaryAsset(source);

  if (asset) {
    const downloadUrl = cloudinaryPrivateDownloadUrl(asset);
    const authenticated = await fetch(downloadUrl, { redirect: "follow" });

    if (authenticated.ok && authenticated.body) {
      return authenticated;
    }
  }

  const publicResponse = await fetch(source, { redirect: "follow" });

  if (publicResponse.ok && publicResponse.body) {
    return publicResponse;
  }

  return null;
}
