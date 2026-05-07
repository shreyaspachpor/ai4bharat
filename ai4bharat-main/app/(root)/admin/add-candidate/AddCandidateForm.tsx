"use client";

import { useMemo, useState } from "react";
import {
  Copy,
  FileText,
  Lock,
  MessageCircle,
  QrCode,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { apiVerifyAadhaarPdf, apiGenerateDeepLink } from "@/lib/api";
import Link from "next/link";
import { seededCandidates } from "@/constants";

const districts = ["Bengaluru Urban", "Mysuru", "Hubli-Dharwad", "Mangaluru"];
const trades = ["Electrician", "Plumber", "Welder", "Mason", "Helper", "Carpenter"];
const languages = [
  { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
  { code: "hi", name: "हिन्दी (Hindi)" },
  { code: "en", name: "English" }
];

export default function AddCandidateForm() {
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [aadhaarPassword, setAadhaarPassword] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [aadhaarData, setAadhaarData] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: "",
    district: "Bengaluru Urban",
    trade: "Electrician",
    language: "kn",
  });

  const [consent, setConsent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [deepLink, setDeepLink] = useState<string | null>(null);

  const [rightDistrict, setRightDistrict] = useState<string>("All districts");
  const [rightTrade, setRightTrade] = useState<string>("All trades");
  const [orgName, setOrgName] = useState<string>("Sewa NGO, Mysuru");

  // UI numbers shown in the reference screenshot (prototype dashboard counters)
  const stats = useMemo(() => ({ total: 142, completed: 89, pending: 31 }), []);

  const filteredCandidates = useMemo(() => {
    return seededCandidates.filter((c) => {
      if (rightDistrict !== "All districts" && c.district !== rightDistrict) return false;
      if (rightTrade !== "All trades" && c.trade !== rightTrade) return false;
      return true;
    });
  }, [rightDistrict, rightTrade]);

  const handleVerifyAadhaar = async () => {
    if (!aadhaarFile) {
      toast.error("Please select an Aadhaar PDF first.");
      return;
    }
    
    setIsVerifying(true);
    try {
      const data = await apiVerifyAadhaarPdf(aadhaarFile, aadhaarPassword);
      if (data && data.name) {
        setAadhaarData(data);
        setFormData(prev => ({ ...prev, name: data.name }));
        toast.success("Aadhaar verified successfully!");
      } else {
        toast.error("Could not extract details from Aadhaar.");
      }
    } catch (e: any) {
      toast.error(e.message || "Verification failed. Check password and file.");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      toast.error("You must confirm candidate consent to proceed.");
      return;
    }
    if (!formData.name) {
      toast.error("Candidate name is required.");
      return;
    }

    const changedByAdmin = aadhaarData ? formData.name !== aadhaarData.name : true;

    setIsGenerating(true);
    try {
      const result = await apiGenerateDeepLink({
        name: formData.name,
        district: formData.district,
        trade: formData.trade,
        language: formData.language,
        aadhaarData: aadhaarData || undefined,
        changed_by_admin: changedByAdmin,
        consent_confirmed: consent,
      });

      if (result.success && result.token) {
        const link = `${window.location.origin}/join/${result.token}`;
        setDeepLink(link);
        toast.success("Magic Link generated successfully!");
      } else {
        toast.error("Failed to generate link.");
      }
    } catch (error: any) {
      toast.error(error.message || "An error occurred generating the link.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyLink = () => {
    if (deepLink) {
      navigator.clipboard.writeText(deepLink);
      toast.success("Link copied to clipboard!");
    }
  };

  const shareOnWhatsApp = () => {
    if (!deepLink) return;
    const message = `AI SkillFit interview link: ${deepLink}`;
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const initials = useMemo(() => {
    const name = formData.name?.trim() || aadhaarData?.name?.trim() || "Raju Kumar";
    const parts = name.split(/\s+/).filter(Boolean);
    const first = parts[0]?.[0] || "R";
    const second = parts[1]?.[0] || "K";
    return `${first}${second}`.toUpperCase();
  }, [aadhaarData?.name, formData.name]);

  return (
    <div className="w-full">
      <div
        className="w-full rounded-2xl border border-dark-300 overflow-hidden"
        style={{ background: "#1f1f1f" }}
      >
        {/* Top bar (match screenshot) */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-dark-300">
          <div className="flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-500 inline-block" />
            <p className="text-light-100 font-semibold">AI SkillFit</p>
            <p className="text-light-400 text-sm">— NGO Operator Panel</p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4 text-sm">
              <span className="px-4 py-1.5 rounded-full border border-blue-500/60 text-blue-200 bg-blue-500/10">
                Register candidate
              </span>
              <Link href="/admin" className="text-light-300 hover:text-light-100">
                All candidates
              </Link>
            </div>

            <p className="text-light-400 text-sm">{orgName}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
            {/* Left: Registration workflow */}
            <div className="lg:col-span-4 border-r border-dark-300 px-5 py-4" style={{ background: "#2a2a2a" }}>
              <p className="text-light-300 text-xs tracking-wider font-semibold">STEP 1 — SCAN AADHAAR</p>

              {/* Scan box (screenshot) */}
              <div className="mt-3 rounded-2xl border border-dark-300 bg-[#242424] p-4">
                <label className="block cursor-pointer rounded-2xl border border-dashed border-dark-300 p-6 text-center hover:border-blue-500/60 transition">
                  <div className="mx-auto h-12 w-12 rounded-2xl bg-blue-500/15 border border-blue-500/30 flex items-center justify-center">
                    <QrCode className="h-6 w-6 text-blue-200" />
                  </div>
                  <p className="text-light-100 font-semibold mt-4">Scan Aadhaar QR code</p>
                  <p className="text-light-400 text-xs mt-1">Point camera at card QR</p>
                  {/* Keeps existing PDF upload + extraction flow */}
                  <input
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      setAadhaarFile(e.target.files?.[0] || null);
                      setAadhaarData(null);
                      setAadhaarPassword("");
                    }}
                  />
                </label>

                {/* Upload/PDF password UI appears after file selection */}
                {aadhaarFile && (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between rounded-xl bg-[#1f1f1f] border border-dark-300 px-3 py-2">
                      <div className="flex items-center gap-2 overflow-hidden">
                        <FileText className="h-4 w-4 text-light-300 flex-shrink-0" />
                        <p className="truncate text-xs text-light-200">{aadhaarFile.name}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setAadhaarFile(null);
                          setAadhaarData(null);
                          setAadhaarPassword("");
                        }}
                        className="p-1 rounded hover:bg-dark-300/40"
                        title="Remove"
                      >
                        <X className="h-4 w-4 text-light-400" />
                      </button>
                    </div>

                    {!aadhaarData && (
                      <>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-light-400" />
                          <input
                            type="password"
                            value={aadhaarPassword}
                            onChange={(e) => setAadhaarPassword(e.target.value)}
                            className="w-full rounded-xl border border-dark-300 bg-[#1f1f1f] py-2.5 pl-10 pr-3 text-sm text-light-100 placeholder:text-light-500 focus:border-blue-500/60 focus:outline-none"
                            placeholder="PDF password"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={handleVerifyAadhaar}
                          disabled={isVerifying}
                          className="w-full rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-100 font-semibold py-2.5 hover:bg-blue-500/25 transition disabled:opacity-60"
                        >
                          {isVerifying ? "Extracting…" : "Extract Details"}
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>

              <p className="text-center text-light-500 text-xs my-4">or enter manually</p>

              {/* Manual entry card (screenshot) */}
              <div className="rounded-2xl border border-dark-300 bg-[#242424] p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full bg-[#e7fff0] text-[#1b1b1b] flex items-center justify-center font-bold">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-light-100 font-semibold leading-tight">
                      {formData.name || aadhaarData?.name || "Raju Kumar"}
                    </p>
                    <p className="text-light-400 text-xs mt-1">
                      {aadhaarData?.masked || "XXXX-XXXX-3421"} · {aadhaarData?.gender || "Male"} · {aadhaarData?.age || "34"} yrs
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div>
                    <p className="text-light-500 text-xs mb-1">Phone</p>
                    <input
                      value={aadhaarData?.phone || "98XXXXXXXX"}
                      onChange={() => {}}
                      className="w-full rounded-lg border border-dark-300 bg-[#1f1f1f] px-3 py-2 text-sm text-light-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <p className="text-light-500 text-xs mb-1">District</p>
                    <input
                      value={formData.district || "Mysuru"}
                      onChange={() => {}}
                      className="w-full rounded-lg border border-dark-300 bg-[#1f1f1f] px-3 py-2 text-sm text-light-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <p className="text-light-500 text-xs mb-1">Address</p>
                    <input
                      value={aadhaarData?.address || "Hunsur Rd, Mysuru"}
                      onChange={() => {}}
                      className="w-full rounded-lg border border-dark-300 bg-[#1f1f1f] px-3 py-2 text-sm text-light-100"
                      readOnly
                    />
                  </div>
                  <div>
                    <p className="text-light-500 text-xs mb-1">Language</p>
                    <input
                      value={(formData.language || "—").toUpperCase()}
                      onChange={() => {}}
                      className="w-full rounded-lg border border-dark-300 bg-[#1f1f1f] px-3 py-2 text-sm text-light-100"
                      readOnly
                    />
                  </div>
                </div>
              </div>

              {/* Trade */}
              <div className="mt-5">
                <p className="text-light-300 text-xs tracking-wider font-semibold">STEP 2 — SELECT TRADE</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {trades.map((t) => {
                    const active = formData.trade === t;
                    return (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, trade: t })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-[#e7fff0] text-[#1b1b1b] border-[#e7fff0]"
                            : "bg-[#242424] text-light-200 border-dark-300 hover:border-light-400/40"
                        }`}
                      >
                        {t}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Interview language */}
              <div className="mt-5">
                <p className="text-light-300 text-xs tracking-wider font-semibold">STEP 3 — INTERVIEW LANGUAGE</p>
                <div className="grid grid-cols-3 gap-2 mt-3">
                  {[
                    { code: "kn", label: "ಕನ್ನಡ" },
                    { code: "hi", label: "हिन्दी" },
                    { code: "en", label: "English" },
                  ].map((l) => {
                    const active = formData.language === l.code;
                    return (
                      <button
                        key={l.code}
                        type="button"
                        onClick={() => setFormData({ ...formData, language: l.code })}
                        className={`rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                          active
                            ? "bg-[#e7fff0] text-[#1b1b1b] border-[#e7fff0]"
                            : "bg-[#242424] text-light-200 border-dark-300 hover:border-light-400/40"
                        }`}
                      >
                        {l.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Consent + CTA */}
              <form onSubmit={handleSubmit} className="mt-5">
                <label className="flex items-start gap-2 text-xs text-light-400">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5"
                  />
                  I confirm that I have the candidate&apos;s explicit consent to use their Aadhaar data for SkillFit registration and evaluation purposes.
                </label>

                <button
                  type="submit"
                  disabled={isGenerating || !consent || (!aadhaarData && !formData.name)}
                  className="w-full mt-3 rounded-xl bg-[#242424] border border-dark-300 py-3 font-semibold text-light-100 hover:border-light-400/40 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGenerating ? "Generating…" : "Generate Magic Link →"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (deepLink) shareOnWhatsApp();
                    else toast.error("Generate the link first.");
                  }}
                  className="w-full mt-3 rounded-xl bg-[#242424] border border-dark-300 py-3 font-semibold text-light-100 hover:border-green-500/50 hover:bg-green-500/10 transition flex items-center justify-center gap-2 disabled:opacity-50"
                  disabled={!deepLink}
                >
                  <MessageCircle className="h-4 w-4" />
                  {deepLink ? "Share Interview Link" : "Generate Link First"}
                </button>

                {deepLink && (
                  <>
                    {/* Direct clickable link */}
                    <a
                      href={deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full mt-3 rounded-xl bg-green-500/10 border border-green-500/30 py-3 font-semibold text-green-300 hover:bg-green-500/20 hover:border-green-500/50 transition flex items-center justify-center gap-2"
                    >
                      ✓ Open Interview Link Directly
                    </a>
                    {/* WhatsApp share with simple message */}
                    <button
                      type="button"
                      onClick={() => {
                        const message = deepLink;
                        const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
                        window.open(url, "_blank", "noopener,noreferrer");
                      }}
                      className="w-full mt-2 rounded-xl bg-[#25D366]/10 border border-[#25D366]/30 py-3 font-semibold text-[#25D366] hover:bg-[#25D366]/20 hover:border-[#25D366]/50 transition flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="h-4 w-4" />
                      Send on WhatsApp
                    </button>
                  </>
                )}

                <p className="text-center text-xs text-light-500 mt-3">Or share the link directly with candidate (copy below)</p>

                {deepLink && (
                  <div className="mt-3 rounded-xl border border-dark-300 bg-[#1f1f1f] px-3 py-2 flex items-center gap-2">
                    <p className="flex-1 text-xs text-light-200 font-mono truncate select-all">{deepLink}</p>
                    <button
                      type="button"
                      onClick={copyLink}
                      className="p-1.5 rounded hover:bg-dark-300/40 transition"
                      title="Copy"
                    >
                      <Copy className="h-4 w-4 text-light-300" />
                    </button>
                  </div>
                )}
              </form>
            </div>

            {/* Right: candidates list + stats */}
            <div className="lg:col-span-8 px-5 py-4" style={{ background: "#1f1f1f" }}>
              {/* Stat cards */}
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-dark-300 bg-[#242424] px-5 py-4">
                  <p className="text-2xl font-bold text-light-100">{stats.total}</p>
                  <p className="text-xs text-light-400 mt-1">Total registered</p>
                </div>
                <div className="rounded-xl border border-dark-300 bg-[#242424] px-5 py-4">
                  <p className="text-2xl font-bold text-emerald-500">{stats.completed}</p>
                  <p className="text-xs text-light-400 mt-1">Interviews completed</p>
                </div>
                <div className="rounded-xl border border-dark-300 bg-[#242424] px-5 py-4">
                  <p className="text-2xl font-bold text-amber-400">{stats.pending}</p>
                  <p className="text-xs text-light-400 mt-1">Link sent, pending</p>
                </div>
              </div>

              {/* Filters row */}
              <div className="mt-4 flex items-center gap-3">
                <div className="h-9 w-9 rounded-lg border border-dark-300 bg-[#242424]" />
                <select
                  value={rightTrade}
                  onChange={(e) => setRightTrade(e.target.value)}
                  className="h-9 bg-[#242424] text-light-100 rounded-lg px-4 text-sm border border-dark-300 focus:outline-none focus:border-light-400/40"
                >
                  {["All trades", ...trades].map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <select
                  value={rightDistrict}
                  onChange={(e) => setRightDistrict(e.target.value)}
                  className="h-9 bg-[#242424] text-light-100 rounded-lg px-4 text-sm border border-dark-300 focus:outline-none focus:border-light-400/40"
                >
                  {["All districts", ...districts].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              {/* Table */}
              <div className="mt-4">
                <div className="grid grid-cols-5 gap-3 px-2 py-2 text-xs text-light-500 tracking-wider">
                  <p>CANDIDATE</p>
                  <p>TRADE</p>
                  <p>DISTRICT</p>
                  <p>LANGUAGE</p>
                  <p>STATUS</p>
                </div>

                <div className="space-y-2">
                  {filteredCandidates.slice(0, 6).map((c, idx) => {
                    const lang = String(c.language || "KN").toUpperCase();
                    const completed = c.fitmentLabel === "Job-ready";
                    const statusLabel = completed ? "Completed" : idx % 3 === 0 ? "Not started" : "Link sent";
                    const dotColor = completed ? "bg-emerald-500" : statusLabel === "Not started" ? "bg-red-500" : "bg-amber-400";
                    const pill =
                      completed
                        ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                        : statusLabel === "Not started"
                          ? "bg-red-500/15 border-red-500/30 text-red-300"
                          : "bg-amber-400/15 border-amber-400/30 text-amber-300";

                    return (
                      <div
                        key={c.id}
                        className="grid grid-cols-5 gap-3 items-center rounded-xl border border-dark-300 bg-[#242424] px-4 py-3"
                      >
                        <div className="min-w-0">
                          <p className="text-light-100 font-semibold leading-tight truncate">{c.name}</p>
                          <p className="text-xs text-light-500 font-mono truncate">{c.id}</p>
                        </div>
                        <p className="text-light-100 font-semibold">{c.trade}</p>
                        <p className="text-light-100 font-semibold">{c.district}</p>
                        <div>
                          <span className="inline-flex items-center justify-center rounded-full bg-[#1f1f1f] border border-dark-300 px-2.5 py-1 text-xs font-semibold text-light-100">
                            {lang}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${dotColor}`} />
                          <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${pill}`}>
                            {statusLabel}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mt-6 flex justify-center">
                  <div className="h-10 w-10 rounded-full border border-dark-300 bg-[#242424] flex items-center justify-center text-light-300">
                    ↓
                  </div>
                </div>
              </div>
          </div>
        </div>
      </div>
    </div>
  );
}
