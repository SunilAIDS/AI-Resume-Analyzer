import os
import re
import json
import io
import pdfplumber
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

# Essential for cloud deployments like Render to avoid 404/v1beta issues
os.environ["GOOGLE_API_USE_MTLS_ENDPOINT"] = "never"

load_dotenv()

# Configure API Key with REST transport for better 2026 compatibility
api_key = os.getenv("GEMINI_API_KEY")
if api_key:
    genai.configure(api_key=api_key, transport='rest')
    print(f"Backend ready with Key: {api_key[:5]}...")
else:
    print("CRITICAL: GEMINI_API_KEY is missing!")

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def health():
    return {"status": "online", "engine": "Gemini 2026 API"}

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    try:
        print(f"--- Incoming Request: {file.filename} ---")
        
        # 1. READ PDF CONTENT
        resume_text = ""
        content = await file.read()
        try:
            with pdfplumber.open(io.BytesIO(content)) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        resume_text += text + "\n"
        except Exception as e:
            return {"error": f"PDF Parse Error: {str(e)}", "ats_score": 0}

        if not resume_text.strip():
            return {"error": "Could not extract text from PDF.", "ats_score": 0}

        # 2. SELECT MODEL (Waterfall Strategy)
        selected_model = None
        # Try 2.5-flash (2026 model) then fall back to 1.5 series
        model_options = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-pro']
        
        for m_name in model_options:
            try:
                test_model = genai.GenerativeModel(model_name=m_name)
                # Attempt a tiny test call to confirm 404 is gone
                test_model.generate_content("test", generation_config={"max_output_tokens": 1})
                selected_model = test_model
                print(f"Model connected: {m_name}")
                break
            except Exception as e:
                print(f"Attempt for {m_name} failed: {str(e)}")
                continue

        if not selected_model:
            raise Exception("All Gemini models returned 404 or were unavailable.")

        # 3. ANALYSIS PROMPT
        prompt = f"""
        Act as a professional ATS. Analyze the Resume vs Job Description.
        Return ONLY valid JSON.
        
        JD: {job_description}
        RESUME: {resume_text}

        JSON Structure:
        {{
            "ats_score": 0-100,
            "match_percentage": 0-100,
            "detected_skills": [],
            "missing_skills": [],
            "bullet_point_suggestions": [],
            "overall_verdict": "Your professional analysis"
        }}
        """

        # 4. GENERATION
        response = selected_model.generate_content(prompt)
        
        # 5. PARSE JSON
        try:
            json_str = re.search(r'\{.*\}', response.text, re.DOTALL).group()
            return json.loads(json_str)
        except Exception:
            print(f"Failed to parse AI output: {response.text}")
            raise Exception("AI output format error.")

    except Exception as e:
        error_msg = str(e)
        print(f"FINAL BACKEND ERROR: {error_msg}")

        if "429" in error_msg:
            friendly_error = "Server Is Busy (Rate Limit). Please Wait For An Minute Before Trying Again."
        elif "404" in error_msg:
            friendly_error = "AI Model Not Found. Check API Configuration"
        else:
            friendly_error = f"System Alert: {error_msg}"
            
        return {
            "error": error_msg,
            "ats_score": 0,
            "match_percentage" : 0,
            "overall_verdict" : friendly_error
        }

if __name__ == "__main__":
    import uvicorn
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
