import re
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
import pdfplumber

app = FastAPI()

# Updated CORS for production/development flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Robust skill list
SKILLS_DB = [
    "python", "react", "sql", "machine learning", "tensorflow", "pytorch",
    "fastapi", "docker", "aws", "opencv", "flask", "django", "linux",
    "numpy", "pandas", "scikit learn", "javascript", "typescript", "mongodb"
]

@app.get("/")
def home():
    return {"status": "online", "message": "AI Resume Analyzer API"}

@app.post("/upload-resume/")
async def upload_resume(
    file: UploadFile = File(...),
    job_description: str = Form("")
):
    text = ""
    try:
        with pdfplumber.open(file.file) as pdf:
            for page in pdf.pages:
                extracted = page.extract_text()
                if extracted:
                    text += extracted
    except Exception as e:
        return {"error": f"Failed to parse PDF: {str(e)}"}

    lower_text = text.lower()
    job_desc_lower = job_description.lower()

    # Use Regex with word boundaries (\b) for precise matching
    detected_skills = [s for s in SKILLS_DB if re.search(rf"\b{s}\b", lower_text)]
    
    # Identify skills specifically requested in the Job Description
    required_skills = [s for s in SKILLS_DB if re.search(rf"\b{s}\b", job_desc_lower)]

    # Matching Logic
    # 1. Matched: Skills in both Resume AND JD
    matched_skills = [s for s in detected_skills if s in required_skills]
    
    # 2. Missing: Skills in JD but NOT in Resume
    missing_skills = [s for s in required_skills if s not in detected_skills]

    # ATS Score: General profile strength based on skill count
    ats_score = min(len(detected_skills) * 10, 100)

    # Match Score: Percentage of JD skills covered by user
    match_score = int((len(matched_skills) / len(required_skills) * 100)) if required_skills else 0

    suggestions = [
        f"The job requires '{s.upper()}', but it wasn't found in your resume." 
        for s in missing_skills
    ]

    return {
        "filename": file.filename,
        "resume_text": text[:1500], # Preview of extracted text
        "skills": detected_skills,
        "ats_score": ats_score,
        "match_score": match_score,
        "matched_skills": matched_skills,
        "suggestions": suggestions
    }
