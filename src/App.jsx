const analyze = async () => {
  if (!file) {
    alert("Upload PDF first")
    return
  }

  try {
    setLoading(true)
    setStatus("Connecting backend... (may take 30s on first load)")

    const form = new FormData()
    form.append("file", file)
    form.append("job_description", jobDesc)

    const res = await axios.post(
      "https://ai-resume-analyzer-x2oz.onrender.com/upload-resume/",
      form,
      {
        timeout: 180000 // IMPORTANT (Render safe)
      }
    )

    console.log("STATUS:", res.status)
    console.log("DATA:", res.data)

    setStatus("Response received")

    setResult(res.data)

  } catch (err) {

    console.log("ERROR:", err)

    if (err.code === "ECONNABORTED") {
      setStatus("Server is waking up (Render cold start). Wait and retry.")
    } 
    else if (err.message.includes("Network Error")) {
      setStatus("Backend is sleeping or not reachable")
    } 
    else {
      setStatus("Request failed")
    }

  } finally {
    setLoading(false)
  }
}
