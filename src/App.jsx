import axios from "axios"
import { useState } from "react"

function App() {

  // =========================
  // INPUT STATE
  // =========================
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [jobDesc, setJobDesc] = useState("")

  // =========================
  // UI STATE
  // =========================
  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)

  // =========================
  // RESULT STATE
  // =========================
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
    const selected = e.target.files[0]

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
      alert("Please upload a PDF resume first")
      return
    }

    try {
      setLoading(true)
      setShowResult(false)

      const formData = new FormData()
      formData.append("file", file)
      formData.append("job_description", jobDesc)

      const response = await axios.post(
        "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          timeout: 60000,
        }
      )

      const data = response.data

      // =========================
      // SET ALL RESULTS TOGETHER
      // =========================
      setResult({
        resumeText: data.resume_text || "",
        skills: data.skills || [],
        atsScore: data.ats_score || 0,
        matchScore: data.match_score || 0,
        matchedSkills: data.matched_skills || [],
        suggestions: data.suggestions || [],
        aiFeedback: data.ai_feedback || ""
      })

      setShowResult(true)

    } catch (error) {

      console.log(error)

      if (error.response) {
        alert("Backend Error: " + error.response.status)
      } else if (error.request) {
        alert("No response from backend")
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
          Upload your resume and get AI-powered ATS analysis
        </p>

        {/* INPUT SECTION */}
        <div className="bg-gray-900 p-10 rounded-2xl mt-10 shadow-lg">

          <input
            type="file"
            accept=".pdf"
            onChange={handleFile}
            className="block w-full text-sm text-gray-300"
          />

          {fileName && (
            <p className="mt-4 text-green-400">
              Uploaded: {fileName}
            </p>
          )}

          <textarea
            placeholder="Paste Job Description Here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full mt-6 p-4 rounded-xl bg-gray-800 text-white border border-gray-700"
            rows="6"
          />

          <button
            onClick={analyzeResume}
            disabled={loading}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
          >
            {loading ? "Analyzing..." : "Analyze Resume"}
          </button>

        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center mt-8">
            <p className="text-yellow-400 text-xl">
              AI is analyzing your resume...
            </p>
          </div>
        )}

        {/* RESULTS */}
        {showResult && (
          <div className="grid md:grid-cols-2 gap-6 mt-10">

            {/* ATS SCORE */}
            <div className="bg-gray-900 p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4">ATS Score</h2>
              <p className="text-5xl font-bold text-green-400">
                {result.atsScore}%
              </p>
            </div>

            {/* MATCH SCORE */}
            <div className="bg-gray-900 p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4">Job Match Score</h2>
              <p className="text-5xl font-bold text-blue-400">
                {result.matchScore}%
              </p>
            </div>

            {/* SKILLS */}
            <div className="bg-gray-900 p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4">Detected Skills</h2>

              {result.skills.length > 0 ? (
                <ul className="space-y-2 text-gray-300">
                  {result.skills.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                </ul>
              ) : (
                <p>No skills detected</p>
              )}
            </div>

            {/* MATCHED SKILLS */}
            <div className="bg-gray-900 p-6 rounded-2xl">
              <h2 className="text-2xl font-bold mb-4 text-green-400">
                Matched Skills
              </h2>

              {result.matchedSkills.length > 0 ? (
                <ul className="space-y-2 text-gray-300">
                  {result.matchedSkills.map((skill, i) => (
                    <li key={i}>• {skill}</li>
                  ))}
                </ul>
              ) : (
                <p>No matched skills found</p>
              )}
            </div>

            {/* SUGGESTIONS */}
            <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">
              <h2 className="text-2xl font-bold mb-4 text-yellow-400">
                AI Suggestions
              </h2>

              {result.suggestions.length > 0 ? (
                <ul className="space-y-3 text-gray-300">
                  {result.suggestions.map((item, i) => (
                    <li key={i} className="bg-gray-800 p-3 rounded-lg">
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>No suggestions available</p>
              )}
            </div>

            {/* AI FEEDBACK */}
            {result.aiFeedback && (
              <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">
                <h2 className="text-2xl font-bold mb-4 text-purple-400">
                  AI Career Feedback
                </h2>

                <p className="text-gray-300 whitespace-pre-wrap">
                  {result.aiFeedback}
                </p>
              </div>
            )}

            {/* RESUME TEXT */}
            <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">
              <h2 className="text-2xl font-bold mb-4">
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
