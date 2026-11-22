# Trò chơi gia đình 🎲

Game hub chạy trên web (test được trên iPhone), giao diện đơn giản cho cả bé 7 tuổi lẫn ông bà 70 tuổi.

| Game                                                                | Chơi với máy | 2 người cùng máy | Chơi với bạn (online) |
| ------------------------------------------------------------------- | :----------: | :--------------: | :-------------------: |
| 🔢 **Tìm số** — thi ai tìm số kế tiếp nhanh hơn (1→30 / 60 / 100)   |              |                  |          ✅           |
| ⭕ **Cờ ca rô** — bàn 3×3 (3 thắng) hoặc 15×15 (5 thắng), máy 3 mức |      ✅      |        ✅        |          ✅           |

Chơi online: một người **Tạo phòng** → nhận mã 4 số → bấm **Gửi cho bạn** (Zalo/Messenger…). Người kia mở link hoặc bấm **Vào phòng** và nhập mã. Không cần tài khoản.

## Chạy trên máy

```bash
npm install
npm run dev            # http://localhost:5173/familygame/  (online cần .env.local)
```

Thử online không cần Firebase thật (cần Java 11+):

```bash
npm run emulators      # terminal 1
npm run dev:emu        # terminal 2 — mở ở 2 tab/trình duyệt để chơi với chính mình
```

Mở trên iPhone cùng mạng Wi-Fi: dùng địa chỉ `Network:` mà Vite in ra.

## Kiểm thử

```bash
npm run lint && npm run typecheck
npm test               # unit: luật chơi, AI ca rô, xếp bàn số
npm run test:rules     # Firebase security rules (emulator)
npm run e2e            # Playwright, giả lập iPhone; 2 "máy" chơi online với nhau qua emulator
```

Trên iPhone không có devtools: bấm 5 lần vào tiêu đề trang chủ (hoặc Cài đặt → Nhật ký lỗi) để xem/chép log.

## Cài đặt online + deploy (làm 1 lần)

1. **Firebase** (gói miễn phí Spark): tạo project tại console.firebase.google.com →
   - Build → Authentication → Sign-in method → bật **Anonymous**.
   - Build → Realtime Database → Create database (vùng `asia-southeast1`) → tab **Rules** → dán nội dung `database.rules.json` → Publish.
   - Project settings → Your apps → thêm **Web app** → lấy config.
2. **GitHub** → repo → Settings → Secrets and variables → Actions → tab **Variables**, thêm:
   `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_DATABASE_URL`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID`.
   (Config web của Firebase là công khai; dữ liệu được bảo vệ bởi rules.)
3. **GitHub Pages**: Settings → Pages → Source: **GitHub Actions**.
4. Push lên `main` → workflow _Deploy_ build và đăng tại `https://<user>.github.io/familygame/`.
5. Trên iPhone: mở link bằng Safari → Chia sẻ → **Thêm vào MH chính** để chơi như app.

## Cấu trúc

```
src/app/        Hub, cài đặt, debug, store cài đặt/hồ sơ
src/games/      registry.ts + mỗi game một thư mục (logic thuần + UI)
src/online/     Firebase, phòng chơi (tạo/vào/presence/chơi lại), màn hình phòng
src/lib/        logger, âm thanh, PRNG, localStorage
src/i18n/       tiếng Việt (mặc định) + tiếng Anh
e2e/            Playwright
tests-rules/    test security rules
```

Thêm game mới: tạo thư mục trong `src/games/`, khai báo trong `src/games/registry.ts`, thêm route trong `src/app/App.tsx`.
