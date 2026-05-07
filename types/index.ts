import type { SpeechQuality } from "@/lib/speech-analyzer";

export type InterviewLanguageCode = "kn-IN" | "hi-IN" | "en-IN";

export type AgentTranscriptMessage = {
	role: "user" | "system" | "assistant";
	content: string;
};

export type AgentIntegrityMetrics = {
	facePresenceScore: number;
	faceAbsenceEvents: number;
	longestAbsenceDuration: number;
	absenceCluster: "start" | "middle" | "end" | "distributed" | "none";
	continuityAnomalyFlag: boolean;
	continuityAnomalyReason: string | null;
	perceptualHash: string | null;
	integrityFlag: boolean;
	integrityReason: string | null;
};

export interface Feedback {
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
	modelAnswers?: string[];
	speechQuality?: SpeechQuality;
	transcript?: Array<{
		role: string;
		content: string;
	}>;
	integrityMetrics?: AgentIntegrityMetrics;
	reviewRequired?: boolean;
}

export interface AgentProps {
	userName: string;
	userId?: string;
	interviewId?: string;
	feedbackId?: string;
	type: "generate" | "interview";
	questions?: string[];
	language?: InterviewLanguageCode;
	trade?: string;
	onInterviewComplete?: (payload: {
		transcript: AgentTranscriptMessage[];
		speechQuality?: SpeechQuality;
		integrityMetrics?: AgentIntegrityMetrics;
	}) => Promise<void> | void;
	completionRedirectPath?: string;
	disableLanguageSelector?: boolean;
}
