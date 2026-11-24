# Nhật ký review test case

## Review lần 1 – v1 → v2 (22/11/2026)

Người review: Claude. Đối chiếu từng case với Apple Human Interface Guidelines, Material Design, WCAG 2.1 AA, yêu cầu review của App Store / Google Play, và hành vi thật của app.

| Case               | Vấn đề tìm thấy khi review                                                                                                                                                                                                    | Sửa                                                                                                      |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| UI-02              | Gộp nút điều khiển với ô chơi game. Bàn ca rô 15×15 và bàn số 100 số không thể có ô 44 px trên điện thoại mà vẫn vừa màn hình; game cờ/puzzle phổ biến chấp nhận ô nhỏ hơn khi có phóng to. Để nguyên thì case luôn fail sai. | Tách: UI-02 cho nút điều khiển (≥ 44 px), thêm UI-02b cho ô chơi (≥ 44 px ở bàn nhỏ, ≥ 32 px ở bàn dày). |
| UI-07              | Thiếu iPad xoay ngang, trong khi app native cho iPad xoay tự do.                                                                                                                                                              | Thêm UI-08 (D11 1366×1024).                                                                              |
| UX-01              | "≤ 100 ms" đo từ Playwright gồm cả độ trễ điều khiển trình duyệt, kết quả không ổn định.                                                                                                                                      | Đo trong trang bằng `performance.now()` từ lúc bấm đến khi DOM đổi.                                      |
| UX-11              | WCAG miễn yêu cầu tương phản cho nút đang vô hiệu; chưa định nghĩa "chữ lớn".                                                                                                                                                 | Loại nút disabled, ghi rõ ngưỡng chữ lớn.                                                                |
| (mới) UX-13, UX-14 | Thiếu case cho luồng online khi có lỗi: nhập sai mã, mất mạng lúc tạo phòng. Đây là chỗ người lớn tuổi dễ kẹt nhất.                                                                                                           | Thêm 2 case P1.                                                                                          |
| (mới) UX-15        | Màn hình chào mừng mới thêm, chưa có case.                                                                                                                                                                                    | Thêm.                                                                                                    |
| (mới) CR-10        | Safari chế độ riêng tư / chặn cookie có thể ném lỗi khi dùng localStorage.                                                                                                                                                    | Thêm case P1.                                                                                            |
| (mới) CR-11        | Bạn chơi cùng rời phòng giữa ván chưa có trong danh mục (chỉ có trong test cũ).                                                                                                                                               | Thêm case P1.                                                                                            |
| LG-04              | Chưa nói tới bàn gần đầy (dễ lỗi nhất) và chưa phủ cả 2 cỡ bàn.                                                                                                                                                               | Mở rộng phạm vi.                                                                                         |
| LG-09              | Để P2, nhưng thiếu biến làm hiện sai tên người thắng.                                                                                                                                                                         | Nâng lên P1.                                                                                             |
| (mới) LG-10        | Chưa có case cho dữ liệu lưu thiếu/sai ở mức đơn vị (CR-04 chỉ test qua giao diện).                                                                                                                                           | Thêm.                                                                                                    |
| (mới) SEC-06       | Rules: chưa kiểm tra người trong phòng sửa thông tin người kia.                                                                                                                                                               | Thêm case P1.                                                                                            |
| (mới) SEC-07       | Mã phòng 4 số có thể dò được: cần ghi nhận rủi ro thay vì bỏ qua.                                                                                                                                                             | Thêm case ghi nhận rủi ro.                                                                               |
| SEC-05             | Chỉ nói Android; iOS có ATS tương đương.                                                                                                                                                                                      | Mở rộng sang iOS.                                                                                        |
| CR-07, CR-08       | Giữ nguyên, nhưng ghi chú: chạy với Firebase emulator, mất mạng giả lập bằng `context.setOffline`.                                                                                                                            | Không đổi nội dung.                                                                                      |
| Ngoài phạm vi      | Nút Back Android, rung, chia sẻ native không test được trên web.                                                                                                                                                              | Ghi vào test plan: kiểm tra tay khi có bản TestFlight / Play closed test.                                |

Kết quả: v2 có **52 case** (v1: 42; thêm 10, sửa 7).

## Review lần 2 – sau run 01 (v2 → v2.1)

Mỗi case FAIL ở run 01 được xem lại: lỗi do **app** (ghi vào `bugs.md` và sửa) hay do **test** (sửa test, ghi ở đây).

| Case             | Kết luận                                                                                                                                         | Thay đổi                                                                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-01            | Lỗi test: sự kiện `pointerdown` tự tạo bằng `dispatchEvent` không đi qua React, nên luôn báo 9999 ms.                                            | Bấm thật bằng Playwright, đo trong trang từ sự kiện `pointerdown` (capture) đến khi lớp CSS của số đổi.                                              |
| SEC-02           | Lỗi test: `isVisible()` không chờ, hộp nhập tên chưa kịp hiện nên người thứ hai không vào phòng.                                                 | `joinAs` chờ hộp nhập tên tối đa 3 giây.                                                                                                             |
| CR-06            | Lỗi test: script chuẩn bị dữ liệu chạy cả trên trang `about:blank` (khi lùi quá trang đầu) và gặp lỗi đọc `sessionStorage`.                      | Bọc script trong `try`.                                                                                                                              |
| CR-07            | Một nửa lỗi test: các dòng `ERR_INTERNET_DISCONNECTED` là đúng khi mất mạng. Nửa còn lại là thiếu sót của app: người mất mạng không được báo gì. | Bỏ qua lỗi mạng khi đang offline; **bổ sung kiểm tra** người mất mạng thấy thông báo "Mất mạng, đang kết nối lại…" và thông báo tắt khi có mạng lại. |
| SEC-07           | Case chưa có test tự động (chỉ ghi nhận rủi ro).                                                                                                 | Chuyển thành case kiểm tra được: rules từ chối trường lạ trong phòng/người chơi; thêm test luồng chơi đầy đủ dưới rules mới.                         |
| Báo cáo          | Ảnh evidence trùng tên giữa các test nên ghi đè nhau (ảnh case SEC-02 hiện màn hình của test khác).                                              | Tên ảnh gồm mã case + thư mục riêng của test.                                                                                                        |
| Các case còn lại | Lỗi của app, xem `bugs.md` B01–B09.                                                                                                              | Không đổi test.                                                                                                                                      |

## Review lần 3 – sau run 02 (v2.1 → v2.2)

Run 02: 52/52 case PASS. Trước khi kết luận, review thêm: soát ảnh evidence bằng mắt và chạy lại toàn bộ bộ e2e cũ (24 test) để tìm hồi quy.

| Phát hiện                                                                                                                              | Kết luận                                                                                                                                                               | Thay đổi                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| Log bộ e2e cũ có cảnh báo Firebase `permission_denied` khi người chơi đã có tên mở link mời, dù test vẫn PASS.                         | **Hồi quy do bản sửa B04** (rules chặt hơn) + lỗ hổng của bộ test: chỉ bắt `console.error`, trong khi Firebase báo lần ghi bị từ chối bằng `console.warn`. Ghi là B10. | Fixture tính mọi `permission_denied` là lỗi. Thêm case **CR-12**. |
| Ảnh D10 (điện thoại xoay ngang): bàn ca rô/bàn số nằm gọn trong màn hình nhưng ô nhỏ (25–30 px). UI-02b chỉ đo kích thước ô ở màn dọc. | Hạn chế của bản web khi xoay ngang; app native khoá màn dọc. Ghi B11 mức Thấp, chấp nhận.                                                                              | Không đổi test (đã ghi giới hạn phạm vi UI-02b).                  |
| Các ảnh còn lại (14 cấu hình × 16 màn hình)                                                                                            | Không thấy lỗi hiển thị.                                                                                                                                               | —                                                                 |

## Review lần 4 – thêm nhóm AU (âm thanh), v2.2 → v2.3

| Case         | Lý do                                                                                                                                            |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| AU-01        | Âm thanh là file: kiểm tra đủ file cho cả 2 giao diện, đúng định dạng MP3 (iPhone cũ không phát ogg), nhỏ, có giấy phép, có trong cache offline. |
| AU-02, AU-03 | Đúng danh sách sự kiện chủ dự án chọn: đếm ngược, thắng/thua/hoà, kỷ lục. Các sự kiện Cờ gánh (gánh, chầu/vây, bị Mở) sẽ test khi có game.       |
| AU-04        | Chủ dự án yêu cầu tắt hẳn các âm phản hồi nhỏ: đo số âm tổng hợp được tạo khi bấm, phải bằng 0.                                                  |
| AU-05        | Thay cho phần âm thanh của UX-10 (UX-10 vẫn kiểm tra rung).                                                                                      |
| AU-06        | Nhạc nền mặc định tắt theo yêu cầu. Trình duyệt chỉ cho phát sau lần chạm đầu, nên test chạm trước khi kiểm tra.                                 |
| AU-07        | Âm thanh theo giao diện.                                                                                                                         |

## Review lần 5 – thêm Cờ gánh, v2.3 → v2.4

| Case                        | Lý do                                                                                                                                                                                                                                                                                                      |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-11 … LG-15               | Bám từng mục trong đặc tả luật của chủ dự án và các điểm review R1–R10.                                                                                                                                                                                                                                    |
| LG-16                       | Máy: luôn đúng luật (kể cả Mở), có gánh thì gánh, tốc độ < 300 ms.                                                                                                                                                                                                                                         |
| LG-17, UX-19, SEC-08        | Online: kiểm tra nước đi trong transaction như Ca rô, rules thêm `coganh`.                                                                                                                                                                                                                                 |
| UI-09                       | Cờ gánh có bàn riêng (SVG): cần kiểm tra vừa màn hình và điểm bấm ≥ 44 px trên điện thoại ở cả 2 giao diện.                                                                                                                                                                                                |
| UX-16 … UX-18, AU-08, CR-13 | Trải nghiệm chọn quân, luật Mở trên giao diện, âm thanh gánh/bị Mở, link sai.                                                                                                                                                                                                                              |
| UX-16                       | Bản đầu giả định quân góc (0,0) bị kẹt lúc bắt đầu ván; thực tế quân đó đi chéo được (đúng luật). Đổi thành kiểm tra "chạm quân khác của mình thì đổi chọn". Trường hợp quân bị khoá đã được UX-17 kiểm tra.                                                                                               |
| CR-01, UX-03, UX-11         | Thêm các màn Cờ gánh vào danh sách màn hình kiểm tra.                                                                                                                                                                                                                                                      |
| english.spec (bộ e2e cũ)    | Báo "Cờ Gánh" là chữ Việt sót trên giao diện tiếng Anh. Quyết định: giữ tên riêng của trò chơi dân gian (như "Sudoku", "Go"), trang store tiếng Anh cũng dùng tên này. Test được phép chấp nhận "Cờ Gánh", "Gánh", "Mở".                                                                                   |
| UI-05, UI-09                | Soát ảnh store sau run 06 thấy tên "Người 1" bị cắt trên màn 360 px (B15). UI-05 bỏ qua ô tên người chơi. Bổ sung: tên ≤ 8 ký tự không được cắt, trên mọi thiết bị; thêm màn Cờ gánh vào vòng chụp 11 thiết bị (UI-09).                                                                                    |
| CR-06 (run 07)              | Lỗi test, chỉ xảy ra khi chạy song song nặng (chạy riêng 5/5 pass): vòng lặp cuối lùi quá trang đầu về `about:blank`, tiến lại thì app nạp lại từ đầu, mà test chỉ chờ cố định 0,8 giây. Đổi `rendered()` sang chờ tới khi app vẽ xong (tối đa 10 giây). Dùng chung cho CR-01, CR-03, CR-04, CR-06, CR-10. |

## Review lần 6 – thêm Ô ăn quan, nhóm game, câu chuyện, v2.4 → v2.5

| Case                       | Lý do                                                                                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| LG-18                      | Luật miền Bắc: 5 sỏi/ô dân, quan = 10 điểm, ăn quan bất kỳ lúc nào (không áp dụng "quan non"), hết dân thì rải lại 5 (được vay). Thêm kiểm tra bảo toàn tổng số sỏi qua 50 ván ngẫu nhiên. |
| LG-19                      | Máy: luôn đi đúng luật, có quan thì ăn, mức Khó thắng mức Dễ, trả lời nhanh trên điện thoại.                                                                                               |
| LG-20, UX-22, SEC-08       | Online: kiểm tra nước đi trong transaction; mỗi người thấy ô của mình ở hàng dưới (đảo bàn 180°); rules thêm `oanquan`.                                                                    |
| UI-10                      | Bàn 7 cột: trên màn 360 px ô dân phải ≥ 44 px, nên ô quan (không bấm được) được thu hẹp.                                                                                                   |
| UX-20, UX-21, AU-09, CR-14 | Chọn ô rồi chọn hướng bằng 2 nút lớn (dễ cho người lớn tuổi hơn vuốt), máy, đi lại, âm thanh khi ăn, link sai.                                                                             |
| UX-23                      | Màn hình chính chia 2 nhóm; mỗi game có tab "Câu chuyện" (nguồn gốc, ý nghĩa tên gọi, mẹo chơi).                                                                                           |
| CR-01, UX-03               | Thêm các màn Ô ăn quan vào danh sách màn hình kiểm tra.                                                                                                                                    |

## Review lần 7 – thêm Nối từ, v2.5 → v2.6

| Case         | Lý do                                                                                                                                                                                                                                                               |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-23        | Từ điển là rủi ro lớn nhất của game: nguồn phải có giấy phép dùng được trên App Store (Wiktionary CC BY-SA, không dùng danh sách GPL), đủ lớn, có từ trẻ em hay nói (Wiktionary thiếu "con mèo", "mèo con"… nên bổ sung danh sách tự soạn), và không có từ thô tục. |
| LG-21        | Bản đầu chấp nhận gõ không dấu. Chủ dự án yêu cầu tiếng Việt phải có dấu. Đổi: bắt buộc đúng dấu, thiếu dấu chỉ nhắc chứ không lộ từ; chấp nhận cả 2 kiểu đặt dấu (hoà/hòa, thuỷ/thủy) vì đều đúng chính tả và bàn phím mỗi máy mỗi kiểu.                           |
| LG-22        | Máy: Dễ chỉ biết một phần từ thông dụng (để bé thắng được), Khó chọn từ "bẫy".                                                                                                                                                                                      |
| LG-24, UX-26 | Online có đồng hồ: dùng giờ máy chủ Firebase; người đến lượt tự xử thua khi hết giờ, nếu app của họ treo thì đối thủ được xử thắng sau 5 giây trễ.                                                                                                                  |
| UX-25        | Kiểm tra hết giờ bằng đồng hồ giả lập của Playwright, không phải chờ 45 giây thật.                                                                                                                                                                                  |
| UI-11        | Màn hình có bàn phím: ô nhập và các nút phải nằm trong màn hình, ≥ 44 px.                                                                                                                                                                                           |

## Review lần 8 – từ cho trẻ em trong Nối từ, v2.6 → v2.7

| Case  | Lý do                                                                                                                                                                                                                                                                                                                              |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-25 | Chơi thử thấy máy mức Dễ dùng từ khó ("sĩ phu"). Thử chọn tự động theo độ phổ biến của từng tiếng thì lọt "nạn nhân", "sống thử", "an tử": không dùng được. Chuyển sang danh sách chọn tay (≈ 900 từ theo chủ đề: gia đình, trường lớp, con vật, đồ ăn, thiên nhiên, đồ chơi, Tết…), có nghĩa tiếng Anh cho từ Wiktionary chưa có. |

| CR-06 (run 12) | Lỗi test lần 2, khi chạy song song nặng: vòng Back/Forward lùi quá trang đầu ra `about:blank`, rồi Forward tải lại cả app và Playwright chờ sự kiện "load" không đến trong 90 giây (trang được lấy lại từ bfcache hoặc máy quá tải). Ảnh lúc lỗi: app hiển thị bình thường; chạy riêng 8/8 pass. Người chơi không thể lùi ra khỏi app, nên test được sửa cho đúng kịch bản: bấm nhanh trong app, không chờ từng trang tải xong, rồi kiểm tra không trắng màn hình và không lỗi. |

## Review lần 9 – bỏ gợi ý, v2.7 → v2.8

| Case         | Lý do                                                                                                                                                                                                   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-06, UX-16 | Chủ dự án yêu cầu bỏ gợi ý ở Tìm số (số tiếp theo sáng sau 15 giây) và Cờ gánh (quân đi được, điểm đến). Riêng khi bị Mở, Cờ gánh vẫn tô sáng quân và điểm bắt buộc (chủ dự án chọn). UX-17 giữ nguyên. |

## Review lần 10 – giao diện máy tính, v2.8 → v2.9

| Case  | Lý do                                                                                                                                                                                                                                                                                                |
| ----- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UI-12 | Chủ dự án chơi trên laptop: màn chơi quá nhỏ (Cờ gánh, Ca rô, Tìm số). Nguyên nhân: bố cục một cột của điện thoại + cỡ nút máy tính bảng (80 px) trên màn hình thấp. UI-01…UI-08 chỉ kiểm tra "không tràn, nằm trọn" nên không bắt được lỗi "quá nhỏ". Thêm UI-12 đo tỉ lệ bàn chơi so với màn hình. |

## Review lần 11 – Ô ăn quan diễn từng bước, v2.9 → v3.0

| Case         | Lý do                                                                                                                                                                                                                                                     |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-20, LG-26 | Chủ dự án: hiệu ứng rải sỏi không rõ. Nước đi giờ được diễn từng bước; test kiểm tra bàn tay ✋ hiện khi rải, chạm để xem nhanh, và việc diễn lại khớp tuyệt đối với kết quả của luật. UX-21/UX-22 chờ lâu hơn vì máy và người chơi online đợi diễn xong. |

## Review lần 12 – Nối từ thêm từ, nút "là từ có thật", v3.0 → v3.1

| Case          | Lý do                                                                                                                                                                                                                                              |
| ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-27         | Thêm ~9.000 từ từ Wiktionary tiếng Việt (CC BY-SA), lọc bỏ từ cũ, phương ngữ, thông tục và nội dung không hợp trẻ em. Lọc vẫn để lọt vài từ thô ("cầu tõm"), nên các từ này chỉ được chấp nhận khi người chơi gõ; máy và gợi ý không bao giờ dùng. |
| UX-27, SEC-09 | Nút "là từ có thật" gửi đúng từ (không tên, không mã người chơi trong bản ghi). Rules chỉ cho tạo mới, giới hạn định dạng, không cho đọc. Chính sách quyền riêng tư được cập nhật.                                                                 |

## Review lần 13 – nhạc nền tự phối, v3.1 → v3.2

| Case  | Lý do                                                                                                                                                                                                                                                                         |
| ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AU-10 | Chủ dự án: nhạc nền đơn âm nghe chán. Nhạc mới 4 lớp (giai điệu gảy kiểu đàn tranh/luyến đàn bầu hoặc chuông, hợp âm nền, bè trầm, bộ gõ mõ/lắc/trống), 3 bài. Phần sáng tác tách riêng (musicScore.ts) để test tự động; chất lượng nghe do chủ dự án duyệt qua file thu thử. |

## Review lần 14 – trình duyệt, v3.2 → v3.3

| Case                                         | Lý do                                                                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| BR-01 … BR-07                                | Chủ dự án hỏi về Firefox, Edge và bản web trên điện thoại. Trước đây mọi test chạy trong Chromium (các "thiết bị" chỉ là kích thước màn hình). Thêm nhóm BR chạy trên mọi trình duyệt; Safari iPhone và Chrome Android chạy thêm toàn bộ nhóm UI/UX. Thiết bị iPhone/iPad dùng nhận dạng Safari thật, điện thoại Android dùng nhận dạng Chrome Android. |
| BR-07 (lần chạy đầu)                         | Tìm ra B16: trên điện thoại, thư viện đăng nhập tải script từ apis.google.com (không cần, lỗi khi mất mạng, trái cam kết không theo dõi). Đã sửa.                                                                                                                                                                                                       |
| UX-24 (mobile-chrome)                        | Thất bại thỉnh thoảng: Gợi ý có thể chọn từ "ngõ cụt" nên không có từ "Có thể nối". Gợi ý giờ ưu tiên từ còn nối tiếp được (tốt cho trẻ em), test ổn định 3/3.                                                                                                                                                                                          |
| CR-16, B18 (Safari/Firefox, lần chạy CI đầu) | Safari iPhone 66/70 và Firefox 9/10: mọi lỗi cùng một kiểu "tải module thất bại" khi trang được tải lại lúc đang tải dở. Không phải lỗi người chơi thấy, nhưng dẫn tới một rủi ro thật (màn trắng khi phần chính không tải được), nên thêm CR-16. Edge, Chrome Android, Safari máy tính: đạt hết.                                                       |

## Review lần 15 – Cờ cá ngựa, v3.4 → v3.5

| Case   | Lý do                                                                                                                                                                                                                            |
| ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| LG-28  | Luật do chủ dự án chọn: ra quân bằng 6 hoặc 1, không nhảy qua ngựa, lên chuồng phải đúng số bậc. Test từng luật trên thế cờ dựng sẵn.                                                                                            |
| LG-29  | Chủ dự án chọn chơi online. Xí ngầu tính từ seed của ván và số lần đã đổ, nên người chơi không thể đổ lại để lấy số đẹp; mọi máy thấy cùng một số. Thêm một ván ngẫu nhiên dài tới khi có người thắng để chắc không bao giờ kẹt. |
| SEC-10 | Cờ cá ngựa cần 4 người, các game khác vẫn 2: thêm ghế 3, 4 vào rules, chỉ mở cho Cờ cá ngựa và chỉ khi phòng đang chờ (không chen vào ván đang chơi).                                                                            |
| UX-28  | Ba trình duyệt cùng chơi: chủ phòng bấm Bắt đầu, lần lượt đổ và đi, bàn cờ ba bên giống nhau; một người thoát thì ván chơi tiếp với hai người.                                                                                   |

## Review lần 16 – bộ đếm lượt chơi, v3.5 → v3.6

| Case   | Lý do                                                                                                                                                                     |
| ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| UX-29  | Chủ dự án: hiện tổng lượt chơi ở trang chủ và từng game; đếm chung mọi người chơi, mỗi ván bắt đầu là một lượt (online: chủ phòng đếm một lần cho cả phòng).              |
| SEC-11 | Bộ đếm là dữ liệu dùng chung ai cũng ghi được, nên rules chỉ cho cộng đúng 1 và chỉ với 6 game có thật; không lưu mã người chơi. Chính sách quyền riêng tư được cập nhật. |
