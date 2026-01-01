import os
import json
import functions_framework
import google.generativeai as genai
from pypdf import PdfReader
from io import BytesIO
from flask import jsonify

# Configure Gemini API
# key should be set in environment variables for security
GENAI_API_KEY = os.environ.get("GEMINI_API_KEY")

if GENAI_API_KEY:
    genai.configure(api_key=GENAI_API_KEY)

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
            "improvements": ["Please configure the GEMINI_API_KEY environment variable."]
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
        
        return (jsonify(analysis_result), 200, headers)

    except Exception as e:
        print(f"Server Error: {e}")
        return (jsonify({'error': 'Internal server error processing the file.'}), 500, headers)
