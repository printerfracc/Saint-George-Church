import Image from "next/image";
import PlaceholderPage from "@/components/public/PlaceholderPage";
import { findDynamicContentByKey } from "@/lib/dynamic-content";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "قصة الكنيسة",
  "تعرّف على قصة كنيسة الشهيد العظيم مارجرجس بالمطرية وتاريخها الروحي في حي المطرية.",
);

export const revalidate = 60;

export default async function HistoryPage() {
  let story: {
    title: string;
    content: string;
    imageUrl: string | null;
  } | null = null;

  try {
    const record = await findDynamicContentByKey("church_story");

    story = record
      ? {
          title: record.title,
          content: record.content,
          imageUrl: record.imageUrl,
        }
      : null;
  } catch {
    story = null;
  }

  if (!story || !story.content.trim()) {
    return (
      <PlaceholderPage title="قصة الكنيسة">
        <p className="rounded-2xl border border-dashed border-coptic-gold-main/50 bg-white/70 px-4 py-8 text-center">
          سيتم نشر قصة الكنيسة قريباً.
        </p>
      </PlaceholderPage>
    );
  }

  return (
    <main className="mx-auto w-full max-w-4xl flex-1 px-4 pt-28 pb-16">
      <h1 className="bg-linear-to-r from-coptic-gold-light to-coptic-gold-dark bg-clip-text text-center text-3xl font-bold text-transparent md:text-4xl">
        {story.title || "قصة الكنيسة"}
      </h1>
      <div className="mx-auto mt-3 h-1 w-20 rounded-full bg-coptic-gold-main" />

      {story.imageUrl ? (
        <div className="relative mt-8 aspect-video overflow-hidden rounded-3xl border border-coptic-gold-main/40 bg-white/70 shadow-sm">
          <Image
            src={story.imageUrl}
            alt={story.title || "قصة الكنيسة"}
            fill
            unoptimized
            className="object-cover"
          />
        </div>
      ) : null}

      <div className="mt-8 whitespace-pre-line text-sm leading-8 text-deep-red/85 md:text-base">
        {story.content}
      </div>
    </main>
  );
}
