import LiveChatOption from "@/components/live/LiveChatOption";
import { getAppUrl } from "@/lib/app-url";
import { YOUTUBE_STREAMS_URL } from "@/lib/church";
import { getYouTubeLiveStatus } from "@/lib/youtube";

function ChannelLink({ label }: { label: string }) {
  return (
    <a
      href={YOUTUBE_STREAMS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex min-h-11 items-center justify-center rounded-full bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark px-5 text-sm font-bold text-black"
      aria-label={label}
    >
      {label}
    </a>
  );
}

export default async function ChurchLiveStream() {
  const live = await getYouTubeLiveStatus();

  if (live.isLive && live.videoId) {
    const embedDomain = new URL(getAppUrl()).hostname;

    return (
      <div className="mt-5">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <p className="inline-flex min-h-11 items-center gap-2 rounded-full bg-coptic-gold-main px-3 text-xs font-bold text-black">
            <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
            البث جارٍ الآن
          </p>
          <ChannelLink label="قناة الكنيسة على يوتيوب" />
        </div>

        {live.title ? (
          <h3 className="mb-4 text-lg font-bold text-deep-red">{live.title}</h3>
        ) : null}

        <div className="relative w-full overflow-hidden rounded-2xl border border-coptic-gold-main/50 bg-black shadow-lg aspect-video">
          <iframe
            src={`https://www.youtube.com/embed/${live.videoId}?autoplay=1&rel=0`}
            title={live.title ?? "البث المباشر من الكنيسة"}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            className="absolute inset-0 h-full w-full"
          />
        </div>

        <LiveChatOption videoId={live.videoId} embedDomain={embedDomain} />
      </div>
    );
  }

  return (
    <div className="mt-5 rounded-2xl border border-coptic-gold-main/40 bg-white/85 px-5 py-8 text-center shadow-sm">
      <p className="text-lg font-bold text-deep-red">لا يوجد بث مباشر حالياً</p>
      <p className="mx-auto mt-3 max-w-lg text-sm leading-8 text-deep-red/75">
        يمكنكم متابعة قناة الكنيسة على يوتيوب لمشاهدة البث عند بدايته، أو تصفح
        القداسات والصلوات المسجّلة.
      </p>
      <div className="mt-6">
        <ChannelLink label="فتح قناة الكنيسة على يوتيوب" />
      </div>
    </div>
  );
}
