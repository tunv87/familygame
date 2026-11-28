"""Clean up the English meanings in src/games/noitu/words.json (run after build-noitu-words.py,
which also calls it). Two kinds of fixes:

1. Meanings that only point at another word ("alternative spelling of X", "synonym of X",
   "Traditional tone placement spelling of X", "Southern Vietnam form of X", ...) take the
   meaning of X, so children see "the Sun" instead of "alternative letter-case form of Mặt Trời".
2. FIXES: hand-checked meanings for common words where Wiktionary's first sense is a rare one
   (e.g. "trứng gà" is listed only as the canistel fruit, not as a hen's egg).
   Written for this project.

Usage: python3 scripts/noitu-fix-glosses.py
"""
import json
import re
import unicodedata

PATH = 'src/games/noitu/words.json'

FIXES = {
    'trứng gà': "chicken egg; hen's egg",
    'bình an': 'safe and sound; peaceful',
    'mặt trăng': 'the Moon',
    'mặt trời': 'the Sun',
    'thơ ca': 'poetry',
    'đèn lồng': 'lantern',
    'đi chơi': 'to go out; to have fun',
    'hạt dẻ': 'chestnut',
    'cả nhà': 'the whole family',
    'bến xe': 'bus station',
    'dài dài': 'long, lasting',
    'bưu điện': 'post office',
    'học trò': 'pupil; student',
    'bầu trời': 'the sky',
    'công an': 'police',
    'sân bay': 'airport',
    'chắc chắn': 'certain; firm, stable',
    'cảm giác': 'feeling',
    'sữa tươi': 'fresh milk',
    'nhà em': 'my home',
    'quả đất': 'the Earth',
    'xin chào': 'hello',
    'mĩ thuật': 'fine arts',
    'bánh mì': 'bread; Vietnamese baguette sandwich',
    'bánh nướng': 'baked mooncake',
    'bánh dẻo': 'soft mooncake',
    'bánh rán': 'fried glutinous rice ball',
    'bánh chưng': 'square sticky rice cake (for Tết)',
    'bánh tét': 'cylindrical sticky rice cake (for Tết)',
    'bánh chay': 'rice dumplings in ginger syrup',
    'bánh cuốn': 'steamed rice rolls',
    'bánh xèo': 'Vietnamese sizzling pancake',
    'bánh đúc': 'savoury rice cake',
    'bánh đa': 'rice cracker; rice paper',
    'canh chua': 'sweet and sour soup',
    'kẹo dừa': 'coconut candy',
    'xe máy': 'motorbike',
    'đá cầu': 'shuttlecock kicking (a game)',
    'cây cối': 'trees and plants',
    'cây xanh': 'green trees',
    'nhảy xa': 'long jump',
    'nhảy dây': 'to skip rope',
    'ra chơi': 'break time; to go out to play',
    'thủ đô': 'capital city',
    'sắc màu': 'colours',
    'bò con': 'calf',
    'chó con': 'puppy',
    'mèo con': 'kitten',
    'cá nhân': 'personal; individual',
    'cậu bé': 'little boy',
    'hội hoạ': 'painting (the art)',
    'hạt dẻ cười': 'pistachio',
    'bộ đội': 'soldier',
    'gà trống': 'rooster',
    'bà xã': 'wife (informal)',
    'ông xã': 'husband (informal)',
    'anh đào': 'cherry',
    'gà lôi': 'pheasant',
    'dù dì': 'owl',
    'ràng ràng': 'ormosia (a tree)',
    'u du': 'sedge',
    'đương quy': 'angelica (a medicinal herb)',
    'trai lí': 'a garcinia shrub',
    'hay là': 'or; or else',
    'đề đốc': 'rear admiral',
    'kịch câm': 'pantomime; mime',
    'thủ phủ': 'capital (of a province or state)',
    'mì tôm': 'instant noodles',
    'đồng loại': 'fellow creature',
    'gần gụi': 'close; intimate',
    'muôn nước': 'all nations',
    'trấy cơn': 'fruit',
    'đẻo đai': 'tough; resilient',
    'bị chú': 'note; annotation',
    'chú dẫn': 'explanatory note',
    'phụ chú': 'footnote; additional note',
    'tính trội': 'dominant trait',
    'lúa chiêm': 'winter-spring rice crop',
    'me tây': 'rain tree (monkeypod)',
    'thiên chủ': 'God (the Lord)',
    'thuỷ quan': 'water god',
    'thái dương': 'the Sun; temple (of the head)',
    'thánh giá': 'the Holy Cross; crucifix',
    'tây hóa': 'to westernize',
    'đông y': 'traditional Eastern medicine',
    'cấp ủy': 'party committee',
    'hóa công': 'the Creator; nature',
    'hỏa mù': 'smoke screen',
    'ma túy': 'drugs; narcotics',
    'túy quyền': 'drunken boxing (kung fu)',
    'tụy đạo': 'pancreatic duct',
    'đôla hóa': 'dollarization',
    'đồi trụy': 'depraved; decadent',
}


def canon(s):
    """Same word whatever the tone placement (hoà / hòa, thuỷ / thủy)."""
    s = unicodedata.normalize('NFD', s.lower())
    s = re.sub(r'o([\u0300\u0301\u0303\u0309\u0323])([ae])(?=\s|$)', r'o\2\1', s)
    s = re.sub(r'u([\u0300\u0301\u0303\u0309\u0323])y(?=\s|$)', r'uy\1', s)
    return unicodedata.normalize('NFC', s)

POINTER = re.compile(
    r'^(?:(?:an? )?alternative (?:letter-case )?(?:form|spelling)'
    r'|(?:[a-z ]*?)synonym|traditional tone placement spelling|(?:southern|northern) vietnam form'
    r'|(?:[a-z ]+ )?vietnam(?: and [a-z ]+ vietnam)? form|short for|see)\s+of\s+(.+?)$|^see\s+(.+?)$',
    re.I,
)


def main():
    data = json.load(open(PATH, encoding='utf-8'))
    rows = data['w']
    by_word = {r[0]: r for r in rows}
    by_lower = {r[0].lower(): r for r in rows}
    by_canon = {}
    for r in rows:
        by_canon.setdefault(canon(r[0]), []).append(r)

    def resolve(gloss, seen):
        m = POINTER.match(gloss)
        if not m:
            return gloss
        target = (m.group(1) or m.group(2) or '').strip().split(' and ')[0].strip().lower()
        r = by_word.get(target) or by_lower.get(target)
        if not r or target in seen or len(r) > 3:
            return None
        return resolve(r[1], seen | {target})

    fixed, unresolved = 0, []
    for r in rows:
        if len(r) > 3:  # Vietnamese meaning, not an English gloss
            continue
        if r[0] in FIXES:
            if r[1] != FIXES[r[0]]:
                r[1] = FIXES[r[0]]
                fixed += 1
            continue
        if POINTER.match(r[1]):
            g = resolve(r[1], {r[0]})
            if not g:  # e.g. "Traditional tone placement spelling of hoà…" (cut short)
                g = next(
                    (
                        o[1]
                        for o in by_canon.get(canon(r[0]), [])
                        if o is not r and len(o) == 3 and not POINTER.match(o[1])
                    ),
                    None,
                )
            if g:
                r[1] = g
                fixed += 1
            else:
                unresolved.append(r)
    # still pointing elsewhere: rare words (the game never offers them), left as they are
    json.dump(data, open(PATH, 'w', encoding='utf-8'), ensure_ascii=False, separators=(',', ':'))
    print(f'fixed {fixed} meanings; {len(unresolved)} rare words still point to another word')
    for r in unresolved:
        if r[2] <= 2:
            print('  common word left unresolved:', r)


if __name__ == '__main__':
    main()
