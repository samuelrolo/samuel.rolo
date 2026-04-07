import re
import os

files_to_patch = [
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\CareerPathHome.tsx",
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\en\CareerPathHomeEN.tsx",
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\CareerPathResults.tsx",
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\CareerIntelligenceHome.tsx",
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\en\CareerIntelligenceHomeEN.tsx",
    r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo\apps\cv-analyser\client\src\pages\CareerIntelligenceResults.tsx",
]

for file_path in files_to_patch:
    if not os.path.exists(file_path):
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # 1. removeItem: remove from BOTH to prevent ghost data
    text = re.sub(
        r"sessionStorage\.removeItem\(([^)]+)\)", 
        r"(localStorage.removeItem(\1), sessionStorage.removeItem(\1))", 
        text
    )

    # 2. getItem: read from local, fallback to session
    text = re.sub(
        r"sessionStorage\.getItem\(([^)]+)\)", 
        r"(localStorage.getItem(\1) || sessionStorage.getItem(\1))", 
        text
    )

    # 3. setItem: just use local
    text = text.replace("sessionStorage.setItem", "localStorage.setItem")

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"Patched {file_path}")
