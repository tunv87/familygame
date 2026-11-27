# QA run 19

Thời gian: 2026-11-27 12:16 UTC
Test tự động: 255 (254 pass, 1 fail, 0 skip)

## Tổng hợp theo nhóm

| Nhóm | Case | PASS | FAIL | NOT RUN |
| --- | --- | --- | --- | --- |
| UI | 13 | 13 | 0 | 0 |
| UX | 31 | 31 | 0 | 0 |
| CR | 17 | 17 | 0 | 0 |
| LG | 31 | 31 | 0 | 0 |
| AU | 10 | 10 | 0 | 0 |
| SEC | 13 | 13 | 0 | 0 |
| BR | 7 | 6 | 1 | 0 |
| **Tổng** | **122** | **121** | **1** | **0** |

## Kết quả từng case

| Case | Ưu tiên | Kết quả | Số test | Kiểm tra |
| --- | --- | --- | --- | --- |
| UI-01 | P1 | ✅ PASS | 14 | Mở từng màn hình chính trên D1–D10 |
| UI-02 | P1 | ✅ PASS | 14 | Nút điều khiển trên D1–D5 (không tính quân cờ/ô số) |
| UI-02b | P1 | ✅ PASS | 14 | Ô chơi game (ô ca rô 3×3, vùng bấm số mức Dễ/Vừa) trên D1–D5 |
| UI-03 | P1 | ✅ PASS | 14 | Bàn Tìm số mức Khó trên D1–D10 |
| UI-04 | P1 | ✅ PASS | 14 | Bàn ca rô 3×3 trên D1–D10 |
| UI-05 | P2 | ✅ PASS | 14 | Chữ trên D1 |
| UI-06 | P1 | ✅ PASS | 14 | Hộp thoại (kết quả, thoát, chào mừng) trên D1 |
| UI-07 | P2 | ✅ PASS | 14 | Chụp ảnh mọi màn hình × thiết bị × 2 giao diện |
| UI-08 | P2 | ✅ PASS | 1 | iPad xoay ngang (D11 1366×1024) |
| UI-09 | P1 | ✅ PASS | 19 | Bàn Cờ gánh trên D1–D5, cả 2 giao diện |
| UI-10 | P1 | ✅ PASS | 5 | Bàn Ô ăn quan trên D1–D5, cả 2 giao diện |
| UI-11 | P1 | ✅ PASS | 5 | Nối từ trên D1–D5, cả 2 giao diện |
| UI-12 | P1 | ✅ PASS | 3 | Máy tính và iPad xoay ngang (D8, D9, D11) |
| UX-01 | P1 | ✅ PASS | 1 | Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi) |
| UX-02 | P1 | ✅ PASS | 1 | Máy (AI) đi nước ca rô 15×15 mức Khó |
| UX-03 | P1 | ✅ PASS | 1 | Mọi màn hình |
| UX-04 | P1 | ✅ PASS | 1 | Thoát giữa ván (ca rô, Tìm số) |
| UX-05 | P1 | ✅ PASS | 1 | Kết thúc ván |
| UX-06 | P2 | ✅ PASS | 1 | Tìm số: không bấm gì 30 giây |
| UX-07 | P1 | ✅ PASS | 1 | Đi lại (Undo) trong ca rô với máy |
| UX-08 | P2 | ✅ PASS | 1 | Bật "Chữ to" |
| UX-09 | P1 | ✅ PASS | 1 | Đổi cài đặt (giao diện, ngôn ngữ, âm thanh) rồi tải lại |
| UX-10 | P1 | ✅ PASS | 1 | Người dùng bản cũ đã tắt "Âm thanh & rung" (một công tắc), rồi cập nhật lên bản có công tắc Rung riêng |
| UX-11 | P1 | ✅ PASS | 1 | Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu |
| UX-12 | P2 | ✅ PASS | 1 | Chơi lại ván Tìm số |
| UX-13 | P1 | ✅ PASS | 1 | Nhập mã phòng không tồn tại |
| UX-14 | P1 | ✅ PASS | 1 | Mất mạng rồi bấm "Tạo phòng" |
| UX-15 | P2 | ✅ PASS | 1 | Màn hình chào mừng chỉ hiện lần đầu |
| UX-16 | P1 | ✅ PASS | 1 | Cờ gánh: chạm quân |
| UX-17 | P1 | ✅ PASS | 1 | Cờ gánh: bị Mở |
| UX-18 | P1 | ✅ PASS | 1 | Cờ gánh với máy |
| UX-19 | P1 | ✅ PASS | 1 | Cờ gánh online |
| UX-20 | P1 | ✅ PASS | 1 | Ô ăn quan: chọn ô rồi chọn hướng |
| UX-21 | P1 | ✅ PASS | 1 | Ô ăn quan với máy |
| UX-22 | P1 | ✅ PASS | 1 | Ô ăn quan online |
| UX-23 | P1 | ✅ PASS | 1 | Màn hình chính và hướng dẫn |
| UX-24 | P1 | ✅ PASS | 1 | Nối từ cùng máy |
| UX-25 | P1 | ✅ PASS | 1 | Nối từ với máy |
| UX-26 | P1 | ✅ PASS | 1 | Nối từ online |
| UX-27 | P2 | ✅ PASS | 1 | Nối từ: báo "là từ có thật" |
| UX-28 | P1 | ✅ PASS | 1 | Cờ cá ngựa online 3 người |
| UX-29 | P2 | ✅ PASS | 2 | Bộ đếm lượt chơi |
| UX-30 | P1 | ✅ PASS | 2 | Admin bật/tắt/ẩn game và từng chế độ |
| UX-31 | P1 | ✅ PASS | 3 | Người xem trong phòng online |
| CR-01 | P1 | ✅ PASS | 1 | Đi qua mọi route |
| CR-02 | P1 | ✅ PASS | 1 | Route không tồn tại |
| CR-03 | P1 | ✅ PASS | 1 | Tham số URL sai (`size=999`, `level=abc`, `mode=xyz`) |
| CR-04 | P1 | ✅ PASS | 1 | localStorage hỏng (JSON lỗi, sai kiểu) |
| CR-05 | P1 | ✅ PASS | 1 | Bấm loạn 300 lần vào bàn Tìm số và ca rô |
| CR-06 | P2 | ✅ PASS | 1 | Bấm Back/Forward liên tục |
| CR-07 | P1 | ✅ PASS | 1 | Mất mạng giữa ván online rồi có mạng lại |
| CR-08 | P1 | ✅ PASS | 1 | Tải lại trang giữa ván online |
| CR-09 | P2 | ✅ PASS | 1 | Chơi 20 ván ca rô liên tiếp |
| CR-10 | P1 | ✅ PASS | 1 | Trình duyệt chặn localStorage (Safari riêng tư) |
| CR-11 | P1 | ✅ PASS | 1 | Bạn chơi cùng rời phòng giữa ván |
| CR-12 | P1 | ✅ PASS | 1 | Mở link mời khi đã có tên sẵn (vào phòng ngay, React có thể chạy hiệu ứng 2 lần) |
| CR-13 | P1 | ✅ PASS | 1 | Link Cờ gánh sai tham số |
| CR-14 | P1 | ✅ PASS | 1 | Link Ô ăn quan sai tham số |
| CR-15 | P1 | ✅ PASS | 1 | Link Nối từ sai tham số |
| CR-16 | P1 | ✅ PASS | 1 | Phần chính của app không tải được (vừa có bản mới, mất mạng) |
| CR-17 | P1 | ✅ PASS | 1 | Không tải được một game (mất mạng trước khi lưu, có bản mới thay thế) |
| LG-01 | P1 | ✅ PASS | 6 | Thắng ca rô theo 4 hướng, ở mép bàn, không "nối" qua hàng |
| LG-02 | P1 | ✅ PASS | 3 | AI 3×3 mức Khó |
| LG-03 | P1 | ✅ PASS | 5 | AI 15×15 |
| LG-04 | P1 | ✅ PASS | 3 | AI không bao giờ chọn ô đã có quân, kể cả bàn gần đầy |
| LG-05 | P1 | ✅ PASS | 4 | Bàn số: đủ số, không chồng nhau, cùng seed cùng bàn |
| LG-06 | P1 | ✅ PASS | 4 | Lấy số: chỉ số kế tiếp, mỗi số 1 người, đếm điểm, hoà |
| LG-07 | P1 | ✅ PASS | 3 | Ca rô online: đúng lượt, ô trống, sau khi thắng không đi tiếp |
| LG-08 | P2 | ✅ PASS | 1 | Kỷ lục luyện tập chỉ lưu khi nhanh hơn |
| LG-09 | P1 | ✅ PASS | 2 | i18n: mọi câu có cùng biến `{name}`, `{n}`… ở VI và EN |
| LG-10 | P2 | ✅ PASS | 7 | Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai |
| LG-11 | P1 | ✅ PASS | 3 | Cờ gánh: bàn, kề nhau, xếp quân |
| LG-12 | P1 | ✅ PASS | 4 | Gánh |
| LG-13 | P1 | ✅ PASS | 5 | Chẹt |
| LG-14 | P1 | ✅ PASS | 5 | Mở |
| LG-15 | P1 | ✅ PASS | 4 | Kết thúc |
| LG-16 | P1 | ✅ PASS | 5 | Máy Cờ gánh |
| LG-17 | P1 | ✅ PASS | 4 | Cờ gánh online |
| LG-18 | P1 | ✅ PASS | 12 | Luật Ô ăn quan |
| LG-19 | P1 | ✅ PASS | 4 | Máy Ô ăn quan 3 mức |
| LG-20 | P1 | ✅ PASS | 4 | Ô ăn quan online |
| LG-21 | P1 | ✅ PASS | 7 | Luật Nối từ |
| LG-22 | P1 | ✅ PASS | 2 | Máy Nối từ |
| LG-23 | P1 | ✅ PASS | 4 | Từ điển Nối từ |
| LG-24 | P1 | ✅ PASS | 3 | Nối từ online |
| LG-25 | P1 | ✅ PASS | 2 | Từ cho trẻ em trong Nối từ |
| LG-26 | P1 | ✅ PASS | 2 | Diễn lại nước đi Ô ăn quan |
| LG-27 | P1 | ✅ PASS | 2 | Từ chỉ có nghĩa tiếng Việt (Wiktionary tiếng Việt) |
| LG-28 | P1 | ✅ PASS | 8 | Luật Cờ cá ngựa |
| LG-29 | P1 | ✅ PASS | 4 | Cờ cá ngựa online |
| LG-30 | P2 | ✅ PASS | 2 | Bàn Cờ cá ngựa |
| LG-31 | P2 | ✅ PASS | 1 | Đọc cấu hình bật/tắt |
| AU-01 | P1 | ✅ PASS | 4 | File âm thanh cho mọi sự kiện, cả 2 giao diện |
| AU-02 | P1 | ✅ PASS | 1 | Đếm ngược 3-2-1 |
| AU-03 | P1 | ✅ PASS | 1 | Kết thúc ván: thắng, hoà, kỷ lục mới |
| AU-04 | P1 | ✅ PASS | 1 | Bấm nút, bấm đúng/sai số, máy đi |
| AU-05 | P1 | ✅ PASS | 1 | Tắt "Âm thanh" |
| AU-06 | P1 | ✅ PASS | 1 | Nhạc nền |
| AU-07 | P2 | ✅ PASS | 1 | Đổi giao diện |
| AU-08 | P1 | ✅ PASS | 1 | Cờ gánh: bị Mở, gánh |
| AU-09 | P2 | ✅ PASS | 1 | Ô ăn quan: ăn sỏi |
| AU-10 | P2 | ✅ PASS | 4 | Nhạc nền tự phối |
| SEC-01 | P1 | ✅ PASS | 9 | Firebase rules (9 case đã có) |
| SEC-02 | P1 | ✅ PASS | 1 | Tên người chơi chứa HTML/script |
| SEC-03 | P1 | ✅ PASS | 2 | Không có khoá bí mật trong bản build |
| SEC-04 | P1 | ✅ PASS | 1 | `npm audit` dependency chạy trong app |
| SEC-05 | P2 | ✅ PASS | 2 | Android không cho HTTP thường (cleartext), iOS không mở ATS tuỳ tiện |
| SEC-06 | P1 | ✅ PASS | 3 | Người trong phòng không sửa được thông tin người kia |
| SEC-07 | P2 | ✅ PASS | 2 | Dữ liệu phòng chỉ gồm thông tin cần cho game (mã phòng 4 số có thể bị dò) |
| SEC-08 | P1 | ✅ PASS | 1 | Loại game trong rules |
| SEC-09 | P1 | ✅ PASS | 1 | Đề xuất từ (Nối từ) |
| SEC-10 | P1 | ✅ PASS | 2 | Phòng 4 người (Cờ cá ngựa) |
| SEC-11 | P1 | ✅ PASS | 1 | Bộ đếm lượt chơi |
| SEC-12 | P1 | ✅ PASS | 1 | Cấu hình bật/tắt game |
| SEC-13 | P1 | ✅ PASS | 1 | Người xem |
| BR-01 | P1 | ✅ PASS | 1 | Mở mọi màn hình |
| BR-02 | P1 | ✅ PASS | 1 | Font tiếng Việt |
| BR-03 | P1 | ❌ FAIL | 1 | Một nước đi mỗi game |
| BR-04 | P1 | ✅ PASS | 1 | Gõ tiếng Việt có dấu trong Nối từ |
| BR-05 | P2 | ✅ PASS | 1 | Âm thanh |
| BR-06 | P1 | ✅ PASS | 1 | Kích thước bàn chơi |
| BR-07 | P1 | ✅ PASS | 1 | Phòng online 2 người |

## Chi tiết case FAIL

### BR-03 – Một nước đi mỗi game
Mong đợi: Ca rô, Cờ gánh, Ô ăn quan (cả xem nhanh), Tìm số đều chơi được

- [BR-03] one move in every game (chromium D8): 88 /   await expect(page.getByTestId('me-score'), '[BR-03] ô ăn quan').toHaveText('6');

Ảnh: [BR-03--every-game-chromium-D8--test-failed-1.png](../../qa/evidence/failures/run-19/BR-03--every-game-chromium-D8--test-failed-1.png), [BR-03--every-game-chromium-D8--test-failed-2.png](../../qa/evidence/failures/run-19/BR-03--every-game-chromium-D8--test-failed-2.png), [BR-03--every-game-chromium-D8--test-failed-3.png](../../qa/evidence/failures/run-19/BR-03--every-game-chromium-D8--test-failed-3.png), [BR-03--every-game-chromium-D8--test-failed-4.png](../../qa/evidence/failures/run-19/BR-03--every-game-chromium-D8--test-failed-4.png)

## Evidence
- Ảnh từng màn hình × thiết bị: `qa/evidence/screens/`
- Ảnh case fail: `qa/evidence/failures/run-19/`
- Kết quả máy đọc: `qa/runs/run-19.json`
