import { redirect } from "next/navigation";

export default function AnniversariesPage() {
  redirect("/admin/registry?tab=anniversaries");
}