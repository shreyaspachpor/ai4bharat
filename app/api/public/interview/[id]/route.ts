import { inferInterviewOutcome } from "@/lib/skillfit-outcome";

// Mock interview data for development/testing
const MOCK_INTERVIEWS: Record<string, any> = {
  "Vu-Q_1qIF0M4": {
    interviewId: "Vu-Q_1qIF0M4",
    trade: "electrician",
    candidateName: "Test Candidate",
    ngoId: "test-ngo-001",
    language: "en",
    questions: [
      { en: "What kind of electrical work have you done before?", key: "past_experience" },
      { en: "What problems have you faced while doing wiring work?", key: "problem_solving" },
      { en: "Do you work alone or as part of a team?", key: "teamwork" },
      { en: "What tools and equipment do you use regularly?", key: "tools_knowledge" },
    ],
    status: "active",
    createdAt: new Date().toISOString(),
  },
  "test-interview-001": {
    interviewId: "test-interview-001",
    trade: "plumber",
    candidateName: "Demo Candidate",
    ngoId: "test-ngo-002",
    language: "en",
    questions: [
      { en: "How many years have you worked as a plumber?", key: "past_experience" },
      { en: "What do you do when a pipe starts leaking?", key: "problem_solving" },
      { en: "What types of pipe fitting work have you done?", key: "skills" },
      { en: "How do you maintain safety at the worksite?", key: "safety_awareness" },
    ],
    status: "active",
    createdAt: new Date().toISOString(),
  },
};

async function getAdminDb() {
  try {
    const admin = await import("@/firebase/admin");
    return admin.db;
  } catch (error) {
    console.warn("Firebase Admin unavailable for public interview route:", error);
    return null;
  }
}

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  // Try to fetch from Firestore first
  try {
    const db = await getAdminDb();
    if (db) {
      const snap = await db
        .collection("interviews")
        .where("interviewId", "==", id)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        return Response.json({ success: true, docId: doc.id, interview: doc.data() });
      }
    }
  } catch (error) {
    console.log("Firestore unavailable, using mock data for development");
  }

  // Fall back to mock data in development
  if (MOCK_INTERVIEWS[id]) {
    return Response.json({ success: true, docId: id, interview: MOCK_INTERVIEWS[id] });
  }

  return Response.json({ success: false, error: "Interview not found" }, { status: 404 });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const transcript = (body?.transcript || []) as { role: "user" | "assistant" | "system"; content: string }[];

  try {
    const db = await getAdminDb();
    if (db) {
      const snap = await db
        .collection("interviews")
        .where("interviewId", "==", id)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const outcome = inferInterviewOutcome(transcript);
        await doc.ref.update({
          ...outcome,
          status: "completed",
          completedAt: new Date().toISOString(),
          faceVerified: true,
          adminAction: null,
        });

        return Response.json({ success: true });
      }
    }
  } catch (error) {
    console.log("Firestore unavailable for POST, mock response");
  }

  // Mock response for development
  if (MOCK_INTERVIEWS[id]) {
    return Response.json({ 
      success: true, 
      message: "Interview completed (mock mode)",
      transcriptLength: transcript.length 
    });
  }

  return Response.json({ success: false, error: "Interview not found" }, { status: 404 });
}
