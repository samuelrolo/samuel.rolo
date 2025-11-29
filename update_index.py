
import os

file_path = 'index.html'
start_marker = '<!-- JavaScript do Diagnóstico -->'
end_marker = '<!-- Feedback Modal JS -->'

new_content = """    <!-- JavaScript do Diagnóstico -->
    <script src="pages/diagnostic.js"></script>

    """

# Try reading with different encodings
encodings = ['utf-8', 'latin-1', 'cp1252']
content = None
used_encoding = None

for enc in encodings:
    try:
        with open(file_path, 'r', encoding=enc) as f:
            content = f.read()
        if start_marker in content and end_marker in content:
            used_encoding = enc
            break
    except Exception as e:
        print(f"Failed with {enc}: {e}")

if content and used_encoding:
    print(f"Read file with encoding: {used_encoding}")
    start_index = content.find(start_marker)
    end_index = content.find(end_marker)

    if start_index != -1 and end_index != -1:
        updated_content = content[:start_index] + new_content + content[end_index:]
        with open(file_path, 'w', encoding=used_encoding) as f:
            f.write(updated_content)
        print("Successfully updated index.html")
    else:
        print("Markers not found (even though check passed?)")
        print(f"Start found: {start_index != -1}")
        print(f"End found: {end_index != -1}")
else:
    print("Could not read file or find markers with any encoding")
