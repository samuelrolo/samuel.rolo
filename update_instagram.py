import os

def update_instagram_link(directory):
    target_link = "https://www.instagram.com/share2inspire.pt/"
    new_link = "https://www.instagram.com/share2inspire_"
    
    import re
    
    # Regex to match instagram links with share2inspire followed by any characters until a quote or space
    # This covers .pt, _, __, ___, etc.
    regex_pattern = r'https?://(www\.)?instagram\.com/share2inspire[a-zA-Z0-9._]*'
    
    count = 0
    for root, dirs, files in os.walk(directory):
        # Skip .git and old folders
        if '.git' in root or '0.old' in root or 'pages\\old' in root:
            continue
            
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                try:
                    with open(filepath, 'r', encoding='utf-8') as f:
                        content = f.read()
                    
                    # Use regex sub to replace all occurrences
                    new_content = re.sub(regex_pattern, new_link, content)
                    
                    if new_content != content:
                        with open(filepath, 'w', encoding='utf-8') as f:
                            f.write(new_content)
                        print(f"Updated: {filepath}")
                        count += 1
                except Exception as e:
                    print(f"Error processing {filepath}: {e}")

    print(f"Total files updated: {count}")

if __name__ == "__main__":
    update_instagram_link("c:\\Users\\samue\\.gemini\\antigravity\\playground\\ultraviolet-pioneer")
