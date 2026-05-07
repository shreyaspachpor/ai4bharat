"use client";

import { useState } from "react";
import { SpeakingQualityDetails } from "./SpeakingQualityDetailsPage";
import { cn } from "@/lib/utils";
import type { Feedback } from "@/types";

interface FeedbackTabsProps {
  feedback: Feedback | null;
  interviewId: string;
  interview: {
    role: string;
    questions: string[];
  };
}

export function FeedbackTabs({ feedback, interviewId, interview }: FeedbackTabsProps) {
  if (!feedback) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Feedback is not available yet.</p>
      </div>
    );
  }

  const [activeTab, setActiveTab] = useState<"feedback" | "speaking" | "transcript">(
    "feedback"
  );

  const fitmentStylesMap: Record<string, string> = {
    "Job-ready": "bg-green-600 text-white",
    "Needs training": "bg-amber-500 text-black",
    "Requires manual verification": "bg-blue-600 text-white",
    "Low confidence / poor quality": "bg-red-600 text-white",
  };
  const fitmentStyles = fitmentStylesMap[feedback.fitmentLabel] || "bg-gray-600 text-white";

  const scoreBar = (label: string, score: number) => (
    <div className="bg-dark-400 p-4 rounded-lg border border-dark-300">
      <div className="flex items-center justify-between mb-2">
        <p className="font-semibold">{label}</p>
        <span className="text-2xl font-bold text-primary-200">
          {score}
          <span className="text-sm text-gray-400">/100</span>
        </span>
      </div>
      <div className="w-full bg-dark-200 rounded-full h-2">
        <div
          className={cn(
            "h-2 rounded-full",
            score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
          )}
          style={{ width: `${Math.max(0, Math.min(100, score))}%` }}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-dark-300 flex-wrap">
        <button
          onClick={() => setActiveTab("feedback")}
          className={cn(
            "px-4 py-2 font-semibold text-sm transition border-b-2",
            activeTab === "feedback"
              ? "border-primary-200 text-primary-200"
              : "border-transparent text-gray-400 hover:text-gray-300"
          )}
        >
          📋 Feedback
        </button>
        <button
          onClick={() => setActiveTab("speaking")}
          className={cn(
            "px-4 py-2 font-semibold text-sm transition border-b-2",
            activeTab === "speaking"
              ? "border-primary-200 text-primary-200"
              : "border-transparent text-gray-400 hover:text-gray-300"
          )}
        >
          📊 Speaking Quality
        </button>
        <button
          onClick={() => setActiveTab("transcript")}
          className={cn(
            "px-4 py-2 font-semibold text-sm transition border-b-2",
            activeTab === "transcript"
              ? "border-primary-200 text-primary-200"
              : "border-transparent text-gray-400 hover:text-gray-300"
          )}
        >
          📝 Transcript
        </button>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === "feedback" && (
          <div className="space-y-6">
            <div className="bg-dark-400 p-6 rounded-lg border border-dark-300">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between flex-wrap gap-3">
                  <h3 className="text-lg font-semibold">SkillFit Result</h3>
                  <span className={cn("px-3 py-1 rounded-full font-semibold", fitmentStyles)}>
                    {feedback.fitmentLabel}
                  </span>
                </div>
                <p className="text-gray-300 leading-relaxed">{feedback.summary}</p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Scores</h3>
              {scoreBar("Relevance", feedback.relevance)}
              {scoreBar("Clarity", feedback.clarity)}
              {scoreBar("Skill Confidence", feedback.skillConfidence)}
            </div>
          </div>
        )}

        {activeTab === "speaking" && (
          <SpeakingQualityDetails feedback={feedback} transcript={feedback.transcript} />
        )}

        {activeTab === "transcript" && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Full Interview Transcript</h3>
            <div className="space-y-3 max-h-[600px] overflow-y-auto">
              {feedback.transcript && feedback.transcript.length > 0 ? (
                feedback.transcript.map((msg: { role: string; content: string }, idx: number) => (
                  <div
                    key={idx}
                    className={cn(
                      "p-4 rounded-lg border",
                      msg.role === "user"
                        ? "bg-blue-500/10 border-blue-500/20 ml-8"
                        : "bg-gray-600/10 border-gray-600/20 mr-8"
                    )}
                  >
                    <p className="text-xs font-semibold text-gray-400 mb-2">
                      {msg.role === "user" ? "👤 You" : "🤖 AI Interviewer"}
                    </p>
                    <p className="text-gray-300">{msg.content}</p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 p-4 bg-dark-400 rounded">
                  No transcript available
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
