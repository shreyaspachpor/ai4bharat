"use client";

import jsQR from "jsqr";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { KARNATAKA_DISTRICTS, TRADES } from "@/constants/skillfit";
import { useSkillfitAuth } from "@/components/skillfit/AuthProvider";
import { db } from "@/firebase/client";
import { apiVerifyAadhaarPdf } from "@/lib/api";
import {
  createInterview,
  getInterviewBaseUrl,
  getWhatsappMessage,
  markLinkSent,
  deleteInterview,
} from "@/lib/skillfit";
import type { InterviewLanguage, InterviewRecord } from "@/types/skillfit";

type CandidateForm = {
  name: string;
  aadhaar_last_4: string;
  phone: string;
  district: string;
  dob: string;
  gender: "M" | "F" | "O";
  address: string;
  trade: string;
  language: InterviewLanguage;
};

const defaultForm: CandidateForm = {
  name: "",
  aadhaar_last_4: "",
  phone: "",
  district: "Mysuru",
  dob: "",
  gender: "M",
  address: "",
  trade: "Electrician",
  language: "kn",
};

const statusLabel: Record<string, string> = {
  completed: "Completed",
  link_sent: "Link sent",
  pending: "Not sent",
  flagged: "Flagged",
};

export default function NgoRegisterPage() {
  const router = useRouter();
  const { user, profile, loading, logout } = useSkillfitAuth();
  const [tab, setTab] = useState<"register" | "all">("register");
  const [manualMode, setManualMode] = useState(false);
  const [extracting, setExtracting] = useState(false);
  const [aadhaarPassword, setAadhaarPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState<CandidateForm>(defaultForm);
  const [rows, setRows] = useState<InterviewRecord[]>([]);
  const [search, setSearch] = useState("");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [districtFilter, setDistrictFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selected, setSelected] = useState<InterviewRecord | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState("");

  useEffect(() => {
    if (!loading && profile?.role !== "ngo") router.replace("/admin/login");
  }, [loading, profile, router]);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(collection(db, "interviews"), where("ngoId", "==", user.uid));
    const unsub = onSnapshot(q, (snap) => {
      const next = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as InterviewRecord[];
      setRows(next);
    });
    return () => unsub();
  }, [user?.uid]);

  const stats = useMemo(() => {
    const total = rows.length;
    const completed = rows.filter((r) => r.status === "completed").length;
    const linkSent = rows.filter((r) => r.status === "link_sent").length;
    const pending = rows.filter((r) => r.status === "pending").length;
    return { total, completed, linkSent, pending };
  }, [rows]);

  const filteredRows = useMemo(
    () =>
      rows
        .filter((r) => r.candidateName.toLowerCase().includes(search.toLowerCase()))
        .filter((r) => (tradeFilter === "All" ? true : r.trade === tradeFilter))
        .filter((r) => (districtFilter === "All" ? true : r.district === districtFilter))
        .filter((r) =>
          statusFilter === "All"
            ? true
            : statusFilter === "Not sent"
              ? r.status === "pending"
              : statusFilter === "Link sent"
                ? r.status === "link_sent"
                : r.status === "completed"
        )
        .sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        }),
    [rows, search, tradeFilter, districtFilter, statusFilter]
  );

  const age = useMemo(() => {
    const year = Number(form.dob.slice(-4));
    if (!year) return "--";
    return String(new Date().getFullYear() - year);
  }, [form.dob]);

  const fillFromQr = useCallback((text?: string) => {
    try {
      const parsed = text ? (JSON.parse(text) as Record<string, string>) : null;
      setForm((prev) => ({
        ...prev,
        name: parsed?.name || defaultForm.name,
        phone: parsed?.phone || defaultForm.phone,
        district: parsed?.district || defaultForm.district,
        dob: parsed?.dob || defaultForm.dob,
        gender: (parsed?.gender as "M" | "F" | "O") || defaultForm.gender,
        address: parsed?.address || defaultForm.address,
      }));
    } catch {
      setForm(defaultForm);
    }
  }, []);

  const extractFromImageQr = useCallback(async (file: File) => {
    const imageUrl = URL.createObjectURL(file);
    try {
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = imageUrl;
      });
      const canvas = document.createElement("canvas");
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return null;
      ctx.drawImage(image, 0, 0);
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const result = jsQR(imageData.data, imageData.width, imageData.height);
      return result?.data || null;
    } finally {
      URL.revokeObjectURL(imageUrl);
    }
  }, []);

  const handleAadhaarUpload = useCallback(
    async (file: File) => {
      setExtracting(true);
      setUploadedFileName(file.name);
      try {
        const isPdf = file.type.includes("pdf") || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          if (!aadhaarPassword) {
            toast.error("Please enter the Aadhaar PDF password first.");
            setExtracting(false);
            return;
          }
          const res = await apiVerifyAadhaarPdf(file, aadhaarPassword);
          const parsed = res?.msgdata?.userdata || res;
          setForm((prev) => ({
            ...prev,
            name: parsed?.name || prev.name,
            phone: parsed?.phone || prev.phone,
            district: parsed?.district || prev.district,
            dob: parsed?.dob || prev.dob,
            gender: (parsed?.gender as "M" | "F" | "O") || prev.gender,
            address: parsed?.address || prev.address,
            aadhaar_last_4: String(parsed?.aadhaar_last_4 || parsed?.aadhaar_last_4_digit || parsed?.aadhaar_last4 || prev.aadhaar_last_4),
          }));
          toast.success("Aadhaar PDF extracted");
          setManualMode(true);
          return;
        }

        const qrPayload = await extractFromImageQr(file);
        fillFromQr(qrPayload || undefined);
        setManualMode(true);
        if (qrPayload) {
          toast.success("Aadhaar image extracted");
        } else {
          toast("Could not decode image QR, loaded manual form defaults");
        }
      } catch (err: any) {
        console.error("Aadhaar extraction error:", err);
        setManualMode(true);
        fillFromQr();
        toast.error(`Upload parsing failed: ${err.message || "Unknown error"}`);
      } finally {
        setExtracting(false);
      }
    },
    [aadhaarPassword, extractFromImageQr, fillFromQr]
  );

  const sendInterviewLink = useCallback(
    async (payload: {
      id: string;
      interviewId: string;
      candidateName: string;
      phone: string;
      language: InterviewLanguage;
    }) => {
      const url = `${getInterviewBaseUrl()}/interview/${payload.interviewId}`;
      const message = getWhatsappMessage(payload.language, payload.candidateName, url);
      window.open(`https://wa.me/91${payload.phone}?text=${encodeURIComponent(message)}`, "_blank");
      await markLinkSent(payload.id);
      toast.success(`Link sent to ${payload.candidateName} on WhatsApp`);
    },
    []
  );

  const handleDelete = async (row: InterviewRecord) => {
    if (!row.id || !user?.uid) return;
    if (window.confirm(`Are you sure you want to delete ${row.candidateName}?`)) {
      try {
        await deleteInterview(row.id, user.uid);
        toast.success("Candidate deleted");
      } catch (err: any) {
        toast.error(err.message || "Failed to delete");
      }
    }
  };

  const handleCreateAndSend = async () => {
    if (!user?.uid || !profile?.centerName) return;
    const created = await createInterview({
      candidateName: form.name,
      aadhaarLast4: form.aadhaar_last_4,
      phone: form.phone,
      district: form.district,
      trade: form.trade,
      language: form.language,
      ngoId: user.uid,
      ngoCenter: profile.centerName,
    });
    await sendInterviewLink({
      id: created.id,
      interviewId: created.interviewId,
      candidateName: form.name,
      phone: form.phone,
      language: form.language,
    });
    setForm(defaultForm);
  };

  if (loading || !profile) return <div className="p-6 text-sm text-zinc-300">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#191919] text-white">
      <nav className="border-b border-white/10 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
          <p className="font-semibold">AI SkillFit</p>
          <p className="text-zinc-400 text-sm">- NGO Operator Panel</p>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-zinc-400">{profile.centerName} ({profile.district})</span>
          <button onClick={logout} className="rounded border border-white/20 px-3 py-1.5 hover:bg-white/5">Logout</button>
        </div>
      </nav>

      <div className="px-3 sm:px-4 py-4">
        <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr] gap-4">
          <section className="rounded-xl border border-white/10 bg-white/5 p-3">
            <p className="text-xs text-zinc-400">STEP 1 - UPLOAD AADHAAR</p>
            <div className="relative mt-2 mb-2">
              <input
                type={showPassword ? "text" : "password"}
                value={aadhaarPassword}
                onChange={(e) => setAadhaarPassword(e.target.value)}
                placeholder="1. Enter PDF password"
                className="w-full rounded bg-black/30 px-2 py-2 pr-14 text-sm border border-white/20 focus:border-blue-400 outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
            <label className="block w-full rounded-xl border border-dashed border-white/25 p-4 cursor-pointer hover:bg-white/5 transition-colors">
              <p className="text-sm font-medium">2. Upload Aadhaar PDF</p>
              <p className="text-xs text-zinc-400 mt-1">Auto-extract name, phone, district and DOB</p>
              <input
                type="file"
                accept=".pdf,image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleAadhaarUpload(file);
                  e.target.value = '';
                }}
              />
            </label>
            {!!uploadedFileName && <p className="mt-1 text-xs text-zinc-500 truncate">{uploadedFileName}</p>}
            {extracting && <p className="mt-1 text-xs text-blue-300">Extracting details...</p>}
            <button onClick={() => setManualMode(true)} className="mt-2 text-xs underline text-zinc-400">or enter manually</button>

            {(manualMode || form.name) && (
              <div className="mt-3 rounded-lg border border-white/10 p-3 space-y-2 text-sm">
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="w-full rounded bg-black/30 px-2 py-1.5" />
                <div className="text-zinc-300 text-xs">
                  XXXX-XXXX-{form.aadhaar_last_4} - {form.gender} - {age} yrs
                </div>
                <input placeholder="Phone Number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded bg-black/30 px-2 py-1.5" />
                <select value={form.district} onChange={(e) => setForm({ ...form, district: e.target.value })} className="w-full rounded bg-black/30 px-2 py-1.5">
                  {KARNATAKA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                </select>
              </div>
            )}

            <p className="text-xs text-zinc-400 mt-3">STEP 2 - SELECT TRADE</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {TRADES.map((t) => (
                <button key={t} onClick={() => setForm({ ...form, trade: t })} className={`rounded border px-2 py-1 text-xs ${form.trade === t ? "bg-emerald-400 text-black border-emerald-300" : "border-white/20"}`}>{t}</button>
              ))}
            </div>

            <p className="text-xs text-zinc-400 mt-3">STEP 3 - INTERVIEW LANGUAGE</p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              {[
                { code: "kn", label: "ಕನ್ನಡ" },
                { code: "hi", label: "हिन्दी" },
                { code: "en", label: "English" },
              ].map((l) => (
                <button key={l.code} onClick={() => setForm({ ...form, language: l.code as InterviewLanguage })} className={`rounded border px-2 py-1 text-xs ${form.language === l.code ? "bg-emerald-400 text-black border-emerald-300" : "border-white/20"}`}>{l.label}</button>
              ))}
            </div>

            <button onClick={handleCreateAndSend} className="mt-4 w-full rounded-lg border border-white/20 px-3 py-3 font-semibold">
              Send interview link on WhatsApp
            </button>
          </section>

          <section className="rounded-xl border border-white/10 bg-black/30 p-3 overflow-auto">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
              <StatCard label="Total registered" value={stats.total} />
              <StatCard label="Completed" value={stats.completed} />
              <StatCard label="Link sent, pending" value={stats.linkSent} />
              <StatCard label="Not yet sent" value={stats.pending} />
            </div>

            <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-2">
              <input placeholder="Search candidate" value={search} onChange={(e) => setSearch(e.target.value)} className="rounded bg-black/50 px-3 py-2 text-sm" />
              <select value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)} className="rounded bg-black/50 px-3 py-2 text-sm">
                <option>All</option>{TRADES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="rounded bg-black/50 px-3 py-2 text-sm">
                <option>All</option>{KARNATAKA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}
              </select>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="rounded bg-black/50 px-3 py-2 text-sm">
                <option>All</option><option>Completed</option><option>Link sent</option><option>Not sent</option>
              </select>
            </div>

            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-zinc-400">
                  <tr className="border-b border-white/10">
                    <th className="text-left py-3 px-2 font-medium">Candidate</th>
                    <th className="text-left py-3 px-2 font-medium">Trade</th>
                    <th className="text-left py-3 px-2 font-medium">District</th>
                    <th className="text-left py-3 px-2 font-medium">Language</th>
                    <th className="text-left py-3 px-2 font-medium">Status</th>
                    <th className="text-left py-3 px-2 font-medium">Date</th>
                    <th className="text-left py-3 px-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.map((r) => (
                    <tr key={r.id} className="border-b border-white/5">
                      <td className="py-3 px-2"><p>{r.candidateName}</p><p className="text-xs text-zinc-500">{r.phone}</p></td>
                      <td className="py-3 px-2">{r.trade}</td>
                      <td className="py-3 px-2">{r.district}</td>
                      <td className="py-3 px-2 text-left">{String(r.language).toUpperCase()}</td>
                      <td className="py-3 px-2"><span className={`px-2 py-1 rounded text-xs ${
                        r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                        r.status === 'flagged' ? 'bg-red-500/20 text-red-300' :
                        r.status === 'link_sent' ? 'bg-blue-500/20 text-blue-300' :
                        'bg-zinc-500/20 text-zinc-300'
                      }`}>{statusLabel[r.status]}</span></td>
                      <td className="py-3 px-2">{r.createdAt ? new Date((r.createdAt as { seconds?: number }).seconds ? (r.createdAt as { seconds: number }).seconds * 1000 : Date.now()).toLocaleDateString("en-IN") : "-"}</td>
                      <td className="py-3 px-2 space-x-3">
                        {r.status === "completed" ? (
                          <button onClick={() => setSelected(r)} className="text-emerald-300 hover:underline">View result</button>
                        ) : (
                          <button
                            onClick={() =>
                              sendInterviewLink({
                                id: r.id || "",
                                interviewId: r.interviewId,
                                candidateName: r.candidateName,
                                phone: r.phone,
                                language: r.language,
                              })
                            }
                            className="text-blue-300 hover:underline"
                          >
                            {r.status === "pending" ? "Send now" : "Resend"}
                          </button>
                        )}
                        <button onClick={() => handleDelete(r)} className="text-red-400 hover:underline">Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/70 p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-xl rounded-xl border border-white/15 bg-[#222] p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">{selected.candidateName}</h3>
            <p className="text-sm text-zinc-400">{selected.trade} - {selected.district}</p>
            <div className="grid grid-cols-3 gap-2 mt-3 text-sm">
              <StatCard label="Relevance" value={selected.relevanceScore || 0} />
              <StatCard label="Clarity" value={selected.clarityScore || 0} />
              <StatCard label="Skill confidence" value={selected.skillConfidenceScore || 0} />
            </div>
            <p className="mt-3 text-sm">{selected.aiSummary || "No summary available."}</p>
            <button onClick={() => setSelected(null)} className="mt-4 rounded border border-white/20 px-3 py-1.5 text-sm">Close</button>
          </div>
        </div>
      )}
    </main>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-zinc-400">{label}</p>
    </div>
  );
}
