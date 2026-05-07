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
        
        console.log(`[Interview] API Response:`, data);
        
        if (data?.success && data?.interview) {
          console.log(`[Interview] Successfully loaded interview`, data.interview);
          setRecord(data.interview as InterviewRecord);
        } else {
          setError("Failed to load interview: " + (data?.error || "Unknown error"));
          console.error(`[Interview] API returned error:`, data);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.error(`[Interview] Error loading interview:`, errorMsg);
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
  if (error) return <div className="p-6 text-sm text-red-300">{error}</div>;
  if (!record) return <div className="p-6 text-sm text-red-300">Invalid or expired interview link.</div>;

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
