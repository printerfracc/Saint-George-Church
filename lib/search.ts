export type SearchChild = {
  id: string;
  title: string;
  type: string;
  url: string;
};

export type SearchResult = {
  id: string;
  title: string;
  type: string;
  url: string;
  children: SearchChild[];
};

export const SEARCH_MIN_QUERY_LENGTH = 2;
export const SEARCH_RESULT_LIMIT = 8;
export const SEARCH_CHILD_LIMIT = 12;

export function normalizeSearchQuery(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export function isSearchableQuery(value: string | null | undefined) {
  return normalizeSearchQuery(value).length >= SEARCH_MIN_QUERY_LENGTH;
}

export function mediaTypeLabel(category: string | null | undefined) {
  if (category === "BOOKS") {
    return "كتاب";
  }

  if (category === "IMAGES") {
    return "صورة";
  }

  return "عظة";
}

export function searchItemAnchor(id: string) {
  return `item-${id}`;
}

export function searchChildUrl(parentUrl: string, childId: string) {
  return `${parentUrl}#${searchItemAnchor(childId)}`;
}

export function searchHomeAnchorUrl(id: string) {
  return searchChildUrl("/", id);
}

export function searchPageAnchorUrl(path: string, id: string) {
  return searchChildUrl(path, id);
}

export function titleContains(query: string) {
  return { contains: query };
}
