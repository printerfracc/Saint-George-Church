import { NextResponse } from "next/server";
import { checkLiveStreamStatus, youtubeCredentialDebug } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const debug = youtubeCredentialDebug();
    console.log(
      "Vercel Key Check - Length:",
      debug.keyLength,
      "Starts with:",
      debug.keyPrefix,
    );

    const status = await checkLiveStreamStatus();

    if (status.ok === false) {
      return NextResponse.json(
        { ...status, debug },
        { status: status.status ?? 500 },
      );
    }

    return NextResponse.json(
      { ...status, debug },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const message =
      error instanceof Error
        ? `YouTube API request failed: ${error.message}`
        : "YouTube API request failed";
    console.error(message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
