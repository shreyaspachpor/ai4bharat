"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { useSkillfitAuth } from "@/components/skillfit/AuthProvider";

export default function AdminLoginPage() {
  const router = useRouter();
  const { login, profile, loading } = useSkillfitAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busyRole, setBusyRole] = useState<"ngo" | "govt" | null>(null);

  useEffect(() => {
    if (!loading && profile?.role === "ngo") router.replace("/ngo/register");
    if (!loading && profile?.role === "govt") router.replace("/admin/dashboard");
  }, [profile, loading, router]);

  const doLogin = async (role: "ngo" | "govt") => {
    try {
      setBusyRole(role);
      const result = await login(email.trim(), password, role);
      toast.success(`Welcome ${result.role === "ngo" ? result.centerName || "NGO operator" : "Officer"}`);
      router.replace(result.role === "ngo" ? "/ngo/register" : "/admin/dashboard");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Login failed";
      toast.error(message);
    } finally {
      setBusyRole(null);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-8 bg-[#171717]">
      <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[#222] p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-2">
          <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <h1 className="text-xl font-semibold text-white">AI SkillFit</h1>
        </div>
        <p className="mt-2 text-sm text-zinc-300">Karnataka Workforce Assessment Platform</p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-xs text-zinc-400">Email</span>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
              placeholder="name@skillfit.in"
            />
          </label>
          <label className="block">
            <span className="text-xs text-zinc-400">Password</span>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              className="mt-1 w-full rounded-lg border border-white/10 bg-[#171717] px-3 py-2 text-sm text-white outline-none focus:border-emerald-400"
            />
          </label>
        </div>

        <div className="mt-6 grid gap-3">
          <button
            onClick={() => doLogin("ngo")}
            disabled={!!busyRole}
            className="rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-black disabled:opacity-60"
          >
            {busyRole === "ngo" ? "Signing in..." : "Login as NGO Operator"}
          </button>
          <button
            onClick={() => doLogin("govt")}
            disabled={!!busyRole}
            className="rounded-lg border border-white/15 bg-transparent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busyRole === "govt" ? "Signing in..." : "Login as Government Officer"}
          </button>
        </div>
      </div>
    </main>
  );
}
