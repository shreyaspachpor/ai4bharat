import { redirect } from "next/navigation";
import { apiGetCurrentUser } from "@/lib/api";
import AddCandidateForm from "./AddCandidateForm";

export const dynamic = "force-dynamic";

export default async function AddCandidatePage() {
  const { user } = await apiGetCurrentUser();
  
  // Only admin can access this page
  if (!user || user.role !== "admin") {
    redirect("/");
  }

  return (
    <div className="max-w-4xl mx-auto py-8">
      <AddCandidateForm />
    </div>
  );
}
