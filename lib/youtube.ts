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

export type LiveStreamCheckError = {
  ok: false;
  error: string;
  status?: number;
  details?: unknown;
};

export type LiveStreamCheckSuccess = YouTubeSearchResponse & {
  ok: true;
  isLive: boolean;
};

export type LiveStreamCheckResult = LiveStreamCheckError | LiveStreamCheckSuccess;

function isLiveStreamError(
  result: LiveStreamCheckResult,
): result is LiveStreamCheckError {
  return result.ok === false;
}

const YOUTUBE_FETCH_OPTIONS = { cache: "no-store" } as const;
const CAIRO_TIME_ZONE = "Africa/Cairo";

type LiveStreamingDetails = {
  actualStartTime?: string;
  actualEndTime?: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
};

type YouTubeVideoItem = {
  id?: string;
  snippet?: {
    title?: string;
    liveBroadcastContent?: string;
  };
  liveStreamingDetails?: LiveStreamingDetails;
};

const offlineStatus: YouTubeLiveStatus = {
  isLive: false,
  videoId: null,
  title: null,
};

const offlineCheck: LiveStreamCheckSuccess = {
  ok: true,
  isLive: false,
  items: [],
};

function sanitizeEnv(value?: string | null) {
  return value?.trim().replace(/^['"]|['"]$/g, "").trim() || "";
}

export function youtubeCredentialDebug() {
  const key = sanitizeEnv(process.env.YOUTUBE_API_KEY);
  const channelId = sanitizeEnv(process.env.YOUTUBE_CHANNEL_ID);

  return {
    keyLength: key.length || null,
    keyPrefix: key ? key.substring(0, 7) : null,
    hasChannelId: channelId.length > 0,
  };
}

function cairoOffsetMinutes(instant: Date) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: CAIRO_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value ?? "0");
  const cairoAsUtc = Date.UTC(
    value("year"),
    value("month") - 1,
    value("day"),
    value("hour"),
    value("minute"),
    value("second"),
  );

  return Math.round((cairoAsUtc - instant.getTime()) / 60_000);
}

function cairoClock(instant: Date) {
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: CAIRO_TIME_ZONE,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).format(instant);
}

/** YouTube sends UTC instants. A bare datetime is Cairo wall time, not the server timezone. */
function parseBroadcastInstant(value?: string) {
  if (!value?.trim()) {
    return null;
  }

  const trimmed = value.trim();
  if (/[zZ]$|[+-]\d{2}:?\d{2}$/.test(trimmed)) {
    const parsed = Date.parse(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})(?::(\d{2}))?/,
  );
  if (!match) {
    return null;
  }

  const utcGuess = Date.UTC(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    Number(match[6] ?? 0),
  );
  const offset = cairoOffsetMinutes(new Date(utcGuess));
  const corrected = utcGuess - offset * 60_000;
  const correctedOffset = cairoOffsetMinutes(new Date(corrected));

  return correctedOffset === offset ? corrected : utcGuess - correctedOffset * 60_000;
}

function instantHasPassed(value: string | undefined, now: number) {
  const instant = parseBroadcastInstant(value);
  return instant != null && instant <= now;
}

function evaluateBroadcast(video: YouTubeVideoItem, now: number) {
  const liveBroadcastContent = video.snippet?.liveBroadcastContent ?? "none";
  const details = video.liveStreamingDetails;
  const actualEndPassed = instantHasPassed(details?.actualEndTime, now);
  const actualStartPassed = details?.actualStartTime
    ? instantHasPassed(details.actualStartTime, now)
    : false;
  const scheduledStartPassed = details?.scheduledStartTime
    ? instantHasPassed(details.scheduledStartTime, now)
    : false;
  const isLive =
    liveBroadcastContent === "live" &&
    !actualEndPassed &&
    (!details?.actualStartTime || actualStartPassed);

  return {
    isLive,
    videoId: video.id ?? null,
    title: video.snippet?.title ?? null,
    liveBroadcastContent,
    actualStartTime: details?.actualStartTime ?? null,
    actualEndTime: details?.actualEndTime ?? null,
    scheduledStartTime: details?.scheduledStartTime ?? null,
    scheduledStartPassed,
    actualStartPassed,
    actualEndPassed,
  };
}

async function fetchLiveSearch(
  apiKey: string,
  channelId: string,
): Promise<LiveStreamCheckResult> {
  const now = new Date();
  const nowMs = now.getTime();

  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${encodeURIComponent(channelId)}&type=video&eventType=live&key=${encodeURIComponent(apiKey)}`,
      YOUTUBE_FETCH_OPTIONS,
    );
    const data = (await response.json()) as YouTubeSearchResponse;
    const searchIds = (data.items ?? [])
      .map((item) => item.id?.videoId)
      .filter((videoId): videoId is string => Boolean(videoId));

    let videosStatus: number | null = null;
    let evaluations: ReturnType<typeof evaluateBroadcast>[] = [];

    if (response.ok && searchIds.length > 0) {
      const videosResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=snippet,liveStreamingDetails&id=${searchIds.map((videoId) => encodeURIComponent(videoId)).join(",")}&key=${encodeURIComponent(apiKey)}`,
        YOUTUBE_FETCH_OPTIONS,
      );
      videosStatus = videosResponse.status;
      const videos = (await videosResponse.json()) as { items?: YouTubeVideoItem[] };
      evaluations = (videos.items ?? []).map((video) => evaluateBroadcast(video, nowMs));
    }

    const liveVideos = evaluations.filter((video) => video.isLive);
    const isLive = liveVideos.length > 0;

    console.log("LIVE CHECK:", {
      isLive,
      currentVercelTime: now.toISOString(),
      cairoTime: cairoClock(now),
      cairoOffsetMinutes: cairoOffsetMinutes(now),
      apiResponseStatus: response.status,
      videosApiStatus: videosStatus,
      searchItemCount: data.items?.length ?? 0,
      evaluations,
    });

    if (!response.ok) {
      return offlineCheck;
    }

    return {
      ...data,
      ok: true,
      isLive,
      items: liveVideos.map((video) => ({
        id: { kind: "youtube#video", videoId: video.videoId ?? undefined },
        snippet: { title: video.title ?? undefined },
      })),
    };
  } catch (error) {
    console.log("LIVE CHECK:", {
      isLive: false,
      currentVercelTime: now.toISOString(),
      cairoTime: cairoClock(now),
      cairoOffsetMinutes: cairoOffsetMinutes(now),
      apiResponseStatus: "fetch-failed",
      error: error instanceof Error ? error.message : "YouTube API request failed",
    });
    console.error("Failed to check live stream status", error);
    return offlineCheck;
  }
}

export async function checkLiveStreamStatus(): Promise<LiveStreamCheckResult> {
  const apiKey = sanitizeEnv(process.env.YOUTUBE_API_KEY);
  const channelId = sanitizeEnv(process.env.YOUTUBE_CHANNEL_ID);

  if (!apiKey || !channelId) {
    return { ok: false, error: "Missing YouTube credentials" };
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
    `https://www.googleapis.com/youtube/v3/channels?part=id&forHandle=${encodeURIComponent(handle)}&key=${encodeURIComponent(apiKey)}`,
    YOUTUBE_FETCH_OPTIONS,
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

    if (!isLiveStreamError(result)) {
      return toLiveStatus(result);
    }

    if (result.error !== "Missing YouTube credentials") {
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

    const fallback = await fetchLiveSearch(apiKey, channelId);
    return isLiveStreamError(fallback) ? offlineStatus : toLiveStatus(fallback);
  } catch {
    return offlineStatus;
  }
}
