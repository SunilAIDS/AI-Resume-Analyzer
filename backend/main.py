from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from groq import Groq

app = FastAPI()

# =========================
# GROQ SETUP SAFE
# =========================
api_key = os.getenv("GROQ_API_KEY")
client = Groq(api_key=api_key) if api_key else None

# =========================
# CORS
# =========================
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "https://ai-resume-analyzer.vercel.app"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {"status": "ok"}

# =========================
# SAFE AI FUNCTION
# =========================
def get_ai_response(prompt: str):
    if not client:
        return "AI not configured (missing API key)"

    try:
        res = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return res.choices[0].message.content

    except Exception as e:
        print("AI ERROR:", e)
        return "AI temporarily unavailable"

# =========================
# MAIN ENDPOINT (ROBUST)
# =========================
@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    try:
        text = ""

        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                t = page.extract_text()
                if t:
                    text += t + "\n"

        text = text[:4000]

        skills_db = [
            "python","react","sql","fastapi","docker",
            "aws","linux","tensorflow","pytorch",
            "opencv","flask","django","pandas","numpy"
        ]

        lower = text.lower()

        detected = [s for s in skills_db if s in lower]

        ats = min(len(detected) * 12, 100)

        prompt = f"""
Analyze resume for ATS.

Resume:
{text}

Job:
{job_description}

Return short feedback.
"""

        ai_feedback = get_ai_response(prompt)

        return {
            "resume_text": text,
            "skills": detected,
            "ats_score": ats,
            "match_score": ats,
            "matched_skills": detected,
            "suggestions": [],
            "ai_feedback": ai_feedback
        }

    except Exception as e:
        print("BACKEND ERROR:", e)
        return {
            "error": "Backend failed but server is alive",
            "details": str(e)
        }
