import {
  createActivity,
  deleteActivity,
  listActivities,
  updateActivity,
} from "@/actions/activities";
import NamedItemManager from "@/components/admin/NamedItemManager";

export const metadata = {
  title: "إدارة الأنشطة",
};

export default async function AdminActivitiesPage() {
  let activities: Awaited<ReturnType<typeof listActivities>> = [];

  try {
    activities = await listActivities();
  } catch {
    activities = [];
  }

  return (
    <main className="px-4 py-8 md:px-8">
      <NamedItemManager
        title="إدارة الأنشطة"
        addLabel="إضافة نشاط"
        emptyLabel="لا توجد أنشطة بعد"
        deleteConfirm="هل تريد حذف هذا النشاط؟"
        preview="activity"
        showLinkField
        reorderModel="ChurchActivity"
        items={activities.map((activity) => ({
          id: activity.id,
          name: activity.name,
          description: activity.description,
          imageUrl: activity.imageUrl,
          link: activity.link,
        }))}
        onCreate={createActivity}
        onUpdate={updateActivity}
        onDelete={deleteActivity}
      />
    </main>
  );
}
