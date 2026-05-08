import os
import re
import json
import io
import pdfplumber
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

load_dotenv()

# 1. Setup Gemini with strict JSON configuration
api_key = os.getenv("GEMINI_API_KEY")

# LOGGING: Vital for Render troubleshooting
if not api_key:
    print("CRITICAL: GEMINI_API_KEY is missing from environment!")
else:
    print(f"API Key detected (starts with: {api_key[:5]}...)")

genai.configure(api_key=api_key)

model = genai.GenerativeModel(
    model_name='gemini-1.5-flash-latest',
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
        print(f"--- NEW REQUEST RECEIVED: {file.filename} ---")
        
        # --- 1. PDF EXTRACTION ---
        resume_text = ""
        content = await file.read()
        
        with pdfplumber.open(io.BytesIO(content)) as pdf:
            print(f"Processing {len(pdf.pages)} pages...")
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    resume_text += text + "\n"

        print(f"Extracted {len(resume_text)} characters from resume.")

        if not resume_text.strip():
            print("ERROR: PDF extraction returned no text.")
            return {"error": "Could not read PDF. Ensure it is not a scanned image.", "ats_score": 0}

        # --- 2. THE PROMPT ---
        prompt = f"""
        Act as a professional ATS. Analyze this Resume vs the Job Description.
        
        JD: {job_description}
        RESUME: {resume_text}
        
        Return JSON ONLY:
        {{
            "ats_score": number,
            "match_percentage": number,
            "detected_skills": [],
            "missing_skills": [],
            "bullet_point_suggestions": [],
            "overall_verdict": "string"
        }}
        """

        # --- 3. AI GENERATION ---
        print("Sending request to Gemini...")
        response = model.generate_content(prompt)
        print("AI Response received.")
        
        # --- 4. SECURE PARSING ---
        try:
            # First try direct text
            result = json.loads(response.text)
            print("Successfully parsed JSON response.")
            return result
        except Exception:
            # Fallback for Markdown formatting
            print("Standard JSON parse failed, attempting regex cleanup...")
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            
            print(f"FAILED AI TEXT: {response.text}")
            raise Exception("AI response format was invalid.")

    except Exception as e:
        print(f"BACKEND ERROR: {str(e)}")
        # We send the error back in the verdict so you can see it on the website
        return {
            "error": str(e), 
            "ats_score": 0, 
            "match_percentage": 0,
            "overall_verdict": f"Server Error: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
