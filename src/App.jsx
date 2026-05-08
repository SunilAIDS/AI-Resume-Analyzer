import React, { useState } from "react";
import axios from "axios";

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  // Replace with your actual deployed URL
  const API_URL = "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/";

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const analyzeResume = async () => {
    if (!file) return alert("Please upload a PDF file.");
    
    setLoading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDesc);

    try {
      const response = await axios.post(API_URL, formData, {
        headers: { "Content-Type": "multipart/form-data" },
        timeout: 30000,
      });
      setResult(response.data);
    } catch (error) {
      console.error("API Error:", error);
      alert(error.response?.data?.error || "Analysis failed. Ensure backend is awake.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white p-4 md:p-10">
      <div className="max-w-4xl mx-auto">
        <header className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-blue-500">AI Resume Analyzer</h1>
          <p className="text-gray-400 mt-2">Optimize your resume for ATS algorithms</p>
        </header>

        <main className="bg-gray-900 border border-gray-800 p-6 rounded-2xl shadow-xl">
          <div className="space-y-6">
            {/* File Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Upload Resume (PDF)</label>
              <input 
                type="file" 
                accept=".pdf" 
                onChange={handleFileChange}
                className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer"
              />
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Job Description</label>
              <textarea
                placeholder="Paste the job requirements here..."
                value={jobDesc}
                onChange={(e) => setJobDesc(e.target.value)}
                className="w-full p-4 rounded-xl bg-gray-800 border border-gray-700 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                rows="5"
              />
            </div>

            <button
              onClick={analyzeResume}
              disabled={loading}
              className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                loading ? "bg-gray-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 shadow-lg shadow-blue-900/20"
              }`}
            >
              {loading ? "Analyzing..." : "Run Analysis"}
            </button>
          </div>
        </main>

        {result && (
          <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in duration-500">
            {/* Stats Cards */}
            <div className="bg-gray-900 p-6 rounded-2xl border border-green-900/30">
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">ATS Profile Strength</h3>
              <p className="text-5xl font-black text-green-400 mt-2">{result.ats_score}%</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-2xl border border-blue-900/30">
              <h3 className="text-gray-400 text-sm font-semibold uppercase tracking-wider">Job Match Rate</h3>
              <p className="text-5xl font-black text-blue-400 mt-2">{result.match_score}%</p>
            </div>

            {/* Suggestions */}
            <div className="md:col-span-2 bg-gray-900 p-6 rounded-2xl border border-yellow-900/20">
              <h3 className="text-yellow-400 font-bold text-xl mb-4">AI Recommendations</h3>
              {result.suggestions.length > 0 ? (
                <ul className="space-y-3">
                  {result.suggestions.map((s, i) => (
                    <li key={i} className="flex items-start gap-3 bg-gray-800/50 p-3 rounded-lg border border-gray-700">
                      <span className="text-yellow-500 mt-1">⚠️</span>
                      <span className="text-gray-300">{s}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-green-400 font-medium">Perfect! Your resume contains all keywords from the job description.</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
