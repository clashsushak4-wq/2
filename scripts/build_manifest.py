import os
from collections import defaultdict

root_dir = r"C:\Users\User\OneDrive\Desktop\bot"

# Use exactly the same ignore logic
ignored = ['node_modules', '.git', 'dist', 'build', 'vendor', '.next', 'venv', '.venv', '__pycache__', '.secret', '.playwright-mcp', '.agents']

def is_ignored(path):
    parts = path.split(os.sep)
    for p in parts:
        if p in ignored:
            return True
        if 'lock' in p.lower():
            return True
    return False

all_files = []
for root, dirs, files in os.walk(root_dir):
    dirs[:] = [d for d in dirs if not is_ignored(d)]
    for file in files:
        if is_ignored(file): continue
        if 'lock' in file.lower(): continue
        all_files.append(os.path.join(root, file))

files_by_dir = defaultdict(list)
for filepath in all_files:
    rel_path = os.path.relpath(filepath, root_dir)
    rel_dir = os.path.dirname(rel_path)
    if not rel_dir:
        rel_dir = '.'
    files_by_dir[rel_dir].append(rel_path)

manifest_lines = ["# Аудит Проекта: Манифест\n"]
CHUNK_SIZE = 6
sorted_dirs = sorted(files_by_dir.keys())

for d in sorted_dirs:
    files = sorted(files_by_dir[d])
    chunks = [files[i:i + CHUNK_SIZE] for i in range(0, len(files), CHUNK_SIZE)]
    
    for i, chunk in enumerate(chunks):
        title = f"{d} ({i+1}/{len(chunks)})" if len(chunks) > 1 else d
        manifest_lines.append(f"- [ ] **{title.replace(os.sep, '/')}**")
        for f in chunk:
            manifest_lines.append(f"  - `{f.replace(os.sep, '/')}`")

audit_dir = os.path.join(root_dir, "audit")
if not os.path.exists(audit_dir):
    os.makedirs(audit_dir)

with open(os.path.join(audit_dir, "00-manifest.md"), "w", encoding="utf-8") as f:
    f.write("\n".join(manifest_lines))

print("Manifest created at audit/00-manifest.md")
