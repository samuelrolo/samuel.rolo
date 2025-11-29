
import os

file_path = 'index.html'
# This string is the start of the garbage we found in the view
start_garbage = '"Existe capacidade de análise preditiva'
end_marker = '<!-- Feedback Modal JS -->'

new_content_block = """
    <!-- JavaScript do Diagnóstico -->
    <script src="pages/diagnostic.js"></script>

"""

# Try reading with utf-8
try:
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
except UnicodeDecodeError:
    # Fallback to latin-1 if utf-8 fails
    with open(file_path, 'r', encoding='latin-1') as f:
        content = f.read()

start_index = content.find(start_garbage)
end_index = content.find(end_marker)

if start_index != -1 and end_index != -1:
    # We want to replace everything from start_garbage up to end_marker
    # with the new_content_block.
    
    # However, we need to be careful about what comes BEFORE start_garbage.
    # In the view, line 1766 is </div>. Line 1767 is the garbage.
    # So we are replacing starting from the garbage.
    
    # We also need to check if there is a </script> before the end marker that we should include in the deletion.
    # The garbage includes the closing </script> of the old block.
    # So deleting up to end_marker is correct.
    
    updated_content = content[:start_index] + new_content_block + content[end_index:]
    
    with open(file_path, 'w', encoding='utf-8') as f:
        f.write(updated_content)
    print("Successfully cleaned up index.html")
else:
    print("Markers not found")
    print(f"Start found: {start_index != -1}")
    print(f"End found: {end_index != -1}")
