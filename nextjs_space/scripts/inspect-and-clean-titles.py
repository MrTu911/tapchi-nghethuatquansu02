import json
from pathlib import Path

corpus_path = Path('public/data/issues/so-7-2026/corpus.json')
if not corpus_path.exists():
    print("❌ corpus.json not found!")
    exit(1)

# Load data
data = json.loads(corpus_path.read_text(encoding='utf-8'))

print("--- Inspecting Articles ---")
dirty_count = 0
for art in data.get('articles', []):
    art_id = art.get('id')
    title = art.get('title', {}).get('main', '')
    
    # Check for specific dirty title of art_003
    if art_id == 'art_003':
        print(f"\n[FOUND DIRTY TITLE] {art_id}:")
        print(f"  Old: {title}")
        clean_title = "Xây dựng lực lượng dự bị động viên hùng hậu, chất lượng cao theo tinh thần văn kiện Đại hội XIV của đảng"
        art['title']['main'] = clean_title
        print(f"  New: {clean_title}")
        dirty_count += 1
    else:
        # Just print first 80 chars of other titles
        print(f"  {art_id}: {title[:80]}...")

# Save back if we made changes
if dirty_count > 0:
    corpus_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
    print(f"\n✓ Successfully cleaned {dirty_count} title(s) in corpus.json.")
else:
    print("\nNo changes made.")
