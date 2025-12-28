# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Read the file
with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Banner HTML
banner = '''
    <!-- Launch Campaign Banner -->
    <div class="alert alert-dismissible fade show mb-0 text-center" style="background: linear-gradient(135deg, #BF9A33 0%, #D4AF37 100%); color: #1A1A1A; border: none; border-radius: 0; padding: 0.75rem;">
        <div class="container">
            <strong>🎉 Campanha de Lançamento:</strong> 
            <span class="small">Kickstart Pro <strong>30€</strong> (-25%) | Revisão CV <strong>20€</strong> (-20%) | Use <code class="bg-dark text-warning px-2">NEWS2I10</code> -10%</span>
            <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="alert" aria-label="Close" style="font-size: 0.75rem; opacity: 0.8;"></button>
        </div>
    </div>
'''

# Find <body> tag and insert immediately after
if '<body>' in content:
    content = content.replace('<body>', '<body>' + banner, 1)
    print("Inserted banner after <body> tag")
elif '<body ' in content:
    # Find the closing > of the body tag
    import re
    content = re.sub(r'(<body[^>]*>)', r'\1' + banner, content, count=1)
    print("Inserted banner after <body ...> tag")
else:
    print("ERROR: Could not find <body> tag")
    sys.exit(1)

# Write back
with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'w', encoding='utf-8') as f:
    f.write(content)

print("SUCCESS: Banner inserted into servicos.html!")
