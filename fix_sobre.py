import re

# Read the file
with open('pages/sobre.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find the misplaced Recommendations section (after </script> tag around line 1409)
# Pattern: from "<!-- Recommendations Section" to "</section>" that appears after scripts
pattern = r'(\s+</script>\s+)(<!-- Recommendations Section.*?</section>)(\s+</main>)'

match = re.search(pattern, content, re.DOTALL)

if match:
    before_script = content[:match.start()]
    script_end = match.group(1)
    recommendations_section = match.group(2)
    after_section = content[match.end():]
    
    # Now find where to insert (before the footer, after last </section> before footer)
    # Look for the last </section> before <!-- Footer -->
    footer_pattern = r'(</section>\s+)(<!-- Footer -->)'
    
    footer_match = re.search(footer_pattern, before_script, re.DOTALL)
    
    if footer_match:
        # Insert recommendations before footer
        new_content = (
            before_script[:footer_match.end(1)] +
            '\n' + recommendations_section + '\n' +
            before_script[footer_match.end(1):] +
            script_end +
            '\n</main>' +
            after_section
        )
        
        # Write back
        with open('pages/sobre.html', 'w', encoding='utf-8') as f:
            f.write(new_content)
        
        print("[OK] Recommendations section moved successfully!")
        print(f"  - Section size: {len(recommendations_section)} chars")
    else:
        print("[ERROR] Could not find footer marker")
else:
    print("[ERROR] Could not find misplaced Recommendations section")
