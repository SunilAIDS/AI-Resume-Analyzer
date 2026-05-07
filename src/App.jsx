import axios from "axios"
import { useState } from "react"

function App() {

  // =========================
  // STATE
  // =========================
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [jobDesc, setJobDesc] = useState("")

  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [statusMsg, setStatusMsg] = useState("")

  const [result, setResult] = useState({
    resumeText: "",
    skills: [],
    atsScore: 0,
    matchScore: 0,
    matchedSkills: [],
    suggestions: [],
    aiFeedback: ""
  })

  // =========================
  // FILE HANDLER
  // =========================
  const handleFile = (e) => {
    const selected = e.target.files?.[0]
    if (selected) {
      setFile(selected)
      setFileName(selected.name)
    }
  }

  // =========================
  // ANALYZE RESUME
  // =========================
  const analyzeResume = async () => {

    if (!file) {
      alert("Please upload a PDF resume")
      return
    }

    try {
      setLoading(true)
      setShowResult(false)
      setStatusMsg("Uploading resume...")

      const formData = new FormData()
      formData.append("file", file)
      formData.append("job_description", jobDesc)

      setStatusMsg("Analyzing with AI...")

      const response = await axios.post(
        "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          timeout: 120000
        }
      )

      console.log("STATUS:", response.status)
      console.log("RAW DATA:", response.data)

      // =========================
      // SAFE PARSE (IMPORTANT FIX)
      // =========================
      let data = response.data

      if (typeof data === "string") {
        try {
          data = JSON.parse(data)
        } catch (e) {
          setStatusMsg("Invalid backend response")
          alert("Backend did not return valid JSON")
          return
        }
      }

      // =========================
      // EMPTY RESPONSE CHECK
      // =========================
      if (!data || Object.keys(data).length === 0) {
        setStatusMsg("Empty response")
        alert("Backend returned empty response")
        return
      }

      if (response.status !== 200 || data.error) {
        setStatusMsg("Backend error")
        alert(data.error || "Backend error")
        return
      }

      // =========================
      // UPDATE STATE
      // =========================
      setResult({
        resumeText: data.resume_text || "",
        skills: data.skills || [],
        atsScore: data.ats_score || 0,
        matchScore: data.match_score ?? data.matchScore ?? 0,
        matchedSkills: data.matched_skills || [],
        suggestions: data.suggestions || [],
        aiFeedback: data.ai_feedback || ""
      })

      setStatusMsg("Analysis complete")
      setShowResult(true)

    } catch (error) {

      console.log("ERROR:", error)
      setStatusMsg("Request failed")

      if (error.response) {
        alert("Backend Error: " + error.response.status)
      } else if (error.request) {
        alert("No response from backend (network issue)")
      } else {
        alert(error.message)
      }

    } finally {
      setLoading(false)
    }
  }

  // =========================
  // UI
  // =========================
  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="max-w-6xl mx-auto">

        {/* HEADER */}
        <h1 className="text-5xl font-bold text-center mt-10">
          AI Resume Analyzer
        </h1>

        <p className="text-center text-gray-400 mt-4">
          Upload resume and get ATS analysis
        </p>

        {/* INPUT */}
        <div className="bg-gray-900 p-8 rounded-2xl mt-10">

          <input
            type="file"
            accept=".pdf"
            onChange={handleFile}
          />

          {fileName && (
            <p className="text-green-400 mt-3">
              Uploaded: {fileName}
            </p>
          )}

          <textarea
            placeholder="Paste Job Description..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full mt-5 p-4 bg-gray-800 rounded"
            rows="6"
          />

          <button
            onClick={analyzeResume}
            disabled={loading}
            className="mt-5 bg-blue-600 px-6 py-3 rounded"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

          {/* STATUS */}
          {statusMsg && (
            <p className="text-yellow-400 mt-3">
              {statusMsg}
            </p>
          )}

        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center mt-8 text-yellow-400">
            Processing your resume...
          </div>
        )}

        {/* RESULTS */}
        {showResult && (
          <div className="mt-10 grid md:grid-cols-2 gap-6">

            <div className="bg-gray-900 p-5 rounded">
              ATS Score: {result.atsScore}%
            </div>

            <div className="bg-gray-900 p-5 rounded">
              Match Score: {result.matchScore}%
            </div>

            <div className="bg-gray-900 p-5 rounded">
              <h2>Skills</h2>
              {result.skills.length
                ? result.skills.join(", ")
                : "No skills detected"}
            </div>

            <div className="bg-gray-900 p-5 rounded">
              <h2>Matched Skills</h2>
              {result.matchedSkills.length
                ? result.matchedSkills.join(", ")
                : "No matched skills"}
            </div>

            <div className="bg-gray-900 p-5 rounded md:col-span-2">
              <h2 className="text-xl font-bold mb-2">
                AI Feedback
              </h2>
              <pre className="whitespace-pre-wrap text-gray-300">
                {result.aiFeedback}
              </pre>
            </div>

            <div className="bg-gray-900 p-5 rounded md:col-span-2">
              <h2 className="text-xl font-bold mb-2">
                Extracted Resume Text
              </h2>
              <p className="text-gray-300 whitespace-pre-wrap">
                {result.resumeText.slice(0, 2000)}
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  )
}

export default App
