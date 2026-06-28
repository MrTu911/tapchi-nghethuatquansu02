import os
import shutil
from pathlib import Path

space_dir = Path(__file__).parent
app_dir = space_dir / "app"

modifications = [
    {
        "file": app_dir / "layout.tsx",
        "find": 'export const dynamic = "force-dynamic"',
        "replace": '// export const dynamic = "force-dynamic"'
    },
    {
        "file": app_dir / "(public)" / "library" / "page.tsx",
        "find": "export const dynamic = 'force-dynamic'",
        "replace": "// export const dynamic = 'force-dynamic'"
    },
    {
        "file": app_dir / "(public)" / "issues" / "[id]" / "page.tsx",
        "append": """
export async function generateStaticParams() {
  const issues = await prisma.issue.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true }
  });
  const params = [];
  for (const issue of issues) {
    params.push({ id: issue.id });
    if (issue.slug) {
      params.push({ id: issue.slug });
    }
  }
  return params;
}
"""
    },
    {
        "file": app_dir / "(public)" / "issues" / "[id]" / "viewer" / "page.tsx",
        "append": """
export async function generateStaticParams() {
  const issues = await prisma.issue.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true }
  });
  const params = [];
  for (const issue of issues) {
    params.push({ id: issue.id });
    if (issue.slug) {
      params.push({ id: issue.slug });
    }
  }
  return params;
}
"""
    },
    {
        "file": app_dir / "(public)" / "library" / "[slug]" / "page.tsx",
        "append": """
export async function generateStaticParams() {
  const fs = require('fs');
  const path = require('path');
  const dirPath = path.join(process.cwd(), 'public', 'data', 'issues');
  if (!fs.existsSync(dirPath)) return [];
  const slugs = fs.readdirSync(dirPath);
  return slugs.map((slug: string) => ({ slug }));
}
"""
    },
    {
        "file": app_dir / "(public)" / "journal" / "issues" / "[id]" / "page.tsx",
        "append": """
export async function generateStaticParams() {
  const issues = await prisma.issue.findMany({
    where: { status: 'PUBLISHED' },
    select: { id: true, slug: true }
  });
  const params = [];
  for (const issue of issues) {
    params.push({ id: issue.id });
    if (issue.slug) {
      params.push({ id: issue.slug });
    }
  }
  return params;
}
"""
    },
    {
        "file": app_dir / "(public)" / "journal-articles" / "[id]" / "page.tsx",
        "prepend": "import { prisma } from '@/lib/prisma';\n",
        "append": """
export async function generateStaticParams() {
  const articles = await prisma.journalArticle.findMany({
    where: {
      status: 'PUBLISHED',
      issue: { status: 'PUBLISHED' }
    },
    select: { id: true }
  });
  return articles.map((art: { id: string }) => ({ id: art.id }));
}
"""
    },
    {
        "file": app_dir / "(public)" / "categories" / "[slug]" / "page.tsx",
        "append": """
export async function generateStaticParams() {
  const categories = await prisma.category.findMany({
    select: { slug: true }
  });
  return categories.map((cat: { slug: string }) => ({ slug: cat.slug }));
}
"""
    }
]

# Backup files
backups = {}
for mod in modifications:
    fp = mod["file"]
    if fp.exists():
        backup_path = fp.with_suffix(fp.suffix + ".deploy_bak")
        shutil.copy2(fp, backup_path)
        backups[fp] = backup_path
        print(f"Backed up {fp.relative_to(app_dir)}")

# Apply modifications
try:
    for mod in modifications:
        fp = mod["file"]
        if not fp.exists():
            continue
        content = fp.read_text(encoding="utf-8")
        if "find" in mod:
            content = content.replace(mod["find"], mod["replace"])
            print(f"Replaced text in {fp.relative_to(app_dir)}")
        if "prepend" in mod:
            content = mod["prepend"] + content
            print(f"Prepended code to {fp.relative_to(app_dir)}")
        if "append" in mod:
            content += mod["append"]
            print(f"Appended code to {fp.relative_to(app_dir)}")
        fp.write_text(content, encoding="utf-8")
    print("All build patches applied successfully.")
except Exception as e:
    print(f"Error applying patches: {e}")
    # Restore immediately
    for fp, bp in backups.items():
        shutil.copy2(bp, fp)
        os.remove(bp)
    print("Restored original files due to error.")
