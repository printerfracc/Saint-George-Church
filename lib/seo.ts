import type { Metadata } from "next";
import { CHURCH_NAME, CHURCH_OG_IMAGE, CHURCH_SEO_DESCRIPTION, CHURCH_SITE_URL } from "@/lib/church";

const DEFAULT_SHARE_IMAGE = `${CHURCH_SITE_URL}${CHURCH_OG_IMAGE}`;

export function publicPageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [
        {
          url: DEFAULT_SHARE_IMAGE,
          width: 1200,
          height: 1200,
          alt: CHURCH_NAME,
        },
      ],
    },
  };
}

export function recordPageMetadata({
  title,
  description,
  imageUrl,
  fallbackTitle,
  path,
}: {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  fallbackTitle: string;
  path?: string;
}): Metadata {
  const resolvedTitle = title?.trim() || fallbackTitle;
  const resolvedDescription = description?.trim() || CHURCH_SEO_DESCRIPTION;
  const image = imageUrl?.trim() || DEFAULT_SHARE_IMAGE;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      ...(path ? { url: path } : {}),
      images: [{ url: image, alt: resolvedTitle }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [image],
    },
  };
}
