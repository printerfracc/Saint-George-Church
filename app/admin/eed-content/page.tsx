import EedContentForm from "@/components/admin/EedContentForm";
import { EED_EL_KHODAM_CONTENT_ID } from "@/lib/eed-content";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "محتوى عيد الخدام",
};

export default async function AdminEedContentPage() {
  let goal = "";
  let slogan = "";

  try {
    const content = await prisma.siteContent.findUnique({
      where: { id: EED_EL_KHODAM_CONTENT_ID },
    });
    goal = content?.goal ?? "";
    slogan = content?.slogan ?? "";
  } catch {
    goal = "";
    slogan = "";
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <EedContentForm goal={goal} slogan={slogan} />
    </main>
  );
}
