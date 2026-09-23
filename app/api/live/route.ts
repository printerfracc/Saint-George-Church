import { NextResponse } from "next/server";
import { checkLiveStreamStatus } from "@/lib/youtube";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const status = await checkLiveStreamStatus();

    if ("error" in status) {
      return NextResponse.json(status, { status: status.status ?? 500 });
    }

    return NextResponse.json(status, {
      headers: {
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? `YouTube API request failed: ${error.message}`
        : "YouTube API request failed";
    console.error(message, error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
