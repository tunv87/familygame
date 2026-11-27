# Bật / tắt / ẩn game (dành cho admin)

Sửa trực tiếp trong **Firebase Console → Realtime Database → tab Data**. Không cần build lại app:
người chơi thấy thay đổi lần tới khi mở app (hoặc tải lại trang).

## Cấu trúc

```
config
└─ games
   ├─ caro     { status: "off" }
   ├─ noitu    { status: "hidden" }
   └─ oanquan  { modes: { online: "hidden", solo: "off" } }
```

| Giá trị  | Ý nghĩa                                                       |
| -------- | ------------------------------------------------------------- |
| `on`     | Bình thường (cũng là mặc định khi không ghi gì)               |
| `off`    | Vẫn hiện nhưng mờ, ghi "Đang bảo trì", không bấm vào được     |
| `hidden` | Ẩn hẳn; mở bằng link thì thấy "Trò chơi này tạm thời chưa mở" |

- Mã game: `numbers` (Tìm số), `caro`, `coganh`, `oanquan`, `noitu`, `cangua`.
- Mã chế độ trong `modes`: `solo` (chơi với máy), `local` (cùng máy), `online`, `practice` (Tìm số: luyện tập).
- Game đang `off` / `hidden` thì mọi chế độ của nó cũng vậy.
- `online` tắt: không tạo được phòng mới; phòng đang chơi vẫn chơi nốt.
- Gõ sai (vd `"of"`) được coi là `on`.

## Cách sửa nhanh

1. Ở gốc database, bấm **+** → tên `config` → bấm **+** → `games` → bấm **+** → tên game (vd `caro`).
2. Trong game đó, thêm `status` = `off` (kiểu string), hoặc thêm `modes` → `online` = `hidden`.
3. Muốn mở lại: đổi thành `on` hoặc xoá dòng đó.

Hoặc dùng **⋮ → Import JSON** tại nút `config/games` với nội dung như:

```json
{ "caro": { "status": "off" }, "oanquan": { "modes": { "online": "hidden" } } }
```

App không ghi được vào `config` (rules chỉ cho đọc), nên chỉ người có quyền vào Firebase Console mới đổi được.
