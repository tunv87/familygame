"""Hand-written everyday words for Nối từ that Wiktionary does not list as entries
(mostly classifier + noun, like "con mèo"). Written for this project; no third-party data."""

ANIMALS = {
    'mèo': 'cat', 'chó': 'dog', 'gà': 'chicken', 'vịt': 'duck', 'lợn': 'pig', 'heo': 'pig',
    'bò': 'cow', 'trâu': 'water buffalo', 'ngựa': 'horse', 'dê': 'goat', 'cừu': 'sheep',
    'thỏ': 'rabbit', 'chuột': 'mouse', 'chim': 'bird', 'cá': 'fish', 'tôm': 'shrimp',
    'cua': 'crab', 'ốc': 'snail', 'ếch': 'frog', 'rùa': 'turtle', 'rắn': 'snake',
    'voi': 'elephant', 'hổ': 'tiger', 'cọp': 'tiger', 'sư tử': None, 'gấu': 'bear',
    'khỉ': 'monkey', 'hươu': 'deer', 'nai': 'deer', 'cáo': 'fox', 'sói': 'wolf',
    'ong': 'bee', 'bướm': 'butterfly', 'kiến': 'ant', 'muỗi': 'mosquito', 'ruồi': 'fly',
    'nhện': 'spider', 'sâu': 'caterpillar', 'giun': 'worm', 'dơi': 'bat', 'cò': 'stork',
    'vẹt': 'parrot', 'quạ': 'crow', 'cú': 'owl', 'công': 'peacock', 'ngỗng': 'goose',
    'nghé': 'buffalo calf', 'bê': 'calf', 'sóc': 'squirrel', 'nhím': 'hedgehog',
    'mực': 'squid', 'sứa': 'jellyfish', 'hến': 'clam', 'sò': 'cockle', 'tép': 'small shrimp',
    'lươn': 'eel', 'chạch': 'loach', 'dế': 'cricket', 've': 'cicada', 'chuồn': None,
    'cóc': 'toad', 'nhái': 'small frog', 'thằn lằn': None, 'tắc kè': None,
}
BABY = ['mèo', 'chó', 'gà', 'vịt', 'lợn', 'heo', 'bò', 'trâu', 'ngựa', 'dê', 'cừu', 'thỏ',
        'chuột', 'chim', 'cá', 'voi', 'hổ', 'gấu', 'khỉ', 'hươu', 'nai', 'cáo', 'sói', 'ngỗng']
FRUITS = {
    'cam': 'orange', 'chuối': 'banana', 'táo': 'apple', 'nho': 'grape', 'xoài': 'mango',
    'dứa': 'pineapple', 'dừa': 'coconut', 'đào': 'peach', 'lê': 'pear', 'mận': 'plum',
    'ổi': 'guava', 'na': 'custard apple', 'mít': 'jackfruit', 'vải': 'lychee',
    'nhãn': 'longan', 'bưởi': 'pomelo', 'chanh': 'lime', 'quýt': 'tangerine', 'dưa': 'melon',
    'khế': 'star fruit', 'hồng': 'persimmon', 'sấu': 'dracontomelon', 'me': 'tamarind',
    'bơ': 'avocado', 'roi': 'rose apple', 'thị': 'gold apple', 'mơ': 'apricot',
    'trứng': 'egg', 'bóng': 'ball', 'núi': 'mountain', 'đất': 'earth ball',
}
FLOWERS = {
    'hồng': 'rose', 'sen': 'lotus', 'súng': 'water lily', 'cúc': 'chrysanthemum',
    'mai': 'apricot blossom', 'đào': 'peach blossom', 'lan': 'orchid', 'huệ': 'tuberose',
    'ly': 'lily', 'nhài': 'jasmine', 'lài': 'jasmine', 'mười giờ': None, 'phượng': 'flame flower',
    'gạo': 'kapok flower', 'sữa': 'milk flower', 'giấy': 'bougainvillea', 'ban': 'bauhinia',
    'tulip': 'tulip', 'cải': 'mustard flower',
}
TREES = {
    'bàng': 'tropical almond tree', 'đa': 'banyan tree', 'si': 'ficus tree', 'tre': 'bamboo',
    'thông': 'pine tree', 'dừa': 'coconut tree', 'chuối': 'banana tree', 'cau': 'areca palm',
    'xoài': 'mango tree', 'mít': 'jackfruit tree', 'nhãn': 'longan tree', 'táo': 'apple tree',
    'cam': 'orange tree', 'bưởi': 'pomelo tree', 'phượng': 'flame tree', 'liễu': 'willow',
    'sen': 'lotus plant', 'lúa': 'rice plant', 'ngô': 'corn plant', 'mía': 'sugarcane',
    'xanh': 'tree', 'cảnh': 'ornamental plant', 'thuốc': 'medicinal plant',
}
COLORS = {
    'đỏ': 'red', 'xanh': 'blue or green', 'vàng': 'yellow', 'trắng': 'white', 'đen': 'black',
    'tím': 'purple', 'hồng': 'pink', 'nâu': 'brown', 'xám': 'grey', 'cam': 'orange colour',
    'be': 'beige', 'bạc': 'silver', 'lục': 'green',
}
THINGS = {  # cái + noun
    'bàn': 'table', 'ghế': 'chair', 'giường': 'bed', 'tủ': 'cupboard', 'cốc': 'cup',
    'chén': 'small bowl', 'bát': 'bowl', 'đĩa': 'plate', 'thìa': 'spoon', 'muỗng': 'spoon',
    'nồi': 'pot', 'chảo': 'pan', 'kéo': 'scissors', 'bút': 'pen', 'thước': 'ruler',
    'cặp': 'school bag', 'mũ': 'hat', 'nón': 'conical hat', 'áo': 'shirt', 'quần': 'trousers',
    'ô': 'umbrella', 'dù': 'umbrella', 'gối': 'pillow', 'chăn': 'blanket', 'quạt': 'fan',
    'đèn': 'lamp', 'gương': 'mirror', 'lược': 'comb', 'khăn': 'towel', 'túi': 'bag',
    'hộp': 'box', 'chổi': 'broom', 'xô': 'bucket', 'chậu': 'basin', 'đồng hồ': None,
}
EVERYDAY = {
    'đi học': 'to go to school', 'đi chơi': 'to go out', 'đi ngủ': 'to go to bed',
    'đi làm': 'to go to work', 'đi bộ': 'to walk', 'đi chợ': 'to go to the market',
    'về nhà': 'to go home', 'ăn cơm': 'to have a meal', 'ăn sáng': 'to have breakfast',
    'ăn trưa': 'to have lunch', 'ăn tối': 'to have dinner', 'ăn quà': 'to eat snacks',
    'uống nước': 'to drink water', 'uống sữa': 'to drink milk', 'rửa tay': 'to wash hands',
    'rửa mặt': 'to wash the face', 'đánh răng': 'to brush teeth', 'tắm rửa': 'to wash up',
    'chải đầu': 'to comb hair', 'mặc áo': 'to put on a shirt', 'đọc sách': 'to read a book',
    'viết bài': 'to write a lesson', 'làm bài': 'to do homework', 'học bài': 'to study a lesson',
    'vẽ tranh': 'to draw a picture', 'hát ca': 'to sing', 'múa hát': 'to sing and dance',
    'chơi đùa': 'to play around', 'nhảy dây': 'to skip rope', 'đá bóng': 'to play football',
    'đá cầu': 'to play shuttlecock', 'thả diều': 'to fly a kite', 'trốn tìm': 'hide-and-seek',
    'kéo co': 'tug of war', 'bịt mắt': 'to blindfold', 'xe đạp': 'bicycle', 'xe máy': 'motorbike',
    'xe buýt': 'bus', 'ô tô': 'car', 'tàu hoả': 'train', 'máy bay': 'aeroplane',
    'trường học': 'school', 'lớp học': 'classroom', 'cô giáo': 'female teacher',
    'thầy giáo': 'male teacher', 'bạn thân': 'best friend', 'sân trường': 'schoolyard',
    'bảng đen': 'blackboard', 'viên phấn': 'piece of chalk', 'quyển vở': 'notebook',
    'quyển sách': 'book', 'cục tẩy': 'eraser', 'bút chì': 'pencil', 'hộp bút': 'pencil case',
    'bà nội': 'paternal grandmother', 'ông nội': 'paternal grandfather',
    'bà ngoại': 'maternal grandmother', 'ông ngoại': 'maternal grandfather',
    'bố mẹ': 'parents', 'ba mẹ': 'parents', 'anh chị': 'older siblings', 'em bé': 'baby',
    'trời mưa': 'rainy weather', 'trời nắng': 'sunny weather', 'cầu vồng': 'rainbow',
    'mặt trời': 'the sun', 'mặt trăng': 'the moon', 'ông trăng': 'the moon',
    'ngôi sao': 'star', 'đám mây': 'cloud', 'cơn mưa': 'shower of rain', 'gió mát': 'cool breeze',
    'bánh mì': 'bread', 'bánh bao': 'steamed bun', 'phở bò': 'beef pho', 'phở gà': 'chicken pho',
    'cơm rang': 'fried rice', 'cơm chiên': 'fried rice', 'canh chua': 'sour soup',
    'kem que': 'ice lolly', 'sữa chua': 'yoghurt', 'nước cam': 'orange juice',
    'nước mía': 'sugarcane juice', 'kẹo mút': 'lollipop', 'kẹo dừa': 'coconut candy',
    'trung thu': 'Mid-Autumn Festival', 'đèn lồng': 'lantern', 'mâm cỗ': 'feast tray',
    'lì xì': 'lucky money', 'pháo hoa': 'fireworks', 'chúc tết': 'to give New Year wishes',
    'đồ chơi': 'toy', 'búp bê': 'doll', 'gấu bông': 'teddy bear', 'xếp hình': 'puzzle',
    'cầu trượt': 'slide', 'xích đu': 'swing', 'bập bênh': 'seesaw', 'bóng bay': 'balloon',
}

rows = {}
add = lambda w, g: rows.setdefault(w, g)
for a, g in ANIMALS.items():
    if g and ' ' not in a:
        add(f'con {a}', g)
for a in BABY:
    add(f'{a} con', f'baby {ANIMALS[a]}')
for f, g in FRUITS.items():
    add(f'quả {f}', g)
    if f not in ('trứng', 'bóng', 'núi', 'đất'):
        add(f'trái {f}', g)
for f, g in FLOWERS.items():
    if g and ' ' not in f:
        add(f'hoa {f}', g)
for t, g in TREES.items():
    add(f'cây {t}', g)
for c, g in COLORS.items():
    add(f'màu {c}', g)
for t, g in THINGS.items():
    if g and ' ' not in t:
        add(f'cái {t}', g)
for w, g in EVERYDAY.items():
    add(w, g)
EXTRA = sorted(rows.items())
