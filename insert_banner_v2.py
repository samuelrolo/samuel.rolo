# -*- coding: utf-8 -*-
import sys
sys.stdout.reconfigure(encoding='utf-8')

# Read the file
with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Banner to insert (directly after <body> tag which should be around line 505)
banner_lines = [
    '\n',
    '    <!-- Launch Campaign Banner -->\n',
   '    <div class="alert alert-dismissible fade show mb-0 text-center" style="background: linear-gradient(135deg, #BF9A33 0%, #D4AF37 100%); color: #1A1A1A; border: none; border-radius: 0; padding: 0.75rem;">\n',
    '        <div class="container">\n',
    '            <strong>🎉 Campanha de Lançamento:</strong> \n',
    '            <span class="small">Kickstart Pro <strong>30€</strong> (-25%) | Revisão CV <strong>20€</strong> (-20%) | Use <code class="bg-dark text-warning px-2">NEWS2I10</code> -10%</span>\n',
    '            <button type="button" class="btn-close position-absolute end-0 me-3" data-bs-dismiss="alert" aria-label="Close" style="font-size: 0.75rem; opacity: 0.8;"></button>\n',
    '        </div>\n',
    '    </div>\n',
    '\n'
]

# Find where to insert - after </script> closing Google Analytics (around line 513)
# Looking for the line that contains just "    </script>"
insert_index = None
for i, line in enumerate(lines):
    if i > 500 and i < 520:  # Around the Google Analytics section
        if '    </script>' in line and 'gtag' in ''.join(lines[max(0,i-10):i]):
            insert_index = i + 1
            break

if insert_index:
    # Insert the banner
    new_lines = lines[:insert_index] + banner_lines + lines[insert_index:]
    
    # Write back
    with open('c:/Users/samue/.gemini/antigravity/scratch/samuel.rolo/pages/servicos.html', 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"Banner inserted successfully at line {insert_index}!")
else:
    print("ERROR: Could not find suitable insertion point")
    print("Lines 505-520:")
    for i in range(505, 520):
        print(f"{i}: {lines[i-1]}", end='')
