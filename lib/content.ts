export const HOME_SECTION_KEYS = ["hero", "church_story"] as const;

export type HomeSectionKey = (typeof HOME_SECTION_KEYS)[number];

export const HOME_SECTIONS: {
  key: HomeSectionKey;
  label: string;
  defaultTitle: string;
  defaultContent?: string;
}[] = [
  {
    key: "hero",
    label: "صورة الواجهة",
    defaultTitle: "كنيسة الشهيد العظيم مارجرجس بالمطرية",
    defaultContent:
      "نافذتك لمتابعة مواعيد القداسات، النهضات الروحية، وأخبار الخدمة لحظة بلحظة.",
  },
  {
    key: "church_story",
    label: "قصة الكنيسة",
    defaultTitle: "قصة الكنيسة",
  },
];

export const STORY_EXCERPT_LIMIT = 280;

export function isHomeSectionKey(value: string): value is HomeSectionKey {
  return HOME_SECTION_KEYS.includes(value as HomeSectionKey);
}

export function storyNeedsReadMore(content: string) {
  return content.trim().length > STORY_EXCERPT_LIMIT;
}

export function excerptStory(content: string) {
  const trimmed = content.trim();

  if (!storyNeedsReadMore(trimmed)) {
    return trimmed;
  }

  return `${trimmed.slice(0, STORY_EXCERPT_LIMIT).trimEnd()}…`;
}
