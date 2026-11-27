# Giao diện web (máy tính) và app (iOS / Android)

Hai giao diện được tách riêng:

| Chạy ở đâu                                                        | Giao diện                                                     | File CSS                                    |
| ----------------------------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------- |
| App iOS / Android (kể cả iPad xoay ngang)                         | Điện thoại / máy tính bảng                                    | `src/styles.css`                            |
| Trình duyệt trên điện thoại, máy tính bảng                        | Điện thoại / máy tính bảng                                    | `src/styles.css`                            |
| Trình duyệt trên máy tính (màn ≥ 1000px nằm ngang, hoặc có chuột) | Máy tính: trang chủ dạng lưới, trang game 3 cột, bàn chơi lớn | `src/styles.css` + `src/styles/desktop.css` |

- `src/main.tsx` chỉ nạp `desktop.css` khi **không** chạy trong app (`isNative` là false), và gắn
  `data-shell="web"` hoặc `data-shell="app"` lên thẻ `<html>`.
- Sửa giao diện máy tính: chỉ sửa `src/styles/desktop.css` → app không bị ảnh hưởng.
- Sửa giao diện điện thoại / app: sửa `src/styles.css`; kiểm tra lại máy tính bằng `npm run qa`
  (UI-12 đo bàn chơi trên màn máy tính).
- Các khối chỉ dành cho máy tính trong code React có class `desk-only` (ẩn ở `styles.css`, hiện ở
  `desktop.css`).
