import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ServiceManager from "@/components/admin/ServiceManager";
import { getService, listServiceParents } from "@/actions/admin-actions";
import { recordPageMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const service = await getService(id);

  return recordPageMetadata({
    title: service?.title,
    description: service?.description,
    imageUrl: service?.imageUrl,
    fallbackTitle: "أقسام القطاع",
    path: `/admin/services/${id}`,
  });
}

export default async function AdminServiceChildrenPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [service, parentOptions] = await Promise.all([
    getService(id),
    listServiceParents(),
  ]);

  if (!service) {
    notFound();
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <ServiceManager
        currentParent={{ id: service.id, title: service.title }}
        backHref={service.parent ? `/admin/services/${service.parent.id}` : "/admin/services"}
        backLabel={service.parent ? `العودة إلى ${service.parent.title}` : "العودة إلى القطاعات"}
        services={service.children.map((child) => ({
          id: child.id,
          title: child.title,
          description: child.description,
          slug: child.slug,
          imageUrl: child.imageUrl,
          parentId: child.parentId,
          childCount: child.childCount,
          imageDisplayMode: child.imageDisplayMode,
          serviceTime: child.serviceTime,
          amenPhone: child.amenPhone,
          imageUrls: child.imageUrls ?? [],
        }))}
        parentOptions={parentOptions}
      />
    </main>
  );
}
