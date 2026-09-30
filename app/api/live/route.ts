export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { checkLiveStreamStatus, youtubeCredentialDebug } from "@/lib/youtube";

const noStore = { "Cache-Control": "no-store" };

export async function GET() {
  try {
    const debug = youtubeCredentialDebug();
    const status = await checkLiveStreamStatus();

    if (status.ok === false) {
      return NextResponse.json(
        {
          ok: true,
          isLive: false,
          items: [],
          debug,
        },
        { headers: noStore },
      );
    }

    return NextResponse.json({ ...status, debug }, { headers: noStore });
  } catch (error) {
    const message =
      error instanceof Error
        ? `YouTube API request failed: ${error.message}`
        : "YouTube API request failed";
    console.error("Failed to check live stream status", error);
    return NextResponse.json(
      {
        ok: true,
        isLive: false,
        items: [],
        error: message,
      },
      { headers: noStore },
    );
  }
}
