import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { apiCheckAuth } from "@/lib/api";

const AuthLayout = async ({ children }: { children: ReactNode }) => {
  const { authenticated: isUserAuthenticated } = await apiCheckAuth();
  if (isUserAuthenticated) redirect("/");

  return <div className="auth-layout">{children}</div>;
};

export default AuthLayout;
