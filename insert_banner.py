import re

# Read the servicos.html file
with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Banner HTML to insert
banner_html = '''
    <!-- Launch Campaign Banner -->
    <div class="alert alert-dismissible fade show mb-0 text-center" style="background: linear-gradient(135deg, #BF9A33 0%, #D4AF37 100%); color: #1A1A1A; border: none; border-radius: 0; padding: 0.75rem;">
        <div class="container">
            <strong>🎉 Campanha de Lançamento:</strong> 
            <span class="small">Kickstart Pro <strong>30€</strong> (-25%) | Revisão CV <strong>20€</strong> (-20%) | Use <code class="bg-dark text-warning px-2">NEWS2I10</code> -10%</span>
            <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="alert" aria-label="Close" style="font-size: 0.75rem; opacity: 0.8;"></button>
        </div>
    </div>
'''

# Find the closing </script> tag after Google Analytics (gtag.js)
# Insert banner after it and before <!-- Header Navigation -->
pattern = r'(\s*</script>\s*\r?\n)(\s*<!-- Header Navigation -->)'
replacement = r'\1' + banner_html + r'\n\2'

# Perform the replacement
new_content = re.sub(pattern, replacement, content, count=1)

# Write back
with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'w', encoding='utf-8') as f:
    f.write(new_content)

print("Banner successfully inserted into servicos.html!")
