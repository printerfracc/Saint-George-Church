import EedContentForm from "@/components/admin/EedContentForm";
import { getEedSiteContent } from "@/lib/eed-content";

export const metadata = {
  title: "محتوى عيد الخدام",
};

export default async function AdminEedContentPage() {
  const content = await getEedSiteContent();
  const goal = content.goal ?? "";
  const slogan = content.slogan ?? "";
  const sloganLogo = content.sloganLogo ?? "";

  return (
    <main className="px-4 py-8 md:px-8">
      <EedContentForm goal={goal} slogan={slogan} sloganLogo={sloganLogo} />
    </main>
  );
}
