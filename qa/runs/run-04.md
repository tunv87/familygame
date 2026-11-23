# QA run 04

Thời gian: 2026-11-23 00:15 UTC
Test tự động: 97 (97 pass, 0 fail, 0 skip)

## Tổng hợp theo nhóm

| Nhóm | Case | PASS | FAIL | NOT RUN |
| --- | --- | --- | --- | --- |
| UI | 9 | 9 | 0 | 0 |
| UX | 15 | 15 | 0 | 0 |
| CR | 12 | 12 | 0 | 0 |
| LG | 10 | 10 | 0 | 0 |
| SEC | 7 | 7 | 0 | 0 |
| **Tổng** | **53** | **53** | **0** | **0** |

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
| UX-01 | P1 | ✅ PASS | 1 | Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi) |
| UX-02 | P1 | ✅ PASS | 1 | Máy (AI) đi nước ca rô 15×15 mức Khó |
| UX-03 | P1 | ✅ PASS | 1 | Mọi màn hình |
| UX-04 | P1 | ✅ PASS | 1 | Thoát giữa ván (ca rô, Tìm số) |
| UX-05 | P1 | ✅ PASS | 1 | Kết thúc ván |
| UX-06 | P2 | ✅ PASS | 1 | Không bấm gì 15 giây trong Tìm số |
| UX-07 | P1 | ✅ PASS | 1 | Đi lại (Undo) trong ca rô với máy |
| UX-08 | P2 | ✅ PASS | 1 | Bật "Chữ to" |
| UX-09 | P1 | ✅ PASS | 1 | Đổi cài đặt (giao diện, ngôn ngữ, âm thanh) rồi tải lại |
| UX-10 | P1 | ✅ PASS | 1 | Tắt âm thanh |
| UX-11 | P1 | ✅ PASS | 1 | Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu |
| UX-12 | P2 | ✅ PASS | 1 | Chơi lại ván Tìm số |
| UX-13 | P1 | ✅ PASS | 1 | Nhập mã phòng không tồn tại |
| UX-14 | P1 | ✅ PASS | 1 | Mất mạng rồi bấm "Tạo phòng" |
| UX-15 | P2 | ✅ PASS | 1 | Màn hình chào mừng chỉ hiện lần đầu |
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
| LG-01 | P1 | ✅ PASS | 6 | Thắng ca rô theo 4 hướng, ở mép bàn, không "nối" qua hàng |
| LG-02 | P1 | ✅ PASS | 3 | AI 3×3 mức Khó |
| LG-03 | P1 | ✅ PASS | 5 | AI 15×15 |
| LG-04 | P1 | ✅ PASS | 3 | AI không bao giờ chọn ô đã có quân, kể cả bàn gần đầy |
| LG-05 | P1 | ✅ PASS | 4 | Bàn số: đủ số, không chồng nhau, cùng seed cùng bàn |
| LG-06 | P1 | ✅ PASS | 4 | Lấy số: chỉ số kế tiếp, mỗi số 1 người, đếm điểm, hoà |
| LG-07 | P1 | ✅ PASS | 3 | Ca rô online: đúng lượt, ô trống, sau khi thắng không đi tiếp |
| LG-08 | P2 | ✅ PASS | 1 | Kỷ lục luyện tập chỉ lưu khi nhanh hơn |
| LG-09 | P1 | ✅ PASS | 2 | i18n: mọi câu có cùng biến `{name}`, `{n}`… ở VI và EN |
| LG-10 | P2 | ✅ PASS | 6 | Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai |
| SEC-01 | P1 | ✅ PASS | 9 | Firebase rules (9 case đã có) |
| SEC-02 | P1 | ✅ PASS | 1 | Tên người chơi chứa HTML/script |
| SEC-03 | P1 | ✅ PASS | 2 | Không có khoá bí mật trong bản build |
| SEC-04 | P1 | ✅ PASS | 1 | `npm audit` dependency chạy trong app |
| SEC-05 | P2 | ✅ PASS | 2 | Android không cho HTTP thường (cleartext), iOS không mở ATS tuỳ tiện |
| SEC-06 | P1 | ✅ PASS | 3 | Người trong phòng không sửa được thông tin người kia |
| SEC-07 | P2 | ✅ PASS | 2 | Dữ liệu phòng chỉ gồm thông tin cần cho game (mã phòng 4 số có thể bị dò) |

## Evidence
- Ảnh từng màn hình × thiết bị: `qa/evidence/screens/`
- Ảnh case fail: `qa/evidence/failures/run-04/`
- Kết quả máy đọc: `qa/runs/run-04.json`

## Phân tích sau run 04 – kết luận
- **53/53 case PASS, 97/97 test PASS.** Xác nhận đã sửa B12.
- Hồi quy: bộ e2e cũ 24/24 PASS, không còn cảnh báo `permission_denied` nào từ app; kiểm tra tự cập nhật PWA PASS; lint, typecheck PASS.
- Các dòng `permission_denied` còn trong log đều đến từ bộ test Firebase rules: test cố ý ghi trái phép để kiểm tra bị chặn.
- Lỗi còn mở: **B11** (mức Thấp, chấp nhận). Đạt tiêu chí kết thúc trong `TEST_PLAN.md`.
