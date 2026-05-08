from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from groq import Groq

app = FastAPI()

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
# GROQ INIT (SAFE LAZY LOAD)
# =========================
def get_client():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    return Groq(api_key=api_key)

# =========================
# AI FUNCTION (SAFE + FAST FAIL)
# =========================
def get_ai_response(prompt: str):
    client = get_client()

    if not client:
        return "AI not configured"

    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3
        )
        return response.choices[0].message.content

    except Exception as e:
        print("AI ERROR:", e)
        return "AI temporarily unavailable"

# =========================
# MAIN API
# =========================
@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    try:
        text = ""

        # =========================
        # SAFE PDF READ
        # =========================
        try:
            with pdfplumber.open(file.file) as pdf:
                for page in pdf.pages:
                    t = page.extract_text()
                    if t:
                        text += t + "\n"
        except Exception:
            return {"error": "Invalid or unreadable PDF"}

        text = text[:3500]

        # =========================
        # SKILLS
        # =========================
        skills_db = [
            "python","react","sql","fastapi","docker",
            "aws","linux","tensorflow","pytorch",
            "opencv","flask","django","pandas","numpy"
        ]

        lower = text.lower()
        detected = [s for s in skills_db if s in lower]

        ats = min(len(detected) * 10, 100)

        # =========================
        # SAFE AI PROMPT
        # =========================
        prompt = f"""
You are an ATS expert.

Resume:
{text[:2000]}

Job:
{job_description}

Give short feedback only.
"""

        ai_feedback = get_ai_response(prompt)

        # =========================
        # ALWAYS RETURN RESPONSE
        # =========================
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
        print("BACKEND CRASH:", e)

        # NEVER FAIL SILENTLY
        return {
            "error": "Backend error but server alive",
            "details": str(e)
        }
