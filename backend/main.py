import os
import re
import json
import io
import pdfplumber
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Force the SDK to ignore potential environment conflicts
os.environ["GOOGLE_API_USE_MTLS_ENDPOINT"] = "never"

load_dotenv()

# Configure API Key
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key)
    print(f"Server initialized with API Key: {api_key[:5]}...")
else:
    print("CRITICAL ERROR: GEMINI_API_KEY is not set in environment variables.")

app = FastAPI()

# Robust CORS for Vercel and Local testing
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "online", "active_model": "Checking..."}

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        print(f"--- Processing Request: {file.filename} ---")
        
        # 1. READ PDF CONTENT
        resume_text = ""
        content = await file.read()
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    resume_text += page_text + "\n"

        if not resume_text.strip():
            return {"error": "PDF is unreadable. Please upload a text-based PDF.", "ats_score": 0}

        # 2. SELECT MODEL (Waterfall Strategy to avoid 404)
        selected_model = None
        # List of models to try in order of preference
        model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
        
        for m_name in model_names:
            try:
                # We initialize inside the call to ensure the most stable connection
                test_model = genai.GenerativeModel(model_name=m_name)
                selected_model = test_model
                print(f"Using Model: {m_name}")
                break
            except Exception:
                continue

        if not selected_model:
            raise Exception("No compatible Gemini models found on your API track.")

        # 3. CONSTRUCT PROMPT
        prompt = f"""
        Analyze this Resume against the Job Description. 
        Return ONLY a JSON object.
        
        JD: {job_description}
        RESUME: {resume_text}

        JSON Structure:
        {{
            "ats_score": number,
            "match_percentage": number,
            "detected_skills": [],
            "missing_skills": [],
            "bullet_point_suggestions": [],
            "overall_verdict": "string"
        }}
        """

        # 4. GENERATE CONTENT
        # We don't use response_mime_type here to ensure compatibility with older API versions
        response = selected_model.generate_content(prompt)
        
        # 5. ROBUST JSON PARSING
        # This finds the JSON even if the AI wraps it in ```json ...
