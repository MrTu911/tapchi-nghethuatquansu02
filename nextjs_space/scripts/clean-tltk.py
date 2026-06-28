import json
from pathlib import Path

corpus_path = Path('public/data/issues/so-7-2026/corpus.json')
if not corpus_path.exists():
    print("❌ corpus.json not found!")
    exit(1)

# Load data
data = json.loads(corpus_path.read_text(encoding='utf-8'))

for art in data.get('articles', []):
    if art.get('id') == 'art_003':
        body_dict = art.get('body', {})
        paragraphs = body_dict.get('paragraphs', [])
        references = art.get('references', [])
        
        print("Original paragraphs length:", len(paragraphs))
        print("Original references:", references)
        
        # Verify the last two paragraphs are indeed the leaking references
        p1 = paragraphs[-2]
        p2 = paragraphs[-1]
        
        if "1, 2, 6, 7." in p1['text'] and "3, 4." in p2['text']:
            print("\n✓ Verified target paragraphs:")
            print(f"  P1: {p1['text'][:80]}...")
            print(f"  P2: {p2['text'][:80]}...")
            
            # Remove from paragraphs list
            body_dict['paragraphs'] = paragraphs[:-2]
            
            # Add to references in the correct order (1, 2, 6, 7 and 3, 4 before 5)
            art['references'] = [p1['text'], p2['text']] + references
            
            print("\nUpdated paragraphs length:", len(body_dict['paragraphs']))
            print("Updated references:", art['references'])
        else:
            print("❌ Target paragraphs did not match expected reference strings!")
            exit(1)

# Save back
corpus_path.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding='utf-8')
print("\n✓ Successfully cleaned references and saved corpus.json.")
