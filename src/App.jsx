import React, { useState } from "react";
import axios from "axios";

const API_URL = "http://localhost:8000/upload-resume/"; // Change to your Render URL later

function App() {
  const [file, setFile] = useState(null);
  const [jobDesc, setJobDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);

  const handleUpload = async () => {
    if (!file) return alert("Please select a PDF file first.");
    setLoading(true);
    
    const formData = new FormData();
    formData.append("file", file);
    formData.append("job_description", jobDesc);

    try {
      const res = await axios.post(API_URL, formData);
      setData(res.data);
    } catch (err) {
      alert("Error connecting to backend.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0d1117] text-white font-sans p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-500 mb-2">ResumeAI SaaS</h1>
        <p className="text-center text-gray-400 mb-10">Professional ATS Analysis for $0</p>

        {/* Input Section */}
        <div className="bg-[#161b22] p-8 rounded-xl border border-gray-800 shadow-2xl">
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Upload PDF Resume</label>
            <input 
              type="file" accept=".pdf" 
              onChange={(e) => setFile(e.target.files[0])}
              className="w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:bg-blue-600 file:text-white hover:file:bg-blue-700"
            />
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Job Description</label>
            <textarea 
              rows="5" value={jobDesc}
              onChange={(e) => setJobDesc(e.target.value)}
              placeholder="Paste the job requirements here..."
              className="w-full bg-[#0d1117] border border-gray-700 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>

          <button 
            onClick={handleUpload}
            disabled={loading}
            className="w-full bg-blue-600 py-3 rounded-lg font-bold hover:bg-blue-500 transition-all disabled:bg-gray-700"
          >
            {loading ? "AI is Analyzing..." : "Analyze Resume"}
          </button>
        </div>

        {/* Results Section */}
        {data && (
          <div className="mt-10 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-green-500">
                <p className="text-gray-400 text-xs uppercase font-bold">ATS Score</p>
                <h2 className="text-4xl font-bold text-green-400">{data.ats_score}%</h2>
              </div>
              <div className="bg-gray-900 p-6 rounded-xl border-l-4 border-blue-500">
                <p className="text-gray-400 text-xs uppercase font-bold">JD Match</p>
                <h2 className="text-4xl font-bold text-blue-400">{data.match_percentage}%</h2>
              </div>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-yellow-500">Expert Verdict</h3>
              <p className="text-gray-300 leading-relaxed">{data.overall_verdict}</p>
            </div>

            <div className="bg-gray-900 p-6 rounded-xl">
              <h3 className="text-xl font-bold mb-4 text-blue-400">Actionable Suggestions</h3>
              <ul className="list-disc list-inside space-y-2 text-gray-300">
                {data.bullet_point_suggestions.map((s, i) => <li key={i}>{s}</li>)}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
