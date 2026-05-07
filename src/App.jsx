import axios from "axios"
import { useState } from "react"

function App() {

  const [fileName, setFileName] = useState("")
  const [showResult, setShowResult] = useState(false)
  const [loading, setLoading] = useState(false)

  const [resumeText, setResumeText] = useState("")
  const [skills, setSkills] = useState([])

  const [atsScore, setAtsScore] = useState(0)

  const [jobDesc, setJobDesc] = useState("")

  const [matchScore, setMatchScore] = useState(0)
  const [matchedSkills, setMatchedSkills] = useState([])

  const [suggestions, setSuggestions] = useState([])

  const handleFile = (e) => {

    const file = e.target.files[0]

    if (file) {
      setFileName(file.name)
    }

  }

  const analyzeResume = async () => {

    if (!fileName) {

      alert("Please upload a resume first")
      return

    }

    try {

      setLoading(true)

      const fileInput = document.querySelector('input[type="file"]')

      if (!fileInput.files[0]) {

        alert("No file selected")
        setLoading(false)

        return

      }

      const file = fileInput.files[0]

      const formData = new FormData()

      formData.append("file", file)
      formData.append("job_description", jobDesc)

      console.log("Sending request...")

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

      setResumeText(response.data.resume_text)

      setSkills(response.data.skills)

      setAtsScore(response.data.ats_score)

      setMatchScore(response.data.match_score)

      setMatchedSkills(response.data.matched_skills)

      setSuggestions(response.data.suggestions)

      setShowResult(true)

    }

    catch (error) {

      console.log("FULL ERROR:")
      console.log(error)

      if (error.response) {

        console.log(error.response.data)
        console.log(error.response.status)

        alert("Backend Error: " + error.response.status)

      }

      else if (error.request) {

        console.log(error.request)

        alert("No response from backend")

      }

      else {

        console.log(error.message)

        alert(error.message)

      }

    }

    finally {

      setLoading(false)

    }

  }

  return (

    <div className="min-h-screen bg-gray-950 text-white p-6">

      <div className="max-w-5xl mx-auto">

        <h1 className="text-5xl font-bold text-center mt-10">
          AI Resume Analyzer
        </h1>

        <p className="text-center text-gray-400 mt-4">
          Upload your resume and get AI-powered ATS analysis.
        </p>

        <div className="bg-gray-900 p-10 rounded-2xl mt-10 shadow-lg">

          <input
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
            placeholder="Paste Job Description Here..."
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            className="w-full mt-6 p-4 rounded-xl bg-gray-800 text-white border border-gray-700"
            rows="6"
          />

          <button
            onClick={analyzeResume}
            className="mt-6 bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-xl font-semibold"
          >

            Analyze Resume

          </button>

        </div>

        {

          loading && (

            <p className="text-yellow-400 mt-6 text-center text-xl">
              Analyzing Resume...
            </p>

          )

        }

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

              {/* JOB MATCH SCORE */}

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

                    skills.map((skill, index) => (

                      <li key={index}>
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                      </li>

                    ))

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

                    matchedSkills.map((skill, index) => (

                      <li key={index}>
                        {skill.charAt(0).toUpperCase() + skill.slice(1)}
                      </li>

                    ))

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

                    suggestions.map((item, index) => (

                      <li
                        key={index}
                        className="bg-gray-800 p-3 rounded-lg"
                      >
                        {item}
                      </li>

                    ))

                  }

                </ul>

              </div>

              {/* EXTRACTED RESUME TEXT */}

              <div className="bg-gray-900 p-6 rounded-2xl md:col-span-2">

                <h2 className="text-2xl font-bold mb-4">
                  Extracted Resume Text
                </h2>

                <p className="text-gray-300 whitespace-pre-wrap">
                  {resumeText.slice(0, 1500)}
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