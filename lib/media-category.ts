export const MEDIA_CATEGORIES = ["SERMONS", "BOOKS", "IMAGES"] as const;

export type MediaCategory = (typeof MEDIA_CATEGORIES)[number];

export const MEDIA_CATEGORY_LABELS: Record<MediaCategory, string> = {
  SERMONS: "عظات",
  BOOKS: "كتب",
  IMAGES: "صور",
};

const CATEGORY_ORDER: MediaCategory[] = ["SERMONS", "BOOKS", "IMAGES"];

export function parseMediaCategory(value: string | null | undefined): MediaCategory {
  if (value === "BOOKS" || value === "IMAGES" || value === "SERMONS") {
    return value;
  }

  return "SERMONS";
}

export type MediaNavLink = {
  title: string;
  href: string;
  isOverview?: boolean;
  category?: MediaCategory;
};

export type MediaNavLinkEntry = {
  key: string;
  title: string;
  href: string;
};

export type MediaNavGroup = {
  key: string;
  category: MediaCategory;
  title: string | null;
  items: MediaNavLinkEntry[];
};

export type MediaNavLayout = {
  overview: MediaNavLinkEntry | null;
  groups: MediaNavGroup[];
};

export function groupMediaNavItems(items: MediaNavLink[]): MediaNavLayout {
  const overviewItem = items.find((item) => item.isOverview);
  const links = items.filter((item) => !item.isOverview && item.title.trim());

  return {
    overview: overviewItem
      ? {
          key: `overview-${overviewItem.href}`,
          title: overviewItem.title,
          href: overviewItem.href,
        }
      : null,
    groups: CATEGORY_ORDER.flatMap((category) => {
      const members = links.filter(
        (item) => parseMediaCategory(item.category) === category,
      );

      if (members.length === 0) {
        return [];
      }

      return [
        {
          key: `group-${category}`,
          category,
          title:
            members.length > 1 || category === "IMAGES"
              ? MEDIA_CATEGORY_LABELS[category]
              : null,
          items: members.map((item) => ({
            key: `${category}-${item.href}`,
            title: item.title,
            href: item.href,
          })),
        },
      ];
    }),
  };
}
