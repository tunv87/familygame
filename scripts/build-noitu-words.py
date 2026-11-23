"""
Builds src/games/noitu/words.json for the Nối từ game.

Inputs (downloaded by hand, not committed):
  1. Wiktionary Vietnamese entries extracted by kaikki.org (CC BY-SA 4.0 / GFDL):
     https://kaikki.org/dictionary/Vietnamese/kaikki.org-dictionary-Vietnamese.jsonl
  2. Syllable frequencies from OpenSubtitles, hermitdave/FrequencyWords (CC BY-SA 4.0),
     used only to rank how common a word is: content/2018/vi/vi_50k.txt

Usage: python3 scripts/build-noitu-words.py kaikki-vi.jsonl vi_50k.txt

Output: {"w": [[word, english gloss, tier], ...]} where tier 0 = for children, 1 = very common,
2 = common, 3 = rare.
Two-syllable words only. Names, archaic/dialect-only words and anything unsuitable for children
(Wiktionary tags + a blocklist below) are left out.
"""
import json, re, sys, unicodedata

src, freq_path = sys.argv[1], sys.argv[2]
OUT = 'src/games/noitu/words.json'

VI = re.compile(r'^[a-zàáảãạăằắẳẵặâầấẩẫậđèéẻẽẹêềếểễệìíỉĩịòóỏõọôồốổỗộơờớởỡợùúủũụưừứửữựỳýỷỹỵ]+$')
BAD_TAGS = {'vulgar', 'offensive', 'derogatory', 'slur', 'pejorative', 'obscene', 'sexual', 'ethnic'}
BAD_POS = {'name', 'character', 'symbol', 'prefix', 'suffix', 'affix', 'romanization', 'abbrev',
           'phrase', 'proverb', 'idiom', 'contraction', 'intj', 'particle'}
OLD_TAGS = {'obsolete', 'archaic', 'dated', 'rare', 'dialectal'}
# Syllables that make a word unsuitable for a family game whatever the gloss says.
BAD_SYLLABLES = {'đụ', 'địt', 'lồn', 'cặc', 'buồi', 'đéo', 'đĩ', 'điếm', 'chịch', 'nứng', 'dái',
                 'đít', 'cứt', 'đái', 'ỉa', 'đù'}
BAD_WORDS = {'bỏ mẹ', 'chết mẹ', 'mẹ kiếp', 'đồ chó', 'thằng chó', 'con hoang', 'bố láo', 'láo toét',
             'mả mẹ', 'tổ cha', 'chó má', 'đồ ngu', 'ngu ngốc', 'khốn nạn', 'mất dạy', 'chó chết'}
BAD_GLOSS = re.compile(
    r'\b(sex\w*|prostitut\w*|whore\w*|brothel|penis|vagin\w*|vulva|genital\w*|testic\w*|scrot\w*|'
    r'anus|anal|feces|faeces|excrement|urin\w*|masturbat\w*|porn\w*|erotic\w*|orgasm|ejaculat\w*|'
    r'semen|sperm|condom|rape\w*|incest|adulter\w*|concubine|mistress|lewd|lust\w*|fornicat\w*|'
    r'pubic|breast\w*|nipple|bosom|suicid\w*|murder\w*|assassin\w*|corpse|execut\w*|behead\w*|'
    r'opium|heroin|cocaine|narcotic\w*|drug addict\w*|gambl\w*|bet|wager|casino|liquor|'
    r'drunk\w*|slut|bastard|bitch|fuck\w*|shit\w*|damn|insult\w*|curse\w*|swear\w*|torture\w*|'
    r'gynecolog\w*|menstru\w*|pregnan\w*|abortion|homosexual\w*|lesbian|gay|transgender|'
    r'eunuch|castrat\w*|slave\w*|racis\w*|nazi\w*|terror\w*|bomb\w*|gun\w*|weapon\w*)\b',
    re.I)

freq = {}
for i, line in enumerate(open(freq_path, encoding='utf-8')):
    s = line.split(' ')[0]
    freq.setdefault(unicodedata.normalize('NFC', s), i)


def tier(word):
    r = max(freq.get(s, 10**9) for s in word.split(' '))
    return 1 if r < 1500 else 2 if r < 5000 else 3


words = {}
for line in open(src, encoding='utf-8'):
    e = json.loads(line)
    w = unicodedata.normalize('NFC', e.get('word', '').strip())
    parts = w.split(' ')
    if len(parts) != 2 or not all(VI.match(p) for p in parts):
        continue
    if e.get('pos', '') in BAD_POS or set(parts) & BAD_SYLLABLES or w in BAD_WORDS:
        continue
    senses = e.get('senses', [])
    tags, glosses = set(), []
    for s in senses:
        tags |= set(s.get('tags', []))
        for c in s.get('categories', []) or []:
            name = (c.get('name', '') if isinstance(c, dict) else str(c)).lower()
            if any(b in name for b in ('vulgar', 'offensive', 'derogatory', 'sex', 'swear')):
                tags.add('vulgar')
        g = s.get('glosses') or []
        if g:
            glosses.append(g[0])
    if tags & BAD_TAGS or any(BAD_GLOSS.search(g) for g in glosses):
        continue
    if tags & OLD_TAGS and len(senses) <= 1:
        continue
    gloss = next((g for g in glosses if g), '')
    gloss = re.sub(r'\s*\([^)]*\)', '', gloss).strip().rstrip('.')
    if not gloss:
        continue
    variant = re.match(r'(alternative form|alternative spelling|short for|synonym) of ', gloss, re.I)
    if len(gloss) > 48:
        gloss = gloss[:46].rsplit(' ', 1)[0].rstrip(',;') + '…'
    # spelling variants are accepted from players but never offered by the computer
    t = 3 if variant else tier(w)
    if w not in words or t < words[w][1]:
        words[w] = (gloss, t)

# everyday words Wiktionary lacks (scripts/noitu-extra.py), always tier 1
sys.path.insert(0, 'scripts')
from importlib import import_module
for w, g in import_module('noitu-extra').EXTRA:
    if w not in words or words[w][1] > 1:
        words[w] = (words[w][0] if w in words else g, 1)

# words for children (scripts/noitu-kids.py): tier 0, used first by the easy computer,
# hints and opening words. Matched across both tone placements (hoà / hòa).
def canon(s):
    s = unicodedata.normalize('NFD', s.lower())
    s = re.sub(r'o([\u0300\u0301\u0303\u0309\u0323])([ae])(?=\s|$)', r'o\2\1', s)
    s = re.sub(r'u([\u0300\u0301\u0303\u0309\u0323])y(?=\s|$)', r'uy\1', s)
    return unicodedata.normalize('NFC', s)


kids = import_module('noitu-kids')
by_canon = {}
for w in words:
    by_canon.setdefault(canon(w), []).append(w)
for w, g in kids.KIDS_NEW.items():
    if canon(w) not in by_canon and w not in kids.KIDS_DROP:
        words[w] = (g, 0)
        by_canon[canon(w)] = [w]
for w in kids.KIDS:
    for k in by_canon.get(canon(w), []):
        words[k] = (words[k][0], 0)

out = sorted(([w, g, t] for w, (g, t) in words.items()), key=lambda x: x[0])
json.dump({'w': out}, open(OUT, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
from collections import Counter
print(len(out), Counter(t for _, _, t in out), file=sys.stderr)
