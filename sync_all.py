import os
import shutil
import re

# Configurations
SRC_DIR = r"C:\Users\samue\.gemini\antigravity\scratch\cv-analyser-v2\dist\public"
DEST_ROOT = r"c:\Users\samue\.gemini\antigravity\scratch\samuel.rolo"
ASSETS_SUBDIR = os.path.join("cv-analyser", "assets")
DEST_ASSETS_DIR = os.path.join(DEST_ROOT, ASSETS_SUBDIR)

TARGET_PAGES = [
    "cv-analyser/index.html",
    "career-path/index.html",
    "career-intelligence/index.html",
    "linkedin-roaster/index.html",
    "estudante/index.html",
    "bundle/index.html",
    "student-pack/index.html",
    "en/pages/home/index.html",
    "en/pages/contact/index.html",
    "en/pages/services/index.html",
    "en/pages/about/index.html",
    "en/career-path/index.html",
    "en/career-intelligence/index.html",
    "en/linkedin-roaster/index.html",
    "en/student-pack/index.html",
    "en/cv-analyser/index.html",
    "en/estudante/index.html",
    "index.html",
    "pages/sobre/index.html",
    "pages/contactos/index.html",
    "pages/servicos/index.html",
]

def sync_assets():
    print(f"Cleaning assets in {DEST_ASSETS_DIR}...")
    if os.path.exists(DEST_ASSETS_DIR):
        shutil.rmtree(DEST_ASSETS_DIR)
    os.makedirs(DEST_ASSETS_DIR)

    src_assets = os.path.join(SRC_DIR, "assets")
    print(f"Copying assets from {src_assets}...")
    for item in os.listdir(src_assets):
        s = os.path.join(src_assets, item)
        d = os.path.join(DEST_ASSETS_DIR, item)
        if os.path.isfile(s):
            shutil.copy2(s, d)
        elif os.path.isdir(s):
            shutil.copytree(s, d)

def get_new_tags():
    index_path = os.path.join(SRC_DIR, "index.html")
    with open(index_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract script tag
    script_match = re.search(r'<script type="module" crossorigin src="/cv-analyser/assets/index-.*?\.js"></script>', content)
    # Extract css tag
    css_match = re.search(r'<link rel="stylesheet" crossorigin href="/cv-analyser/assets/index-.*?\.css">', content)
    # Extract preloads
    preload_matches = re.findall(r'<link rel="modulepreload" crossorigin href="/cv-analyser/assets/vendor-.*?\.js">', content)
    
    return {
        "script": script_match.group(0) if script_match else None,
        "css": css_match.group(0) if css_match else None,
        "preloads": preload_matches
    }

def update_html_files(tags):
    if not tags["script"] or not tags["css"]:
        print("Error: Could not find script or css tags in source index.html")
        return

    print("Updating HTML files...")
    for page in TARGET_PAGES:
        page_path = os.path.join(DEST_ROOT, page)
        if not os.path.exists(page_path):
            print(f"Skipping {page} (not found)")
            continue
        
        with open(page_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Replace script
        content = re.sub(
            r'<script type="module" crossorigin src="/cv-analyser/assets/index-.*?\.js"></script>',
            tags["script"],
            content
        )
        
        # Replace CSS
        content = re.sub(
            r'<link rel="stylesheet" crossorigin href="/cv-analyser/assets/index-.*?\.css">',
            tags["css"],
            content
        )
        
        # Replace preloads
        # First remove all current preloads
        content = re.sub(
            r'<link rel="modulepreload" crossorigin href="/cv-analyser/assets/vendor-.*?\.js">',
            "",
            content
        )
        # Then add new ones before the script tag or in the head
        new_preloads = "\n    ".join(tags["preloads"])
        if tags["script"] in content:
            content = content.replace(tags["script"], f"{new_preloads}\n    {tags['script']}")
        
        with open(page_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"Updated {page}")

if __name__ == "__main__":
    sync_assets()
    tags = get_new_tags()
    update_html_files(tags)
    print("Done!")
