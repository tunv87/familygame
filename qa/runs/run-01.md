# QA run 01

Thời gian: 2026-11-22 23:53 UTC
Test tự động: 91 (78 pass, 13 fail, 0 skip)

## Tổng hợp theo nhóm

| Nhóm     | Case   | PASS   | FAIL   | NOT RUN |
| -------- | ------ | ------ | ------ | ------- |
| UI       | 9      | 5      | 4      | 0       |
| UX       | 15     | 13     | 2      | 0       |
| CR       | 11     | 7      | 4      | 0       |
| LG       | 10     | 9      | 1      | 0       |
| SEC      | 7      | 3      | 3      | 1       |
| **Tổng** | **52** | **37** | **14** | **1**   |

## Kết quả từng case

| Case   | Ưu tiên | Kết quả    | Số test | Kiểm tra                                                                  |
| ------ | ------- | ---------- | ------- | ------------------------------------------------------------------------- |
| UI-01  | P1      | ✅ PASS    | 14      | Mở từng màn hình chính trên D1–D10                                        |
| UI-02  | P1      | ❌ FAIL    | 14      | Nút điều khiển trên D1–D5 (không tính quân cờ/ô số)                       |
| UI-02b | P1      | ✅ PASS    | 14      | Ô chơi game (ô ca rô 3×3, vùng bấm số mức Dễ/Vừa) trên D1–D5              |
| UI-03  | P1      | ❌ FAIL    | 14      | Bàn Tìm số mức Khó trên D1–D10                                            |
| UI-04  | P1      | ❌ FAIL    | 14      | Bàn ca rô 3×3 trên D1–D10                                                 |
| UI-05  | P2      | ✅ PASS    | 14      | Chữ trên D1                                                               |
| UI-06  | P1      | ❌ FAIL    | 14      | Hộp thoại (kết quả, thoát, chào mừng) trên D1                             |
| UI-07  | P2      | ✅ PASS    | 14      | Chụp ảnh mọi màn hình × thiết bị × 2 giao diện                            |
| UI-08  | P2      | ✅ PASS    | 1       | iPad xoay ngang (D11 1366×1024)                                           |
| UX-01  | P1      | ❌ FAIL    | 1       | Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi) |
| UX-02  | P1      | ✅ PASS    | 1       | Máy (AI) đi nước ca rô 15×15 mức Khó                                      |
| UX-03  | P1      | ✅ PASS    | 1       | Mọi màn hình                                                              |
| UX-04  | P1      | ✅ PASS    | 1       | Thoát giữa ván (ca rô, Tìm số)                                            |
| UX-05  | P1      | ✅ PASS    | 1       | Kết thúc ván                                                              |
| UX-06  | P2      | ✅ PASS    | 1       | Không bấm gì 15 giây trong Tìm số                                         |
| UX-07  | P1      | ✅ PASS    | 1       | Đi lại (Undo) trong ca rô với máy                                         |
| UX-08  | P2      | ✅ PASS    | 1       | Bật "Chữ to"                                                              |
| UX-09  | P1      | ✅ PASS    | 1       | Đổi cài đặt (giao diện, ngôn ngữ, âm thanh) rồi tải lại                   |
| UX-10  | P1      | ✅ PASS    | 1       | Tắt âm thanh                                                              |
| UX-11  | P1      | ❌ FAIL    | 1       | Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu     |
| UX-12  | P2      | ✅ PASS    | 1       | Chơi lại ván Tìm số                                                       |
| UX-13  | P1      | ✅ PASS    | 1       | Nhập mã phòng không tồn tại                                               |
| UX-14  | P1      | ✅ PASS    | 1       | Mất mạng rồi bấm "Tạo phòng"                                              |
| UX-15  | P2      | ✅ PASS    | 1       | Màn hình chào mừng chỉ hiện lần đầu                                       |
| CR-01  | P1      | ✅ PASS    | 1       | Đi qua mọi route                                                          |
| CR-02  | P1      | ✅ PASS    | 1       | Route không tồn tại                                                       |
| CR-03  | P1      | ❌ FAIL    | 1       | Tham số URL sai (`size=999`, `level=abc`, `mode=xyz`)                     |
| CR-04  | P1      | ❌ FAIL    | 1       | localStorage hỏng (JSON lỗi, sai kiểu)                                    |
| CR-05  | P1      | ✅ PASS    | 1       | Bấm loạn 300 lần vào bàn Tìm số và ca rô                                  |
| CR-06  | P2      | ❌ FAIL    | 1       | Bấm Back/Forward liên tục                                                 |
| CR-07  | P1      | ❌ FAIL    | 1       | Mất mạng giữa ván online rồi có mạng lại                                  |
| CR-08  | P1      | ✅ PASS    | 1       | Tải lại trang giữa ván online                                             |
| CR-09  | P2      | ✅ PASS    | 1       | Chơi 20 ván ca rô liên tiếp                                               |
| CR-10  | P1      | ✅ PASS    | 1       | Trình duyệt chặn localStorage (Safari riêng tư)                           |
| CR-11  | P1      | ✅ PASS    | 1       | Bạn chơi cùng rời phòng giữa ván                                          |
| LG-01  | P1      | ✅ PASS    | 6       | Thắng ca rô theo 4 hướng, ở mép bàn, không "nối" qua hàng                 |
| LG-02  | P1      | ✅ PASS    | 3       | AI 3×3 mức Khó                                                            |
| LG-03  | P1      | ✅ PASS    | 5       | AI 15×15                                                                  |
| LG-04  | P1      | ✅ PASS    | 3       | AI không bao giờ chọn ô đã có quân, kể cả bàn gần đầy                     |
| LG-05  | P1      | ✅ PASS    | 4       | Bàn số: đủ số, không chồng nhau, cùng seed cùng bàn                       |
| LG-06  | P1      | ✅ PASS    | 4       | Lấy số: chỉ số kế tiếp, mỗi số 1 người, đếm điểm, hoà                     |
| LG-07  | P1      | ✅ PASS    | 3       | Ca rô online: đúng lượt, ô trống, sau khi thắng không đi tiếp             |
| LG-08  | P2      | ✅ PASS    | 1       | Kỷ lục luyện tập chỉ lưu khi nhanh hơn                                    |
| LG-09  | P1      | ✅ PASS    | 2       | i18n: mọi câu có cùng biến `{name}`, `{n}`… ở VI và EN                    |
| LG-10  | P2      | ❌ FAIL    | 3       | Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai                              |
| SEC-01 | P1      | ✅ PASS    | 9       | Firebase rules (9 case đã có)                                             |
| SEC-02 | P1      | ❌ FAIL    | 1       | Tên người chơi chứa HTML/script                                           |
| SEC-03 | P1      | ✅ PASS    | 2       | Không có khoá bí mật trong bản build                                      |
| SEC-04 | P1      | ❌ FAIL    | 1       | `npm audit` dependency chạy trong app                                     |
| SEC-05 | P2      | ✅ PASS    | 2       | Android không cho HTTP thường (cleartext), iOS không mở ATS tuỳ tiện      |
| SEC-06 | P1      | ❌ FAIL    | 3       | Người trong phòng không sửa được thông tin người kia                      |
| SEC-07 | P2      | ⚪ NOT RUN | 0       | Mã phòng 4 số có thể bị dò                                                |

## Chi tiết case FAIL

### UI-02 – Nút điều khiển trên D1–D5 (không tính quân cờ/ô số)

Mong đợi: Mọi nút ≥ 44×44 px (Apple HIG 44pt, Material 48dp ≈ 44 px CSS ở mật độ chuẩn)

- [UI-01][UI-02][UI-02b][UI-03][UI-04][UI-05][UI-06][UI-07] D4 Galaxy S8 360×740 classic: Error: [UI-02] D4 00-welcome: controls < 44px: button "🐶" 43×48; button "🐱" 43×48; button "🐰" 43×48; button "🐻" 43×48; button "🐼" 43×48; button "🦊" 43×48; button "🐯" 43×48; button "🐸" 43×48; button "🐵" 43×48; button "🦄" 43×48; button "🐧" 43×48; button "🐢" 43×48

Ảnh: [UI-01-test-failed-1.png](../../qa/evidence/failures/run-01/UI-01-test-failed-1.png), [UI-01-test-failed-2.png](../../qa/evidence/failures/run-01/UI-01-test-failed-2.png)

### UI-03 – Bàn Tìm số mức Khó trên D1–D10

Mong đợi: Toàn bộ bàn số nằm trong màn hình, không phải cuộn

- [UI-01][UI-02][UI-02b][UI-03][UI-04][UI-05][UI-06][UI-07] D10 Phone landscape 844×390 classic: Error: [UI-03] D10 numbers easy board not fully visible: 262,80 320×384 in 844×390 / Error: [UI-03] D10 numbers medium board not fully visible: 263,-2 319×532 in 844×390 / Error: [UI-03] D10 numbers hard board not fully visible: 262,-116 320×520 in 844×390

Ảnh: [UI-01-test-failed-1.png](../../qa/evidence/failures/run-01/UI-01-test-failed-1.png), [UI-01-test-failed-2.png](../../qa/evidence/failures/run-01/UI-01-test-failed-2.png), [UI-01-test-failed-3.png](../../qa/evidence/failures/run-01/UI-01-test-failed-3.png), [UI-01-test-failed-4.png](../../qa/evidence/failures/run-01/UI-01-test-failed-4.png), [UI-01-test-failed-5.png](../../qa/evidence/failures/run-01/UI-01-test-failed-5.png)

### UI-04 – Bàn ca rô 3×3 trên D1–D10

Mong đợi: Cả 9 ô nằm trong màn hình

- [UI-01][UI-02][UI-02b][UI-03][UI-04][UI-05][UI-06][UI-07] D10 Phone landscape 844×390 classic: Error: [UI-04] D10 caro 3×3 board not fully visible: 265,186 314×314 in 844×390

Ảnh: [UI-01-test-failed-1.png](../../qa/evidence/failures/run-01/UI-01-test-failed-1.png), [UI-01-test-failed-2.png](../../qa/evidence/failures/run-01/UI-01-test-failed-2.png), [UI-01-test-failed-3.png](../../qa/evidence/failures/run-01/UI-01-test-failed-3.png), [UI-01-test-failed-4.png](../../qa/evidence/failures/run-01/UI-01-test-failed-4.png), [UI-01-test-failed-5.png](../../qa/evidence/failures/run-01/UI-01-test-failed-5.png)

### UI-06 – Hộp thoại (kết quả, thoát, chào mừng) trên D1

Mong đợi: Nút chính nhìn thấy mà không cần cuộn

- [UI-01][UI-02][UI-02b][UI-03][UI-04][UI-05][UI-06][UI-07] D10 Phone landscape 844×390 classic: Error: [UI-06] D10 welcome: "Bắt đầu chơi" needs scrolling

Ảnh: [UI-01-test-failed-1.png](../../qa/evidence/failures/run-01/UI-01-test-failed-1.png), [UI-01-test-failed-2.png](../../qa/evidence/failures/run-01/UI-01-test-failed-2.png), [UI-01-test-failed-3.png](../../qa/evidence/failures/run-01/UI-01-test-failed-3.png), [UI-01-test-failed-4.png](../../qa/evidence/failures/run-01/UI-01-test-failed-4.png), [UI-01-test-failed-5.png](../../qa/evidence/failures/run-01/UI-01-test-failed-5.png)

### UX-01 – Bấm đúng số trong Tìm số (đo trong trang: từ sự kiện bấm đến khi DOM đổi)

Mong đợi: Phản hồi hình ảnh trong ≤ 100 ms

- [UX-01] correct tap gives visual feedback within 100 ms: Error: [UX-01] feedback times ms: 9999, 9999, 9999, 9999, 9999 / > 27 / expect(Math.max(...times), `[UX-01] feedback times ms: ${times.join(', ')}`).toBeLessThanOrEqual(

Ảnh: [UX-01-test-failed-1.png](../../qa/evidence/failures/run-01/UX-01-test-failed-1.png)

### UX-11 – Độ tương phản chữ (WCAG AA) ở cả 2 giao diện, trừ nút đang bị vô hiệu

Mong đợi: Chữ thường ≥ 4.5:1, chữ lớn (≥ 24 px, hoặc ≥ 18.7 px đậm) ≥ 3:1

- [UX-11] text contrast meets WCAG AA in both themes: Error: [UX-11] classic /#/numbers/play?mode=bot&level=easy: low contrast: "0" 2.80:1 (rgb(249, 115, 22) on rgb(255,255,255)) / Error: [UX-11] cute /: low contrast: "Nhập mã bạn gửi" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / Error: [UX-11] cute /#/settings: low contrast: "Dễ thương 🎀" 2.10:1 (rgb(255, 255, 255) on rgb(255,143,200)) / "Tắt" 2.10:1 (rgb(255, 255, 255) on rgb(255,143,200)) / "Tắt" 2.10:1 (rgb(255, 255, 255) on rgb(255,143,200)) / "Tiếng Việt" 2.10:1 (rgb(255, 255, 255) on rgb(255,143,200)) / "v" 3.56:1 (r / Error: [UX-11] cute /#/about: low contrast: "Miễn phí · Không quả" 3.56:1 (rgb(176, 106, 150) on rgb(255,240,247)) / "v" 3.56:1 (rgb(176, 106, 150) on rgb(255,240,247)) / "Cập nhật: 23/11/2026" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / Error: [UX-11] cute /#/caro: low contrast: "Một mình đấu với máy" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / "Thay phiên nhau trên" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / "Mỗi người một máy, q" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / Error: [UX-11] cute /#/numbers: low contrast: "Thi tìm số nhanh với" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / "Một mình, bấm giờ, p" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255)) / "Mỗi người một máy, q" 3.93:1 (rgb(176, 106, 150) on rgb(255,255,255))

Ảnh: [UX-11-test-failed-2.png](../../qa/evidence/failures/run-01/UX-11-test-failed-2.png), [UX-11-test-failed-1.png](../../qa/evidence/failures/run-01/UX-11-test-failed-1.png), [UX-11-test-failed-3.png](../../qa/evidence/failures/run-01/UX-11-test-failed-3.png), [UX-11-test-failed-4.png](../../qa/evidence/failures/run-01/UX-11-test-failed-4.png), [UX-11-test-failed-5.png](../../qa/evidence/failures/run-01/UX-11-test-failed-5.png)

### CR-03 – Tham số URL sai (`size=999`, `level=abc`, `mode=xyz`)

Mong đợi: Không crash, dùng giá trị mặc định

- [CR-03] bad URL parameters do not crash: Error: [CR-03] /#/numbers/play?mode=bot&level=impossible: blank screen / > 59 / expect.soft(await rendered(page), `[CR-03] ${r}: blank screen`).toBe(true); / 61 / expect(errors, '[CR-03] errors').toEqual([]); / Error: [CR-03] errors / 59 / expect.soft(await rendered(page), `[CR-03] ${r}: blank screen`).toBe(true); / > 61 / expect(errors, '[CR-03] errors').toEqual([]);

Ảnh: [CR-03-test-failed-1.png](../../qa/evidence/failures/run-01/CR-03-test-failed-1.png)

### CR-04 – localStorage hỏng (JSON lỗi, sai kiểu)

Mong đợi: App vẫn mở, dùng mặc định

- [CR-04] corrupted saved data does not break the app: Error: [CR-04] case 2: blank screen / > 89 / expect.soft(await rendered(page), `[CR-04] case ${i + 1}: blank screen`).toBe(true); / 97 / expect.soft(await rendered(page), `[CR-04] case ${i + 1}: settings blank`).toBe(true); / 98 / expect.soft(errors, `[CR-04] case ${i + 1} ${JSON.stringify(data)}: errors`).toEqual([]);

Ảnh: [CR-04-test-failed-1.png](../../qa/evidence/failures/run-01/CR-04-test-failed-1.png), [CR-04-test-failed-2.png](../../qa/evidence/failures/run-01/CR-04-test-failed-2.png), [CR-04-test-failed-3.png](../../qa/evidence/failures/run-01/CR-04-test-failed-3.png)

### CR-06 – Bấm Back/Forward liên tục

Mong đợi: Không lỗi

- [CR-06] rapid back/forward navigation: Error: [CR-06] errors / 137 / expect(await rendered(page), '[CR-06] blank screen').toBe(true); / > 138 / expect(errors, '[CR-06] errors').toEqual([]);

Ảnh: [CR-06-test-failed-2.png](../../qa/evidence/failures/run-01/CR-06-test-failed-2.png), [CR-06-test-failed-1.png](../../qa/evidence/failures/run-01/CR-06-test-failed-1.png), [CR-06-test-failed-3.png](../../qa/evidence/failures/run-01/CR-06-test-failed-3.png)

### CR-07 – Mất mạng giữa ván online rồi có mạng lại

Mong đợi: Hiện trạng thái mất kết nối, có mạng lại thì chơi tiếp

- [CR-07] losing the connection mid-game and getting it back: Error: [CR-07] errors / 158 / '[CR-07] game did not continue after reconnect', / > 160 / expect([...a.errors, ...b.errors], '[CR-07] errors').toEqual([]);

Ảnh: [CR-07-test-failed-1.png](../../qa/evidence/failures/run-01/CR-07-test-failed-1.png), [CR-07-test-failed-2.png](../../qa/evidence/failures/run-01/CR-07-test-failed-2.png)

### LG-10 – Đọc dữ liệu lưu (load) với dữ liệu thiếu/sai

Mong đợi: Lấy mặc định cho phần thiếu

- [LG-10] saved data with missing or wrong fields falls back to defaults › ignores invalid JSON and non-object values: AssertionError: "text": expected { '0': 't', '1': 'e', '2': 'x', …(2) } to deeply equal { a: 1 } / at /home/user/familygame/src/qa/logic.test.ts:80:43 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:1695:35 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:2864:26 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:3402:20 / at new Promise (<anonymous>)

### SEC-02 – Tên người chơi chứa HTML/script

Mong đợi: Hiển thị như chữ, không chạy script

- [SEC-02] HTML in a player name is shown as text and never runs: Error: [SEC-02] name not shown as text / - [SEC-02] name not shown as text getByTestId('opp-score').locator('..') with timeout 5000ms / 19 / '[SEC-02] name not shown as text', / 22 / expect(ran, '[SEC-02] script from a name ran').toBeUndefined();

Ảnh: [SEC-02-test-failed-1.png](../../qa/evidence/failures/run-01/SEC-02-test-failed-1.png), [SEC-02-test-failed-2.png](../../qa/evidence/failures/run-01/SEC-02-test-failed-2.png), [SEC-02-test-failed-5.png](../../qa/evidence/failures/run-01/SEC-02-test-failed-5.png), [SEC-02-test-failed-3.png](../../qa/evidence/failures/run-01/SEC-02-test-failed-3.png), [SEC-02-test-failed-4.png](../../qa/evidence/failures/run-01/SEC-02-test-failed-4.png)

### SEC-04 – `npm audit` dependency chạy trong app

Mong đợi: Không có lỗ hổng High/Critical

- [SEC-04] dependencies shipped in the app have no high/critical advisories › npm audit --omit=dev: AssertionError: expected { high: 4, critical: +0 } to deeply equal { high: +0, critical: +0 } / at /home/user/familygame/src/qa/security.test.ts:75:62 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:1695:35 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:2864:26 / at file:///home/user/familygame/node_modules/vitest/dist/chunks/run.zBhXlcZQ.js:3402:20 / at new Promise (<anonymous>)

### SEC-06 – Người trong phòng không sửa được thông tin người kia

Mong đợi: Rules chặn

- [SEC-06] players cannot tamper with each other › a member cannot rename or remove the other player: Error: promise resolved "undefined" instead of rejecting / at _Assertion.**VITEST_REJECTS** (file:///home/user/familygame/node_modules/vitest/dist/chunks/index.DNcttN5a.js:2179:33) / at _Assertion.propertyGetter (file:///home/user/familygame/node_modules/chai/index.js:1607:27) / at Reflect.get (<anonymous>) / at Object.proxyGetter [as get] (file:///home/user/familygame/node_modules/chai/index.js:1696:22) / at denied (/home/user/familygame/tests-rules/rules.test.ts:58:50)
- [SEC-06] players cannot tamper with each other › a member cannot take the host role or give the seat to someone else: Error: promise resolved "undefined" instead of rejecting / at _Assertion.**VITEST_REJECTS** (file:///home/user/familygame/node_modules/vitest/dist/chunks/index.DNcttN5a.js:2179:33) / at _Assertion.propertyGetter (file:///home/user/familygame/node_modules/chai/index.js:1607:27) / at Reflect.get (<anonymous>) / at Object.proxyGetter [as get] (file:///home/user/familygame/node_modules/chai/index.js:1696:22) / at denied (/home/user/familygame/tests-rules/rules.test.ts:58:50)

## Evidence

- Ảnh từng màn hình × thiết bị: `qa/evidence/screens/`
- Ảnh case fail: `qa/evidence/failures/run-01/`
- Kết quả máy đọc: `qa/runs/run-01.json`

## Phân tích sau run 01

- 14 case FAIL: **9 lỗi của app** (B01–B09 trong `qa/bugs.md`, 5 mức Cao) và **5 lỗi/thiếu sót của test** (UX-01, SEC-02, CR-06, một phần CR-07, SEC-07 chưa có test) — chi tiết trong `qa/review-log.md`, mục "Review lần 2".
- Ảnh fail của run này bị trùng tên giữa các test (đã sửa script từ run 02), nên một số link ảnh ở trên trỏ sai màn hình.
