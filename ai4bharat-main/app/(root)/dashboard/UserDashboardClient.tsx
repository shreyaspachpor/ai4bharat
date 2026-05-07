"use client";

import Link from "next/link";
import dayjs from "dayjs";
import { useMemo } from "react";

interface AssessmentData {
  interviewId: string;
  role: string;
  createdAt: string;
  feedback: {
    relevance: number;
    clarity: number;
    skillConfidence: number;
    fitmentLabel: string;
    summary: string;
    createdAt: string;
  } | null;
}

interface UserDashboardClientProps {
  userName: string;
  assessments: AssessmentData[];
}

const fitmentColors: Record<string, string> = {
  "Job-ready": "bg-green-600 text-white",
  "Needs training": "bg-amber-500 text-black",
  "Requires manual verification": "bg-blue-600 text-white",
  "Low confidence / poor quality": "bg-red-600 text-white",
};

const fitmentEmoji: Record<string, string> = {
  "Job-ready": "✅",
  "Needs training": "📚",
  "Requires manual verification": "🔍",
  "Low confidence / poor quality": "⚠️",
};

export default function UserDashboardClient({ userName, assessments }: UserDashboardClientProps) {
  const stats = useMemo(() => {
    const completed = assessments.filter((a) => a.feedback);
    const total = completed.length;

    if (total === 0) {
      return { total: 0, avgRelevance: 0, avgClarity: 0, avgConfidence: 0, overallScore: 0, fitmentBreakdown: {} as Record<string, number>, bestTrade: "N/A" };
    }

    const avgRelevance = Math.round(completed.reduce((acc, a) => acc + (a.feedback?.relevance || 0), 0) / total);
    const avgClarity = Math.round(completed.reduce((acc, a) => acc + (a.feedback?.clarity || 0), 0) / total);
    const avgConfidence = Math.round(completed.reduce((acc, a) => acc + (a.feedback?.skillConfidence || 0), 0) / total);
    const overallScore = Math.round((avgRelevance + avgClarity + avgConfidence) / 3);

    const fitmentBreakdown: Record<string, number> = {};
    completed.forEach((a) => {
      const label = a.feedback?.fitmentLabel || "Unknown";
      fitmentBreakdown[label] = (fitmentBreakdown[label] || 0) + 1;
    });

    // Find trade with highest average score
    const tradeScores: Record<string, { total: number; count: number }> = {};
    completed.forEach((a) => {
      if (!tradeScores[a.role]) tradeScores[a.role] = { total: 0, count: 0 };
      const avg = ((a.feedback?.relevance || 0) + (a.feedback?.clarity || 0) + (a.feedback?.skillConfidence || 0)) / 3;
      tradeScores[a.role].total += avg;
      tradeScores[a.role].count += 1;
    });
    const bestTrade = Object.entries(tradeScores).sort(([, a], [, b]) => (b.total / b.count) - (a.total / a.count))[0]?.[0] || "N/A";

    return { total, avgRelevance, avgClarity, avgConfidence, overallScore, fitmentBreakdown, bestTrade };
  }, [assessments]);

  const scoreColor = (score: number) => {
    if (score >= 75) return "text-green-400";
    if (score >= 50) return "text-amber-400";
    return "text-red-400";
  };

  const scoreBarColor = (score: number) => {
    if (score >= 75) return "bg-green-500";
    if (score >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-100">My Dashboard</h1>
          <p className="text-light-400 mt-1">Welcome back, <span className="text-primary-200 font-semibold">{userName}</span></p>
        </div>
        <Link
          href="/"
          className="bg-dark-200 text-primary-200 px-5 py-2.5 rounded-full font-semibold hover:bg-dark-300 transition text-sm"
        >
          ← Back to Home
        </Link>
      </div>

      {/* Stats Cards */}
      {stats.total > 0 ? (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="rounded-2xl p-5 border border-dark-300" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
              <p className="text-light-400 text-sm">Assessments Taken</p>
              <p className="text-3xl font-bold text-primary-100 mt-1">{stats.total}</p>
            </div>
            <div className="rounded-2xl p-5 border border-dark-300" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
              <p className="text-light-400 text-sm">Overall Score</p>
              <p className={`text-3xl font-bold mt-1 ${scoreColor(stats.overallScore)}`}>{stats.overallScore}<span className="text-sm text-light-400">/100</span></p>
            </div>
            <div className="rounded-2xl p-5 border border-dark-300" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
              <p className="text-light-400 text-sm">Best Trade</p>
              <p className="text-xl font-bold text-primary-100 mt-1 capitalize">{stats.bestTrade}</p>
            </div>
            <div className="rounded-2xl p-5 border border-dark-300" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
              <p className="text-light-400 text-sm">Job-Ready Count</p>
              <p className="text-3xl font-bold text-green-400 mt-1">{stats.fitmentBreakdown["Job-ready"] || 0}</p>
            </div>
          </div>

          {/* Score Breakdown */}
          <div className="rounded-2xl p-6 border border-dark-300 mb-8" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
            <h3 className="text-lg font-bold text-light-100 mb-5">Average Scores</h3>
            <div className="space-y-4">
              {[
                { label: "Relevance", score: stats.avgRelevance },
                { label: "Clarity", score: stats.avgClarity },
                { label: "Skill Confidence", score: stats.avgConfidence },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="text-sm font-medium text-light-100">{item.label}</p>
                    <span className={`font-bold ${scoreColor(item.score)}`}>{item.score}/100</span>
                  </div>
                  <div className="w-full bg-dark-200 rounded-full h-2.5">
                    <div
                      className={`h-2.5 rounded-full transition-all ${scoreBarColor(item.score)}`}
                      style={{ width: `${Math.max(0, Math.min(100, item.score))}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Fitment Distribution */}
          <div className="rounded-2xl p-6 border border-dark-300 mb-8" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
            <h3 className="text-lg font-bold text-light-100 mb-5">Fitment Distribution</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Object.entries(stats.fitmentBreakdown).map(([label, count]) => (
                <div key={label} className="flex items-center gap-3 bg-dark-200/60 rounded-xl px-4 py-3">
                  <span className="text-xl">{fitmentEmoji[label] || "📋"}</span>
                  <div>
                    <p className="text-xs text-light-400">{label}</p>
                    <p className="text-lg font-bold text-light-100">{count}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Assessment History */}
          <div className="rounded-2xl border border-dark-300 overflow-hidden mb-8" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
            <div className="p-5 border-b border-dark-300">
              <h3 className="text-lg font-bold text-light-100">Assessment History</h3>
            </div>
            <div className="divide-y divide-dark-300">
              {assessments
                .filter((a) => a.feedback)
                .sort((a, b) => new Date(b.feedback!.createdAt).getTime() - new Date(a.feedback!.createdAt).getTime())
                .map((a) => (
                  <div key={a.interviewId} className="flex items-center justify-between p-5 hover:bg-dark-200/30 transition">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 flex-wrap">
                        <p className="text-light-100 font-semibold capitalize">{a.role} Assessment</p>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fitmentColors[a.feedback!.fitmentLabel]}`}>
                          {a.feedback!.fitmentLabel}
                        </span>
                      </div>
                      <p className="text-light-400 text-sm mt-1">
                        {dayjs(a.feedback!.createdAt).format("MMM D, YYYY h:mm A")} · {a.feedback!.summary?.slice(0, 80)}...
                      </p>
                    </div>
                    <div className="flex items-center gap-4 ml-4">
                      <div className="text-right hidden md:block">
                        <p className={`text-lg font-bold ${scoreColor(Math.round((a.feedback!.relevance + a.feedback!.clarity + a.feedback!.skillConfidence) / 3))}`}>
                          {Math.round((a.feedback!.relevance + a.feedback!.clarity + a.feedback!.skillConfidence) / 3)}
                        </p>
                        <p className="text-xs text-light-400">avg score</p>
                      </div>
                      <Link
                        href={`/interview/${a.interviewId}/feedback`}
                        className="bg-primary-200 text-dark-100 px-4 py-2 rounded-full text-sm font-semibold hover:bg-primary-200/80 transition whitespace-nowrap"
                      >
                        View Result
                      </Link>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </>
      ) : (
        <div className="rounded-2xl p-12 border border-dark-300 text-center mb-8" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
          <p className="text-4xl mb-4">📋</p>
          <h3 className="text-xl font-bold text-light-100 mb-2">No assessments yet</h3>
          <p className="text-light-400 mb-6">Take your first skill assessment to see your stats here.</p>
          <Link
            href="/"
            className="bg-primary-200 text-dark-100 px-6 py-3 rounded-full font-bold hover:bg-primary-200/80 transition"
          >
            Start an Assessment
          </Link>
        </div>
      )}
    </div>
  );
}
