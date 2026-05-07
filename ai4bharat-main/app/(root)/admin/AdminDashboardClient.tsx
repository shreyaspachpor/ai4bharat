"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { seededCandidates } from "@/constants";

const districts = ["All", "Bengaluru Urban", "Mysuru", "Hubli-Dharwad", "Mangaluru"];
const trades = ["All", "Electrician", "Plumber", "Welder", "Mason", "Helper", "Carpenter"];
const languages = ["All", "kn", "hi", "en"];
const fitmentLabels = ["All", "Job-ready", "Needs training", "Requires manual verification", "Low confidence / poor quality"];

const languageNames: Record<string, string> = {
  kn: "ಕನ್ನಡ",
  hi: "हिन्दी",
  en: "English",
};

const fitmentColors: Record<string, string> = {
  "Job-ready": "bg-green-600 text-white",
  "Needs training": "bg-amber-500 text-black",
  "Requires manual verification": "bg-blue-600 text-white",
  "Low confidence / poor quality": "bg-red-600 text-white",
};

export default function AdminDashboardClient() {
  const [districtFilter, setDistrictFilter] = useState("All");
  const [tradeFilter, setTradeFilter] = useState("All");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [fitmentFilter, setFitmentFilter] = useState("All");
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false);

  const filtered = useMemo(() => {
    return seededCandidates.filter((c) => {
      if (districtFilter !== "All" && c.district !== districtFilter) return false;
      if (tradeFilter !== "All" && c.trade !== tradeFilter) return false;
      if (languageFilter !== "All" && c.language !== languageFilter) return false;
      if (fitmentFilter !== "All" && c.fitmentLabel !== fitmentFilter) return false;
      if (showFlaggedOnly && !c.flagged) return false;
      return true;
    });
  }, [districtFilter, tradeFilter, languageFilter, fitmentFilter, showFlaggedOnly]);

  const stats = useMemo(() => {
    const total = seededCandidates.length;
    const jobReady = seededCandidates.filter((c) => c.fitmentLabel === "Job-ready").length;
    const needsTraining = seededCandidates.filter((c) => c.fitmentLabel === "Needs training").length;
    const flagged = seededCandidates.filter((c) => c.flagged).length;
    return { total, jobReady, needsTraining, flagged };
  }, []);

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold text-primary-100">Admin Dashboard</h1>
          <p className="text-light-400 mt-1">AI SkillFit — Workforce Screening Overview</p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/admin/add-candidate"
            className="bg-primary-200 text-dark-100 px-5 py-2.5 rounded-full font-bold hover:bg-primary-200/80 transition text-sm flex items-center gap-2 shadow-lg shadow-primary-200/20"
          >
            <span className="text-lg leading-none">+</span> Register New Candidate
          </Link>
          <Link
            href="/"
            className="bg-dark-200 text-primary-200 px-5 py-2.5 rounded-full font-semibold hover:bg-dark-300 transition text-sm flex items-center"
          >
            ← Back to Home
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="rounded-2xl p-5 border border-dark-300" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
          <p className="text-light-400 text-sm">Total Screened</p>
          <p className="text-3xl font-bold text-primary-100 mt-1">{stats.total}</p>
        </div>
        <div className="rounded-2xl p-5 border border-green-500/30" style={{ background: "linear-gradient(to bottom, #0f2a1a, #08090D)" }}>
          <p className="text-green-400 text-sm">Job-Ready</p>
          <p className="text-3xl font-bold text-green-400 mt-1">{stats.jobReady}</p>
        </div>
        <div className="rounded-2xl p-5 border border-amber-500/30" style={{ background: "linear-gradient(to bottom, #2a1f0f, #08090D)" }}>
          <p className="text-amber-400 text-sm">Needs Training</p>
          <p className="text-3xl font-bold text-amber-400 mt-1">{stats.needsTraining}</p>
        </div>
        <div className="rounded-2xl p-5 border border-red-500/30" style={{ background: "linear-gradient(to bottom, #2a0f0f, #08090D)" }}>
          <p className="text-red-400 text-sm">⚠ Flagged</p>
          <p className="text-3xl font-bold text-red-400 mt-1">{stats.flagged}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="rounded-2xl p-5 border border-dark-300 mb-6" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
        <p className="text-sm font-semibold text-light-100 mb-3">Filters</p>
        <div className="flex flex-wrap gap-3">
          <select value={districtFilter} onChange={(e) => setDistrictFilter(e.target.value)} className="bg-dark-200 text-light-100 rounded-full px-4 py-2 text-sm border border-dark-300 focus:border-primary-200 focus:outline-none">
            {districts.map((d) => (<option key={d} value={d}>{d === "All" ? "All Districts" : d}</option>))}
          </select>
          <select value={tradeFilter} onChange={(e) => setTradeFilter(e.target.value)} className="bg-dark-200 text-light-100 rounded-full px-4 py-2 text-sm border border-dark-300 focus:border-primary-200 focus:outline-none">
            {trades.map((t) => (<option key={t} value={t}>{t === "All" ? "All Trades" : t}</option>))}
          </select>
          <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} className="bg-dark-200 text-light-100 rounded-full px-4 py-2 text-sm border border-dark-300 focus:border-primary-200 focus:outline-none">
            {languages.map((l) => (<option key={l} value={l}>{l === "All" ? "All Languages" : languageNames[l] || l}</option>))}
          </select>
          <select value={fitmentFilter} onChange={(e) => setFitmentFilter(e.target.value)} className="bg-dark-200 text-light-100 rounded-full px-4 py-2 text-sm border border-dark-300 focus:border-primary-200 focus:outline-none">
            {fitmentLabels.map((f) => (<option key={f} value={f}>{f === "All" ? "All Categories" : f}</option>))}
          </select>
          <button onClick={() => setShowFlaggedOnly(!showFlaggedOnly)} className={`px-4 py-2 rounded-full text-sm font-semibold border transition ${showFlaggedOnly ? "bg-red-600 text-white border-red-600" : "bg-dark-200 text-light-400 border-dark-300 hover:border-red-500"}`}>
            ⚠ Flagged Only
          </button>
        </div>
      </div>

      {/* Candidate Table */}
      <div className="rounded-2xl border border-dark-300 overflow-hidden" style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}>
        <div className="p-5 border-b border-dark-300">
          <p className="text-sm font-semibold text-light-100">Showing {filtered.length} of {seededCandidates.length} candidates</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-300">
                <th className="text-left px-5 py-3 text-light-400 font-semibold">ID</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Name</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">District</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Trade</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Language</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Relevance</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Clarity</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Confidence</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Fitment</th>
                <th className="text-left px-5 py-3 text-light-400 font-semibold">Flag</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id} className="border-b border-dark-300/50 hover:bg-dark-200/50 transition">
                  <td className="px-5 py-3 text-light-400 font-mono text-xs">{c.id}</td>
                  <td className="px-5 py-3 text-light-100 font-medium">{c.name}</td>
                  <td className="px-5 py-3 text-light-400">{c.district}</td>
                  <td className="px-5 py-3 text-light-400">{c.trade}</td>
                  <td className="px-5 py-3 text-light-400">{languageNames[c.language] || c.language}</td>
                  <td className="px-5 py-3"><span className={`font-semibold ${c.relevance >= 70 ? "text-green-400" : c.relevance >= 40 ? "text-amber-400" : "text-red-400"}`}>{c.relevance}</span></td>
                  <td className="px-5 py-3"><span className={`font-semibold ${c.clarity >= 70 ? "text-green-400" : c.clarity >= 40 ? "text-amber-400" : "text-red-400"}`}>{c.clarity}</span></td>
                  <td className="px-5 py-3"><span className={`font-semibold ${c.skillConfidence >= 70 ? "text-green-400" : c.skillConfidence >= 40 ? "text-amber-400" : "text-red-400"}`}>{c.skillConfidence}</span></td>
                  <td className="px-5 py-3"><span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${fitmentColors[c.fitmentLabel] || "bg-gray-600 text-white"}`}>{c.fitmentLabel}</span></td>
                  <td className="px-5 py-3 text-center">{c.flagged ? <span className="text-red-400 text-lg" title="Flagged for review">⚠</span> : <span className="text-green-400 text-sm">✓</span>}</td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-10 text-center text-light-400">No candidates match the current filters.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Flagged Cases */}
      {seededCandidates.filter((c) => c.flagged).length > 0 && (
        <div className="mt-8 rounded-2xl p-5 border border-red-500/30" style={{ background: "linear-gradient(to bottom, #1a0f0f, #08090D)" }}>
          <h3 className="text-lg font-bold text-red-400 mb-4">⚠ Flagged Cases — Requires Manual Review</h3>
          <div className="flex flex-col gap-3">
            {seededCandidates.filter((c) => c.flagged).map((c) => (
              <div key={c.id} className="flex items-center justify-between bg-dark-200/60 rounded-xl px-5 py-3 border border-red-500/20">
                <div>
                  <p className="text-light-100 font-medium">{c.name} <span className="text-light-400 text-sm">({c.id})</span></p>
                  <p className="text-light-400 text-sm">{c.trade} · {c.district} · {languageNames[c.language]}</p>
                </div>
                <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${fitmentColors[c.fitmentLabel]}`}>{c.fitmentLabel}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-8 text-center text-light-400 text-sm pb-8">
        <p>AI SkillFit Dashboard · Directorate of EDCS, Government of Karnataka</p>
        <p className="mt-1 text-xs">Data shown is for prototype demonstration purposes.</p>
      </div>
    </div>
  );
}
