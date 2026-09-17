import re
import json
from vocab_p1 import PAGES_DATA
from vocab_p2 import PAGES_DATA_2
from vocab_p3 import PAGES_DATA_3

def parse_block(text):
    lines = [line.strip() for line in text.strip().split('\n') if line.strip()]
    entries = []
    i = 0
    while i < len(lines):
        line = lines[i]
        # Match pattern: 1. abandon (v.) = leave completely
        m = re.match(r'^(\d+)\.\s*([a-zA-Z\s\-]+?)\s*\(([^)]+)\)\s*=\s*(.+)$', line)
        if m:
            num = int(m.group(1))
            word = m.group(2).strip()
            pos = m.group(3).strip()
            meaning_en = m.group(4).strip()
            # The next line(s) before the next numbered entry is the Hindi meaning
            i += 1
            hindi_parts = []
            while i < len(lines) and not re.match(r'^\d+\.', lines[i]):
                hindi_parts.append(lines[i])
                i += 1
            meaning_hi = ' '.join(hindi_parts)
            entries.append({
                'id': num,
                'word': word,
                'pos': pos,
                'meaningEnglish': meaning_en,
                'meaningHindi': meaning_hi
            })
        else:
            i += 1
    return entries

all_entries = parse_block(PAGES_DATA) + parse_block(PAGES_DATA_2) + parse_block(PAGES_DATA_3)
print(f"Total entries parsed: {len(all_entries)}")
if all_entries:
    print(f"First: {all_entries[0]}")
    print(f"Last: {all_entries[-1]}")

# Check for missing ids from 1 to 1000
ids = set(e['id'] for e in all_entries)
missing = [x for x in range(1, 1001) if x not in ids]
print(f"Missing IDs count: {len(missing)}")
if missing:
    print(f"Missing IDs: {missing[:20]}")
