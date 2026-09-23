import { YOUTUBE_CHANNEL_HANDLE } from "@/lib/church";

const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "youtube-nocookie.com",
  "youtu.be",
]);

function isYouTubeVideoId(value?: string | null) {
  return Boolean(value && YOUTUBE_ID_PATTERN.test(value));
}

export function extractYouTubeVideoId(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (isYouTubeVideoId(trimmed)) {
    return trimmed;
  }

  try {
    const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    const host = url.hostname.replace(/^(www|m)\./, "");

    if (!YOUTUBE_HOSTS.has(host)) {
      return null;
    }

    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0] ?? "";
      return isYouTubeVideoId(id) ? id : null;
    }

    const fromQuery = url.searchParams.get("v");
    if (isYouTubeVideoId(fromQuery)) {
      return fromQuery;
    }

    const parts = url.pathname.split("/").filter(Boolean);
    if (
      parts[0] &&
      ["embed", "shorts", "live", "v"].includes(parts[0]) &&
      isYouTubeVideoId(parts[1])
    ) {
      return parts[1];
    }
  } catch {
    return null;
  }

  return null;
}

export function youtubeThumbnailUrl(value?: string | null) {
  const videoId = extractYouTubeVideoId(value);
  return videoId ? `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg` : null;
}

export function isYouTubeUrl(value?: string | null) {
  return Boolean(extractYouTubeVideoId(value));
}

export type YouTubeLiveStatus = {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
};

type YouTubeSearchItem = {
  id?: { kind?: string; videoId?: string };
  snippet?: { title?: string };
};

export type YouTubeSearchResponse = {
  kind?: string;
  etag?: string;
  regionCode?: string;
  pageInfo?: { totalResults?: number; resultsPerPage?: number };
  items?: YouTubeSearchItem[];
  error?: { code?: number; message?: string };
};

export type LiveStreamCheckResult =
  | { error: string; status?: number; details?: unknown }
  | (YouTubeSearchResponse & { isLive: boolean });

const offlineStatus: YouTubeLiveStatus = {
  isLive: false,
  videoId: null,
  title: null,
};

function youtubeErrorMessage(status: number, data: YouTubeSearchResponse) {
  const googleMessage = data.error?.message?.trim();
  return `YouTube API Error ${status}: ${googleMessage || "Unknown YouTube error"}`;
}

async function fetchLiveSearch(
  apiKey: string,
  channelId: string,
): Promise<LiveStreamCheckResult> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`,
      { cache: "no-store" },
    );

    const data = (await response.json()) as YouTubeSearchResponse;

    if (!response.ok) {
      const message = youtubeErrorMessage(response.status, data);
      console.error(message, data);
      return {
        error: message,
        status: response.status,
        details: data,
      };
    }

    return {
      ...data,
      isLive: Array.isArray(data.items) && data.items.length > 0,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? `YouTube API request failed: ${error.message}`
        : "YouTube API request failed";
    console.error(message, error);
    return { error: message };
  }
}

export async function checkLiveStreamStatus(): Promise<LiveStreamCheckResult> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  const channelId = process.env.YOUTUBE_CHANNEL_ID?.trim();

  if (!apiKey || !channelId) {
    return { error: "Missing YouTube credentials" };
  }

  return fetchLiveSearch(apiKey, channelId);
}

function toLiveStatus(
  data: YouTubeSearchResponse & { isLive: boolean },
): YouTubeLiveStatus {
  const liveVideo = data.items?.[0];
  const videoId = liveVideo?.id?.videoId ?? null;

  if (!data.isLive || !videoId) {
    return offlineStatus;
  }

  return {
    isLive: true,
    videoId,
    title: liveVideo?.snippet?.title ?? null,
  };
}

async function resolveChannelIdFromHandle(apiKey: string) {
  const handle = (
    process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || YOUTUBE_CHANNEL_HANDLE
  ).replace(/^@/, "");

  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${handle}&key=${apiKey}`,
    { cache: "no-store" },
  );

  if (!response.ok) {
    const data = (await response.json().catch(() => ({}))) as YouTubeSearchResponse;
    console.error(youtubeErrorMessage(response.status, data), data);
    return null;
  }

  const data = (await response.json()) as {
    items?: Array<{ id?: string }>;
  };

  return data.items?.[0]?.id ?? null;
}

export async function getYouTubeLiveStatus(): Promise<YouTubeLiveStatus> {
  try {
    const result = await checkLiveStreamStatus();

    if ("isLive" in result) {
      return toLiveStatus(result);
    }

    if (result.error && result.error !== "Missing YouTube credentials") {
      console.error(result.error, result.details ?? result);
      return offlineStatus;
    }

    const apiKey = process.env.YOUTUBE_API_KEY?.trim();
    if (!apiKey) {
      return offlineStatus;
    }

    const channelId = await resolveChannelIdFromHandle(apiKey);
    if (!channelId) {
      return offlineStatus;
    }

    return toLiveStatus(await fetchLiveSearch(apiKey, channelId));
  } catch {
    return offlineStatus;
  }
}
