"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";

import Agent from "@/components/Agent";
import { getQuestions } from "@/lib/questionBank";
import type { InterviewLanguage, InterviewRecord } from "@/types/skillfit";

function toAgentLanguage(code: InterviewLanguage | undefined) {
  if (code === "kn") return "kn-IN";
  if (code === "hi") return "hi-IN";
  return "en-IN";
}

export default function PublicInterviewPage() {
  const params = useParams<{ id: string }>();
  const [record, setRecord] = useState<InterviewRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInterview() {
      if (!params?.id) {
        setError("No interview ID provided");
        setLoading(false);
        return;
      }
      setLoading(true);
      setError(null);
      
      try {
        console.log(`[Interview] Loading interview ${params.id}...`);
        const res = await fetch(`/api/public/interview/${params.id}`);
        const data = await res.json();
        
        console.log(`[Interview] API Response (${res.status}):`, data);
        
        if (!res.ok) {
          setError(`API Error ${res.status}: ${data?.error || "Unknown error"}`);
          console.error(`[Interview] API returned ${res.status}:`, data);
          return;
        }
        
        if (data?.success && data?.interview) {
          console.log(`[Interview] Successfully loaded interview`, data.interview);
          setRecord(data.interview as InterviewRecord);
        } else {
          const errorMsg = data?.error || "Unknown error";
          setError(`Failed to load interview: ${errorMsg}`);
          console.error(`[Interview] API returned unexpected response:`, data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Interview] Network/Parse error:`, errorMsg);
        setError(`Failed to load interview: ${errorMsg}`);
      } finally {
        setLoading(false);
      }
    }
    loadInterview();
  }, [params?.id]);

  const questions = useMemo(() => {
    if (!record?.trade) return [];
    return getQuestions(record.trade.toLowerCase(), record.language || "en", 4);
  }, [record?.trade, record?.language]);

  if (loading) return <div className="p-6 text-sm text-zinc-300">Loading interview...</div>;
  if (error) return (
    <div className="p-6 min-h-screen bg-dark-100">
      <div className="mx-auto max-w-2xl">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
          <h3 className="text-red-300 font-semibold mb-2">Interview Load Error</h3>
          <p className="text-red-200 text-sm mb-3">{error}</p>
          <p className="text-red-100 text-xs opacity-75">Interview ID: {params?.id || "Unknown"}</p>
          <p className="text-red-100 text-xs opacity-75 mt-2">
            Please check the interview link or contact your administrator.
          </p>
        </div>
      </div>
    </div>
  );
  if (!record) return (
    <div className="p-6 min-h-screen bg-dark-100">
      <div className="mx-auto max-w-2xl">
        <div className="bg-yellow-900/20 border border-yellow-700 rounded-lg p-4">
          <h3 className="text-yellow-300 font-semibold mb-2">Invalid Interview</h3>
          <p className="text-yellow-200 text-sm">Invalid or expired interview link.</p>
          <p className="text-yellow-100 text-xs opacity-75 mt-2">Interview ID: {params?.id || "Unknown"}</p>
        </div>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-dark-100">
      <div className="mx-auto max-w-5xl px-4 py-6">
        <h2 className="mb-4 text-xl font-semibold text-light-100">{record.trade} Interview</h2>
        <Agent
          userName={record.candidateName || "Candidate"}
          userId={record.ngoId}
          interviewId={record.interviewId}
          type="interview"
          questions={questions}
          trade={record.trade}
          language={toAgentLanguage(record.language)}
          disableLanguageSelector
          completionRedirectPath="/admin/dashboard"
          onInterviewComplete={async ({ transcript }) => {
            await fetch(`/api/public/interview/${record.interviewId}`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ transcript }),
            });
          }}
        />
      </div>
    </main>
  );
}
