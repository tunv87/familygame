# QA – Trò chơi gia đình

| Tài liệu                                 | Nội dung                                                            |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [TEST_PLAN.md](TEST_PLAN.md)             | Phạm vi, 11 kích thước màn hình, tiêu chí đạt                       |
| [test-cases.md](test-cases.md)           | 60 test case (UI, UX, CR, LG, AU, SEC), bản v2.3                    |
| [review-log.md](review-log.md)           | 3 lần review test case và lý do sửa                                 |
| [bugs.md](bugs.md)                       | 14 lỗi tìm được, mức độ, cách sửa, lần chạy xác nhận                |
| [runs/](runs/)                           | Kết quả từng lần chạy (`run-NN.md` đọc được, `run-NN.json` máy đọc) |
| [evidence/screens/](evidence/screens/)   | Ảnh mọi màn hình × thiết bị × giao diện của lần chạy cuối           |
| [evidence/failures/](evidence/failures/) | Ảnh các case FAIL ở từng lần chạy                                   |

## Tiến trình

| Lần chạy                 | PASS / tổng case                  | Test tự động  | Lỗi mới tìm thấy                       | Ghi chú                                 |
| ------------------------ | --------------------------------- | ------------- | -------------------------------------- | --------------------------------------- |
| [run 01](runs/run-01.md) | 37 / 52 (14 FAIL, 1 chưa có test) | 78 / 91       | B01–B09 (5 Cao, 4 Trung bình)          | 5 FAIL do lỗi test, sửa test sau review |
| [run 02](runs/run-02.md) | 52 / 52                           | 96 / 96       | B10 (hồi quy, tìm qua log), B11 (Thấp) | Thêm CR-12, bắt cả lần ghi bị từ chối   |
| [run 03](runs/run-03.md) | 52 / 53                           | 96 / 97       | B12 (Thấp)                             |                                         |
| [run 04](runs/run-04.md) | 53 / 53                           | 97 / 97       | —                                      | Sạch lỗi; còn B11 (Thấp, chấp nhận)     |
| [run 05](runs/run-05.md) | **60 / 60**                       | **108 / 108** | B13, B14 (tìm khi viết test âm thanh)  | Thêm nhóm AU – âm thanh                 |

## Chạy lại

```bash
npm run qa
```

Cần Java 11+ (Firebase emulator). Kết quả ghi vào `qa/runs/run-NN.md`.

Kiểm tra tay khi có bản cài thật (TestFlight / Play closed test): nút Back Android, rung, bảng chia sẻ, cài đặt và mở lại app.
