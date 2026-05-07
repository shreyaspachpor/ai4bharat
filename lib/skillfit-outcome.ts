export function inferInterviewOutcome(
  transcript: { role: "user" | "assistant" | "system"; content: string }[]
) {
  const userLines = transcript
    .filter((m) => m.role === "user")
    .map((m) => m.content.trim())
    .filter(Boolean);

  const fullText = userLines.join(" ").toLowerCase();
  const wordCount = fullText.split(/\s+/).filter(Boolean).length;
  const avgWords = userLines.length ? Math.round(wordCount / userLines.length) : 0;

  const relevanceScore = Math.min(92, Math.max(28, 40 + Math.round(avgWords * 1.6)));
  const clarityScore = Math.min(90, Math.max(25, 35 + Math.round(userLines.length * 4.5)));
  const skillConfidenceScore = Math.min(
    93,
    Math.max(22, Math.round((relevanceScore + clarityScore) / 2) + (wordCount > 120 ? 8 : 0))
  );
  const avg = Math.round((relevanceScore + clarityScore + skillConfidenceScore) / 3);

  let fitmentLabel = "Needs training";
  if (avg >= 75) fitmentLabel = "Job-ready";
  else if (avg < 40) fitmentLabel = "Low confidence / poor quality";
  else if (avg >= 60 && avg < 70) fitmentLabel = "Requires manual verification";

  return {
    relevanceScore,
    clarityScore,
    skillConfidenceScore,
    fitmentLabel,
    aiSummary:
      avg >= 75
        ? "Candidate responses are consistent and role-aligned. Suitable for quick deployment."
        : avg >= 60
          ? "Candidate shows baseline competence but needs one round of human verification."
          : avg >= 40
            ? "Candidate understands some practical concepts but needs targeted training support."
            : "Responses were limited or unclear; recommend re-interview or manual screening.",
  };
}
