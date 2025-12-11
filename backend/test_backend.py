import sys
import unittest
from unittest.mock import MagicMock, patch
import os

# Mock functions_framework before importing (to avoid Python 3.13 compatibility issues locally)
mock_ff = MagicMock()
def side_effect(func):
    return func
mock_ff.http.side_effect = side_effect
sys.modules['functions_framework'] = mock_ff

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), 'backend'))
from main import analyze_cv

from flask import Flask
app = Flask(__name__)

class TestCVAnalysis(unittest.TestCase):
    def test_no_file(self):
        request = MagicMock()
        request.method = 'POST'
        request.files = {}
        
        with app.app_context():
            response = analyze_cv(request)
            # response is (body, status, headers)
            self.assertEqual(response[1], 400)
            self.assertIn('No file part', response[0].json['error'])

    @patch('main.GENAI_API_KEY', 'fake_key')
    @patch('main.genai')
    def test_valid_pdf_flow(self, mock_genai):
        # Mock Gemini response
        mock_model = MagicMock()
        mock_response = MagicMock()
        mock_response.text = '{"score": 85, "summary": "Good", "strengths": ["A"], "improvements": ["B"]}'
        mock_model.generate_content.return_value = mock_response
        mock_genai.GenerativeModel.return_value = mock_model

        # Mock PDF file
        request = MagicMock()
        request.method = 'POST'
        mock_file = MagicMock()
        mock_file.filename = 'test.pdf'
        mock_file.read.return_value = b'%PDF-1.4 mock content'
        
        # We need to mock pypdf or provide a real minimal valid PDF byte stream.
        # Mocking PdfReader is easier
        with patch('main.PdfReader') as MockPdfReader:
            mock_pdf_instance = MockPdfReader.return_value
            page = MagicMock()
            page.extract_text.return_value = "Sample CV Content"
            mock_pdf_instance.pages = [page]
            
            request.files = {'file': mock_file}
            
            with app.app_context():
                response = analyze_cv(request)
            
                self.assertEqual(response[1], 200)
                data = response[0].json
                self.assertEqual(data['score'], 85)

if __name__ == '__main__':
    unittest.main()
