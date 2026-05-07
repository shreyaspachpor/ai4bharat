import { apiSignOut } from "@/lib/api";
import { cookies } from "next/headers";
 
export async function POST() {
  try {
    await apiSignOut();
  } catch (e) {
    console.error(e);
  }
  const cookieStore = await cookies();
  cookieStore.delete("session");
  return Response.json({ success: true });
} 