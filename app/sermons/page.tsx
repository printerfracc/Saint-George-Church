import LatestSermons from "@/components/home/LatestSermons";
import { prisma } from "@/lib/prisma";
import { publicPageMetadata } from "@/lib/seo";

export const metadata = publicPageMetadata(
  "أرشيف العظات",
  "أرشيف عظات كنيسة الشهيد العظيم مارجرجس بالمطرية للاستماع والتحميل.",
);

export default async function SermonsPage() {
  let sermons: {
    id: string;
    title: string;
    mediaUrl: string;
    date: string;
    priestName: string;
  }[] = [];

  try {
    const records = await prisma.sermon.findMany({
      orderBy: { date: "desc" },
      include: { priest: true },
    });

    sermons = records.map((sermon) => ({
      id: sermon.id,
      title: sermon.title,
      mediaUrl: sermon.mediaUrl,
      date: sermon.date.toISOString(),
      priestName: sermon.priest.name,
    }));
  } catch {
    sermons = [];
  }

  return (
    <main id="sermons" className="flex-1 bg-cream pt-20">
      <LatestSermons
        sermons={sermons}
        title="أرشيف العظات"
        showArchiveLink={false}
      />
    </main>
  );
}
