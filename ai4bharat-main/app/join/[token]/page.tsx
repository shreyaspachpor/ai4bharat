"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Image from "next/image";
import { signInAnonymously } from "firebase/auth";
import { auth } from "@/firebase/client";
import { apiGetInterviewByToken } from "@/lib/api";
import Agent from "@/components/Agent";
import { ShieldCheck, Loader2 } from "lucide-react";

export default function ZeroUIInterviewPage() {
  const params = useParams();
  const token = params.token as string;

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [interview, setInterview] = useState<any>(null);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    async function init() {
      try {
        // 1. Authenticate anonymously so Firebase Storage allows video uploads
        await signInAnonymously(auth);

        // 2. Fetch interview data using the deep link token
        const data = await apiGetInterviewByToken(token);
        if (data && data.id) {
          setInterview(data);
        } else {
          setError("Interview link is invalid or has expired.");
        }
      } catch (err: any) {
        setError(err.message || "Failed to load interview.");
      } finally {
        setIsLoading(false);
      }
    }
    
    if (token) {
      init();
    }
  }, [token]);

  if (isLoading) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark-100">
        <Loader2 className="h-10 w-10 text-primary-200 animate-spin" />
        <p className="mt-4 text-light-400">Loading your interview...</p>
      </div>
    );
  }

  if (error || !interview) {
    return (
      <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-dark-100 p-4 text-center">
        <div className="bg-dark-200 p-8 rounded-2xl border border-red-500/30 max-w-sm w-full shadow-2xl">
          <p className="text-4xl mb-4">⚠️</p>
          <h2 className="text-xl font-bold text-red-400 mb-2">Invalid Link</h2>
          <p className="text-light-400 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Once started, show the Agent UI
  if (hasStarted) {
    // Extract and normalize candidate name
    const candidateName = interview.candidateName || interview.candidate_name || interview.name || "Candidate";
    
    // Extract and normalize language - convert from "kn", "hi", "en" to "kn-IN", "hi-IN", "en-IN"
    let interviewLanguage = interview.interviewLanguage || interview.language || "en";
    if (interviewLanguage && !interviewLanguage.includes("-")) {
      interviewLanguage = interviewLanguage === "kn" ? "kn-IN" : 
                         interviewLanguage === "hi" ? "hi-IN" : "en-IN";
    }
    
    console.log(`[Interview] Starting with: name="${candidateName}", language="${interviewLanguage}"`);
    
    return (
      <div className="min-h-[100dvh] bg-dark-100">
        <Agent
          userName={candidateName}
          userId={interview.userId}
          interviewId={interview.id}
          type="interview"
          questions={interview.questions || []}
          language={interviewLanguage}
          trade={interview.role || interview.trade || "General"}
        />
      </div>
    );
  }

  // Pre-start screen: Simple, trust-building, one button
  return (
    <div className="min-h-[100dvh] flex flex-col bg-dark-100">
      {/* Minimal Header */}
      <header className="p-4 flex items-center justify-center gap-2 border-b border-dark-300 bg-dark-200/50">
        <Image src="/logo.svg" alt="logo" height={24} width={28} />
        <h1 className="text-primary-100 font-semibold text-lg tracking-wide">AI SkillFit</h1>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 text-center max-w-md mx-auto w-full">
        <div className="w-full bg-dark-200 rounded-3xl p-8 border border-dark-300 shadow-xl flex flex-col items-center">
          <div className="h-16 w-16 bg-primary-200/20 rounded-full flex items-center justify-center text-primary-200 mb-6">
            <ShieldCheck className="h-8 w-8" />
          </div>
          
          <h2 className="text-2xl font-bold text-light-100 mb-2">Government of Karnataka</h2>
          <p className="text-light-400 text-sm mb-8">
            Your identity has been verified. You are about to start your 
            <strong className="text-primary-200"> {interview.role} </strong> 
            assessment.
          </p>

          <div className="w-full space-y-4">
            <button
              onClick={() => setHasStarted(true)}
              className="w-full bg-green-500 text-white font-bold py-5 rounded-2xl text-xl shadow-lg shadow-green-500/20 hover:bg-green-400 transition-colors"
            >
              Start Interview
            </button>
            <p className="text-xs text-light-500">
              Please ensure you are in a quiet place and your camera is unobstructed.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
