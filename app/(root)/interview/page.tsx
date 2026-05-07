import Agent from "@/components/Agent";
import { apiGetCurrentUser } from "@/lib/api";

const Page = async () => {
  const { user } = await apiGetCurrentUser();

  return (
    <>
      <h3>Create Skill Assessment</h3>

      <Agent
        userName={user?.name!}
        userId={user?.id}
        type="generate"
      />
    </>
  );
};

export default Page;
