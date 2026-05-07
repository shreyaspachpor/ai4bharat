"use client";

import { cn } from "@/lib/utils";
import { useState } from "react";
import type { Feedback } from "@/types";

interface SpeakingQualityDetailsProps {
  feedback: Feedback;
  transcript?: Array<{ role: string; content: string }>;
}

export function SpeakingQualityDetails({
  feedback,
  transcript = [],
}: SpeakingQualityDetailsProps) {
  const sq = feedback.speechQuality;
  const [expandedSection, setExpandedSection] = useState<string | null>(
    "fillers"
  );

  if (!sq) {
    return (
      <div className="p-4 bg-dark-400 rounded-lg border border-dark-300">
        <p className="text-gray-400 text-sm">
          Speech quality data not available for this interview.
        </p>
      </div>
    );
  }

  // Get color based on score
  const getScoreColor = (score: number) => {
    if (score >= 80) return { text: "text-green-500", bg: "bg-green-500/10" };
    if (score >= 60) return { text: "text-yellow-500", bg: "bg-yellow-500/10" };
    return { text: "text-red-500", bg: "bg-red-500/10" };
  };

  // Get speaking speed status
  const getSpeedStatus = (wpm: number) => {
    if (wpm >= 130 && wpm <= 160) return { status: "Perfect", color: "text-green-500" };
    if (wpm < 130) return { status: "Too Slow", color: "text-yellow-500" };
    return { status: "Too Fast", color: "text-red-500" };
  };

  const speedStatus = getSpeedStatus(sq.estimatedWPM);
  const fillerScore = 100 - sq.fillerWordPercentage * 5;

  return (
    <div className="space-y-6">
      {/* Overall Speaking Score */}
      <div
        className={cn(
          "p-6 rounded-lg border-2",
          getScoreColor(fillerScore).bg,
          "border-current"
        )}
      >
        <h3 className="text-lg font-semibold text-gray-200 mb-4">
          📊 Overall Speaking Quality
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Filler Words Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Filler Word Control</span>
              <span className={cn("font-bold text-lg", getScoreColor(fillerScore).text)}>
                {Math.round(fillerScore)}/100
              </span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-3">
              <div
                className={cn(
                  "h-3 rounded-full transition-all",
                  fillerScore >= 80
                    ? "bg-green-500"
                    : fillerScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{ width: `${Math.max(0, Math.min(100, fillerScore))}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {sq.fillerWordPercentage}% of words were fillers
            </p>
          </div>

          {/* Speaking Speed Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Speaking Speed</span>
              <span className={cn("font-bold text-lg", speedStatus.color)}>
                {sq.estimatedWPM} WPM
              </span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-3">
              <div
                className={cn(
                  "h-3 rounded-full",
                  sq.estimatedWPM >= 130 && sq.estimatedWPM <= 160
                    ? "bg-green-500"
                    : sq.estimatedWPM < 130
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{
                  width: `${Math.min(100, (sq.estimatedWPM / 200) * 100)}%`,
                }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {speedStatus.status} (Ideal: 130-160 WPM)
            </p>
          </div>

          {/* Completeness Score */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Answer Completeness</span>
              <span className={cn("font-bold text-lg", getScoreColor(sq.completenessScore).text)}>
                {sq.completenessScore}/100
              </span>
            </div>
            <div className="w-full bg-dark-200 rounded-full h-3">
              <div
                className={cn(
                  "h-3 rounded-full",
                  sq.completenessScore >= 80
                    ? "bg-green-500"
                    : sq.completenessScore >= 60
                      ? "bg-yellow-500"
                      : "bg-red-500"
                )}
                style={{ width: `${sq.completenessScore}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-2">
              How complete your answers were
            </p>
          </div>

          {/* Total Filler Words */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400">Total Filler Words</span>
              <span className="font-bold text-lg text-orange-400">
                {sq.totalFillerWords}
              </span>
            </div>
            <div className="bg-orange-500/10 border border-orange-500/20 rounded p-2">
              <p className="text-xs text-gray-400">
                Used across entire interview
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filler Words Breakdown */}
      <div className="border border-dark-300 rounded-lg overflow-hidden">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "fillers" ? null : "fillers"
            )
          }
          className="w-full p-4 bg-dark-400 hover:bg-dark-300 transition flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-gray-200">
            ❌ Filler Words Breakdown
          </h3>
          <span className="text-gray-400">
            {expandedSection === "fillers" ? "▼" : "▶"}
          </span>
        </button>

        {expandedSection === "fillers" && (
          <div className="p-4 space-y-4">
            {/* Filler Words Count Grid */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {sq.fillerWords.um > 0 && (
                <div className="bg-red-500/10 border border-red-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Um</p>
                  <p className="text-xl font-bold text-red-400">
                    {sq.fillerWords.um}x
                  </p>
                </div>
              )}
              {sq.fillerWords.like > 0 && (
                <div className="bg-orange-500/10 border border-orange-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Like</p>
                  <p className="text-xl font-bold text-orange-400">
                    {sq.fillerWords.like}x
                  </p>
                </div>
              )}
              {sq.fillerWords.basically > 0 && (
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Basically</p>
                  <p className="text-xl font-bold text-yellow-400">
                    {sq.fillerWords.basically}x
                  </p>
                </div>
              )}
              {sq.fillerWords.you_know > 0 && (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">You know</p>
                  <p className="text-xl font-bold text-blue-400">
                    {sq.fillerWords.you_know}x
                  </p>
                </div>
              )}
              {sq.fillerWords.actually > 0 && (
                <div className="bg-purple-500/10 border border-purple-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Actually</p>
                  <p className="text-xl font-bold text-purple-400">
                    {sq.fillerWords.actually}x
                  </p>
                </div>
              )}
              {sq.fillerWords.so > 0 && (
                <div className="bg-cyan-500/10 border border-cyan-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">So</p>
                  <p className="text-xl font-bold text-cyan-400">
                    {sq.fillerWords.so}x
                  </p>
                </div>
              )}
              {sq.fillerWords.right > 0 && (
                <div className="bg-pink-500/10 border border-pink-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Right</p>
                  <p className="text-xl font-bold text-pink-400">
                    {sq.fillerWords.right}x
                  </p>
                </div>
              )}
              {sq.fillerWords.uh > 0 && (
                <div className="bg-indigo-500/10 border border-indigo-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Uh</p>
                  <p className="text-xl font-bold text-indigo-400">
                    {sq.fillerWords.uh}x
                  </p>
                </div>
              )}
              {sq.fillerWords.kind_of > 0 && (
                <div className="bg-lime-500/10 border border-lime-500/20 rounded p-3">
                  <p className="text-xs text-gray-400">Kind of</p>
                  <p className="text-xl font-bold text-lime-400">
                    {sq.fillerWords.kind_of}x
                  </p>
                </div>
              )}
            </div>

            {/* Timeline of Filler Words */}
            {sq.fillerOccurrences && sq.fillerOccurrences.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dark-300">
                <h4 className="text-sm font-semibold text-gray-300 mb-3">
                  📍 When You Used Them:
                </h4>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {sq.fillerOccurrences.map((occ: { type: string; timestamp: number; timeLabel: string }, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-dark-300/50 p-2.5 rounded text-sm"
                    >
                      <span className="text-gray-300">
                        <span className="text-gray-500">{occ.timeLabel}</span>
                        {" - "}
                        <span className="font-semibold text-gray-200">
                          "{occ.type}"
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            <div className="mt-4 pt-4 border-t border-dark-300 bg-blue-500/5 p-3 rounded">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Try speaking more deliberately. If you
                catch yourself using fillers, pause for a breath instead. In
                interviews, silence is better than "um" or "like".
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Speaking Pace Analysis */}
      <div className="border border-dark-300 rounded-lg overflow-hidden">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "pace" ? null : "pace"
            )
          }
          className="w-full p-4 bg-dark-400 hover:bg-dark-300 transition flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-gray-200">
            ⏱️ Speaking Pace Analysis
          </h3>
          <span className="text-gray-400">
            {expandedSection === "pace" ? "▼" : "▶"}
          </span>
        </button>

        {expandedSection === "pace" && (
          <div className="p-4 space-y-4">
            <div className="bg-dark-300/50 p-4 rounded">
              <p className="text-sm text-gray-400 mb-2">Current Speed:</p>
              <p className="text-3xl font-bold text-blue-400 mb-2">
                {sq.estimatedWPM} WPM
              </p>
              <p className={cn("text-sm font-semibold", speedStatus.color)}>
                {speedStatus.status} (Ideal: 130-160 WPM)
              </p>
            </div>

            {sq.estimatedWPM < 130 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                <p className="text-sm text-yellow-300">
                  🐢 <strong>You're speaking too slowly.</strong> Try to pick up
                  the pace! This can signal nervousness.
                </p>
              </div>
            )}
            {sq.estimatedWPM > 160 && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                <p className="text-sm text-red-300">
                  🚀 <strong>You're speaking too fast.</strong> Slow down and
                  let the interviewer absorb your answers.
                </p>
              </div>
            )}
            {sq.estimatedWPM >= 130 && sq.estimatedWPM <= 160 && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                <p className="text-sm text-green-300">
                  ✅ <strong>Perfect pace!</strong> You're speaking at an ideal
                  speed for technical interviews.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Completeness Analysis */}
      <div className="border border-dark-300 rounded-lg overflow-hidden">
        <button
          onClick={() =>
            setExpandedSection(
              expandedSection === "completeness" ? null : "completeness"
            )
          }
          className="w-full p-4 bg-dark-400 hover:bg-dark-300 transition flex items-center justify-between"
        >
          <h3 className="text-lg font-semibold text-gray-200">
            ✅ Answer Completeness
          </h3>
          <span className="text-gray-400">
            {expandedSection === "completeness" ? "▼" : "▶"}
          </span>
        </button>

        {expandedSection === "completeness" && (
          <div className="p-4 space-y-4">
            <div className="bg-dark-300/50 p-4 rounded">
              <p className="text-sm text-gray-400 mb-2">Completeness Score:</p>
              <p className={cn("text-3xl font-bold", getScoreColor(sq.completenessScore).text)}>
                {sq.completenessScore}%
              </p>
            </div>

            {sq.completenessScore >= 80 && (
              <div className="bg-green-500/10 border border-green-500/20 p-3 rounded">
                <p className="text-sm text-green-300">
                  ✅ <strong>Excellent!</strong> Your answers are complete and
                  well-structured.
                </p>
              </div>
            )}
            {sq.completenessScore >= 60 && sq.completenessScore < 80 && (
              <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded">
                <p className="text-sm text-yellow-300">
                  ⚠️ <strong>Good, but could be better.</strong> Some answers
                  felt rushed. Take time to fully explain your thoughts.
                </p>
              </div>
            )}
            {sq.completenessScore < 60 && (
              <div className="bg-red-500/10 border border-red-500/20 p-3 rounded">
                <p className="text-sm text-red-300">
                  🔴 <strong>Incomplete answers detected.</strong> Make sure to
                  finish your thoughts before moving to the next question.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
