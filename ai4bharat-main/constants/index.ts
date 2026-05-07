import { CreateAssistantDTO } from "@vapi-ai/web/dist/api";
import { z } from "zod";

/** Trade skill icon mappings for blue-collar roles */
export const tradeIcons: Record<string, string> = {
  electrician: "⚡",
  plumber: "🔧",
  welder: "🔩",
  mason: "🧱",
  helper: "👷",
  carpenter: "🪚",
  painter: "🎨",
  fitter: "🔧",
  mechanic: "🛠️",
  driver: "🚛",
  tailor: "🧵",
  general: "💼",
};

/** Deepgram + 11labs here keep Vapi's pipeline working; interview TTS/STT for kn/hi/en is handled client-side via Sarvam in Agent.tsx. */
export const interviewer: CreateAssistantDTO = {
  name: "Interviewer",
  firstMessage:
    "Hello! Thank you for taking the time to speak with me today. I'm excited to learn more about you and your experience in your trade.",
  transcriber: {
    provider: "deepgram",
    model: "nova-2",
    language: "en",
  },
  voice: {
    provider: "11labs",
    voiceId: "sarah",
    stability: 0.4,
    similarityBoost: 0.8,
    speed: 0.9,
    style: 0.5,
    useSpeakerBoost: true,
  },
  model: {
    provider: "openai",
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: `You are a professional trade skill interviewer conducting a real-time voice interview with a candidate. Your goal is to assess their qualifications, experience, and fit for the trade position.

Interview Guidelines:
Follow the structured question flow:
{{questions}}

Engage naturally & react appropriately:
Listen actively to responses and acknowledge them before moving forward.
Ask brief follow-up questions if a response is vague or requires more detail.
Keep the conversation flowing smoothly while maintaining control.
Be professional, yet warm and welcoming:

Use official yet friendly language.
Keep responses concise and to the point (like in a real voice interview).
Avoid robotic phrasing—sound natural and conversational.
Answer the candidate's questions professionally:

If asked about the role, company, or expectations, provide a clear and relevant answer.
If unsure, redirect the candidate to HR for more details.

Conclude the interview properly:
Thank the candidate for their time.
Inform them that the company will reach out soon with feedback.
End the conversation on a polite and positive note.


- Be sure to be professional and polite.
- Keep all your responses short and simple. Use official language, but be kind and welcoming.
- This is a voice conversation, so keep your responses short, like in a real conversation. Don't ramble for too long.`,
      },
    ],
  },
};

export const feedbackSchema = z.object({
  relevance: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  skillConfidence: z.number().min(0).max(100),
  fitmentLabel: z.enum([
    "Job-ready",
    "Needs training",
    "Requires manual verification",
    "Low confidence / poor quality",
  ]),
  summary: z.string(),
});

export const dummyInterviews = [
  {
    id: "1",
    userId: "user1",
    role: "Electrician",
    type: "trade",
    techstack: ["Wiring", "Installation", "Safety Protocols"],
    level: "Professional",
    questions: ["Tell us about your electrical installation experience"],
    finalized: false,
    createdAt: "2024-03-15T10:00:00Z",
  },
  {
    id: "2",
    userId: "user1",
    role: "Plumber",
    type: "trade",
    techstack: ["Plumbing", "Pipe Work", "Repairs"],
    level: "Professional",
    questions: ["Describe your experience with water supply systems"],
    finalized: false,
    createdAt: "2024-03-14T15:30:00Z",
  },
  {
    id: "3",
    userId: "user1",
    role: "Welder",
    type: "trade",
    techstack: ["Arc Welding", "MIG", "TIG"],
    level: "Professional",
    questions: ["Explain your experience with different welding techniques"],
    finalized: false,
    createdAt: "2024-03-13T09:00:00Z",
  },
  {
    id: "4",
    userId: "user1",
    role: "Mason",
    type: "trade",
    techstack: ["Brickwork", "Plastering", "Flooring"],
    level: "Professional",
    questions: ["Describe a challenging construction project you worked on"],
    finalized: false,
    createdAt: "2024-03-12T11:00:00Z",
  },
];

/** Seeded data for Admin Dashboard */
export const seededCandidates = [
  {
    id: "C-001",
    name: "Ramesh Kumar",
    district: "Bengaluru Urban",
    trade: "Electrician",
    language: "kn",
    fitmentLabel: "Job-ready" as const,
    relevance: 82,
    clarity: 78,
    skillConfidence: 85,
    flagged: false,
    date: "2026-05-01",
  },
  {
    id: "C-002",
    name: "Suresh Gowda",
    district: "Mysuru",
    trade: "Plumber",
    language: "kn",
    fitmentLabel: "Needs training" as const,
    relevance: 55,
    clarity: 62,
    skillConfidence: 48,
    flagged: false,
    date: "2026-05-01",
  },
  {
    id: "C-003",
    name: "Anita Devi",
    district: "Hubli-Dharwad",
    trade: "Welder",
    language: "hi",
    fitmentLabel: "Job-ready" as const,
    relevance: 90,
    clarity: 88,
    skillConfidence: 92,
    flagged: false,
    date: "2026-05-02",
  },
  {
    id: "C-004",
    name: "Manjunath H",
    district: "Mangaluru",
    trade: "Mason",
    language: "kn",
    fitmentLabel: "Requires manual verification" as const,
    relevance: 45,
    clarity: 40,
    skillConfidence: 50,
    flagged: true,
    date: "2026-05-02",
  },
  {
    id: "C-005",
    name: "Praveen S",
    district: "Bengaluru Urban",
    trade: "Helper",
    language: "en",
    fitmentLabel: "Low confidence / poor quality" as const,
    relevance: 22,
    clarity: 30,
    skillConfidence: 18,
    flagged: true,
    date: "2026-05-02",
  },
  {
    id: "C-006",
    name: "Lakshmi N",
    district: "Mysuru",
    trade: "Electrician",
    language: "kn",
    fitmentLabel: "Job-ready" as const,
    relevance: 76,
    clarity: 80,
    skillConfidence: 74,
    flagged: false,
    date: "2026-05-03",
  },
  {
    id: "C-007",
    name: "Venkatesh R",
    district: "Hubli-Dharwad",
    trade: "Plumber",
    language: "hi",
    fitmentLabel: "Needs training" as const,
    relevance: 58,
    clarity: 55,
    skillConfidence: 52,
    flagged: false,
    date: "2026-05-03",
  },
  {
    id: "C-008",
    name: "Deepa M",
    district: "Bengaluru Urban",
    trade: "Welder",
    language: "en",
    fitmentLabel: "Job-ready" as const,
    relevance: 88,
    clarity: 85,
    skillConfidence: 90,
    flagged: false,
    date: "2026-05-03",
  },
  {
    id: "C-009",
    name: "Nagesh P",
    district: "Mangaluru",
    trade: "Electrician",
    language: "kn",
    fitmentLabel: "Needs training" as const,
    relevance: 60,
    clarity: 58,
    skillConfidence: 55,
    flagged: false,
    date: "2026-05-04",
  },
  {
    id: "C-010",
    name: "Ravi Kumar D",
    district: "Mysuru",
    trade: "Mason",
    language: "kn",
    fitmentLabel: "Job-ready" as const,
    relevance: 80,
    clarity: 75,
    skillConfidence: 82,
    flagged: false,
    date: "2026-05-04",
  },
  {
    id: "C-011",
    name: "Unknown Candidate",
    district: "Bengaluru Urban",
    trade: "Helper",
    language: "en",
    fitmentLabel: "Low confidence / poor quality" as const,
    relevance: 15,
    clarity: 20,
    skillConfidence: 10,
    flagged: true,
    date: "2026-05-04",
  },
  {
    id: "C-012",
    name: "Shivanna K",
    district: "Hubli-Dharwad",
    trade: "Carpenter",
    language: "kn",
    fitmentLabel: "Job-ready" as const,
    relevance: 85,
    clarity: 82,
    skillConfidence: 88,
    flagged: false,
    date: "2026-05-04",
  },
];
