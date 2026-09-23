import { NextResponse } from "next/server";
import { checkLiveStreamStatus, youtubeCredentialDebug } from "@/lib/youtube";

export async function GET() {
  try {
    const debug = youtubeCredentialDebug();
    const status = await checkLiveStreamStatus();

    if (status.ok === false) {
      return NextResponse.json({
        ok: true,
        isLive: false,
        items: [],
        debug,
      });
    }

    return NextResponse.json({ ...status, debug });
  } catch (error) {
    const message =
      error instanceof Error
        ? `YouTube API request failed: ${error.message}`
        : "YouTube API request failed";
    return NextResponse.json({
      ok: true,
      isLive: false,
      items: [],
      error: message,
    });
  }
}
