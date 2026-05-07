from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber
import os
from groq import Groq

app = FastAPI()

# =========================
# ENV SAFETY CHECK
# =========================
api_key = os.getenv("GROQ_API_KEY")

if not api_key:
    raise Exception("❌ GROQ_API_KEY not set in environment variables")

client = Groq(api_key=api_key)

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
# GROQ AI FUNCTION
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
        return "AI service temporarily unavailable. Please try again."

# =========================
# MAIN ENDPOINT
# =========================
@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    text = ""

    # =========================
    # PDF EXTRACTION
    # =========================
    with pdfplumber.open(file.file) as pdf:
        for page in pdf.pages:
            extracted = page.extract_text()
            if extracted:
                text += extracted + "\n"

    # =========================
    # LIMIT TEXT (IMPORTANT FOR SPEED)
    # =========================
    text = text[:4000]
    job_description = job_description[:2000]

    lower_text = text.lower()
    job_desc_lower = job_description.lower()

    # =========================
    # SKILLS DB
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
    # MATCHED SKILLS
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
    ) if skills_db else 0

    # =========================
    # AI PROMPT
    # =========================
    prompt = f"""
You are an ATS Resume Expert.

Analyze the resume vs job description.

Give:
1. Resume strengths
2. Missing skills
3. ATS optimization tips
4. Improvement suggestions
5. Hiring chance (percentage)

Resume:
{text}

Job Description:
{job_description}

Be concise and professional.
"""

    # =========================
    # AI RESPONSE
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
