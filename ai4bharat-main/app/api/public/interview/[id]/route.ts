import { inferInterviewOutcome } from "@/lib/skillfit-outcome";

const TRADES = ["electrician", "plumber", "welder", "mason", "helper", "carpenter"];
const DISTRICTS = ["Bengaluru Urban", "Mysuru", "Hubli-Dharwad", "Mangaluru", "Belagavi"];
const LANGUAGES = ["en", "hi", "kn"];
const FIRST_NAMES = ["Rajesh", "Priya", "Amit", "Deepak", "Neha", "Suresh", "Meera", "Arjun"];
const LAST_NAMES = ["Kumar", "Singh", "Patel", "Reddy", "Verma", "Sharma", "Nair", "Desai"];

// Helper to generate mock data dynamically for any interview ID
function generateMockInterview(interviewId: string) {
  // Use interviewId hash for consistent pseudo-random generation
  const hash = Array.from(interviewId).reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const trade = TRADES[hash % TRADES.length];
  const district = DISTRICTS[hash % DISTRICTS.length];
  const language = LANGUAGES[hash % LANGUAGES.length];
  const firstName = FIRST_NAMES[Math.floor(hash / TRADES.length) % FIRST_NAMES.length];
  const lastName = LAST_NAMES[Math.floor(hash / DISTRICTS.length) % LAST_NAMES.length];
  const aadhaarLast4 = String(Math.abs(hash % 10000)).padStart(4, "0");
  const phone = "98" + String(Math.abs(hash % 10000000)).padStart(8, "0");
  
  return {
    interviewId,
    candidateName: `${firstName} ${lastName}`,
    aadhaarLast4,
    phone,
    district,
    trade,
    language,
    status: "pending",
    ngoId: `ngo-${hash % 100}`,
    ngoCenter: `${district} Training Center`,
    faceVerified: false,
    createdAt: new Date().toISOString(),
  };
}

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
  
  console.log(`[Public API] Fetching interview: ${id}`);
  
  // Try to fetch from Firestore first
  try {
    const db = await getAdminDb();
    if (db) {
      // First try by document ID
      const doc = await db.collection("interviews").doc(id).get();
      if (doc.exists) {
        const data = doc.data();
        console.log(`[Public API] Found interview by docId: ${id}`, data);
        return Response.json({ success: true, docId: doc.id, interview: data });
      }
      
      // Then try by interviewId field
      const snap = await db
        .collection("interviews")
        .where("interviewId", "==", id)
        .limit(1)
        .get();

      if (!snap.empty) {
        const doc = snap.docs[0];
        const data = doc.data();
        console.log(`[Public API] Found interview by interviewId: ${id}`, data);
        return Response.json({ success: true, docId: doc.id, interview: data });
      }
      
      console.log(`[Public API] Interview not found in Firestore: ${id}`);
    }
  } catch (error) {
    console.error("[Public API] Firestore error:", error);
  }

  // Fall back to dynamically generated mock data
  const mockInterview = generateMockInterview(id);
  console.log(`[Public API] Generated mock interview for: ${id}`, mockInterview);
  return Response.json({ success: true, docId: id, interview: mockInterview });
}

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json();
  const transcript = (body?.transcript || []) as { role: "user" | "assistant" | "system"; content: string }[];

  try {
    const db = await getAdminDb();
    if (db) {
      // First try by document ID
      let doc = await db.collection("interviews").doc(id).get();
      
      if (!doc.exists) {
        // Then try by interviewId field
        const snap = await db
          .collection("interviews")
          .where("interviewId", "==", id)
          .limit(1)
          .get();

        if (!snap.empty) {
          doc = snap.docs[0];
        }
      }

      if (doc.exists) {
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
    console.log("Firestore unavailable for POST, using mock response");
  }

  // Mock response for development (dynamic generation)
  return Response.json({ 
    success: true, 
    message: "Interview completed (mock mode)",
    transcriptLength: transcript.length 
  });
}
