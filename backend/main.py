import os
import json
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from dotenv import load_dotenv

load_dotenv()

# Configure Gemini
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

@app.post("/analyze")
async def analyze_resume_ai(file: UploadFile = File(...), job_desc: str = Form("")):
    # 1. Extract Text
    # (Use your existing pdfplumber logic here to get 'resume_text')
    
    # 2. Craft the Professional Prompt
    prompt = f"""
    Act as an expert ATS (Applicant Tracking System) and Career Coach.
    Analyze the following Resume against the Job Description.
    
    Job Description: {job_desc}
    Resume Text: {resume_text}
    
    Provide the response in strict JSON format with these keys:
    - ats_score: (0-100)
    - match_score: (0-100)
    - missing_keywords: [list]
    - profile_summary: "Short critique"
    - actionable_suggestions: ["Reword X to Y", "Add metric to Z"]
    """

    # 3. Get AI Response
    response = model.generate_content(prompt)
    
    # Clean and parse the JSON response
    try:
        data = json.loads(response.text.replace("```json", "").replace("
```", ""))
        return data
    except:
        return {"error": "AI response parsing failed"}
