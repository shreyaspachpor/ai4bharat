"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const defaultValues = {
  trade: "electrician",
  district: "",
  language: "en",
};

interface CreateInterviewFormProps {
  userId: string;
}

const CreateInterviewForm = ({ userId }: CreateInterviewFormProps) => {
  const router = useRouter();
  const [form, setForm] = useState(defaultValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/vapi/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          userid: userId,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setForm(defaultValues);
        // Refresh the page so the new card appears in "Available Assessments"
        router.refresh();
      } else {
        setError(data.error || "Failed to create assessment.");
      }
    } catch (err) {
      setError("An error occurred.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl mx-auto rounded-2xl overflow-hidden"
      style={{ background: "linear-gradient(to bottom, #1A1C20, #08090D)" }}
    >
      <div className="p-6 border-b border-dark-300">
        <h2 className="text-xl font-bold text-primary-100">Create Trade Skill Assessment</h2>
        <p className="text-sm text-light-400 mt-1">Set up a new AI-led screening for a specific trade</p>
      </div>

      <div className="p-6 flex flex-col gap-5">
        {/* Trade */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-light-100">Trade / Role</label>
          <select
            name="trade"
            value={form.trade}
            onChange={handleChange}
            className="bg-dark-200 text-light-100 rounded-full px-5 py-3 border border-dark-300 focus:border-primary-200 focus:outline-none transition"
          >
            <option value="electrician">⚡ Electrician</option>
            <option value="plumber">🔧 Plumber</option>
            <option value="welder">🔩 Welder</option>
            <option value="mason">🧱 Mason</option>
            <option value="helper">👷 Helper</option>
            <option value="carpenter">🪚 Carpenter</option>
            <option value="painter">🎨 Painter</option>
            <option value="fitter">🔧 Fitter</option>
          </select>
        </div>

        {/* District */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-light-100">District</label>
          <select
            name="district"
            value={form.district}
            onChange={handleChange}
            className="bg-dark-200 text-light-100 rounded-full px-5 py-3 border border-dark-300 focus:border-primary-200 focus:outline-none transition"
          >
            <option value="">Select district...</option>
            <option value="bengaluru-urban">Bengaluru Urban</option>
            <option value="mysuru">Mysuru</option>
            <option value="hubli-dharwad">Hubli-Dharwad</option>
            <option value="mangaluru">Mangaluru</option>
          </select>
        </div>

        {/* Language */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-light-100">Interview Language</label>
          <div className="flex gap-3 mt-1 flex-wrap">
            {[
              { value: "kn", label: "ಕನ್ನಡ", flag: "🇮🇳" },
              { value: "hi", label: "हिन्दी", flag: "🇮🇳" },
              { value: "en", label: "English", flag: "🌐" },
            ].map((lang) => (
              <label
                key={lang.value}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full border cursor-pointer transition-all ${
                  form.language === lang.value
                    ? "border-primary-200 bg-primary-200/10 text-primary-200"
                    : "border-dark-300 text-light-400 hover:border-light-600"
                }`}
              >
                <input
                  type="radio"
                  name="language"
                  value={lang.value}
                  checked={form.language === lang.value}
                  onChange={handleChange}
                  className="hidden"
                />
                <span>{lang.flag}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-200 text-dark-100 font-bold py-3 rounded-full hover:bg-primary-200/80 transition disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Creating...
            </span>
          ) : (
            "Create Assessment"
          )}
        </button>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-2.5 rounded-xl text-sm text-center">
            {error}
          </div>
        )}
      </div>
    </form>
  );
};

export default CreateInterviewForm;