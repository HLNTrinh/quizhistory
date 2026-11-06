# Sử Ký

Ứng dụng ôn tập Lịch sử theo mô hình MVC, gồm giao diện React/Vite, API Express, MongoDB và Docker Compose.

## Chạy bằng Docker

1. Tạo file `.env` từ `.env.example` và đặt `JWT_SECRET` thành chuỗi ngẫu nhiên riêng.
2. Tại thư mục dự án, chạy `docker compose up --build`.
3. Mở `http://localhost:8080`, sau đó tạo tài khoản để bắt đầu ôn tập.

MongoDB lưu dữ liệu trong volume `mongo_data`. Chủ đề mẫu và câu hỏi Lịch sử Việt Nam được khởi tạo tự động khi database còn trống. Kết quả làm bài được chấm ở API và lưu theo tài khoản.

## Chạy khi phát triển

- API: `npm install --prefix backend`, sau đó `npm run dev --prefix backend`.
- Giao diện: `npm install --prefix frontend`, sau đó `npm run dev --prefix frontend`.
- Khi chạy ngoài Docker, đặt `MONGODB_URI` trỏ tới MongoDB local và đặt `JWT_SECRET` trong môi trường shell. Vite chuyển tiếp `/api` đến `http://localhost:5000`.

## Khu vực quản trị

- Trang đăng nhập riêng: `http://localhost:8080/admin/login`; sau khi đăng nhập, bảng điều khiển ở `/admin`.
- Chỉ tài khoản có `role: "admin"` trong collection `users` mới đăng nhập được. API đăng ký công khai luôn tạo `role: "student"`, nên quản trị viên phải tạo trong cơ sở dữ liệu.
- Biến môi trường: `ADMIN_JWT_SECRET` (bắt buộc, phải khác `JWT_SECRET`) và `ADMIN_SESSION_HOURS` (tuỳ chọn, mặc định 2 giờ).
- Cách nhanh nhất: đăng ký một tài khoản bình thường trên giao diện học sinh, sau đó nâng quyền trong MongoDB:

```js
db.users.updateOne({ email: "admin@truong.edu.vn" }, { $set: { role: "admin" } });
```

Hoặc chèn trực tiếp bản ghi mới với `passwordHash` sinh bằng `bcrypt.hash("mat-khau-cua-ban", 12)`.

Endpoint quản trị: `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `GET /api/admin/overview`. Hai endpoint sau yêu cầu header `Authorization: Bearer <admin token>` và trả `401` nếu token là của học sinh.

## API chính

- `POST /api/auth/register` tạo tài khoản.
- `POST /api/auth/login` đăng nhập và nhận JWT.
- `GET /api/auth/me` lấy tài khoản hiện tại; gửi token bằng header `Authorization: Bearer <token>`.
- `GET /api/dashboard` lấy thống kê học tập và 5 lượt ôn tập gần nhất (cần đăng nhập).
- `GET /api/packages` danh sách gói chuyên đề kèm các bộ câu hỏi, trạng thái mở khóa (công khai, token tùy chọn).
- `GET /api/packages/:packageId` chi tiết gói chuyên đề và tiến độ từng chặng (công khai, token tùy chọn).
- `GET /api/question-sets/:questionSetId/quiz` lấy câu hỏi của một bộ, không kèm đáp án đúng (cần đăng nhập).
- `POST /api/question-set-attempts` nộp bài, chấm điểm và lưu kết quả (cần đăng nhập).
- `GET /api/leaderboard` bảng xếp hạng theo điểm tích lũy (cần đăng nhập).
- `GET /api/health` kiểm tra API.