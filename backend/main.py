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

# Configure Gemini - Get your FREE key at aistudio.google.com
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel('gemini-1.5-flash')

app = FastAPI()

# CORS configuration for local dev and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        # 1. Extract Text from PDF
        resume_text = ""
        content = await file.read()
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            for page in pdf.pages:
                page_text = page.extract_text()
                if page_text:
                    resume_text += page_text

        if not resume_text:
            return {"error": "Could not extract text. Ensure the PDF is not a scanned image."}

        # 2. AI Prompt
        prompt = f"""
        Act as a professional ATS (Applicant Tracking System) and Career Coach. 
        Analyze the Resume against the Job Description.
        
        JD: {job_description}
        RESUME: {resume_text}
        
        Return ONLY a JSON object with these keys:
        - ats_score: (0-100)
        - match_percentage: (0-100)
        - detected_skills: []
        - missing_skills: []
        - bullet_point_suggestions: ["specific rewordings"]
        - overall_verdict: "2-sentence summary"
        """

        # 3. Get AI Response
        response = model.generate_content(prompt)
        
        # 4. Secure JSON Parsing
        json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
        if json_match:
            return json.loads(json_match.group())
        else:
            raise HTTPException(status_code=500, detail="AI failed to generate valid JSON")

    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
