# Apify Job Scraping Investigation

## Current State

### Apify Usage
- Apify is used ONLY for **LinkedIn profile scraping** (not job scraping)
- Endpoint: `https://share2inspire-beckend.lm.r.appspot.com/api/services/scrape-linkedin`
- Used in the "Usar perfil LinkedIn" flow to extract CV data from LinkedIn profiles

### Job Description Input
- The `jobInput` field accepts free text OR a URL
- It is sent directly to the Supabase Edge Function as `job_description` (raw text, max 3000 chars)
- The Edge Function passes it to Gemini, which interprets it
- When a LinkedIn job URL is provided, Gemini cannot access the URL and "simulates" a job description based on the URL text

### Problem
- LinkedIn job URLs are NOT scraped - the raw URL text is sent to Gemini
- Gemini sees `https://www.linkedin.com/jobs/collections/recommended/?currentJobId=4362180439` and tries to infer a job from it
- This results in "(Simulado)" appearing in the analysis

### Solution Options
1. **Add LinkedIn job scraping via Apify** - Use an Apify actor like `apify/linkedin-jobs-scraper` to extract job descriptions from LinkedIn URLs
2. **Add scraping in the backend** - Add a new endpoint or modify the existing one to detect LinkedIn job URLs and scrape them
3. **Frontend detection** - Detect URLs in the jobInput and warn the user to paste the full text instead (ALREADY IMPLEMENTED in Live Match)
