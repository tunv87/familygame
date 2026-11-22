# Test plan – Trò chơi gia đình

## Mục tiêu

Đảm bảo app (web + bọc iOS/Android) **không crash, đúng luật chơi, an toàn, dễ dùng cho 7–70 tuổi** trên các màn hình phổ biến, trước khi gửi App Store / Google Play.

## Phạm vi

| Nhóm                                       | Mã  | Công cụ                                    | File                                                                 |
| ------------------------------------------ | --- | ------------------------------------------ | -------------------------------------------------------------------- |
| Giao diện trên nhiều màn hình              | UI  | Playwright (Chromium, giả lập thiết bị)    | `e2e/qa/ui.spec.ts`                                                  |
| Trải nghiệm theo chuẩn game                | UX  | Playwright                                 | `e2e/qa/ux.spec.ts`                                                  |
| Chống crash / dữ liệu hỏng / thao tác loạn | CR  | Playwright + emulator                      | `e2e/qa/crash.spec.ts`                                               |
| Luật chơi, AI, dữ liệu                     | LG  | Vitest                                     | `src/**/*.test.ts`, `src/qa/*.test.ts`                               |
| Bảo mật                                    | SEC | Vitest + emulator + Playwright + quét tĩnh | `tests-rules/`, `e2e/qa/security.spec.ts`, `src/qa/security.test.ts` |

Không trong phạm vi lần này: test trên thiết bị thật (cần TestFlight / Play closed test), hiệu năng mạng chậm thật, trình đọc màn hình đầy đủ.

## Thiết bị / kích thước màn hình (viewport CSS px)

| Mã  | Thiết bị                    | Kích thước | Ghi chú                                     |
| --- | --------------------------- | ---------- | ------------------------------------------- |
| D1  | iPhone SE (3rd)             | 375×667    | màn nhỏ nhất còn phổ biến                   |
| D2  | iPhone 14 / 15              | 390×844    | phổ biến nhất VN                            |
| D3  | iPhone 15 Pro Max           | 430×932    |                                             |
| D4  | Galaxy S8 / Android nhỏ     | 360×740    |                                             |
| D5  | Pixel 7                     | 412×915    |                                             |
| D6  | iPad mini                   | 768×1024   |                                             |
| D7  | iPad Pro 12.9"              | 1024×1366  |                                             |
| D8  | Laptop                      | 1366×768   |                                             |
| D9  | Desktop Full HD             | 1920×1080  |                                             |
| D10 | Điện thoại xoay ngang (web) | 844×390    | app native khoá dọc; web vẫn phải dùng được |

Cả 2 giao diện (Cổ điển, Dễ thương) và 2 ngôn ngữ (VI, EN) ở các case có đánh dấu.

## Tiêu chí

- **Vào test:** build web pass, emulator Firebase chạy được.
- **Đạt (exit):** 100% case P1 pass; không còn lỗi mức Cao/Trung bình mở; lỗi Thấp còn lại được ghi rõ và chấp nhận.
- **Mức độ lỗi:** Cao = crash/mất dữ liệu/sai luật/bảo mật; Trung bình = khó dùng, sai hiển thị rõ; Thấp = thẩm mỹ.

## Evidence (bằng chứng)

- Mỗi lần chạy: `qa/runs/run-NN.md` (tổng hợp, case fail, phân tích) + `qa/runs/run-NN.json` (kết quả máy đọc).
- Ảnh chụp từng màn hình × thiết bị của lần chạy cuối: `qa/evidence/screens/` (JPEG nén). Ảnh của case fail ở các lần trước: `qa/evidence/failures/run-NN/`.
- Lỗi và cách sửa: `qa/bugs.md`. Quá trình review test case: `qa/review-log.md`.

## Cách chạy

```bash
npm run qa          # chạy toàn bộ: logic + rules + UI/UX/crash/security, ghi evidence
```

- Ngoài phạm vi (test tay trên máy thật): nút Back Android, rung, bảng chia sẻ native, cài từ TestFlight/Play.
