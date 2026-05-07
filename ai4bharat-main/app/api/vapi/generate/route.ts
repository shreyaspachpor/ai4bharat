import { getQuestions } from "@/lib/questionBank";

function normalizeTrade(input?: string): keyof typeof import("@/lib/questionBank").default {
  const t = (input || "").toLowerCase().trim();
  if (t.includes("electric")) return "electrician";
  if (t.includes("plumb")) return "plumber";
  if (t.includes("weld")) return "welder";
  if (t.includes("mason") || t.includes("construction")) return "mason";
  if (t.includes("helper") || t.includes("labor") || t.includes("labour")) return "helper";
  if (t === "electrician" || t === "plumber" || t === "welder" || t === "mason" || t === "helper") {
    return t as any;
  }
  return "helper";
}

async function getAdminDb() {
  try {
    const admin = await import("@/firebase/admin");
    return admin.db;
  } catch (error) {
    console.warn("Firebase Admin unavailable for Vapi generate route:", error);
    return null;
  }
}

export async function POST(request: Request) {
  const body = await request.json();
  const { userid } = body;
  const trade = normalizeTrade(body.trade || body.role);
  const district = typeof body.district === "string" ? body.district.trim() : "";
  const language = body.language === "kn" || body.language === "hi" ? body.language : "en";
  const count = Number(body.count ?? body.amount ?? 4);

  try {
    const db = await getAdminDb();
    if (!db) {
      return Response.json(
        {
          success: false,
          error:
            "Firebase Admin is not configured. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY.",
        },
        { status: 500 }
      );
    }

    const questions = getQuestions(trade, language, Number.isFinite(count) ? count : 4);

    const tradeSkills: Record<string, string[]> = {
      electrician: ["Wiring", "Installation", "Safety"],
      plumber: ["Plumbing", "Pipe Work", "Repairs"],
      welder: ["Arc Welding", "MIG", "TIG"],
      mason: ["Brickwork", "Plastering", "Flooring"],
      helper: ["General Labour", "Loading", "Site Work"],
      carpenter: ["Woodwork", "Framing", "Finishing"],
      painter: ["Wall Painting", "Polishing", "Mixing"],
      fitter: ["Fitting", "Assembly", "Measurement"],
    };

    const interview = {
      role: trade,
      type: "trade",
      level: "N/A",
      techstack: tradeSkills[trade] || [],
      questions,
      userId: userid,
      finalized: true,
      createdAt: new Date().toISOString(),
      district,
      interviewLanguage: language,
    };

    const docRef = await db.collection("interviews").add(interview);

    return Response.json({ success: true, interviewId: docRef.id }, { status: 200 });
  } catch (error) {
    console.error("Error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return Response.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function GET() {
  return Response.json({ success: true, data: "Thank you!" }, { status: 200 });
}
