"use client";

import { collection, onSnapshot, query, updateDoc, doc } from "firebase/firestore";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { KARNATAKA_DISTRICTS, TRADES } from "@/constants/skillfit";
import { useSkillfitAuth } from "@/components/skillfit/AuthProvider";
import { db } from "@/firebase/client";
import { seedDemoData, deleteInterview } from "@/lib/skillfit";
import type { InterviewRecord } from "@/types/skillfit";

const FITMENTS = [
  "All",
  "Job-ready",
  "Needs training",
  "Requires manual verification",
  "Low confidence / poor quality",
  "Suspected fraud",
];

export default function GovtDashboardPage() {
  const router = useRouter();
  const { profile, loading, logout, user } = useSkillfitAuth();
  const [rows, setRows] = useState<InterviewRecord[]>([]);
  const [search, setSearch] = useState("");
  const [district, setDistrict] = useState("All");
  const [trade, setTrade] = useState("All");
  const [fitment, setFitment] = useState("All");
  const [language, setLanguage] = useState("All");
  const [selected, setSelected] = useState<InterviewRecord | null>(null);

  useEffect(() => {
    if (!loading && profile?.role !== "govt") router.replace("/admin/login");
  }, [loading, profile, router]);

  useEffect(() => {
    const unsub = onSnapshot(query(collection(db, "interviews")), (snap) => {
      setRows(snap.docs.map((d) => ({ id: d.id, ...d.data() })) as InterviewRecord[]);
    });
    return () => unsub();
  }, []);

  const filtered = useMemo(
    () =>
      rows
        .filter((r) => r.candidateName.toLowerCase().includes(search.toLowerCase()))
        .filter((r) => (district === "All" ? true : r.district === district))
        .filter((r) => (trade === "All" ? true : r.trade === trade))
        .filter((r) => (language === "All" ? true : r.language === language))
        .filter((r) => {
          if (fitment === "All") return true;
          if (fitment === "Suspected fraud") return r.status === "flagged";
          return r.fitmentLabel === fitment;
        })
        .sort((a, b) => {
          const tA = (a.createdAt as any)?.seconds || 0;
          const tB = (b.createdAt as any)?.seconds || 0;
          return tB - tA;
        }),
    [rows, search, district, trade, language, fitment]
  );

  const stats = useMemo(() => {
    const total = rows.length;
    const jobReady = rows.filter((r) => r.fitmentLabel === "Job-ready").length;
    const training = rows.filter((r) => r.fitmentLabel === "Needs training").length;
    const manual = rows.filter((r) => r.fitmentLabel === "Requires manual verification").length;
    const flagged = rows.filter((r) => r.fitmentLabel === "Low confidence / poor quality" || r.status === "flagged").length;
    return { total, jobReady, training, manual, flagged };
  }, [rows]);

  const exportCsv = () => {
    const header = "Candidate,Trade,District,Language,Fitment,Relevance,Clarity,SkillConfidence\n";
    const body = filtered
      .map((r) =>
        [r.candidateName, r.trade, r.district, r.language, r.fitmentLabel || "", r.relevanceScore || 0, r.clarityScore || 0, r.skillConfidenceScore || 0].join(",")
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "skillfit-results.csv";
    a.click();
  };

  const setAction = async (row: InterviewRecord, action: "shortlisted" | "training" | "flagged") => {
    if (!row.id) return;
    await updateDoc(doc(db, "interviews", row.id), {
      adminAction: action,
      ...(action === "flagged" ? { status: "flagged" } : {}),
    });
    toast.success(`Updated action: ${action}`);
  };

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

  if (loading || !profile) return <div className="p-6 text-zinc-300">Loading...</div>;

  return (
    <main className="min-h-screen bg-[#101010] text-white p-3 sm:p-5">
      <nav className="mb-4 border border-white/10 rounded-xl px-4 py-3 flex justify-between items-center">
        <div>
          <p className="font-semibold">AI SkillFit - Government Dashboard · Karnataka EDCS</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-zinc-400">District Officer</span>
          <button onClick={logout} className="rounded-md border border-white/20 px-3 py-1.5">Logout</button>
        </div>
      </nav>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
        <Card title="Total interviews" value={stats.total} />
        <Card title="Job-ready" value={stats.jobReady} />
        <Card title="Needs training" value={stats.training} />
        <Card title="Manual verify" value={stats.manual} />
        <Card title="Flagged" value={stats.flagged} />
      </div>

      <div className="mt-3 grid grid-cols-1 md:grid-cols-6 gap-2">
        <input className="rounded bg-black/40 px-3 py-2 text-sm" placeholder="Search candidate" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="rounded bg-black/40 px-3 py-2 text-sm" value={district} onChange={(e) => setDistrict(e.target.value)}><option>All</option>{KARNATAKA_DISTRICTS.map((d) => <option key={d}>{d}</option>)}</select>
        <select className="rounded bg-black/40 px-3 py-2 text-sm" value={trade} onChange={(e) => setTrade(e.target.value)}><option>All</option>{TRADES.map((t) => <option key={t}>{t}</option>)}</select>
        <select className="rounded bg-black/40 px-3 py-2 text-sm" value={fitment} onChange={(e) => setFitment(e.target.value)}>{FITMENTS.map((f) => <option key={f}>{f}</option>)}</select>
        <select className="rounded bg-black/40 px-3 py-2 text-sm" value={language} onChange={(e) => setLanguage(e.target.value)}><option>All</option><option value="kn">Kannada</option><option value="hi">Hindi</option><option value="en">English</option></select>
        <button onClick={exportCsv} className="rounded border border-white/20 px-3 py-2 text-sm">Export CSV</button>
      </div>

      {rows.length === 0 && (
        <button
          onClick={async () => {
            if (!user?.uid) return;
            await seedDemoData(user.uid, "Sewa NGO");
            toast.success("Seeded demo interview data");
          }}
          className="sr-only focus:not-sr-only mt-2 rounded border border-emerald-500 px-3 py-2 text-xs"
        >
          Seed demo data
        </button>
      )}

      <div className="mt-3 overflow-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="text-zinc-400 bg-white/5">
            <tr>
              <th className="text-left p-2">Candidate</th><th className="text-left p-2">Trade</th><th className="text-left p-2">District</th><th className="text-left p-2">Status</th><th className="text-left p-2">Fitment</th><th className="text-left p-2">Scores (R/C/S)</th><th className="text-left p-2">Avg %</th><th className="text-left p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((r) => {
              const avg = Math.round(((r.relevanceScore || 0) + (r.clarityScore || 0) + (r.skillConfidenceScore || 0)) / 3);
              return (
                <tr key={r.id} className="border-t border-white/10">
                  <td className="p-2">{r.candidateName}<div className="text-xs text-zinc-500">{r.district}</div></td>
                  <td className="p-2">{r.trade}</td>
                  <td className="p-2">{r.district}</td>
                  <td className="p-2">
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                      r.status === 'completed' ? 'bg-emerald-500/20 text-emerald-300' :
                      r.status === 'flagged' ? 'bg-red-500/20 text-red-300' :
                      r.status === 'link_sent' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-zinc-500/20 text-zinc-300'
                    }`}>
                      {r.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="p-2">
                    {r.fitmentLabel ? (
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        r.fitmentLabel === 'Job-ready' ? 'bg-emerald-500/20 text-emerald-300' :
                        r.fitmentLabel === 'Needs training' ? 'bg-amber-500/20 text-amber-300' :
                        'bg-red-500/20 text-red-300'
                      }`}>
                        {r.fitmentLabel}
                      </span>
                    ) : "-"}
                  </td>
                  <td className="p-2">{r.relevanceScore || 0}/{r.clarityScore || 0}/{r.skillConfidenceScore || 0}</td>
                  <td className="p-2">
                    <div>{avg}%</div>
                    <div className="h-1.5 rounded bg-white/10"><div className="h-1.5 rounded bg-emerald-500" style={{ width: `${avg}%` }} /></div>
                  </td>
                  <td className="p-2 space-x-2">
                    <button onClick={() => setAction(r, "shortlisted")} className="text-emerald-300 hover:underline">Shortlist</button>
                    <button onClick={() => setAction(r, "training")} className="text-amber-300 hover:underline">Training</button>
                    <button onClick={() => setSelected(r)} className="text-blue-300 hover:underline">View</button>
                    <button onClick={() => handleDelete(r)} className="text-red-400 hover:underline">Delete</button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="fixed inset-0 bg-black/75 p-4 flex items-center justify-center" onClick={() => setSelected(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-white/15 bg-[#1d1d1d] p-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold">{selected.candidateName} - {selected.trade}</h3>
            <p className="text-sm text-zinc-400">{selected.district}</p>
            <div className="grid grid-cols-3 gap-2 mt-3">
              <Card title="Relevance" value={selected.relevanceScore || 0} />
              <Card title="Clarity" value={selected.clarityScore || 0} />
              <Card title="Skill confidence" value={selected.skillConfidenceScore || 0} />
            </div>
            <p className="mt-3 text-sm">{selected.aiSummary || "No AI summary available."}</p>
            <div className="mt-3 text-xs text-zinc-400">Face verified {selected.faceVerified ? "✓" : "✗"} | No duplicate ✓ | Recording {selected.videoUrl ? "available" : "not available"}</div>
            <div className="mt-4 space-x-2">
              <button onClick={() => setAction(selected, "shortlisted")} className="rounded bg-emerald-600 px-3 py-1.5 text-sm">Shortlist for job</button>
              <button onClick={() => setAction(selected, "training")} className="rounded bg-amber-600 px-3 py-1.5 text-sm">Send to training</button>
              <button onClick={() => setAction(selected, "flagged")} className="rounded bg-red-700 px-3 py-1.5 text-sm">Flag for review</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function Card({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/5 p-3">
      <p className="text-xl font-semibold">{value}</p>
      <p className="text-xs text-zinc-400">{title}</p>
    </div>
  );
}
