import ServiceManager from "@/components/admin/ServiceManager";
import { listServiceParents, listServices } from "@/actions/admin-actions";

export const metadata = {
  title: "إدارة الخدمات",
};

export default async function AdminServicesPage() {
  const [services, parentOptions] = await Promise.all([
    listServices(null),
    listServiceParents(),
  ]);

  return (
    <main className="px-4 py-8 md:px-8">
      <ServiceManager
        services={services.map((service) => ({
          id: service.id,
          title: service.title,
          description: service.description,
          slug: service.slug,
          imageUrl: service.imageUrl,
          parentId: service.parentId,
          childCount: service.childCount,
          imageDisplayMode: service.imageDisplayMode,
          serviceTime: service.serviceTime,
          amenPhone: service.amenPhone,
          imageUrls: service.imageUrls ?? [],
        }))}
        parentOptions={parentOptions}
      />
    </main>
  );
}
