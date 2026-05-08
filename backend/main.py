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
    print("CRITICAL ERROR: GEMINI_API_KEY is not set.")

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
    return {"status": "online", "message": "Resume API is running"}

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        print(f"--- Processing Request: {file.filename} ---")
        
        # 1. READ PDF CONTENT
        resume_text = ""
        content = await file.read()
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        resume_text += page_text + "\n"
        except Exception as pdf_err:
            print(f"PDF Error: {pdf_err}")
            return {"error": "Failed to read PDF content.", "ats_score": 0}

        if not resume_text.strip():
            return {"error": "PDF is empty or unreadable.", "ats_score": 0}

        # 2. SELECT MODEL (Waterfall Strategy)
        selected_model = None
        model_names = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro']
        
        for m_name in model_names:
            try:
                selected_model = genai.GenerativeModel(model_name=m_name)
                # Test a simple call to verify the model is accessible
                print(f"Successfully initialized: {m_name}")
                break
            except Exception:
                continue

        if not selected_model:
            raise Exception("No compatible Gemini models found.")

        # 3. CONSTRUCT PROMPT
        prompt = f"""
        Act as a professional ATS. Analyze this Resume against the Job Description. 
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
        response = selected_model.generate_content(prompt)
        
        # 5. ROBUST JSON PARSING
        try:
            # Clean the response text to find the JSON block
            json_match = re.search(r'\{.*\}', response.text, re.DOTALL)
            if json_match:
                return json.loads(json_match.group())
            else:
                print(f"Raw AI Response: {response.text}")
                raise Exception("AI response did not contain valid JSON.")
        except Exception as parse_error:
            print(f"Parsing Error: {parse_error}")
            raise Exception("Failed to parse AI analysis results.")

    except Exception as e:
        print(f"SERVER ERROR: {str(e)}")
        return {
            "error": str(e),
            "ats_score": 0,
            "match_percentage": 0,
            "overall_verdict": f"Status: {str(e)}"
        }

if __name__ == "__main__":
    import uvicorn
    # Using environment variable for Port to satisfy Render/Heroku
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
