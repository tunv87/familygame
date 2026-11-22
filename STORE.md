# Đưa app lên App Store & Google Play

Mọi thứ build, ký, upload đã tự động bằng GitHub Actions. Phần dưới là **việc bạn làm một lần** trên trang Apple/Google (cần đăng nhập, xác minh danh tính, trả phí — Claude không làm thay được).

|                                   | Giá trị                                          |
| --------------------------------- | ------------------------------------------------ |
| Mã app (Bundle ID / Package name) | `io.github.tunv87.familygame`                    |
| Tên trên store (VI)               | Tìm số & Cờ ca rô: Gia đình                      |
| Tên trên store (EN)               | Family Games: Numbers & Gomoku                   |
| Tên dưới icon                     | Gia đình (Android máy tiếng Anh: Family Games)   |
| Chính sách quyền riêng tư         | https://tunv87.github.io/familygame/privacy.html |
| Trang hỗ trợ                      | https://github.com/tunv87/familygame/issues      |
| Danh mục                          | Games → Board (phụ: Family)                      |
| Độ tuổi                           | 4+ (Apple) / Mọi lứa tuổi (Google)               |

Nội dung store (mô tả, từ khoá, ảnh chụp VI/EN) nằm trong `fastlane/metadata/` và `fastlane/screenshots/`; tạo lại ảnh bằng `npm run store:screenshots`.

Thêm secret: GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**.

---

## A. Google Play (làm trước — có 14 ngày thử nghiệm bắt buộc)

1. **Tài khoản**: https://play.google.com/console → đăng ký **Cá nhân**, phí 25 USD, xác minh danh tính (CCCD/hộ chiếu) và số điện thoại. Có thể mất vài ngày.
2. **Khoá ký app (upload key)** — chọn một cách:
   - Nhờ Claude tạo và gửi file cho bạn, **hoặc**
   - Tự tạo (cần Java): `keytool -genkeypair -v -keystore upload.jks -alias upload -keyalg RSA -keysize 2048 -validity 10000`
   - Lưu file `.jks` + mật khẩu ở nơi an toàn (Google Drive riêng/trình quản lý mật khẩu). Mất khoá thì phải xin Google đặt lại.
   - Thêm secret: `ANDROID_KEYSTORE_BASE64` (nội dung `base64 -w0 upload.jks`), `ANDROID_KEYSTORE_PASSWORD`, `ANDROID_KEY_ALIAS` (= `upload`), `ANDROID_KEY_PASSWORD`.
3. **Tạo app** trong Play Console: _Create app_ → tên "Tìm số & Cờ ca rô: Gia đình", ngôn ngữ mặc định Tiếng Việt, _Game_, _Free_.
4. **Bản build đầu tiên** (Google bắt upload tay lần đầu):
   - GitHub → **Actions → Mobile release → Run workflow** (platform `android`).
   - Mở lượt chạy → tải artifact **android-release-aab** → giải nén ra `app-release.aab`.
   - Play Console → **Testing → Closed testing** → _Create track_ (hoặc dùng _Alpha_) → _Create release_ → upload file `.aab` → khi được hỏi, chọn **Google Play App Signing** (mặc định).
5. **Người thử (bắt buộc với tài khoản cá nhân)**: ở track Closed testing → _Testers_ → thêm danh sách email (≥ **12 người**, Gmail) → gửi link mời cho họ cài. Cần **12 người giữ app 14 ngày liên tục** mới được xin lên Production.
6. **Upload tự động các lần sau**: Play Console → **Setup → API access** → tạo _service account_ (mở Google Cloud) → tạo khoá **JSON** → quay lại Play Console → **Users and permissions** → mời email service account, quyền _Release to testing tracks_ + _Manage store presence_ (hoặc Admin).
   - Secret: `PLAY_SERVICE_ACCOUNT_JSON` = toàn bộ nội dung file JSON.
7. **Khai báo bắt buộc** (Policy → App content):
   - _Privacy policy_: URL ở bảng trên.
   - _Ads_: **No**. _App access_: **All functionality is available without special access**.
   - _Content rating_: trả lời bảng hỏi (không bạo lực, không cờ bạc, có tương tác giữa người dùng: **Yes – users can interact** nhưng _không chat_, chỉ người có mã phòng) → thường ra _Everyone/3+_.
   - _Target audience_: chọn đúng nhóm tuổi người chơi (có trẻ em) → app phải tuân thủ chính sách Gia đình: app **đã** đáp ứng (không quảng cáo, không SDK theo dõi, có chính sách quyền riêng tư).
   - _Data safety_: **Thu thập**: _Personal info → Name_ (biệt danh) và _App info & performance_: không; _Device or other IDs → User IDs_ (mã ẩn danh Firebase). Mục đích: **App functionality**. Không chia sẻ với bên thứ ba. **Mã hoá khi truyền: Có**. Người dùng có thể yêu cầu xoá: Có (qua trang hỗ trợ).
8. **Store listing**: chạy _Mobile release_ với `upload_metadata = true` (sau bước 6) để tự đẩy mô tả + ảnh; hoặc copy tay từ `fastlane/metadata/android/`.
9. Sau 14 ngày: **Production → Apply for production access** → trả lời vài câu về đợt thử → gửi duyệt.

## B. Apple App Store

1. **Tài khoản**: https://developer.apple.com/programs/enroll → _Individual_, 99 USD/năm (dùng Apple ID có bật xác thực 2 lớp). Duyệt 1–2 ngày.
2. **Đăng ký mã app**: https://developer.apple.com/account/resources/identifiers → **+** → _App IDs_ → _App_ → Bundle ID **Explicit** `io.github.tunv87.familygame`, mô tả "Family Games" → Register.
3. **Tạo app**: https://appstoreconnect.apple.com → _Apps_ → **+ New App** → iOS, tên "Tìm số & Cờ ca rô: Gia đình", ngôn ngữ chính **Vietnamese**, Bundle ID ở trên, SKU `familygame`.
4. **API key cho CI**: App Store Connect → **Users and Access → Integrations → App Store Connect API** → _Generate API Key_, quyền **Admin** (cần để Xcode tự tạo chứng chỉ ký) → tải file `.p8` (chỉ tải được 1 lần).
   - Secrets: `ASC_KEY_ID` (Key ID), `ASC_ISSUER_ID` (Issuer ID ở đầu trang), `ASC_KEY_P8` (toàn bộ nội dung file .p8, cả dòng BEGIN/END), `APPLE_TEAM_ID` (developer.apple.com → Membership details → Team ID).
5. **Build lên TestFlight**: Actions → **Mobile release** → Run workflow (platform `ios`, hoặc `both`) → ~20 phút sau bản build xuất hiện trong App Store Connect → TestFlight → cài thử bằng app TestFlight trên iPhone.
6. **Trang store**: chạy lại workflow với `upload_metadata = true` (đẩy mô tả, từ khoá, ảnh iPhone + iPad VI/EN, ghi chú cho reviewer). Rồi trong App Store Connect điền nốt:
   - _App Privacy_: **Data Not Linked to You** → _User Content → Other User Content_ (biệt danh) và _Identifiers → User ID_; mục đích **App Functionality**; **không Tracking**.
   - _Age Rating_: bảng hỏi toàn "None/No" → **4+**.
   - _App Review Information_: tên, số điện thoại, email liên hệ của bạn (ghi chú cho reviewer đã có sẵn).
   - _Pricing_: Free.
7. Chọn bản build → **Add for Review → Submit**. Thường có kết quả trong 1–3 ngày.

## C. Phát hành các bản sau

1. Sửa code → merge vào `main` (web tự cập nhật).
2. Actions → **Mobile release** → Run workflow, nhập `version` mới (vd `1.1.0`).
   Hoặc tạo tag: `git tag v1.1.0 && git push origin v1.1.0`.
3. Android lên track đã chọn; iOS lên TestFlight → submit review trong App Store Connect.

## Kiểm tra nhanh khi có lỗi

- Workflow cảnh báo _"... secrets are not set"_: thiếu secret ở bước tương ứng.
- Android `upload` lỗi _"Package not found"_: chưa upload tay bản đầu (A.4).
- iOS lỗi ký (_No signing certificate / provisioning_): API key chưa phải quyền **Admin**, hoặc chưa đăng ký Bundle ID (B.2).
