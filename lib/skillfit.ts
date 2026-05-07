import { nanoid } from "nanoid";
import {
  Timestamp,
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  deleteDoc,
  where,
} from "firebase/firestore";

import { db } from "@/firebase/client";
import type { AdminProfile, InterviewLanguage, InterviewRecord } from "@/types/skillfit";
import { inferInterviewOutcome } from "@/lib/skillfit-outcome";

const adminsRef = collection(db, "admins");
const interviewsRef = collection(db, "interviews");
import { apiDeleteInterview } from "@/lib/api";

export function getInterviewBaseUrl() {
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, ""); // strip trailing slash
  }
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return "http://localhost:3000";
}

export function getWhatsappMessage(language: InterviewLanguage, name: string, url: string) {
  if (language === "kn") {
    return `ನಮಸ್ಕಾರ ${name}! 🙏

AI SkillFit ಸಂದರ್ಶನಕ್ಕೆ ಸ್ವಾಗತ. ಕೆಳಗಿನ ಲಿಂಕ್ ತೆರೆದು ಸಂದರ್ಶನ ನೀಡಿ:

${url}

ಧನ್ಯವಾದಗಳು!`;
  }
  if (language === "hi") {
    return `नमस्कार ${name}! 🙏

आपका AI SkillFit साक्षात्कार तैयार है। नीचे दिए गए लिंक पर क्लिक करें:

${url}

धन्यवाद!`;
  }
  return `Hello ${name}! 👋

Your AI SkillFit interview is ready. Click the link below to begin:

${url}

Good luck!`;
}

export async function getAdminProfile(uid: string) {
  const snap = await getDoc(doc(db, "admins", uid));
  if (!snap.exists()) return null;
  return snap.data() as AdminProfile;
}

export async function seedAdminForKnownEmail(uid: string, email: string) {
  const normalized = email.toLowerCase();
  const adminDoc = doc(db, "admins", uid);

  if (normalized === "ngo@skillfit.in") {
    await setDoc(
      adminDoc,
      {
        uid,
        email: normalized,
        role: "ngo",
        centerName: "Sewa NGO",
        district: "Mysuru",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
    return;
  }

  if (normalized === "officer@skillfit.in") {
    await setDoc(
      adminDoc,
      {
        uid,
        email: normalized,
        role: "govt",
        name: "District Officer",
        district: "All",
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }
}

export async function createInterview(payload: {
  candidateName: string;
  aadhaarLast4: string;
  phone: string;
  district: string;
  trade: string;
  language: InterviewLanguage;
  ngoId: string;
  ngoCenter: string;
}) {
  const interviewId = nanoid(12);
  const data: InterviewRecord = {
    interviewId,
    candidateName: payload.candidateName,
    aadhaarLast4: payload.aadhaarLast4,
    phone: payload.phone,
    district: payload.district,
    trade: payload.trade,
    language: payload.language,
    status: "pending",
    ngoId: payload.ngoId,
    ngoCenter: payload.ngoCenter,
    createdAt: serverTimestamp(),
    faceVerified: false,
    videoUrl: null,
    fitmentLabel: null,
    adminAction: null,
  };

  const ref = await addDoc(interviewsRef, data);
  return { id: ref.id, interviewId };
}

export async function markLinkSent(id: string) {
  await updateDoc(doc(db, "interviews", id), {
    status: "link_sent",
    linkSentAt: serverTimestamp(),
  });
}

export async function updateAdminAction(id: string, action: "shortlisted" | "training" | "flagged") {
  const payload: Record<string, string> = { adminAction: action };
  if (action === "flagged") payload.status = "flagged";
  await updateDoc(doc(db, "interviews", id), payload);
}

export async function deleteInterview(id: string, userId: string) {
  const res = await apiDeleteInterview(id, userId);
  if (!res?.success) throw new Error(res?.error || "Failed to delete");
}

export async function seedDemoData(ngoId: string, ngoCenter: string) {
  const now = Timestamp.now();
  const rows: Omit<InterviewRecord, "id">[] = [
    {
      interviewId: nanoid(12),
      candidateName: "Raju Kumar",
      aadhaarLast4: "3421",
      phone: "9876543210",
      district: "Mysuru",
      trade: "Electrician",
      language: "kn",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Job-ready",
      relevanceScore: 82,
      clarityScore: 78,
      skillConfidenceScore: 85,
      aiSummary: "Strong practical wiring knowledge. Can be deployed quickly in supervised field work.",
      adminAction: null,
    },
    {
      interviewId: nanoid(12),
      candidateName: "Suresh B.",
      aadhaarLast4: "1198",
      phone: "9880011223",
      district: "Dharwad",
      trade: "Plumber",
      language: "kn",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Needs training",
      relevanceScore: 58,
      clarityScore: 51,
      skillConfidenceScore: 55,
      aiSummary: "Understands basics but misses safety details. Recommending short focused upskilling.",
      adminAction: null,
    },
    {
      interviewId: nanoid(12),
      candidateName: "Mahesh V.",
      aadhaarLast4: "4402",
      phone: "9900011122",
      district: "Kalaburagi",
      trade: "Welder",
      language: "hi",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Requires manual verification",
      relevanceScore: 67,
      clarityScore: 62,
      skillConfidenceScore: 64,
      aiSummary: "Shows practical exposure but evidence is partial. Manual panel review suggested.",
      adminAction: null,
    },
    {
      interviewId: nanoid(12),
      candidateName: "Lakshmi D.",
      aadhaarLast4: "7783",
      phone: "9966001122",
      district: "Mysuru",
      trade: "Mason",
      language: "kn",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Job-ready",
      relevanceScore: 80,
      clarityScore: 76,
      skillConfidenceScore: 79,
      aiSummary: "Good alignment with role tasks and consistent responses. Suitable for immediate placement.",
      adminAction: null,
    },
    {
      interviewId: nanoid(12),
      candidateName: "Basavaraj T.",
      aadhaarLast4: "9012",
      phone: "9945012345",
      district: "Belagavi",
      trade: "Helper",
      language: "kn",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: false,
      videoUrl: null,
      fitmentLabel: "Low confidence / poor quality",
      relevanceScore: 34,
      clarityScore: 39,
      skillConfidenceScore: 31,
      aiSummary: "Recording quality is poor and responses are unclear. Needs re-attempt or manual screening.",
      adminAction: "flagged",
    },
    {
      interviewId: nanoid(12),
      candidateName: "Naveen P.",
      aadhaarLast4: "2245",
      phone: "9988776655",
      district: "Tumakuru",
      trade: "Electrician",
      language: "hi",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Needs training",
      relevanceScore: 47,
      clarityScore: 59,
      skillConfidenceScore: 53,
      aiSummary: "Conceptual understanding is present but inconsistent execution confidence. Training recommended.",
      adminAction: null,
    },
    {
      interviewId: nanoid(12),
      candidateName: "Farzana S.",
      aadhaarLast4: "6677",
      phone: "9977112233",
      district: "Bengaluru Urban",
      trade: "Plumber",
      language: "kn",
      status: "completed",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: true,
      videoUrl: null,
      fitmentLabel: "Job-ready",
      relevanceScore: 88,
      clarityScore: 84,
      skillConfidenceScore: 81,
      aiSummary: "Very good trade readiness and communication clarity. Strong candidate for shortlist.",
      adminAction: "shortlisted",
    },
    {
      interviewId: nanoid(12),
      candidateName: "Ramesh N.",
      aadhaarLast4: "3344",
      phone: "9911223344",
      district: "Dharwad",
      trade: "Welder",
      language: "kn",
      status: "flagged",
      ngoId,
      ngoCenter,
      createdAt: now,
      completedAt: now,
      linkSentAt: now,
      faceVerified: false,
      videoUrl: null,
      fitmentLabel: "Low confidence / poor quality",
      relevanceScore: 29,
      clarityScore: 33,
      skillConfidenceScore: 35,
      aiSummary: "Potential identity mismatch and inconsistent responses detected. Manual verification required.",
      adminAction: "flagged",
    },
  ];

  await Promise.all(rows.map((row) => addDoc(interviewsRef, row)));
}

export async function finalizeInterviewResult(
  docId: string,
  transcript: { role: "user" | "assistant" | "system"; content: string }[]
) {
  const outcome = inferInterviewOutcome(transcript);
  await updateDoc(doc(db, "interviews", docId), {
    ...outcome,
    status: "completed",
    completedAt: serverTimestamp(),
    faceVerified: true,
    adminAction: null,
  });
}
