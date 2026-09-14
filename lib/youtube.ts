import { unstable_cache } from "next/cache";
import { YOUTUBE_CHANNEL_HANDLE } from "@/lib/church";

export type YouTubeLiveStatus = {
  isLive: boolean;
  videoId: string | null;
  title: string | null;
};

const offlineStatus: YouTubeLiveStatus = {
  isLive: false,
  videoId: null,
  title: null,
};

function youtubeEndpoint(path: string, params: Record<string, string>) {
  const url = new URL(`https://www.googleapis.com/youtube/v3/${path}`);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}

async function resolveChannelId(apiKey: string) {
  const configuredId = process.env.YOUTUBE_CHANNEL_ID?.trim();
  if (configuredId) {
    return configuredId;
  }

  const handle = (
    process.env.YOUTUBE_CHANNEL_HANDLE?.trim() || YOUTUBE_CHANNEL_HANDLE
  ).replace(/^@/, "");

  const response = await fetch(
    youtubeEndpoint("channels", {
      part: "id",
      forHandle: handle,
      key: apiKey,
    }),
    { cache: "no-store" },
  );

  if (!response.ok) {
    return null;
  }

  const data = (await response.json()) as {
    items?: Array<{ id?: string }>;
  };

  return data.items?.[0]?.id ?? null;
}

async function fetchYouTubeLiveStatus(): Promise<YouTubeLiveStatus> {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();

  if (!apiKey) {
    return offlineStatus;
  }

  try {
    const channelId = await resolveChannelId(apiKey);
    if (!channelId) {
      return offlineStatus;
    }

    const response = await fetch(
      youtubeEndpoint("search", {
        part: "snippet",
        channelId,
        eventType: "live",
        type: "video",
        maxResults: "1",
        key: apiKey,
      }),
      { cache: "no-store" },
    );

    if (!response.ok) {
      return offlineStatus;
    }

    const data = (await response.json()) as {
      items?: Array<{
        id?: { videoId?: string };
        snippet?: { title?: string };
      }>;
    };

    const liveVideo = data.items?.[0];
    const videoId = liveVideo?.id?.videoId ?? null;

    if (!videoId) {
      return offlineStatus;
    }

    return {
      isLive: true,
      videoId,
      title: liveVideo?.snippet?.title ?? null,
    };
  } catch {
    return offlineStatus;
  }
}

export const getYouTubeLiveStatus = unstable_cache(
  fetchYouTubeLiveStatus,
  ["youtube-live-status"],
  {
    revalidate: 60,
    tags: ["youtube-live"],
  },
);
