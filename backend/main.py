from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from groq import Groq

app = FastAPI()

# ✅ Groq client (use environment variable for security)
client = Groq(api_key=os.getenv("GROQ_API_KEY"))

# =========================
# CORS CONFIG
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
# HOME ROUTE
# =========================
@app.get("/")
def home():
    return {"message": "Backend is running"}

# =========================
# AI FUNCTION (GROQ)
# =========================
def get_ai_response(prompt: str):
    response = client.chat.completions.create(
        model="llama-3.1-70b-versatile",
        messages=[
            {"role": "user", "content": prompt}
        ]
    )
    return response.choices[0].message.content

# =========================
# MAIN UPLOAD ENDPOINT
# =========================
@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    text = ""

    # =========================
    # PDF TEXT EXTRACTION
    # =========================
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    lower_text = text.lower()
    job_desc_lower = job_description.lower()

    # =========================
    # SKILLS DATABASE
    # =========================
    skills_db = [
        "python", "react", "sql", "machine learning",
        "tensorflow", "pytorch", "fastapi", "docker",
        "aws", "opencv", "flask", "django", "linux",
        "numpy", "pandas", "scikit learn"
    ]

    # =========================
    # DETECTED SKILLS
    # =========================
    detected_skills = [
        skill for skill in skills_db if skill in lower_text
    ]

    # =========================
    # ATS SCORE
    # =========================
    ats_score = min(len(detected_skills) * 10, 100)

    # =========================
    # MISSING SKILLS
    # =========================
    missing_skills = [
        skill for skill in skills_db if skill not in detected_skills
    ]

    # =========================
    # MATCHED SKILLS (JOB DESC)
    # =========================
    matched_skills = [
        skill for skill in detected_skills if skill in job_desc_lower
    ]

    # =========================
    # SUGGESTIONS
    # =========================
    suggestions = [
        f"Consider adding '{skill}' to your resume."
        for skill in missing_skills
    ]

    # =========================
    # MATCH SCORE
    # =========================
    match_score = int(
        (len(matched_skills) / len(skills_db)) * 100
    ) if len(skills_db) > 0 else 0

    # =========================
    # GROQ AI PROMPT
    # =========================
    prompt = f"""
You are an ATS Resume Expert.

Analyze the resume against the job description.

Return:
1. Resume strengths
2. Missing skills
3. ATS optimization tips
4. Resume improvement suggestions
5. Final hiring chance (percentage)

Resume:
{text}

Job Description:
{job_description}

Keep it short, clear, and professional.
"""

    # =========================
    # AI RESPONSE (GROQ)
    # =========================
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
