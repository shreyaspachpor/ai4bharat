import { redirect } from "next/navigation";
import { apiGetCurrentUser } from "@/lib/api";
import AdminDashboardClient from "./AdminDashboardClient";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const { user } = await apiGetCurrentUser();
  
  // Only admin can access this page
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return <AdminDashboardClient />;
}
