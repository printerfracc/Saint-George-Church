import { YOUTUBE_CHANNEL_HANDLE } from "@/lib/church";

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
  | { error: "Missing YouTube credentials" }
  | (YouTubeSearchResponse & { isLive: boolean });

const offlineStatus: YouTubeLiveStatus = {
  isLive: false,
  videoId: null,
  title: null,
};

async function fetchLiveSearch(
  apiKey: string,
  channelId: string,
): Promise<YouTubeSearchResponse & { isLive: boolean }> {
  const response = await fetch(
    `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${channelId}&type=video&eventType=live&key=${apiKey}`,
    { next: { revalidate: 60 } },
  );

  const data = (await response.json()) as YouTubeSearchResponse;

  return {
    ...data,
    isLive: Array.isArray(data.items) && data.items.length > 0,
  };
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
    { next: { revalidate: 60 } },
  );

  if (!response.ok) {
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
