import os
import re
import json
import io
import pdfplumber
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# 1. Setup Gemini with strict JSON configuration
# Make sure GEMINI_API_KEY is set in Render -> Environment
api_key = os.getenv("GEMINI_API_KEY")
if not api_key:
    print("WARNING: GEMINI_API_KEY is not set!")

genai.configure(api_key=api_key)

# We use the generation_config to force JSON mode
model = genai.GenerativeModel(
    model_name='gemini-1.5-flash',
    generation_config={"response_mime_type": "application/json"}
)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health_check():
    return {"status": "online", "message": "Resume API is running"}

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        # --- 1. PDF EXTRACTION ---
        resume_text = ""
        content = await file.read()
        
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    resume_text += text + "\n"

        if not resume_text.strip():
            return {"error": "Could not read PDF. Ensure it is not a scanned image."}

        # --- 2. THE PROMPT ---
        # We define a strict schema so the AI doesn't hallucinate key names
        prompt = f"""
        You are a professional Applicant Tracking System (ATS). 
        Analyze the following Resume against the Job Description.
        
        JOB DESCRIPTION:
        {job_description}
        
        RESUME CONTENT:
        {resume_text}
        
        Return a JSON object with this exact structure:
        {{
            "ats_score": number,
            "match_percentage": number,
            "detected_skills": ["skill1", "skill2"],
            "missing_skills": ["skill1", "skill2"],
            "bullet_point_suggestions": ["suggestion1", "suggestion2"],
            "overall_verdict": "string"
        }}
        """

        # --- 3. AI GENERATION ---
        response = model.generate_content(prompt)
        
        # --- 4. SECURE PARSING ---
        # Since we forced response_mime_type, response.text should be pure JSON
        try:
            result = json.loads(response.text)
            return result
        except json.JSONDecodeError:
            # Fallback to Regex if the model ignored the config
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            raise Exception("AI failed to return valid JSON.")

    except Exception as e:
        print(f"Error occurred: {str(e)}")
        return {"error": str(e), "ats_score": 0, "match_percentage": 0}

if __name__ == "__main__":
    import uvicorn
    # Render uses the PORT environment variable
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
