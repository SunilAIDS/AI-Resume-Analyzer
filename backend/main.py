from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from groq import Groq

app = FastAPI()

# =========================
# GROQ SETUP (SAFE)
# =========================
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    print("❌ WARNING: GROQ_API_KEY not found")
    api_key = "dummy_key"

client = Groq(api_key=api_key)

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

# =========================
# HEALTH CHECK
# =========================
@app.get("/")
def home():
    return {"message": "Backend is running"}

# =========================
# GROQ FUNCTION (SAFE)
# =========================
def get_ai_response(prompt: str):
    try:
        response = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": prompt}
            ]
        )
        return response.choices[0].message.content

    except Exception as e:
        print("❌ GROQ ERROR:", e)
        return "AI service temporarily unavailable."

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
        # PDF EXTRACTION
        # =========================
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted + "\n"

        # LIMIT SIZE (IMPORTANT)
        text = text[:4000]
        job_description = job_description[:2000]

        lower_text = text.lower()
        job_desc_lower = job_description.lower()

        # =========================
        # SKILLS
        # =========================
        skills_db = [
            "python", "react", "sql", "machine learning",
            "tensorflow", "pytorch", "fastapi", "docker",
            "aws", "opencv", "flask", "django", "linux",
            "numpy", "pandas", "scikit learn"
        ]

        detected_skills = [s for s in skills_db if s in lower_text]
        missing_skills = [s for s in skills_db if s not in detected_skills]
        matched_skills = [s for s in detected_skills if s in job_desc_lower]

        ats_score = min(len(detected_skills) * 10, 100)

        match_score = int(
            (len(matched_skills) / len(skills_db)) * 100
        ) if skills_db else 0

        suggestions = [
            f"Consider adding '{s}' to your resume."
            for s in missing_skills
        ]

        # =========================
        # AI PROMPT
        # =========================
        prompt = f"""
You are an ATS Resume Expert.

Analyze resume vs job description.

Return:
- Strengths
- Missing skills
- ATS optimization tips
- Improvements
- Hiring chance %

Resume:
{text}

Job Description:
{job_description}
"""

        ai_feedback = get_ai_response(prompt)

        # =========================
        # RESPONSE
        # =========================
        return {
            "filename": file.filename,
            "resume_text": text,
            "skills": detected_skills,
            "missing_skills": missing_skills,
            "ats_score": ats_score,
            "match_score": match_score,
            "matched_skills": matched_skills,
            "suggestions": suggestions,
            "ai_feedback": ai_feedback
        }

    except Exception as e:
        print("❌ ENDPOINT ERROR:", e)
        return {
            "error": "Failed to process resume",
            "details": str(e)
        }
