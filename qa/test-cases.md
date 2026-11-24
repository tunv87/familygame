# Danh mục test case

Phiên bản: **v2.8** (Nối từ: từ cho trẻ em; xem `review-log.md`). Mỗi case có mã; tên test trong code bắt đầu bằng đúng mã này (vd `[UI-01]`) để kết quả tự ghép lại vào bảng.
Ưu tiên: P1 = bắt buộc pass trước khi lên store, P2 = nên pass.

## UI – Giao diện trên nhiều màn hình (D1–D10)

| Mã     | Ưu tiên | Kiểm tra                                                     | Kết quả mong đợi                                                                        |
| ------ | ------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------- |
| UI-01  | P1      | Mở từng màn hình chính trên D1–D10                           | Không tràn ngang (không có thanh cuộn ngang)                                            |
| UI-02  | P1      | Nút điều khiển trên D1–D5 (không tính quân cờ/ô số)          | Mọi nút ≥ 44×44 px (Apple HIG 44pt, Material 48dp ≈ 44 px CSS ở mật độ chuẩn)           |
| UI-02b | P1      | Ô chơi game (ô ca rô 3×3, vùng bấm số mức Dễ/Vừa) trên D1–D5 | ≥ 44 px; mức Khó và bàn 15×15 ≥ 32 px (bàn 15×15 có nút phóng to)                       |
| UI-03  | P1      | Bàn Tìm số mức Khó trên D1–D10                               | Toàn bộ bàn số nằm trong màn hình, không phải cuộn                                      |
| UI-04  | P1      | Bàn ca rô 3×3 trên D1–D10                                    | Cả 9 ô nằm trong màn hình                                                               |
| UI-05  | P2      | Chữ trên D1                                                  | Không chữ nào bị cắt ngoài vùng của nó                                                  |
| UI-06  | P1      | Hộp thoại (kết quả, thoát, chào mừng) trên D1                | Nút chính nhìn thấy mà không cần cuộn                                                   |
| UI-07  | P2      | Chụp ảnh mọi màn hình × thiết bị × 2 giao diện               | Lưu evidence để soát bằng mắt                                                           |
| UI-08  | P2      | iPad xoay ngang (D11 1366×1024)                              | Không tràn, bàn chơi nằm trọn                                                           |
| UI-09  | P1      | Bàn Cờ gánh trên D1–D5, cả 2 giao diện                       | Nằm gọn trong màn hình, mỗi điểm bấm ≥ 44 px, không tràn ngang                          |
| UI-10  | P1      | Bàn Ô ăn quan trên D1–D5, cả 2 giao diện                     | Bàn và nút chọn hướng nằm gọn trong màn hình, mỗi ô dân ≥ 44 px, không tràn ngang       |
| UI-11  | P1      | Nối từ trên D1–D5, cả 2 giao diện                            | Ô nhập, nút Nối, Gợi ý, Chịu, đồng hồ nằm trong màn hình, cao ≥ 44 px, không tràn ngang |

## UX – Trải nghiệm theo chuẩn game

| Mã    | Ưu tiên | Kiểm tra                                                                                               | Kết quả mong đợi                                                                                                                                                                     |
| ----- | ------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| UX-01 | P1      | Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi)                              | Phản hồi hình ảnh trong ≤ 100 ms                                                                                                                                                     |
| UX-02 | P1      | Máy (AI) đi nước ca rô 15×15 mức Khó                                                                   | Trả lời trong ≤ 1 giây                                                                                                                                                               |
| UX-03 | P1      | Mọi màn hình                                                                                           | Luôn có đường quay lại / thoát                                                                                                                                                       |
| UX-04 | P1      | Thoát giữa ván (ca rô, Tìm số)                                                                         | Hỏi xác nhận, chọn "Chơi tiếp" thì ván còn nguyên                                                                                                                                    |
| UX-05 | P1      | Kết thúc ván                                                                                           | Hiện người thắng/hoà rõ ràng + "Chơi lại" + "Trang chủ"                                                                                                                              |
| UX-06 | P2      | Tìm số: không bấm gì 30 giây                                                                           | Không có số nào được gợi ý (chủ dự án yêu cầu bỏ gợi ý)                                                                                                                              |
| UX-07 | P1      | Đi lại (Undo) trong ca rô với máy                                                                      | Xoá cả nước của người và của máy                                                                                                                                                     |
| UX-08 | P2      | Bật "Chữ to"                                                                                           | Cỡ chữ tăng trên mọi màn hình                                                                                                                                                        |
| UX-09 | P1      | Đổi cài đặt (giao diện, ngôn ngữ, âm thanh) rồi tải lại                                                | Giữ nguyên lựa chọn                                                                                                                                                                  |
| UX-10 | P1      | Người dùng bản cũ đã tắt "Âm thanh & rung" (một công tắc), rồi cập nhật lên bản có công tắc Rung riêng | Vẫn không có âm và không rung                                                                                                                                                        |
| UX-11 | P1      | Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu                                  | Chữ thường ≥ 4.5:1, chữ lớn (≥ 24 px, hoặc ≥ 18.7 px đậm) ≥ 3:1                                                                                                                      |
| UX-12 | P2      | Chơi lại ván Tìm số                                                                                    | Có đếm ngược 3-2-1 trước khi bắt đầu                                                                                                                                                 |
| UX-13 | P1      | Nhập mã phòng không tồn tại                                                                            | Báo lỗi dễ hiểu trong ≤ 5 giây, nhập lại được                                                                                                                                        |
| UX-14 | P1      | Mất mạng rồi bấm "Tạo phòng"                                                                           | Báo không kết nối được trong ≤ 10 giây, không quay vô hạn                                                                                                                            |
| UX-15 | P2      | Màn hình chào mừng chỉ hiện lần đầu                                                                    | Đúng                                                                                                                                                                                 |
| UX-16 | P1      | Cờ gánh: chạm quân                                                                                     | Không hiện gợi ý (quân đi được, điểm đến); quân được chọn có viền; chạm quân khác của mình thì đổi chọn; quân đối phương bị từ chối; chỉ khi bị Mở mới tô sáng quân và điểm bắt buộc |
| UX-17 | P1      | Cờ gánh: bị Mở                                                                                         | Có cảnh báo, quân phải đi được chọn sẵn, chỉ còn nước gánh bắt buộc, quân khác bị khoá                                                                                               |
| UX-18 | P1      | Cờ gánh với máy                                                                                        | Máy trả lời; Đi lại quay về lượt mình; thoát giữa ván hỏi trước                                                                                                                      |
| UX-19 | P1      | Cờ gánh online                                                                                         | Nước đi, Mở, gánh hiện ở cả 2 máy; chủ phòng cầm Đen đi trước                                                                                                                        |
| UX-20 | P1      | Ô ăn quan: chọn ô rồi chọn hướng                                                                       | Ô đối phương bị từ chối; rải, bốc tiếp, ăn đúng luật; điểm và lượt cập nhật                                                                                                          |
| UX-21 | P1      | Ô ăn quan với máy                                                                                      | Máy đi lại; Đi lại quay về lượt của mình; thoát giữa ván phải xác nhận                                                                                                               |
| UX-22 | P1      | Ô ăn quan online                                                                                       | Mỗi người thấy ô của mình ở hàng dưới; nước đi đồng bộ, lượt đổi đúng                                                                                                                |
| UX-23 | P1      | Màn hình chính và hướng dẫn                                                                            | Game chia nhóm Dân gian / Trí tuệ; mọi game có tab Cách chơi và Câu chuyện                                                                                                           |
| UX-24 | P1      | Nối từ cùng máy                                                                                        | Có từ mở đầu; gợi ý điền từ; gõ thiếu dấu bị nhắc "Gõ có dấu"; từ lạ, từ đã dùng bị báo; chịu thua hiện lý do và từ có thể nối                                                       |
| UX-25 | P1      | Nối từ với máy                                                                                         | Máy trả lời; hết giờ thì thua và cộng điểm cho máy                                                                                                                                   |
| UX-26 | P1      | Nối từ online                                                                                          | Từ hiện ở cả 2 máy (từ của mình bên phải); đổi lượt; chịu thua kết thúc ván ở cả 2 máy                                                                                               |

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
| CR-13 | P1      | Link Cờ gánh sai tham số                                                         | Không crash, dùng mặc định                               |
| CR-14 | P1      | Link Ô ăn quan sai tham số                                                       | Không crash, dùng mặc định                               |
| CR-15 | P1      | Link Nối từ sai tham số                                                          | Không crash, dùng mặc định                               |

## LG – Logic

| Mã    | Ưu tiên | Kiểm tra                                                      | Kết quả mong đợi                                                                                                                                                                   |
| ----- | ------- | ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-01 | P1      | Thắng ca rô theo 4 hướng, ở mép bàn, không "nối" qua hàng     | Đúng (đã có)                                                                                                                                                                       |
| LG-02 | P1      | AI 3×3 mức Khó                                                | Không bao giờ thua (đã có)                                                                                                                                                         |
| LG-03 | P1      | AI 15×15                                                      | Luôn ăn khi có 4, luôn chặn 4 (đã có)                                                                                                                                              |
| LG-04 | P1      | AI không bao giờ chọn ô đã có quân, kể cả bàn gần đầy         | Trên 500 thế cờ ngẫu nhiên, mọi mức, cả 3×3 và 15×15                                                                                                                               |
| LG-05 | P1      | Bàn số: đủ số, không chồng nhau, cùng seed cùng bàn           | Đúng (đã có)                                                                                                                                                                       |
| LG-06 | P1      | Lấy số: chỉ số kế tiếp, mỗi số 1 người, đếm điểm, hoà         | Đúng (đã có)                                                                                                                                                                       |
| LG-07 | P1      | Ca rô online: đúng lượt, ô trống, sau khi thắng không đi tiếp | Đúng (đã có)                                                                                                                                                                       |
| LG-08 | P2      | Kỷ lục luyện tập chỉ lưu khi nhanh hơn                        | Đúng                                                                                                                                                                               |
| LG-09 | P1      | i18n: mọi câu có cùng biến `{name}`, `{n}`… ở VI và EN        | Đúng (thiếu biến = hiện sai tên người chơi)                                                                                                                                        |
| LG-10 | P2      | Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai                  | Lấy mặc định cho phần thiếu                                                                                                                                                        |
| LG-11 | P1      | Cờ gánh: bàn, kề nhau, xếp quân                               | Đường chéo chỉ ở điểm chẵn; 8 quân mỗi bên, đối xứng tâm; đi 1 bước tới điểm trống                                                                                                 |
| LG-12 | P1      | Gánh                                                          | Gánh 1 cặp, nhiều trục (chầu 6); không ăn kiểu kẹp hai đầu; không phản ứng dây chuyền                                                                                              |
| LG-13 | P1      | Chẹt                                                          | 1 quân và cả nhóm; rời chỗ mở đường thở; Gánh trước Chẹt sau; quân của bên vừa đi không bị đổi                                                                                     |
| LG-14 | P1      | Mở                                                            | Kiểu rút quân và kiểu đưa quân vào thế bị kẹp; thế gánh có sẵn không bắt buộc; chỉ 1 lượt; nhiều nước bắt buộc được chọn 1                                                         |
| LG-15 | P1      | Kết thúc                                                      | Thắng khi đối phương hết quân; hoà 100 lượt và lặp 3 lần; bên sắp đi luôn có nước (R3)                                                                                             |
| LG-16 | P1      | Máy Cờ gánh                                                   | Luôn đi đúng luật (cả Mở); có gánh thì gánh, ưu tiên gánh nhiều; Khó thắng Dễ, < 300 ms                                                                                            |
| LG-17 | P1      | Cờ gánh online                                                | Đúng lượt, nước sai bị từ chối, dữ liệu hỏng không crash, người thắng theo uid                                                                                                     |
| LG-18 | P1      | Luật Ô ăn quan                                                | Rải, bốc tiếp, dừng trước ô quan, ăn và ăn liên tiếp, rải lại khi hết dân (cho vay), hết quan thì thu quân; tổng số sỏi không đổi                                                  |
| LG-19 | P1      | Máy Ô ăn quan 3 mức                                           | Luôn đi nước hợp lệ; Vừa/Khó ăn quan khi có thể; Khó thắng Dễ ≥ 8/10; trả lời < 0,5 giây                                                                                           |
| LG-20 | P1      | Ô ăn quan online                                              | Đúng lượt, nước sai bị từ chối, dữ liệu hỏng không crash, người thắng theo uid                                                                                                     |
| LG-21 | P1      | Luật Nối từ                                                   | Chỉ gõ tiếng thứ hai hoặc cả từ; bắt buộc đúng dấu (thiếu dấu bị báo, không lộ từ); "hoà"/"hòa", "thuỷ"/"thủy" là một từ; từ lạ, sai đầu, đã dùng bị từ chối; hết giờ/chịu là thua |
| LG-22 | P1      | Máy Nối từ                                                    | Chỉ đi từ hợp lệ; hết từ thì chịu; Vừa không dùng từ hiếm; Khó chọn từ để lại ít đường nối nhất                                                                                    |
| LG-23 | P1      | Từ điển Nối từ                                                | > 15.000 từ 2 tiếng, mỗi từ có nghĩa tiếng Anh; có từ thông dụng của trẻ (con mèo, mèo con…); không có từ thô tục; > 80% từ thông dụng nối tiếp được                               |
| LG-24 | P1      | Nối từ online                                                 | Đúng lượt, từ được kiểm tra, đồng hồ đặt lại; chỉ người đến lượt được chịu, đối thủ chỉ được xử thắng khi quá giờ + 5 giây; dữ liệu hỏng không crash                               |
| LG-25 | P1      | Từ cho trẻ em trong Nối từ                                    | > 800 từ chọn tay (không có từ khó như "sĩ phu", "nạn nhân"); máy mức Dễ, Gợi ý, "Có thể nối" dùng từ trẻ em trước; mức Dễ và cùng máy mở ván bằng từ trẻ em có ≥ 3 từ nối tiếp    |

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
| AU-08 | P1      | Cờ gánh: bị Mở, gánh                          | Có âm "forced" và "ganh"                                                |
| AU-09 | P2      | Ô ăn quan: ăn sỏi                             | Có âm "ganh" (ăn quan: "ganhBig")                                       |

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
| SEC-08 | P1      | Loại game trong rules                                                     | Chấp nhận `coganh`, `oanquan`, `noitu`, từ chối game lạ                                                                                                |
