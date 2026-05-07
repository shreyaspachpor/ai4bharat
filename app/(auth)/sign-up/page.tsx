import AuthForm from "@/components/AuthForm";

// Never pre-render at build time — requires runtime auth state
export const dynamic = "force-dynamic";

const Page = () => {
  return <AuthForm type="sign-up" />;
};

export default Page;
