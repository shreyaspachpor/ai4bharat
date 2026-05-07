import { redirect } from "next/navigation";

async function Home() {
  redirect("/admin/login");
}

export default Home;
