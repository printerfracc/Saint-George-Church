import Link from "next/link";
import { checkLiveStreamStatus } from "@/lib/youtube";

export default async function LiveNowBanner() {
  let isLive = false;

  try {
    const status = await checkLiveStreamStatus();
    isLive = "isLive" in status && status.isLive;
  } catch {
    isLive = false;
  }

  if (!isLive) {
    return null;
  }

  return (
    <Link
      href="/live"
      className="bg-red-600 text-white text-center py-2 font-bold flex justify-center items-center gap-2 w-full"
      aria-label="مشاهدة البث المباشر الآن"
    >
      <span
        className="h-2.5 w-2.5 animate-pulse rounded-full bg-white"
        aria-hidden="true"
      />
      🔴 بث مباشر الآن
    </Link>
  );
}
