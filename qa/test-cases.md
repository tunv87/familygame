# Danh mục test case

Phiên bản: **v2.3** (thêm nhóm AU – âm thanh, xem `review-log.md`). Mỗi case có mã; tên test trong code bắt đầu bằng đúng mã này (vd `[UI-01]`) để kết quả tự ghép lại vào bảng.
Ưu tiên: P1 = bắt buộc pass trước khi lên store, P2 = nên pass.

## UI – Giao diện trên nhiều màn hình (D1–D10)

| Mã     | Ưu tiên | Kiểm tra                                                     | Kết quả mong đợi                                                              |
| ------ | ------- | ------------------------------------------------------------ | ----------------------------------------------------------------------------- |
| UI-01  | P1      | Mở từng màn hình chính trên D1–D10                           | Không tràn ngang (không có thanh cuộn ngang)                                  |
| UI-02  | P1      | Nút điều khiển trên D1–D5 (không tính quân cờ/ô số)          | Mọi nút ≥ 44×44 px (Apple HIG 44pt, Material 48dp ≈ 44 px CSS ở mật độ chuẩn) |
| UI-02b | P1      | Ô chơi game (ô ca rô 3×3, vùng bấm số mức Dễ/Vừa) trên D1–D5 | ≥ 44 px; mức Khó và bàn 15×15 ≥ 32 px (bàn 15×15 có nút phóng to)             |
| UI-03  | P1      | Bàn Tìm số mức Khó trên D1–D10                               | Toàn bộ bàn số nằm trong màn hình, không phải cuộn                            |
| UI-04  | P1      | Bàn ca rô 3×3 trên D1–D10                                    | Cả 9 ô nằm trong màn hình                                                     |
| UI-05  | P2      | Chữ trên D1                                                  | Không chữ nào bị cắt ngoài vùng của nó                                        |
| UI-06  | P1      | Hộp thoại (kết quả, thoát, chào mừng) trên D1                | Nút chính nhìn thấy mà không cần cuộn                                         |
| UI-07  | P2      | Chụp ảnh mọi màn hình × thiết bị × 2 giao diện               | Lưu evidence để soát bằng mắt                                                 |
| UI-08  | P2      | iPad xoay ngang (D11 1366×1024)                              | Không tràn, bàn chơi nằm trọn                                                 |

## UX – Trải nghiệm theo chuẩn game

| Mã    | Ưu tiên | Kiểm tra                                                                                               | Kết quả mong đợi                                                |
| ----- | ------- | ------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| UX-01 | P1      | Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi)                              | Phản hồi hình ảnh trong ≤ 100 ms                                |
| UX-02 | P1      | Máy (AI) đi nước ca rô 15×15 mức Khó                                                                   | Trả lời trong ≤ 1 giây                                          |
| UX-03 | P1      | Mọi màn hình                                                                                           | Luôn có đường quay lại / thoát                                  |
| UX-04 | P1      | Thoát giữa ván (ca rô, Tìm số)                                                                         | Hỏi xác nhận, chọn "Chơi tiếp" thì ván còn nguyên               |
| UX-05 | P1      | Kết thúc ván                                                                                           | Hiện người thắng/hoà rõ ràng + "Chơi lại" + "Trang chủ"         |
| UX-06 | P2      | Không bấm gì 15 giây trong Tìm số                                                                      | Số cần tìm được gợi ý (viền nhấp nháy)                          |
| UX-07 | P1      | Đi lại (Undo) trong ca rô với máy                                                                      | Xoá cả nước của người và của máy                                |
| UX-08 | P2      | Bật "Chữ to"                                                                                           | Cỡ chữ tăng trên mọi màn hình                                   |
| UX-09 | P1      | Đổi cài đặt (giao diện, ngôn ngữ, âm thanh) rồi tải lại                                                | Giữ nguyên lựa chọn                                             |
| UX-10 | P1      | Người dùng bản cũ đã tắt "Âm thanh & rung" (một công tắc), rồi cập nhật lên bản có công tắc Rung riêng | Vẫn không có âm và không rung                                   |
| UX-11 | P1      | Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu                                  | Chữ thường ≥ 4.5:1, chữ lớn (≥ 24 px, hoặc ≥ 18.7 px đậm) ≥ 3:1 |
| UX-12 | P2      | Chơi lại ván Tìm số                                                                                    | Có đếm ngược 3-2-1 trước khi bắt đầu                            |
| UX-13 | P1      | Nhập mã phòng không tồn tại                                                                            | Báo lỗi dễ hiểu trong ≤ 5 giây, nhập lại được                   |
| UX-14 | P1      | Mất mạng rồi bấm "Tạo phòng"                                                                           | Báo không kết nối được trong ≤ 10 giây, không quay vô hạn       |
| UX-15 | P2      | Màn hình chào mừng chỉ hiện lần đầu                                                                    | Đúng                                                            |

## CR – Chống crash

| Mã    | Ưu tiên | Kiểm tra                                                                         | Kết quả mong đợi                                         |
| ----- | ------- | -------------------------------------------------------------------------------- | -------------------------------------------------------- |
| CR-01 | P1      | Đi qua mọi route                                                                 | Không có lỗi JS (pageerror) hay console.error            |
| CR-02 | P1      | Route không tồn tại                                                              | Về trang chủ                                             |
| CR-03 | P1      | Tham số URL sai (`size=999`, `level=abc`, `mode=xyz`)                            | Không crash, dùng giá trị mặc định                       |
| CR-04 | P1      | localStorage hỏng (JSON lỗi, sai kiểu)                                           | App vẫn mở, dùng mặc định                                |
| CR-05 | P1      | Bấm loạn 300 lần vào bàn Tìm số và ca rô                                         | Không lỗi JS, trạng thái hợp lệ                          |
| CR-06 | P2      | Bấm Back/Forward liên tục                                                        | Không lỗi                                                |
| CR-07 | P1      | Mất mạng giữa ván online rồi có mạng lại                                         | Hiện trạng thái mất kết nối, có mạng lại thì chơi tiếp   |
| CR-08 | P1      | Tải lại trang giữa ván online                                                    | Vào lại đúng phòng, ván còn nguyên                       |
| CR-09 | P2      | Chơi 20 ván ca rô liên tiếp                                                      | Không lỗi, không chậm dần                                |
| CR-10 | P1      | Trình duyệt chặn localStorage (Safari riêng tư)                                  | App vẫn chạy được                                        |
| CR-11 | P1      | Bạn chơi cùng rời phòng giữa ván                                                 | Hiện thông báo, không crash, thoát được                  |
| CR-12 | P1      | Mở link mời khi đã có tên sẵn (vào phòng ngay, React có thể chạy hiệu ứng 2 lần) | Vào được phòng, không có lần ghi nào bị Firebase từ chối |

## LG – Logic

| Mã    | Ưu tiên | Kiểm tra                                                      | Kết quả mong đợi                                     |
| ----- | ------- | ------------------------------------------------------------- | ---------------------------------------------------- |
| LG-01 | P1      | Thắng ca rô theo 4 hướng, ở mép bàn, không "nối" qua hàng     | Đúng (đã có)                                         |
| LG-02 | P1      | AI 3×3 mức Khó                                                | Không bao giờ thua (đã có)                           |
| LG-03 | P1      | AI 15×15                                                      | Luôn ăn khi có 4, luôn chặn 4 (đã có)                |
| LG-04 | P1      | AI không bao giờ chọn ô đã có quân, kể cả bàn gần đầy         | Trên 500 thế cờ ngẫu nhiên, mọi mức, cả 3×3 và 15×15 |
| LG-05 | P1      | Bàn số: đủ số, không chồng nhau, cùng seed cùng bàn           | Đúng (đã có)                                         |
| LG-06 | P1      | Lấy số: chỉ số kế tiếp, mỗi số 1 người, đếm điểm, hoà         | Đúng (đã có)                                         |
| LG-07 | P1      | Ca rô online: đúng lượt, ô trống, sau khi thắng không đi tiếp | Đúng (đã có)                                         |
| LG-08 | P2      | Kỷ lục luyện tập chỉ lưu khi nhanh hơn                        | Đúng                                                 |
| LG-09 | P1      | i18n: mọi câu có cùng biến `{name}`, `{n}`… ở VI và EN        | Đúng (thiếu biến = hiện sai tên người chơi)          |
| LG-10 | P2      | Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai                  | Lấy mặc định cho phần thiếu                          |

## AU – Âm thanh

| Mã    | Ưu tiên | Kiểm tra                                      | Kết quả mong đợi                                                        |
| ----- | ------- | --------------------------------------------- | ----------------------------------------------------------------------- |
| AU-01 | P1      | File âm thanh cho mọi sự kiện, cả 2 giao diện | Có đủ, đúng MP3, mỗi file < 50 KB, có giấy phép CC0, được cache offline |
| AU-02 | P1      | Đếm ngược 3-2-1                               | 3 tiếng "tick" và 1 tiếng "go"                                          |
| AU-03 | P1      | Kết thúc ván: thắng, hoà, kỷ lục mới          | Mỗi kết quả có âm riêng                                                 |
| AU-04 | P1      | Bấm nút, bấm đúng/sai số, máy đi              | Không có âm (chỉ rung)                                                  |
| AU-05 | P1      | Tắt "Âm thanh"                                | Không phát âm nào                                                       |
| AU-06 | P1      | Nhạc nền                                      | Mặc định tắt; bật thì phát; giữ lựa chọn sau khi tải lại; tắt thì dừng  |
| AU-07 | P2      | Đổi giao diện                                 | Tải bộ âm của giao diện mới                                             |

## SEC – Bảo mật

| Mã     | Ưu tiên | Kiểm tra                                                                  | Kết quả mong đợi                                                                                                                                       |
| ------ | ------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| SEC-01 | P1      | Firebase rules (9 case đã có)                                             | Pass                                                                                                                                                   |
| SEC-02 | P1      | Tên người chơi chứa HTML/script                                           | Hiển thị như chữ, không chạy script                                                                                                                    |
| SEC-03 | P1      | Không có khoá bí mật trong bản build                                      | Chỉ có config web công khai của Firebase                                                                                                               |
| SEC-04 | P1      | `npm audit` dependency chạy trong app                                     | Không có lỗ hổng High/Critical                                                                                                                         |
| SEC-05 | P2      | Android không cho HTTP thường (cleartext), iOS không mở ATS tuỳ tiện      | Đúng                                                                                                                                                   |
| SEC-06 | P1      | Người trong phòng không sửa được thông tin người kia                      | Rules chặn                                                                                                                                             |
| SEC-07 | P2      | Dữ liệu phòng chỉ gồm thông tin cần cho game (mã phòng 4 số có thể bị dò) | Rules từ chối mọi trường lạ (email, số điện thoại…); rủi ro dò mã được ghi nhận và chấp nhận vì phòng chỉ chứa biệt danh + nước đi, hết hạn sau 24 giờ |
