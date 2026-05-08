import os
import json
import google.generativeai as genai
from fastapi import FastAPI, UploadFile, File, Form

# You get this key for FREE from Google AI Studio
genai.configure(api_key="Gemini Key")
model = genai.GenerativeModel('gemini-1.5-flash')

@app.post("/upload-resume/")
async def upload_resume(file: UploadFile = File(...), job_description: str = Form("")):
    # ... (Keep your existing pdfplumber code to get 'text') ...

    # This is the "Magic" Prompt
    prompt = f"""
    You are a professional Career Coach and ATS Specialist. 
    Analyze the following resume against the job description provided.
    
    JOB DESCRIPTION:
    {job_description}
    
    RESUME TEXT:
    {text}
    
    Provide a detailed analysis in JSON format:
    {{
      "ats_score": (integer 0-100),
      "match_percentage": (integer 0-100),
      "detected_skills": ["list", "of", "skills"],
      "missing_skills": ["skills", "to", "add"],
      "bullet_point_suggestions": [
        "Specifically how to reword a bullet point to be more impactful",
        "Another suggestion"
      ],
      "overall_verdict": "A 2-sentence professional summary"
    }}
    """

    response = model.generate_content(prompt)
    
    # We strip any markdown formatting the AI might add
    clean_json = response.text.replace("```json", "").replace("
```", "").strip()
    return json.loads(clean_json)
