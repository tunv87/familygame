# Kiểm thử tự động sau khi deploy (Post-deploy QA)

Mỗi lần **Deploy to GitHub Pages** chạy xong và thành công, workflow **Post-deploy QA**
(`.github/workflows/post-deploy-qa.yml`) tự:

1. Mở trang thật https://tunv87.github.io/familygame/ bằng Chromium, trên máy tính (1280×800)
   và điện thoại (360×800), kiểm TC-01 … TC-15 (`qa/post-deploy.mjs`), ghi `qa/latest-results.json`.
2. Ghi kết quả vào Google Sheet "Familygame – Tiến độ dự án" (`qa/update-sheet.mjs`), kể cả khi
   có case FAIL:
   - tab **Test_Cases**: theo `tc_id` (cột A) → `test_date` (B), `actual_result` (H), `status` (I)
   - tab **Version_Trigger**: A1 và A2 = bản build vừa test (lấy từ trang Nhật ký lỗi `#/debug`)
   - tab **Kiểm thử**: thêm một dòng vào bảng "Lần chạy" (có link tới lần chạy trên GitHub và cột
     "Ngày test")

Chạy tay: GitHub → Actions → Post-deploy QA → Run workflow.

## Cài một lần

1. Google Cloud Console → IAM & Admin → Service Accounts → tạo một service account (không cần
   quyền gì) → Keys → Add key → JSON → tải file về.
2. Bật **Google Sheets API** cho project đó (APIs & Services → Library).
3. Mở Google Sheet → Share → thêm e-mail của service account (dạng
   `…@….iam.gserviceaccount.com`) với quyền **Editor**.
4. GitHub repo → Settings → Secrets and variables → Actions → New repository secret:
   tên `GOOGLE_SERVICE_ACCOUNT_JSON`, giá trị = toàn bộ nội dung file JSON.

## Chạy thử trên máy

```bash
npx playwright install chromium
QA_URL=https://tunv87.github.io/familygame/ node qa/post-deploy.mjs
SPREADSHEET_ID=... GOOGLE_SERVICE_ACCOUNT_JSON="$(cat key.json)" node qa/update-sheet.mjs
```

Script chỉ đọc trang web: không tạo phòng, không tạo tài khoản, không ghi vào database.
