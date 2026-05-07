/**
 * API client for the Python FastAPI backend.
 *
 * All backend calls go through this module so switching
 * environments is a single env-var change.
 */

const API_BASE = typeof window !== "undefined"
  ? process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
  : "http://127.0.0.1:8000";

type RequestOpts = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

async function request<T = unknown>(
  path: string,
  opts: RequestOpts = {}
): Promise<T> {
  const { method = "GET", body, headers = {} } = opts;

  let cookieHeader = "";
  if (typeof window === "undefined") {
    try {
      const { cookies } = await import("next/headers");
      const cookieStore = await cookies();
      cookieHeader = cookieStore.toString();
    } catch (e) {
      // Ignore if not in context
    }
  }

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    credentials: "include", // send session cookie for client fetches
    headers: {
      "Content-Type": "application/json",
      ...(cookieHeader ? { Cookie: cookieHeader } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(`API ${method} ${path} failed (${res.status}): ${text}`);
  }

  return res.json();
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export async function apiSignUp(params: {
  uid: string;
  name: string;
  email: string;
  aadhaarData?: Record<string, any>;
}) {
  return request<{ success: boolean; message: string }>("/api/auth/sign-up", {
    method: "POST",
    body: params,
  });
}

export async function apiVerifyAadhaarPdf(file: File, password?: string) {
  const formData = new FormData();
  formData.append("file", file);
  if (password) {
    formData.append("password", password);
  }

  const res = await fetch(`${API_BASE}/api/aadhaar/getaadhaarinfo/pdf/`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown error");
    throw new Error(text || "Failed to verify Aadhaar");
  }

  return res.json();
}

export async function apiSignIn(params: {
  email: string;
  idToken: string;
}) {
  return request<{ success: boolean; message: string }>("/api/auth/sign-in", {
    method: "POST",
    body: params,
  });
}

export async function apiSignOut() {
  return request<{ success: boolean }>("/api/auth/sign-out", {
    method: "POST",
  });
}

export async function apiGetCurrentUser() {
  return request<{
    user: {
      id: string;
      name: string;
      email: string;
      role: "admin" | "user";
    } | null;
  }>("/api/auth/me");
}

export async function apiCheckAuth() {
  return request<{ authenticated: boolean; isAdmin: boolean }>(
    "/api/auth/check"
  );
}

// ── Interviews ───────────────────────────────────────────────────────────────

export async function apiGenerateInterview(params: {
  userid: string;
  trade?: string;
  role?: string;
  district?: string;
  language?: string;
  count?: number;
}) {
  return request<{ success: boolean; interviewId: string }>(
    "/api/interviews/generate",
    { method: "POST", body: params }
  );
}

export async function apiGetInterview(interviewId: string) {
  return request<any>(
    `/api/interviews/${interviewId}`
  );
}

export async function apiGenerateDeepLink(params: {
  name: string;
  email?: string;
  district: string;
  trade: string;
  language: string;
  aadhaarData?: Record<string, any>;
  changed_by_admin?: boolean;
  consent_confirmed?: boolean;
}) {
  return request<{ success: boolean; token: string; interviewId: string }>(
    "/api/interviews/generate-deep-link",
    { method: "POST", body: params }
  );
}

export async function apiGetInterviewByToken(token: string) {
  return request<any>(
    `/api/interviews/deep-link/${token}`
  );
}

export async function apiGetInterviewsByUser(userId: string) {
  return request<any[]>(
    `/api/interviews/user/${userId}`
  );
}

export async function apiGetLatestInterviews(
  userId: string,
  limit = 20
) {
  return request<any[]>(
    `/api/interviews/latest/${userId}?limit=${limit}`
  );
}

export async function apiGetCompletedInterviews(userId: string) {
  return request<any[]>(
    `/api/interviews/completed/${userId}`
  );
}

export async function apiDeleteInterview(
  interviewId: string,
  userId: string
) {
  return request<{ success: boolean; error?: string }>(
    `/api/interviews/${interviewId}?user_id=${userId}`,
    { method: "DELETE" }
  );
}

// ── Feedback ─────────────────────────────────────────────────────────────────

export async function apiCreateFeedback(params: any) {
  return request<{ success: boolean; feedbackId?: string }>(
    "/api/feedback/create",
    { method: "POST", body: params }
  );
}

export async function apiGetFeedback(
  interviewId: string,
  userId: string
) {
  return request<any>(
    `/api/feedback/${interviewId}/${userId}`
  );
}

export async function apiGetAllFeedbackForUser(userId: string) {
  return request<any[]>(`/api/feedback/user/${userId}`);
}

export async function apiExtractInterviewFields(transcript: string) {
  return request<{
    success: boolean;
    fields: {
      role: string;
      level: string;
      techstack: string;
      type: string;
      amount: number;
    };
  }>("/api/feedback/extract-fields", {
    method: "POST",
    body: { transcript },
  });
}
