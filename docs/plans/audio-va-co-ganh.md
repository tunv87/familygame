# Plan: Âm thanh + game Cờ gánh

Đã chốt với chủ dự án (23/11/2026):

- Cờ gánh có **luật Mở bắt buộc**; chế độ **giống Ca rô** (chơi với máy 3 mức, 2 người cùng máy, chơi với bạn online).
- Âm thanh **theo giao diện** (Cổ điển / Dễ thương), dùng file âm thanh miễn phí.
- **Nhạc nền**: có, nút bật/tắt riêng, **mặc định tắt**.
- Test trên điện thoại thật làm sau.

---

## Phần A – Thiết kế âm thanh

### Nguồn âm thanh

- Gói npm `@wubbleai/community-sfx` (bản sao nguyên vẹn thư viện **UI SFX**, https://github.com/romainsimon/uisfx), giấy phép **CC0 1.0**: dùng tự do, cả thương mại, không bắt buộc ghi nguồn. Vẫn ghi nguồn trong màn Giới thiệu và `public/sounds/LICENSE`.
- Mỗi phong cách có 78 âm cùng tên. Chọn 2 phong cách: **soft** (Cổ điển: nhẹ, êm cho người lớn tuổi) và **rubber** (Dễ thương: nảy, vui cho bé). Nghe thử cả _dreamy_ rồi chốt.
- Chỉ chép **khoảng 18 file mp3 mỗi phong cách** vào `public/sounds/<theme>/` (mp3 chạy được trên mọi iPhone; ogg không chạy trên iOS cũ). Tổng dự kiến dưới 300 KB, được cache để chơi offline.
- Các trang tải âm thanh khác (Kenney, Freesound, OpenGameArt) bị chặn từ môi trường build, nên dùng gói trên npm.

### Bảng sự kiện → âm thanh (bản nháp, chốt sau khi nghe thử)

| Sự kiện                     | Khi nào                              | Âm (soft / rubber)     | Rung       |
| --------------------------- | ------------------------------------ | ---------------------- | ---------- |
| `tap`                       | Bấm nút, chọn thẻ                    | press                  | nhẹ        |
| `toggle`                    | Bật/tắt trong Cài đặt                | toggle-on / toggle-off | —          |
| `open` / `close`            | Mở / đóng hộp thoại                  | open / close           | —          |
| `place`                     | Đặt quân ca rô, đi quân cờ gánh      | snap                   | nhẹ        |
| `select`                    | Chọn quân cờ gánh để đi              | select                 | —          |
| `correct`                   | Tìm đúng số                          | check                  | nhẹ        |
| `wrong`                     | Bấm sai số, ô không hợp lệ           | invalid-drop           | lỗi        |
| `opponent`                  | Máy / bạn chơi cùng vừa đi           | receive                | —          |
| `tick` / `go`               | Đếm ngược 3-2-1 / bắt đầu            | progress-step / start  | —          |
| `capture`                   | **Gánh** được quân                   | bonus                  | vừa        |
| `captureBig`                | Gánh nhiều (chầu 4, chầu 6), **Vây** | streak                 | mạnh       |
| `forced`                    | Bị **Mở**: phải đi nước bắt buộc     | warning                | —          |
| `win`                       | Thắng                                | achievement            | thành công |
| `lose`                      | Thua                                 | retry                  | —          |
| `draw`                      | Hoà                                  | complete               | —          |
| `record`                    | Kỷ lục mới (Luyện tập)               | level-up               | thành công |
| `friendJoin` / `friendLeft` | Bạn vào / rời phòng                  | connect / disconnect   | —          |
| `offline`                   | Mất mạng                             | warning                | —          |

### Kỹ thuật

- `src/lib/audio.ts` thay `sound.ts`: tải file bằng Web Audio (`AudioBuffer`), giải mã một lần, phát gần như không trễ. Mở khoá âm thanh ở lần chạm đầu (iOS bắt buộc). Không phát lại cùng một âm trong khoảng 40 ms (tránh rè khi bấm loạn). Âm lượng chuẩn hoá theo từng sự kiện.
- Giữ API cũ `sfx.xxx()` để không phải sửa nhiều chỗ, nhưng chuyển hết sang tên sự kiện ở bảng trên. Nếu file chưa tải xong hoặc lỗi thì dùng âm tổng hợp hiện có, không bao giờ im lặng hẳn và không bao giờ lỗi.
- Đổi giao diện thì đổi luôn bộ âm thanh.
- **Nhạc nền** `src/lib/music.ts`: giai điệu ngũ cung nhẹ tự sinh bằng Web Audio (không cần file, không có vấn đề bản quyền), lặp khoảng 30 giây, âm lượng thấp. Tự nhỏ đi khi có hiệu ứng thắng/thua. Tạm dừng khi app chạy nền hoặc khi tab bị ẩn.
- Cài đặt: tách thành **Âm thanh**, **Rung** (chỉ hiện trên điện thoại) và **Nhạc nền** (mặc định Tắt). Dữ liệu cũ `sound: false` được chuyển sang tắt cả âm thanh lẫn rung.
- App native: file nằm sẵn trong app; rung dùng Haptics đã có.

---

## Phần B – Game Cờ gánh

### Luật (bản dùng trong app – cần chủ dự án xác nhận)

- **Bàn**: 5×5 = 25 điểm. Có đường ngang, đường dọc, và đường chéo ở các điểm có (hàng + cột) chẵn (kiểu bàn alquerque).
- **Xếp quân** (mỗi bên 8): bên A chiếm cả hàng trên (5 quân), 2 đầu hàng thứ 2, và đầu phải hàng giữa; bên B đối xứng ở phía dưới.
- **Đi**: mỗi lượt đi 1 quân 1 bước theo đường kẻ, tới điểm trống kề bên.
- **Gánh**: quân vừa đi tới nằm **giữa 2 quân địch thẳng hàng** thì 2 quân đó **đổi sang màu mình**. Xét mọi hướng cùng lúc, nên một nước có thể gánh 2 đôi (chầu 4) hoặc 3 đôi (chầu 6). Tự đi vào giữa 2 quân địch thì **không** bị gánh.
- **Vây (chẹt)**: sau nước đi, mọi nhóm quân địch nối liền nhau mà **không còn điểm trống kề** thì đổi sang màu mình.
- **Mở (bắt buộc)**: đối phương vừa rời một điểm khiến điểm đó nằm giữa 2 quân của họ, và mình có quân đi vào gánh được, thì mình **phải** đi nước gánh đó (có nhiều quân đi vào được thì chọn một). App tô sáng nước bắt buộc và khoá các nước khác.
- **Thắng**: đối phương hết quân (tất cả đã bị đổi màu). **Hoà**: 60 nước liên tiếp không ai gánh/vây được (chống ván kéo dài vô hạn), hoặc cùng thế cờ lặp lại 3 lần.

### Cấu trúc (theo cách làm của Ca rô)

| File                                                     | Nội dung                                                                                                                                                                                            |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/games/coganh/logic.ts`                              | Bàn, kề nhau, xếp quân, nước đi hợp lệ, gánh, vây, mở, thắng/hoà (hàm thuần, không phụ thuộc giao diện)                                                                                             |
| `src/games/coganh/ai.ts`                                 | Máy 3 mức: **Dễ** đi ngẫu nhiên, ưu tiên nước gánh nhưng hay bỏ lỡ; **Vừa** tìm trước 2 nước; **Khó** alpha-beta 4–5 nước, đánh giá theo số quân và số nước đi được. Mục tiêu dưới 300 ms mỗi nước. |
| `src/games/coganh/online.ts`                             | Trạng thái online (bàn dạng chuỗi 25 ký tự, lượt, nước vừa đi, đếm nước), `applyCoGanhMove` kiểm tra hợp lệ trong transaction giống `applyCaroMove`                                                 |
| `CoGanhBoard.tsx`                                        | Bàn vẽ bằng SVG, co theo màn hình. Quân to (≥ 52 px trên iPhone SE). Chạm quân để chọn, các điểm đi được hiện ra, chạm điểm để đi. Hiệu ứng lật màu khi bị gánh/vây. Nước bắt buộc nhấp nháy.       |
| `CoGanhSetup.tsx`, `CoGanhLocal.tsx`, `CoGanhOnline.tsx` | Như ca rô: chọn chế độ → mức → chơi; đi lại (Undo), ván mới, hỏi trước khi thoát, kết quả                                                                                                           |
| `help.ts`                                                | Hướng dẫn 3 bước có hình minh hoạ gánh / vây / mở                                                                                                                                                   |
| Khác                                                     | `registry.ts` (thẻ Cờ gánh ở trang chủ, icon theo giao diện), i18n VI/EN, `room.ts` (tạo ván mới, đổi người đi trước mỗi ván), giao diện Dễ thương (quân 💖/⭐)                                     |

### Firebase

- `database.rules.json`: thêm `'coganh'` vào danh sách game hợp lệ. **Sau khi merge, chủ dự án dán lại rules lên Firebase Console.**

### Store

- Mô tả, từ khoá VI/EN thêm "Cờ gánh" (từ khoá: _cờ gánh, cờ chém, trò chơi dân gian_). Tạo lại ảnh store bằng `npm run store:screenshots` với cảnh Cờ gánh.

---

## Phần C – Kiểm thử (dùng lại bộ QA đã có)

- **LG**: xếp quân, đi đúng đường, gánh 1/2/3 đôi, không tự bị gánh, vây 1 quân và cả nhóm, mở bắt buộc, thắng, hoà sau 60 nước và lặp 3 lần, chuỗi online. Máy không bao giờ đi nước sai luật (thử 1.000 thế cờ), luôn gánh khi bị bắt buộc, chạy dưới 300 ms.
- **UI**: bàn Cờ gánh nằm gọn trong 11 kích thước màn hình, quân ≥ 44 px trên điện thoại; chụp ảnh evidence cả 2 giao diện.
- **UX**: chọn quân hiện nước đi được; nước bắt buộc được tô và khoá nước khác; có âm/rung cho gánh; Undo; hỏi trước khi thoát.
- **Âm thanh**: mỗi sự kiện có file ở cả 2 bộ âm; đổi giao diện thì đổi bộ âm; tắt âm thì không phát; nhạc nền mặc định tắt và giữ lựa chọn sau khi tải lại; file âm thanh được cache offline; bấm loạn không lỗi.
- **CR**: tham số link sai cho Cờ gánh, dữ liệu phòng hỏng, mất mạng giữa ván online.
- **SEC**: rules chấp nhận `coganh`, từ chối game lạ; nước đi online sai luật bị từ chối.
- Chạy `npm run qa` theo vòng lặp sửa → chạy lại đến khi sạch, lưu evidence như lần trước.

---

## Thứ tự làm & ước lượng

| Bước | Việc                                                                | Ước lượng |
| ---- | ------------------------------------------------------------------- | --------- |
| 1    | Âm thanh: chọn file, `audio.ts`, gán sự kiện, Cài đặt mới, nhạc nền | 0,5 ngày  |
| 2    | Cờ gánh: logic + unit test (làm trước, vì luật quyết định mọi thứ)  | 0,5 ngày  |
| 3    | Cờ gánh: AI + test                                                  | 0,5 ngày  |
| 4    | Cờ gánh: giao diện, chơi với máy, cùng máy                          | 0,5 ngày  |
| 5    | Cờ gánh online + rules                                              | 0,5 ngày  |
| 6    | QA (thêm case, chạy vòng lặp đến sạch), trang store, ảnh            | 0,5 ngày  |

## Việc của chủ dự án

1. Xác nhận luật Cờ gánh ở Phần B (đặc biệt cách xếp quân và luật hoà), hoặc chỉ ra chỗ khác với cách nhà mình hay chơi.
2. Sau khi merge: dán lại `database.rules.json` lên Firebase.
3. Nghe thử bộ âm thanh trên điện thoại khi có bản mới, góp ý nếu cần đổi.
