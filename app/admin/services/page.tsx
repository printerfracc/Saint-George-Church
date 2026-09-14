import ServiceManager from "@/components/admin/ServiceManager";
import { listServices } from "@/actions/admin-actions";

export const metadata = {
  title: "إدارة الخدمات",
};

export default async function AdminServicesPage() {
  let services: Awaited<ReturnType<typeof listServices>> = [];

  try {
    services = await listServices();
  } catch {
    services = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <ServiceManager
        services={services.map((service) => ({
          id: service.id,
          title: service.title,
          description: service.description,
          imageUrl: service.imageUrl,
        }))}
      />
    </main>
  );
}
