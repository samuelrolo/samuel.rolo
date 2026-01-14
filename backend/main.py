import os
import json
import functions_framework
import google.generativeai as genai
from pypdf import PdfReader
from io import BytesIO
from flask import jsonify
from datetime import datetime

# Configure Gemini API
# key should be set in environment variables for security
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

# Supabase Configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://cvlumvgrbuolrnwrtrgz.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN2bHVtdmdyYnVvbHJud3J0cmd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzNjQyNzMsImV4cCI6MjA4Mzk0MDI3M30.DAowq1KK84KDJEvHL-0ztb-zN6jyeC1qVLLDMpTaRLM")
DOMAIN = os.environ.get("DOMAIN", "share2inspire.pt")
ASSISTANT_EMAIL = os.environ.get("ASSISTANT_EMAIL", "samuel.rolo@share2inspire.pt")

def is_valid_cv(text):
    """Validate if text content looks like a CV/resume"""
    if not text or len(text) < 200:
        return False
    
    text_lower = text.lower()
    
    # Keywords that typically appear in CVs (Portuguese and English)
    cv_keywords = [
        'experience', 'education', 'skills', 'work', 'employment',
        'universidade', 'licenciatura', 'mestrado', 'doutoramento',
        'experiência', 'formação', 'competências', 'habilidades',
        'email', 'telefone', 'phone', 'contact', 'contacto',
        'curriculum', 'currículo', 'resume', 'cv',
        'professional', 'profissional', 'career', 'carreira'
    ]
    
    # Count how many CV-related keywords are present
    keyword_count = sum(1 for keyword in cv_keywords if keyword in text_lower)
    
    # Require at least 3 CV-related keywords to consider it a valid CV
    return keyword_count >= 3

def analyze_text_with_gemini(text):
    if not GENAI_API_KEY:
        return {
            "score": 0,
            "summary": "API Key not configured.",
            "strengths": ["System error"],
            "improvements": ["Please configure the GEMINI_API_KEY environment variable."],
            "training_relevance": {
                "score": 0,
                "assessment": "API key not configured",
                "aligned_courses": [],
                "recommended_courses": []
            }
        }

    try:
        model = genai.GenerativeModel('gemini-pro')
        
        prompt = f"""
        You are an expert HR consultant and CV reviewer. Analyze the following CV text.
        
        CV TEXT:
        {text[:10000]} 
        
        Provide a structured analysis in JSON format with the following keys:
        - score: A number from 0-100 based on overall quality, keyword relevance, and formatting.
        - summary: A brief 2-sentence summary of the candidate's profile.
        - strengths: A list of 3 key strengths found in the CV (e.g., "Clear career progression", "Strong technical skills").
        - improvements: A list of 3-4 specific, actionable improvements (e.g., "Quantify achievements in the Sales Manager role", "Add a dedicated Skills section").
        - training_relevance: An object with:
          * score: Number 0-100 indicating how relevant the candidate's training/certifications are to their professional area
          * assessment: Brief 1-2 sentence analysis of training alignment (in Portuguese)
          * aligned_courses: List of 2-4 courses/certifications that are highly relevant to the candidate's area (if found)
          * recommended_courses: List of 2-3 suggested courses that would strengthen the profile for this area
        
        For training_relevance analysis:
        - First identify the candidate's main professional area (HR, Tech, Finance, Management, etc.)
        - Then evaluate if certifications/courses align with that area
        - Score higher if courses are recent, specialized, and directly applicable
        - Provide Portuguese names for recommended courses
        
        Do not output markdown code blocks. Output ONLY raw JSON.
        """
        
        response = model.generate_content(prompt)
        content = response.text
        
        # Clean up if the model returns markdown '```json ... ```'
        if content.startswith("```"):
            lines = content.split('\n')
            if lines and lines[0].strip().startswith("```"):
                lines = lines[1:]
            if lines and lines[-1].strip() == "```":
                lines = lines[:-1]
            content = "\n".join(lines)
            
        return json.loads(content)
        
    except Exception as e:
        print(f"Error calling Gemini: {e}")
        return {
            "score": 50,
            "summary": "Error analyzing CV.",
            "strengths": ["N/A"],
            "improvements": ["Could not complete AI analysis due to an error."]
        }

def log_analysis_to_supabase(analysis_data, user_email, user_name):
    """Log CV analysis to Supabase for record keeping"""
    try:
        import requests
        
        # Prepare the data for logging
        log_entry = {
            "user_email": user_email,
            "user_name": user_name,
            "analysis_result": analysis_data,
            "created_at": datetime.utcnow().isoformat(),
            "domain": DOMAIN
        }
        
        # Try to insert into cv_analysis table
        headers = {
            "apikey": SUPABASE_ANON_KEY,
            "Authorization": f"Bearer {SUPABASE_ANON_KEY}",
            "Content-Type": "application/json"
        }
        
        response = requests.post(
            f"{SUPABASE_URL}/rest/v1/cv_analysis",
            json=log_entry,
            headers=headers
        )
        
        if response.status_code in [200, 201]:
            print(f"Analysis logged to Supabase for {user_email}")
        else:
            print(f"Warning: Could not log to Supabase: {response.text}")
            
    except Exception as e:
        print(f"Error logging to Supabase: {e}")
        # Don't fail the main analysis if logging fails

@functions_framework.http
def analyze_cv(request):
    # Set CORS headers for the preflight request
    if request.method == 'OPTIONS':
        headers = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'POST',
            'Access-Control-Allow-Headers': 'Content-Type',
            'Access-Control-Max-Age': '3600'
        }
        return ('', 204, headers)

    # Set CORS headers for the main request
    headers = {
        'Access-Control-Allow-Origin': '*'
    }

    if request.method != 'POST':
        return (jsonify({'error': 'Method not allowed'}), 405, headers)

    if 'file' not in request.files:
        return (jsonify({'error': 'No file part'}), 400, headers)

    file = request.files['file']

    if file.filename == '':
        return (jsonify({'error': 'No selected file'}), 400, headers)

    try:
        # Get user information
        user_email = request.form.get('email', 'anonymous@share2inspire.pt')
        user_name = request.form.get('name', 'Candidato')
        
        # Read PDF content
        if file.filename.lower().endswith('.pdf'):
            pdf_bytes = BytesIO(file.read())
            reader = PdfReader(pdf_bytes)
            text = ""
            for page in reader.pages:
                text += page.extract_text() or ""
        else:
            # Fallback for txt or other simple formats if needed, or error
            # For now, let's assume text if not PDF for simplicity or just return error
            return (jsonify({'error': 'Unsupported file format. Please upload a PDF.'}), 400, headers)

        if not text.strip():
             return (jsonify({'error': 'Could not extract text from the file.'}), 400, headers)

        # Validate if file is actually a CV
        if not is_valid_cv(text):
            return (jsonify({
                'error': 'O ficheiro carregado não parece ser um CV. Por favor, carregue um currículo válido com informações sobre experiência, formação ou competências.'
            }), 400, headers)

        # Call AI
        analysis_result = analyze_text_with_gemini(text)
        
        # Log to Supabase
        log_analysis_to_supabase(analysis_result, user_email, user_name)
        
        return (jsonify({
            'success': True,
            'report': analysis_result,
            'domain': DOMAIN,
            'assistant_email': ASSISTANT_EMAIL
        }), 200, headers)

    except Exception as e:
        print(f"Server Error: {e}")
        return (jsonify({'error': 'Internal server error processing the file.'}), 500, headers)
