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

### Luật (theo đặc tả của chủ dự án, 23/11/2026, đã review)

Toạ độ `(x, y)`: x là cột, y là hàng, từ 0 đến 4.

1. **Bàn**: 25 điểm. Mọi điểm nối 4 hướng ngang/dọc. Điểm có `(x + y) % 2 == 0` nối thêm 4 hướng chéo. Bảng kề nhau (adjacency) và bảng "đường thẳng qua mỗi điểm" được tính sẵn một lần.
2. **Xếp quân**: Đen (đi trước) ở `(0..4,0)`, `(0,1)`, `(4,1)`, `(0,2)`. Trắng ở `(4,2)`, `(0,3)`, `(4,3)`, `(0..4,4)`. Hai bên đối xứng tâm qua `(2,2)`.
3. **Đi**: 1 quân sang điểm kề và trống. Không nhảy qua quân.
4. **Thứ tự xử lý một nước đi**: di chuyển → **Gánh** → cập nhật bàn → **Chẹt** → kiểm tra thắng/hoà → tính nước **Mở** bắt buộc cho lượt sau.
5. **Gánh**: trên mỗi trục qua điểm đích (2 trục, hoặc 4 trục ở điểm chẵn), nếu 2 điểm kề hai bên đều là quân đối phương thì cả 2 đổi màu. Gánh nhiều trục cùng lúc được (2–4 cặp).
6. **Chẹt**: mọi nhóm quân đối phương nối liền nhau (theo bảng kề) mà không còn điểm trống kề nào thì đổi màu toàn bộ.
7. **Mở**: `bắt buộc = các nước gánh của đối phương sau nước vừa đi` **trừ** `các nước gánh mà đối phương đã có sẵn trên bàn trước nước đó`. Nếu tập này không rỗng thì lượt kế tiếp chỉ được chọn trong tập này. Ràng buộc chỉ kéo dài 1 lượt.
8. **Thắng**: đối phương hết quân. (Luật "hết nước đi thì thua" vẫn được cài để phòng hờ, nhưng theo luật Chẹt thì không bao giờ xảy ra, xem ghi chú review.)
9. **Hoà**: cùng thế cờ (vị trí quân + bên đi + nước bắt buộc) lặp lại 3 lần, hoặc **100 lượt đi liên tiếp** (tính cả hai bên) không có quân nào đổi màu.

### Ghi chú review đặc tả

| #   | Điểm                                                                                                                                                                                                                          | Quyết định trong code                                                                                                                                                                           |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1  | Cách xếp quân khác bản nháp ban đầu (quân lẻ ở hàng giữa nằm bên trái cho Đen)                                                                                                                                                | Theo đặc tả                                                                                                                                                                                     |
| R2  | Hoà sau N nước: đặc tả 100, plan cũ 60                                                                                                                                                                                        | Theo đặc tả: 100 lượt đi (khoảng 50 mỗi bên)                                                                                                                                                    |
| R3  | "Hết nước đi thì thua" không bao giờ xảy ra: một nhóm không còn nước đi chính là một nhóm không còn điểm trống kề, và nhóm đó đã bị Chẹt đổi màu ngay cuối lượt trước. Do đó mọi quân còn lại của bên sắp đi luôn có nước đi. | Vẫn cài, kèm unit test chứng minh trường hợp này không thể xảy ra                                                                                                                               |
| R4  | Đặc tả nêu 2 ví dụ Mở: (a) rút quân để hở khe, (b) đưa quân vào thế bị kẹp. Hai ví dụ dẫn tới 2 cách hiểu khác nhau.                                                                                                          | Dùng định nghĩa thuật toán ở mục 7 (so sánh trước/sau theo cặp _từ ô → tới ô_). Định nghĩa này bao gồm cả (a), (b), và trường hợp nước gánh của bên vừa đi tạo ra thế gánh mới cho đối phương.  |
| R5  | Không có phản ứng dây chuyền: quân vừa bị đổi màu không gánh tiếp                                                                                                                                                             | Nói rõ trong code và có test                                                                                                                                                                    |
| R6  | Chẹt chỉ cần chạy 1 lần: đổi màu không làm thay đổi ô trống, nên khí của các nhóm khác giữ nguyên                                                                                                                             | Chạy 1 lần, có test                                                                                                                                                                             |
| R7  | Tự đi vào giữa 2 quân đối phương thì **không** bị gánh (gánh chỉ do bên vừa đi gây ra)                                                                                                                                        | Theo luật truyền thống, có test                                                                                                                                                                 |
| R8  | Chẹt chỉ áp cho quân đối phương. Nhóm quân của chính bên vừa đi mà hết khí thì không đổi màu.                                                                                                                                 | Theo đặc tả, có test                                                                                                                                                                            |
| R9  | Ai đi trước mỗi ván                                                                                                                                                                                                           | Ván 1 người tạo phòng / Người 1 cầm Đen (đi trước). Mỗi ván mới đổi bên, giống Ca rô.                                                                                                           |
| R10 | Cấu trúc dữ liệu                                                                                                                                                                                                              | Mảng 25 ô (`Int8Array`) với bảng kề và bảng trục tính sẵn. Bàn chỉ có 25 điểm nên chưa cần bitboard: alpha-beta 4–5 nước vẫn dưới 300 ms. Sẽ đo thật; nếu chậm mới chuyển sang bitboard 32 bit. |

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

- **LG** (theo đặc tả): bảng kề (không đi chéo ở điểm lẻ), xếp quân đối xứng; gánh đơn, gánh nhiều trục (2–4 cặp); gánh làm hở đường thở cho nhóm đang bị vây; chẹt 1 quân và cả nhóm lớn; không có phản ứng dây chuyền (R5–R8); Mở kiểu (a) rút quân, (b) đưa quân vào thế bị kẹp, và thế gánh có sẵn không bị bắt buộc; ràng buộc Mở chỉ kéo dài 1 lượt; thắng; hoà sau 100 lượt và lặp 3 lần; trường hợp R3; kiểm tra nước đi online. Máy không bao giờ đi nước sai luật (thử 1.000 thế cờ), luôn gánh khi bị bắt buộc, chạy dưới 300 ms.
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

1. ~~Xác nhận luật Cờ gánh~~: đã có đặc tả (23/11). Chỉ cần xem 10 quyết định ở mục "Ghi chú review đặc tả".
2. Sau khi merge: dán lại `database.rules.json` lên Firebase.
3. Nghe thử bộ âm thanh trên điện thoại khi có bản mới, góp ý nếu cần đổi.
