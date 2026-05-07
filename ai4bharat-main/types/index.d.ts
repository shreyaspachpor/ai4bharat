interface Feedback {
  id: string;
  interviewId: string;
  relevance: number;
  clarity: number;
  skillConfidence: number;
  fitmentLabel:
    | "Job-ready"
    | "Needs training"
    | "Requires manual verification"
    | "Low confidence / poor quality";
  summary: string;
  createdAt: string;
  modelAnswers?: string[]; // Array of model answers, one per question

  // Speech Quality Analysis Data
  speechQuality?: {
    totalFillerWords: number;
    fillerWordPercentage: number;
    estimatedWPM: number;
    completenessScore: number;
    fillerWords: {
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
    };
    fillerOccurrences: Array<{
      type: string;
      timestamp: number;
      timeLabel: string;
    }>;
  };
  transcript?: Array<{
    role: string;
    content: string;
  }>;

  // Interview integrity (face presence + continuity signals)
  integrityMetrics?: IntegrityMetrics;
  reviewRequired?: boolean;
}

type AbsenceCluster = "start" | "middle" | "end" | "distributed" | "none";

interface IntegrityMetrics {
  facePresenceScore: number; // 0-100
  faceAbsenceEvents: number;
  longestAbsenceDuration: number; // seconds
  absenceCluster: AbsenceCluster;
  continuityAnomalyFlag: boolean;
  continuityAnomalyReason: string | null;
  perceptualHash: string | null;
  integrityFlag: boolean;
  integrityReason: string | null;
}

interface Interview {
  id: string;
  role: string;
  level: string;
  questions: string[];
  techstack: string[];
  createdAt: string;
  userId: string;
  type: string;
  finalized: boolean;
  videoUrl?: string;
}

interface CreateFeedbackParams {
  interviewId: string;
  userId: string;
  transcript: { role: string; content: string }[];
  trade: string;
  language: "kn-IN" | "hi-IN" | "en-IN";
  feedbackId?: string;
  integrityMetrics?: IntegrityMetrics;
  speechQuality?: {
    totalFillerWords: number;
    fillerWordPercentage: number;
    estimatedWPM: number;
    completenessScore: number;
    fillerWords: {
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
    };
    fillerOccurrences: Array<{
      type: string;
      timestamp: number;
      timeLabel: string;
    }>;
  };
}

interface User {
  name: string;
  email: string;
  id: string;
  role?: "admin" | "user";
}

interface InterviewCardProps {
  interviewId?: string;
  userId?: string;
  role: string;
  type: string;
  techstack: string[];
  createdAt?: string;
}

type InterviewLanguageCode = "kn-IN" | "hi-IN" | "en-IN";

interface AgentProps {
  userName: string;
  userId?: string;
  interviewId?: string;
  feedbackId?: string;
  type: "generate" | "interview";
  questions?: string[];
  /** Spoken + STT language for Sarvam (interview flow only). */
  language?: InterviewLanguageCode;
  /** Trade/role for SkillFit feedback rubric. */
  trade?: string;
  onInterviewComplete?: (payload: {
    transcript: { role: "user" | "system" | "assistant"; content: string }[];
    speechQuality?: Feedback["speechQuality"];
    integrityMetrics?: IntegrityMetrics;
  }) => Promise<void> | void;
  completionRedirectPath?: string;
  disableLanguageSelector?: boolean;
}

interface RouteParams {
  params: Promise<Record<string, string>>;
  searchParams: Promise<Record<string, string>>;
}

interface GetFeedbackByInterviewIdParams {
  interviewId: string;
  userId: string;
}

interface GetLatestInterviewsParams {
  userId: string;
  limit?: number;
}

interface SignInParams {
  email: string;
  idToken: string;
}

interface SignUpParams {
  uid: string;
  name: string;
  email: string;
  password: string;
}

type FormType = "sign-in" | "sign-up";

interface TechIconProps {
  techStack: string[];
}
