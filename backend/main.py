from openai iport OpenAI
import os
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

app = FastAPI()
client = OpenAI(
    api_key=os.getenv("OPENAI_API_KEY")
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def home():
    return {
        "message": "Backend is running"
    }


@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):

    text = ""

    # Extract text from PDF
    with pdfplumber.open(file.file) as pdf:

        for page in pdf.pages:

            extracted = page.extract_text()

            if extracted:
                text += extracted

    # Convert to lowercase
    lower_text = text.lower()
    job_desc_lower = job_description.lower()
    ai_response = client.chat.completions.create(
    model="gpt-4.1-mini",
    messages=[
        {
            "role": "system",
            "content": "You are a professional ATS resume analyzer."
        },
        {
            "role": "user",
            "content": f"""
            Analyze this resume.

            Resume:
            {text}

            Job Description:
            {job_description}

            Provide:
            1. ATS score out of 100
            2. Resume strengths
            3. Weaknesses
            4. Missing skills
            5. Suggestions for improvement
            6. Job match analysis
            """
        }
    ]
)

ai_feedback = ai_response.choices[0].message.content

    # Skills Database
    skills_db = [
        "python",
        "react",
        "sql",
        "machine learning",
        "tensorflow",
        "pytorch",
        "fastapi",
        "docker",
        "aws",
        "opencv",
        "flask",
        "django",
        "linux",
        "numpy",
        "pandas",
        "scikit learn"
    ]

    # Detect Resume Skills
    detected_skills = []

    for skill in skills_db:

        if skill in lower_text:
            detected_skills.append(skill)

    # ATS Score Logic
    ats_score = len(detected_skills) * 10

    if ats_score > 100:
        ats_score = 100

    # Missing Skills
    missing_skills = []

    for skill in skills_db:

        if skill not in detected_skills:
            missing_skills.append(skill)

    # Job Description Matching
    matched_skills = []
    suggestions = []

    for skill in detected_skills:

        if skill in job_desc_lower:
            matched_skills.append(skill)
            
    for skill in missing_skills:
        suggestions.append(f"Consider adding '{skill}' to your resume to better match the job description.")
        

    # Match Score
    if len(skills_db) > 0:

        match_score = int(
            (len(matched_skills) / len(skills_db)) * 100
        )

    else:
        match_score = 0

    # Final Response
    return {

        "filename": file.filename,

        "resume_text": text,

        "skills": detected_skills,

        "missing_skills": missing_skills,

        "ats_score": ats_score,

        "match_score": match_score,

        "matched_skills": matched_skills,
        
        "suggestions": suggestions

        "ai_feedback" : ai_feedback

    }
