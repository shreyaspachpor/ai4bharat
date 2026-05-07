"use client";

import { SpeechQuality } from "@/lib/speech-analyzer";
import { cn } from "@/lib/utils";
import { useState } from "react";

interface SpeakingPanelProps {
  isActive: boolean;
  speechQuality: SpeechQuality | null;
  currentTranscript: string;
  isSpeaking: boolean;
  allMessages?: Array<{ role: string; content: string }>; // All messages including AI
}

export function SpeakingQualityPanel({
  isActive,
  speechQuality,
  currentTranscript,
  isSpeaking,
  allMessages = [],
}: SpeakingPanelProps) {
  const [expandFillers, setExpandFillers] = useState(false);
  const [showAISpeech, setShowAISpeech] = useState(false);

  if (!isActive || !speechQuality) return null;

  // Get score colors
  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return "bg-green-500/10 border-green-500/20";
    if (score >= 60) return "bg-yellow-500/10 border-yellow-500/20";
    return "bg-red-500/10 border-red-500/20";
  };

  return (
    <div className="mt-6 p-4 rounded-lg border border-dark-300 bg-dark-400/50 max-h-96 overflow-y-auto">
      <h4 className="text-sm font-semibold mb-4 text-gray-200">
        📊 Speaking Quality (Real-Time)
      </h4>

      <div className="space-y-3">
        {/* Filler Words - Cumulative with Breakdown */}
        <div className={cn("p-3 rounded border", getScoreBgColor(100 - speechQuality.fillerWordPercentage * 5))}>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setExpandFillers(!expandFillers)}
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-gray-300">
                  ❌ Filler Words Detected
                </span>
              </div>
              <div className="text-sm font-bold text-gray-200 mt-1">
                Total: {speechQuality.totalFillerWords} words
              </div>
            </div>
            <div
              className={cn(
                "text-right px-2 py-1 rounded text-xs font-semibold",
                getScoreColor(100 - speechQuality.fillerWordPercentage * 5)
              )}
            >
              {speechQuality.fillerWordPercentage}%
            </div>
          </div>

          {/* Expanded Filler Words Breakdown */}
          {expandFillers && (
            <div className="mt-3 pt-3 border-t border-dark-300 space-y-2 text-xs">
              {/* Count Breakdown */}
              <div className="grid grid-cols-2 gap-2">
                {speechQuality.fillerWords.um > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">Um:</span>
                    <span className="text-red-400 font-bold ml-1">
                      {speechQuality.fillerWords.um}x
                    </span>
                  </div>
                )}
                {speechQuality.fillerWords.like > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">Like:</span>
                    <span className="text-orange-400 font-bold ml-1">
                      {speechQuality.fillerWords.like}x
                    </span>
                  </div>
                )}
                {speechQuality.fillerWords.basically > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">Basically:</span>
                    <span className="text-yellow-400 font-bold ml-1">
                      {speechQuality.fillerWords.basically}x
                    </span>
                  </div>
                )}
                {speechQuality.fillerWords.you_know > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">You know:</span>
                    <span className="text-blue-400 font-bold ml-1">
                      {speechQuality.fillerWords.you_know}x
                    </span>
                  </div>
                )}
                {speechQuality.fillerWords.actually > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">Actually:</span>
                    <span className="text-purple-400 font-bold ml-1">
                      {speechQuality.fillerWords.actually}x
                    </span>
                  </div>
                )}
                {speechQuality.fillerWords.so > 0 && (
                  <div className="bg-dark-300/50 p-2 rounded">
                    <span className="text-gray-400">So:</span>
                    <span className="text-cyan-400 font-bold ml-1">
                      {speechQuality.fillerWords.so}x
                    </span>
                  </div>
                )}
              </div>

              {/* Timestamps */}
              {speechQuality.fillerOccurrences.length > 0 && (
                <div className="mt-3 pt-2 border-t border-dark-300">
                  <p className="text-gray-400 font-semibold mb-2">
                    When did you use them:
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {speechQuality.fillerOccurrences.map((occ, idx) => (
                      <div key={idx} className="flex justify-between bg-dark-300/30 p-1.5 rounded">
                        <span className="text-gray-400">
                          {occ.timeLabel} - "{occ.type}"
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Speaking Speed */}
        <div className="flex items-center justify-between p-2 rounded border border-dark-300">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Speaking Speed</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {speechQuality.estimatedWPM} WPM
              {speechQuality.estimatedWPM >= 130 &&
                speechQuality.estimatedWPM <= 160 && " ✅ Ideal"}
              {speechQuality.estimatedWPM < 130 && " 🐢 Too Slow"}
              {speechQuality.estimatedWPM > 160 && " 🚀 Too Fast"}
            </div>
          </div>
        </div>

        {/* Pause Quality */}
        <div className="flex items-center justify-between p-2 rounded border border-dark-300">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400">Status</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {isSpeaking ? "🎤 Speaking..." : "⏸️ Paused"}
            </div>
          </div>
          <div
            className={cn(
              "w-2 h-2 rounded-full",
              isSpeaking ? "bg-green-500 animate-pulse" : "bg-gray-500"
            )}
          />
        </div>

        {/* Answer Completeness */}
        <div className="flex flex-col gap-2 p-2 rounded border border-dark-300">
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">Answer Completeness</span>
            <span className="text-xs font-semibold text-gray-300">
              {speechQuality.completenessScore}%
            </span>
          </div>
          <div className="w-full bg-dark-200 rounded-full h-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full transition-all",
                speechQuality.completenessScore >= 80
                  ? "bg-green-500"
                  : speechQuality.completenessScore >= 60
                    ? "bg-yellow-500"
                    : "bg-red-500"
              )}
              style={{ width: `${speechQuality.completenessScore}%` }}
            />
          </div>
        </div>

        {/* Toggle AI Speech */}
        <div className="pt-2 border-t border-dark-300">
          <button
            onClick={() => setShowAISpeech(!showAISpeech)}
            className="text-xs text-blue-400 hover:text-blue-300 font-semibold"
          >
            {showAISpeech ? "▼ Hide" : "▶ Show"} AI Interviewer's Speech
          </button>

          {showAISpeech && (
            <div className="mt-2 space-y-2 max-h-40 overflow-y-auto">
              {allMessages
                .filter((msg) => msg.role === "assistant")
                .map((msg, idx) => (
                  <div key={idx} className="bg-blue-500/10 border border-blue-500/20 p-2 rounded">
                    <p className="text-xs text-blue-300 italic line-clamp-3">
                      "{msg.content}"
                    </p>
                  </div>
                ))}
            </div>
          )}
        </div>

        {/* Current User Speech */}
        {currentTranscript && (
          <div className="pt-2 border-t border-dark-300">
            <p className="text-xs text-gray-400 mb-1 font-semibold">Your current answer:</p>
            <p className="text-xs text-gray-300 italic line-clamp-3 bg-dark-300/30 p-2 rounded">
              "{currentTranscript}"
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
