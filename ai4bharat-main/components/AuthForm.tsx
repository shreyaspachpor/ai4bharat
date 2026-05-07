"use client";

import { z } from "zod";
import Link from "next/link";
import Image from "next/image";
import { toast } from "sonner";
import { auth } from "@/firebase/client";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";

import { Form } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { UploadCloud, FileText, X, Lock } from "lucide-react";

import { apiSignIn, apiSignUp, apiVerifyAadhaarPdf } from "@/lib/api";
import FormField from "./FormField";

const authFormSchema = (type: "sign-in" | "sign-up") => {
  return z.object({
    name: type === "sign-up" ? z.string().min(3) : z.string().optional(),
    email: z.string().email(),
    password: z.string().min(3),
  });
};

const AuthForm = ({ type }: { type: "sign-in" | "sign-up" }) => {
  const router = useRouter();
  const [loginMode, setLoginMode] = useState<"candidate" | "admin">("candidate");
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarPassword, setAadhaarPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  const formSchema = authFormSchema(type);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: z.infer<typeof formSchema>) => {
    try {
      if (type === "sign-up") {
        if (!aadhaarFile) {
          toast.error("Please upload your Aadhaar PDF to verify your identity.");
          return;
        }

        setIsVerifying(true);
        let verifiedData = null;
        try {
          const verificationResult = await apiVerifyAadhaarPdf(aadhaarFile, aadhaarPassword);
          
          // The backend returns the raw Aadhaar data on 200 OK, not a wrapper object
          if (verificationResult && Object.keys(verificationResult).length > 0) {
            verifiedData = verificationResult;
            toast.success("Aadhaar verified successfully!");
          } else {
            throw new Error("Invalid Aadhaar data received.");
          }
        } catch (e: any) {
          setIsVerifying(false);
          toast.error(e.message || "Failed to verify Aadhaar. Please check the PDF and password.");
          return;
        }

        const { name, email, password } = data;

        const userCredential = await createUserWithEmailAndPassword(
          auth,
          email,
          password
        );

        const result = await apiSignUp({
          uid: userCredential.user.uid,
          name: name!,
          email,
          aadhaarData: verifiedData,
        });

        setIsVerifying(false);

        if (!result.success) {
          toast.error(result.message);
          return;
        }

        toast.success("Account created successfully. Please sign in.");
        router.push("/sign-in");
      } else {
        const { email, password } = data;

        const userCredential = await signInWithEmailAndPassword(
          auth,
          email,
          password
        );

        const idToken = await userCredential.user.getIdToken();
        if (!idToken) {
          toast.error("Sign in Failed. Please try again.");
          return;
        }

        const result = await apiSignIn({
          email,
          idToken,
        });

        if (!result?.success) {
          toast.error(result?.message || "Sign in failed. Please try again.");
          return;
        }

        toast.success("Signed in successfully.");
        // Use replace with a small delay to ensure cookie is set
        setTimeout(() => {
          if (loginMode === "admin") {
            router.replace("/admin");
          } else {
            router.replace("/");
          }
        }, 100);
      }
    } catch (error) {
      console.log(error);
      toast.error(`There was an error: ${error}`);
    }
  };

  const isSignIn = type === "sign-in";

  // Quick-fill for admin login
  const fillAdminCredentials = () => {
    form.setValue("email", "admin123@skillfit.com");
    form.setValue("password", "12345678");
  };

  return (
    <div className="card-border lg:min-w-[566px]">
      <div className="flex flex-col gap-6 card py-14 px-10">
        <div className="flex flex-row gap-2 justify-center">
          <Image src="/logo.svg" alt="logo" height={32} width={38} />
          <h2 className="text-primary-100">AI SkillFit</h2>
        </div>

        <p className="text-center text-light-400 text-sm -mt-4">
          AI-Powered Skill Screening for Karnataka&apos;s Workforce
        </p>

        {/* Role Toggle — only on sign-in */}
        {isSignIn && (
          <div className="flex rounded-full bg-dark-200 p-1 gap-1">
            <button
              type="button"
              onClick={() => {
                setLoginMode("candidate");
                form.reset({ name: "", email: "", password: "" });
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                loginMode === "candidate"
                  ? "bg-primary-200 text-dark-100"
                  : "text-light-400 hover:text-light-100"
              }`}
            >
              👤 Candidate
            </button>
            <button
              type="button"
              onClick={() => {
                setLoginMode("admin");
                fillAdminCredentials();
              }}
              className={`flex-1 py-2.5 rounded-full text-sm font-semibold transition-all ${
                loginMode === "admin"
                  ? "bg-emerald-600 text-white"
                  : "text-light-400 hover:text-light-100"
              }`}
            >
              🛡️ Admin (EDCS)
            </button>
          </div>
        )}

        {/* Admin hint */}
        {isSignIn && loginMode === "admin" && (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl px-4 py-3 text-center">
            <p className="text-emerald-400 text-xs font-medium">
              Admin Portal — Directorate of EDCS, Govt. of Karnataka
            </p>
            <p className="text-emerald-400/70 text-xs mt-1">
              Email: admin123@skillfit.com · Password: 12345678
            </p>
          </div>
        )}

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="w-full space-y-6 mt-4 form"
          >
            {!isSignIn && (
              <FormField
                control={form.control}
                name="name"
                label="Name"
                placeholder="Your Name"
                type="text"
              />
            )}

            <FormField
              control={form.control}
              name="email"
              label="Email"
              placeholder="Your email address"
              type="email"
            />

            <FormField
              control={form.control}
              name="password"
              label="Password"
              placeholder="Enter your password"
              type="password"
            />

            {!isSignIn && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-dark-300"></div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-light-400">Identity Verification</span>
                  <div className="h-px flex-1 bg-dark-300"></div>
                </div>

                <div className="rounded-xl border border-dark-300 bg-dark-200/50 p-4">
                  {!aadhaarFile ? (
                    <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-dark-300 p-6 transition-colors hover:border-primary-200 hover:bg-dark-300/50">
                      <div className="rounded-full bg-dark-300 p-3 text-light-400">
                        <UploadCloud className="h-6 w-6" />
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-medium text-light-100">Upload Aadhaar PDF</p>
                        <p className="mt-1 text-xs text-light-400">Click or drag and drop your e-Aadhaar</p>
                      </div>
                      <input
                        type="file"
                        accept=".pdf"
                        className="hidden"
                        onChange={(e) => setAadhaarFile(e.target.files?.[0] || null)}
                      />
                    </label>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <div className="flex items-center justify-between rounded-lg bg-dark-300 p-3">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <FileText className="h-8 w-8 flex-shrink-0 text-primary-200" />
                          <div className="overflow-hidden">
                            <p className="truncate text-sm font-medium text-light-100">{aadhaarFile.name}</p>
                            <p className="text-xs text-light-400">{(aadhaarFile.size / 1024 / 1024).toFixed(2)} MB</p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setAadhaarFile(null)}
                          className="rounded-full p-1 text-light-400 hover:bg-dark-200 hover:text-white"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-medium text-light-100">Aadhaar PDF Password</label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-400" />
                          <input
                            type="password"
                            value={aadhaarPassword}
                            onChange={(e) => setAadhaarPassword(e.target.value)}
                            className="w-full rounded-md border border-dark-300 bg-dark-400 py-2 pl-10 pr-3 text-sm text-light-100 placeholder:text-light-500 focus:border-primary-200 focus:outline-none focus:ring-1 focus:ring-primary-200"
                            placeholder="e.g. SHRE2000 (First 4 letters + Birth Year)"
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button className="btn" type="submit" disabled={isVerifying}>
              {isVerifying ? (
                <div className="flex items-center gap-2">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                  Verifying Aadhaar...
                </div>
              ) : isSignIn ? (
                loginMode === "admin" ? "Sign In as Admin" : "Sign In as Candidate"
              ) : (
                "Create an Account"
              )}
            </Button>
          </form>
        </Form>

        <p className="text-center">
          {isSignIn ? "No account yet?" : "Have an account already?"}
          <Link
            href={!isSignIn ? "/sign-in" : "/sign-up"}
            className="font-bold text-user-primary ml-1"
          >
            {!isSignIn ? "Sign In" : "Sign Up"}
          </Link>
        </p>
      </div>
    </div>
  );
};

export default AuthForm;
