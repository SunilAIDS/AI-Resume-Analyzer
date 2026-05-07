import axios from "axios"
import { useState } from "react"

function App() {

  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState("")
  const [jobDesc, setJobDesc] = useState("")
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState("")
  const [result, setResult] = useState(null)

  const handleFile = (e) => {
    const f = e.target.files[0]
    if (f) {
      setFile(f)
      setFileName(f.name)
    }
  }

  const analyze = async () => {

    if (!file) {
      alert("Upload PDF first")
      return
    }

    try {
      setLoading(true)
      setStatus("Uploading...")

      const form = new FormData()
      form.append("file", file)
      form.append("job_description", jobDesc)

      const res = await axios.post(
        "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/",
        form,
        {
          timeout: 120000
        }
      )

      console.log("STATUS:", res.status)
      console.log("DATA:", res.data)

      setResult(res.data)
      setStatus("Done")

    } catch (err) {

      console.log(err)

      if (err.code === "ECONNABORTED") {
        setStatus("Server is slow (Render cold start). Try again.")
      } else {
        setStatus("Backend not responding")
      }

    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>AI Resume Analyzer</h1>

      <input type="file" onChange={handleFile} />

      <textarea
        value={jobDesc}
        onChange={(e) => setJobDesc(e.target.value)}
        placeholder="Job Description"
      />

      <button onClick={analyze} disabled={loading}>
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      <p>{status}</p>

      {result && (
        <div>
          <h3>ATS: {result.ats_score}%</h3>
          <h3>Skills: {result.skills?.join(", ")}</h3>
          <pre>{result.ai_feedback}</pre>
        </div>
      )}
    </div>
  )
}

export default App
