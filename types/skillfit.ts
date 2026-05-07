export type AdminRole = "ngo" | "govt";

export type InterviewStatus = "pending" | "link_sent" | "completed" | "flagged";
export type InterviewLanguage = "kn" | "hi" | "en";
export type AdminAction = "shortlisted" | "training" | "flagged" | null;

export interface AdminProfile {
  uid: string;
  email: string;
  role: AdminRole;
  centerName?: string;
  name?: string;
  district: string;
  createdAt?: unknown;
}

export interface InterviewRecord {
  id?: string;
  interviewId: string;
  candidateName: string;
  aadhaarLast4: string;
  phone: string;
  district: string;
  trade: string;
  language: InterviewLanguage;
  status: InterviewStatus;
  ngoId: string;
  ngoCenter: string;
  createdAt?: unknown;
  linkSentAt?: unknown;
  completedAt?: unknown;
  faceVerified: boolean;
  faceSnapshotUrl?: string | null;
  videoUrl?: string | null;
  fitmentLabel?: string | null;
  relevanceScore?: number | null;
  clarityScore?: number | null;
  skillConfidenceScore?: number | null;
  aiSummary?: string | null;
  adminAction?: AdminAction;
}
