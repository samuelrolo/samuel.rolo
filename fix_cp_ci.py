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
        print(f"Skipping {file_path}, does not exist")
        continue

    with open(file_path, 'r', encoding='utf-8') as f:
        text = f.read()

    # We want to replace:
    # sessionStorage.getItem('key') -> (localStorage.getItem('key') || sessionStorage.getItem('key'))
    # But only if it's not already replaced
    text = re.sub(r"sessionStorage\.getItem\(([^)]+)\)", r"(localStorage.getItem(\1) || sessionStorage.getItem(\1))", text)
    
    # We want to replace:
    # sessionStorage.setItem('key', value) -> localStorage.setItem('key', value); sessionStorage.setItem('key', value)
    # Using regex to find the setItem statements
    # Match: sessionStorage.setItem(args); or sessionStorage.setItem(args)
    text = re.sub(
        r"sessionStorage\.setItem\(([^,]+),\s*(.+?)\)(;?)", 
        r"localStorage.setItem(\1, \2)\3; sessionStorage.setItem(\1, \2)\3", 
        text
    )

    # We want to replace:
    # sessionStorage.removeItem('key') -> localStorage.removeItem('key'); sessionStorage.removeItem('key')
    text = re.sub(
        r"sessionStorage\.removeItem\(([^)]+)\)(;?)", 
        r"localStorage.removeItem(\1)\2; sessionStorage.removeItem(\1)\2", 
        text
    )

    # Cleanup duplicates if they already had both
    text = text.replace("(localStorage.getItem", "(localStorage.getItem") # just checking

    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(text)
    
    print(f"Patched {file_path}")
