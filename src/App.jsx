import React, { useState } from "react";
import axios from "axios";

const API_URL = "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/";

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file first.");
    setLoading(true);
    setData(null);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDesc);

    try {
      const res = await axios.post(API_URL, formData);
      if (res.data) {
        setData(res.data);
      } else {
        throw new Error("No response from AI.");
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.overall_verdict || "Server is warming up. Please wait 60s.";
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score) => {
    if (score >= 75) return "text-emerald-400";
    if (score >= 50) return "text-blue-400";
    return "text-amber-400";
  };

  // Helper to split the verdict into points if it comes back as a big paragraph
  const formatVerdict = (verdict) => {
    if (!verdict) return [];
    // Splits by periods, but keeps the period. Filters out empty strings.
    return verdict.split(/(?<=[.!?])\s+/).filter(sentence => sentence.length > 5);
  };

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-200 font-sans p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        
        {/* HEADER */}
        <header className="flex flex-col items-center mb-10">
          <div className="flex items-center gap-3 mb-2">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
              <path d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z" stroke="#6366f1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="13" r="2.5" fill="#6366f1" />
              <path d="M10.5 14.5L8.5 16.5M13.5 14.5L15.5 16.5" stroke="#6366f1" strokeWidth="1.5"/>
            </svg>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">
              Nexus<span className="text-indigo-500">CV</span>
            </h1>
          </div>
          <p className="text-slate-400 text-sm italic">AI-Powered Semantic ATS Engine</p>
        </header>

        {/* INPUT PANEL */}
        <div className="bg-slate-800/40 backdrop-blur-md p-6 rounded-2xl border border-slate-700/50 shadow-xl">
          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Document Upload</label>
            <input 
              type="file" accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-700 file:text-indigo-300 hover:file:bg-slate-600 transition-all cursor-pointer"
            />
          </div>

          <div className="mb-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-3">Job Requirements</label>
            <textarea 
              rows="5" value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste target Job Description..."
              className="w-full bg-slate-900/50 border border-slate-700 rounded-xl p-4 focus:ring-1 focus:ring-indigo-500 outline-none transition-all text-sm"
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-indigo-600 py-4 rounded-xl font-bold text-white hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-900/20 disabled:opacity-50"
          >
            {loading ? "Initializing Nexus Analysis..." : "Analyze Match"}
          </button>
        </div>

        {/* RESULTS DASHBOARD */}
        {data && (
          <div className="mt-10 space-y-6">
            
            {/* SCORE CARDS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">ATS Score</p>
                <h2 className={`text-5xl font-black ${getScoreColor(data.ats_score)}`}>{data.ats_score}%</h2>
              </div>
              <div className="bg-slate-800/80 p-6 rounded-2xl border border-slate-700 text-center">
                <p className="text-slate-500 text-[10px] uppercase font-black tracking-widest mb-2">Keyword Match</p>
                <h2 className="text-5xl font-black text-indigo-400">{data.match_percentage}%</h2>
              </div>
            </div>

            {/* NEW: SKILLS MATRIX (Green/Red Tags) */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                Nexus Skills Matrix
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Detected Strengths</p>
                  <div className="flex flex-wrap gap-2">
                    {(data.detected_skills || ["Python", "Machine Learning"]).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 uppercase font-bold mb-2">Critical Gaps</p>
                  <div className="flex flex-wrap gap-2">
                    {(data.missing_skills || ["Docker", "Kubernetes"]).map((skill, i) => (
                      <span key={i} className="px-3 py-1 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs rounded-full font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* IMPROVED: EXPERT VERDICT (Point-based) */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold text-white mb-4">Intelligence Verdict</h3>
              <div className="space-y-3">
                {formatVerdict(data.overall_verdict).map((point, i) => (
                  <div key={i} className="flex gap-3 text-sm text-slate-300 leading-relaxed">
                    <span className="text-indigo-500 font-bold shrink-0">•</span>
                    <p>{point}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* OPTIMIZATION ROADMAP */}
            <div className="bg-slate-800/60 p-6 rounded-2xl border border-slate-700">
              <h3 className="text-sm font-bold mb-4 text-white">Actionable Roadmap</h3>
              <ul className="space-y-3">
                {(data.bullet_point_suggestions || []).map((s, i) => (
                  <li key={i} className="flex gap-3 text-sm text-slate-400 group">
                    <span className="text-indigo-500 font-mono text-xs">[{i+1}]</span>
                    <span className="group-hover:text-slate-200 transition-colors">{s}</span>
                  </li>
                ))}
              </ul>
            </div>
            
            <button 
                onClick={() => { setData(null); setFile(null); setJobDesc(""); }}
                className="w-full py-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-600 hover:text-indigo-400 transition-all"
            >
              Clear Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
