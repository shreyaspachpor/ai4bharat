// Speech quality analysis utility - NO AI/API NEEDED

export interface FillerWordCount {
  um: number;
  uh: number;
  like: number;
  basically: number;
  you_know: number;
  actually: number;
  right: number;
  so: number;
  kind_of: number;
  sort_of: number;
}

export interface FillerWordOccurrence {
  type: string;
  timestamp: number; // Character position in text
  timeLabel: string; // MM:SS format
}

export interface SpeechQuality {
  fillerWords: FillerWordCount;
  totalFillerWords: number;
  fillerWordPercentage: number;
  averagePauseLength: number;
  speechSegments: number;
  estimatedWPM: number;
  completenessScore: number;
  fillerOccurrences: FillerWordOccurrence[]; // New: track each occurrence
}

// List of common filler words to detect
const FILLER_WORDS = {
  um: ["um", "umm", "ummm"],
  uh: ["uh", "uhh", "uhhh"],
  like: ["like"],
  basically: ["basically"],
  you_know: ["you know", "you're know"],
  actually: ["actually"],
  right: ["right", "righht"],
  so: ["so", "uh so"],
  kind_of: ["kind of", "kind of like"],
  sort_of: ["sort of", "sorta"],
};

/**
 * Find all filler word occurrences with timestamps
 */
export function findFillerOccurrences(text: string, durationSeconds: number = 60): FillerWordOccurrence[] {
  const occurrences: FillerWordOccurrence[] = [];
  const lowerText = text.toLowerCase();
  const totalChars = text.length;

  // Search for each filler word pattern
  Object.entries(FILLER_WORDS).forEach(([key, patterns]) => {
    patterns.forEach((pattern) => {
      const regex = new RegExp(`\\b${pattern}\\b`, "gi");
      let match;

      while ((match = regex.exec(lowerText)) !== null) {
        // Estimate time based on character position (rough approximation)
        const charPosition = match.index;
        const estimatedSeconds = (charPosition / totalChars) * durationSeconds;

        // Convert to MM:SS format
        const minutes = Math.floor(estimatedSeconds / 60);
        const seconds = Math.floor(estimatedSeconds % 60);
        const timeLabel = `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;

        occurrences.push({
          type: pattern,
          timestamp: charPosition,
          timeLabel,
        });
      }
    });
  });

  // Sort by timestamp
  return occurrences.sort((a, b) => a.timestamp - b.timestamp);
}
export function countFillerWords(text: string): FillerWordCount {
  const lowerText = text.toLowerCase();
  const counts: FillerWordCount = {
    um: 0,
    uh: 0,
    like: 0,
    basically: 0,
    you_know: 0,
    actually: 0,
    right: 0,
    so: 0,
    kind_of: 0,
    sort_of: 0,
  };

  // Count each filler word pattern
  Object.entries(FILLER_WORDS).forEach(([key, patterns]) => {
    patterns.forEach((pattern) => {
      const regex = new RegExp(`\\b${pattern}\\b`, "gi");
      const matches = lowerText.match(regex);
      counts[key as keyof FillerWordCount] = (matches || []).length;
    });
  });

  return counts;
}

/**
 * Calculate total word count from transcript
 */
export function calculateWordCount(text: string): number {
  const words = text.trim().split(/\s+/);
  return words.length;
}

/**
 * Estimate speaking speed (words per minute)
 * Assumes average speech with pauses
 */
export function estimateSpeechSpeed(
  text: string,
  durationSeconds: number
): number {
  if (durationSeconds === 0) return 0;
  const wordCount = calculateWordCount(text);
  const minutes = durationSeconds / 60;
  return Math.round(wordCount / minutes);
}

/**
 * Calculate completeness score based on answer length, structure, and detail
 * Ranges from 0-100 based on comprehensiveness
 */
export function calculateCompletenessScore(text: string): number {
  let score = 50; // Start at middle (50%)

  if (!text || text.trim().length === 0) return 0;

  const wordCount = calculateWordCount(text);
  const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
  const lastSentence = sentences[sentences.length - 1]?.trim() || "";

  // Word count scoring (more words = more detailed)
  if (wordCount >= 100) score += 25; // Comprehensive answer
  else if (wordCount >= 50) score += 15;  // Decent length
  else if (wordCount >= 25) score += 5;   // Brief but acceptable
  else score += 0;                          // Very short

  // Sentence structure scoring (more sentences = better structure)
  if (sentences.length >= 4) score += 15; // Well-structured
  else if (sentences.length >= 3) score += 10; // Good structure
  else if (sentences.length === 2) score += 5; // Basic structure

  // Penalty for incomplete endings
  const incompletePhrases = [" and", " so", " because", " if", " when", " like", " um", " uh"];
  if (incompletePhrases.some(phrase => lastSentence.toLowerCase().endsWith(phrase))) {
    score -= 15; // Sentence cut off
  }

  // Penalty for very short final sentence (< 5 chars = likely cut off)
  if (lastSentence.length < 5 && sentences.length > 1) {
    score -= 10;
  }

  // Bonus for complete final punctuation
  if (lastSentence.endsWith(".") || lastSentence.endsWith("!") || lastSentence.endsWith("?")) {
    score += 5; // Proper ending
  }

  return Math.max(0, Math.min(100, score));
}

/**
 * Analyze full speech quality
 */
export function analyzeSpeechQuality(
  transcript: string,
  durationSeconds: number = 60
): SpeechQuality {
  const fillerWords = countFillerWords(transcript);
  const totalFillerWords = Object.values(fillerWords).reduce(
    (a, b) => a + b,
    0
  );
  const wordCount = calculateWordCount(transcript);
  const speakingWPM = estimateSpeechSpeed(transcript, durationSeconds);
  const completeness = calculateCompletenessScore(transcript);
  const fillerOccurrences = findFillerOccurrences(transcript, durationSeconds);

  return {
    fillerWords,
    totalFillerWords,
    fillerWordPercentage:
      wordCount > 0 ? Math.round((totalFillerWords / wordCount) * 100) : 0,
    averagePauseLength: 0, // Would need timestamp data
    speechSegments: transcript.split(/[.!?]+/).length,
    estimatedWPM: speakingWPM,
    completenessScore: completeness,
    fillerOccurrences,
  };
}

/**
 * Get filler word score (0-100)
 * Lower filler words = higher score
 */
export function getFillerWordScore(analysis: SpeechQuality): number {
  // Ideal is 0-2% filler words
  const percentage = analysis.fillerWordPercentage;

  if (percentage <= 2) return 100;
  if (percentage <= 5) return 90;
  if (percentage <= 8) return 75;
  if (percentage <= 12) return 60;
  if (percentage <= 15) return 45;
  return Math.max(0, 30 - percentage);
}

/**
 * Get speaking speed score (0-100)
 * 130-160 WPM is ideal
 */
export function getSpeakingSpeedScore(wpm: number): number {
  const ideal = 145;
  const diff = Math.abs(wpm - ideal);

  if (diff <= 15) return 100; // 130-160
  if (diff <= 30) return 85; // 115-175
  if (diff <= 50) return 70; // 95-195
  if (diff <= 70) return 50; // 75-215
  return Math.max(0, 30 - (diff - 70) / 10);
}

/**
 * Get speaking quality score (0-100)
 */
export function getSpeakingQualityScore(analysis: SpeechQuality): number {
  const fillerScore = getFillerWordScore(analysis);
  const speedScore = getSpeakingSpeedScore(analysis.estimatedWPM);
  const completenessScore = analysis.completenessScore;

  // Weighted average: 40% filler words, 30% speed, 30% completeness
  return Math.round(
    fillerScore * 0.4 + speedScore * 0.3 + completenessScore * 0.3
  );
}
