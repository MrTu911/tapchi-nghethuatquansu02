import os
import shutil
from pathlib import Path

space_dir = Path(__file__).parent
app_dir = space_dir / "app"

print("Restoring original files from backups...")
count = 0
for root, dirs, files in os.walk(app_dir):
    for file in files:
        if file.endswith(".deploy_bak"):
            bp = Path(root) / file
            fp = bp.with_suffix("")
            shutil.copy2(bp, fp)
            os.remove(bp)
            print(f"Restored: {fp.relative_to(app_dir)}")
            count += 1
print(f"✓ Restored {count} files and cleaned up backups.")
