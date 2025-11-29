
import os

file_path = 'index.html'

# Try reading as binary first to see if it's weird
with open(file_path, 'rb') as f:
    content_bytes = f.read()
    print(f"File size: {len(content_bytes)} bytes")
    print(f"First 100 bytes: {content_bytes[:100]}")

# Try decoding
try:
    content = content_bytes.decode('utf-8')
    print("Decoded as utf-8")
except:
    print("Failed to decode as utf-8")
    try:
        content = content_bytes.decode('latin-1')
        print("Decoded as latin-1")
    except:
        print("Failed to decode as latin-1")
        exit()

lines = content.splitlines()
print(f"Total lines: {len(lines)}")

for i in range(1760, min(1800, len(lines))):
    print(f"{i+1}: {repr(lines[i])}")
