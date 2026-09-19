import type { Metadata } from "next";
import { CHURCH_OG_IMAGE, CHURCH_SEO_DESCRIPTION } from "@/lib/church";

export function publicPageMetadata(title: string, description: string): Metadata {
  return {
    title,
    description,
    openGraph: {
      title,
      description,
    },
  };
}

export function recordPageMetadata({
  title,
  description,
  imageUrl,
  fallbackTitle,
}: {
  title?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  fallbackTitle: string;
}): Metadata {
  const resolvedTitle = title?.trim() || fallbackTitle;
  const resolvedDescription = description?.trim() || CHURCH_SEO_DESCRIPTION;
  const image = imageUrl?.trim() || CHURCH_OG_IMAGE;

  return {
    title: resolvedTitle,
    description: resolvedDescription,
    openGraph: {
      title: resolvedTitle,
      description: resolvedDescription,
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title: resolvedTitle,
      description: resolvedDescription,
      images: [image],
    },
  };
}
