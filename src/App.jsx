import axios from "axios"
import { useState } from "react"

function App() {

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")

  const [loading, setLoading] = useState(false)
  const [showResult, setShowResult] = useState(false)

  const [resumeText, setResumeText] = useState("")
  const [skills, setSkills] = useState([])
  const [atsScore, setAtsScore] = useState(0)

  const [jobDesc, setJobDesc] = useState("")

  const [matchScore, setMatchScore] = useState(0)
  const [matchedSkills, setMatchedSkills] = useState([])

  const [suggestions, setSuggestions] = useState([])

  const [aiFeedback, setAiFeedback] = useState("")

  const handleFile = (e) => {

    const selectedFile = e.target.files[0]

    if (selectedFile) {

      setFile(selectedFile)
      setFileName(selectedFile.name)

    }

  }

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

      console.log("Uploading Resume...")

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

      console.log(response.data)

      setResumeText(response.data.resume_text || "")

      setSkills(response.data.skills || [])

      setAtsScore(response.data.ats_score || 0)

      setMatchScore(response.data.match_score || 0)

      setMatchedSkills(response.data.matched_skills || [])

      setSuggestions(response.data.suggestions || [])

      setAiFeedback(response.data.ai_feedback || "")

      setShowResult(true)

    }

    catch (error) {

      console.log("FULL ERROR:")
      console.log(error)

      if (error.response) {

        console.log(error.response.data)

        alert(
          "Backend Error: " +
          error.response.status
        )

      }

      else if (error.request) {

        alert("No response from backend")

      }

      else {

        alert(error.message)

      }

    }

    finally {

      setLoading(false)

    }

  }

  return (

    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="max-w-6xl mx-auto">

        <h1 className="text-5xl font-bold text-center mt-10">
          AI Resume Analyzer
        </h1>

        <p className="text-center text-gray-400 mt-4">
          Upload your resume and get AI-powered ATS analysis
        </p>

        {/* Upload Section */}

        <div className="bg-gray-900 p-10 rounded-2xl mt-10 shadow-lg">

          <input
            id="resume-upload"
            name="resume-upload"
            type="file"
            accept=".pdf"
            onChange={handleFile}
            className="block w-full text-sm text-gray-300"
          />

          {

            fileName && (

              <p className="mt-4 text-green-400">
                Uploaded: {fileName}
              </p>

            )

          }

          <textarea
            id="job-description"
            name="job-description"
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

            {
              loading
              ? "Analyzing..."
              : "Analyze Resume"
            }

          </button>

        </div>

        {/* Loading */}

        {

          loading && (

            <div className="text-center mt-8">

              <p className="text-yellow-400 text-xl">
                AI is analyzing your resume...
              </p>

            </div>

          )

        }

        {/* Results */}

        {

          showResult && (

            <div className="grid md:grid-cols-2 gap-6 mt-10">

              {/* ATS SCORE */}

              <div className="bg-gray-900 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4">
                  ATS Score
                </h2>

                <p className="text-5xl font-bold text-green-400">
                  {atsScore}%
                </p>

              </div>

              {/* MATCH SCORE */}

              <div className="bg-gray-900 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4">
                  Job Match Score
                </h2>

                <p className="text-5xl font-bold text-blue-400">
                  {matchScore}%
                </p>

              </div>

              {/* DETECTED SKILLS */}

              <div className="bg-gray-900 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4">
                  Detected Skills
                </h2>

                <ul className="space-y-2 text-gray-300">

                  {

                    skills.length > 0
                    ? skills.map((skill, index) => (

                      <li key={index}>
                        • {skill}
                      </li>

                    ))

                    : <p>No skills detected</p>

                  }

                </ul>

              </div>

              {/* MATCHED SKILLS */}

              <div className="bg-gray-900 p-6 rounded-2xl">

                <h2 className="text-2xl font-bold mb-4 text-green-400">
                  Matched Skills
                </h2>

                <ul className="space-y-2 text-gray-300">

                  {

                    matchedSkills.length > 0
                    ? matchedSkills.map((skill, index) => (

                      <li key={index}>
                        • {skill}
                      </li>

                    ))

                    : <p>No matched skills found</p>

                  }

                </ul>

              </div>

              {/* AI SUGGESTIONS */}

              <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">

                <h2 className="text-2xl font-bold mb-4 text-yellow-400">
                  AI Suggestions
                </h2>

                <ul className="space-y-3 text-gray-300">

                  {

                    suggestions.length > 0
                    ? suggestions.map((item, index) => (

                      <li
                        key={index}
                        className="bg-gray-800 p-3 rounded-lg"
                      >
                        {item}
                      </li>

                    ))

                    : <p>No suggestions available</p>

                  }

                </ul>

              </div>

              {/* OPENAI AI FEEDBACK */}

              {

                aiFeedback && (

                  <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">

                    <h2 className="text-2xl font-bold mb-4 text-purple-400">
                      AI Career Feedback
                    </h2>

                    <p className="text-gray-300 whitespace-pre-wrap">
                      {aiFeedback}
                    </p>

                  </div>

                )

              }

              {/* RESUME TEXT */}

              <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">

                <h2 className="text-2xl font-bold mb-4">
                  Extracted Resume Text
                </h2>

                <p className="text-gray-300 whitespace-pre-wrap">
                  {resumeText.slice(0, 2000)}
                </p>

              </div>

            </div>

          )

        }

      </div>

    </div>

  )

}

export default App
