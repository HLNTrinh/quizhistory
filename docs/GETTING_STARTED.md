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

## API chính

- `POST /api/auth/register` tạo tài khoản.
- `POST /api/auth/login` đăng nhập và nhận JWT.
- `GET /api/auth/me` lấy tài khoản hiện tại; gửi token bằng header `Authorization: Bearer <token>`.
- `GET /api/dashboard` lấy chủ đề và tiến độ.
- `GET /api/quizzes/:topicId` lấy câu hỏi không kèm đáp án.
- `POST /api/attempts` nộp bài và lưu kết quả.
- `GET /api/health` kiểm tra API.

## Cổng quản trị (admin)

- Địa chỉ: `http://localhost:8080/admin/login` khi chạy Docker, hoặc `http://localhost:5173/admin/login` khi chạy `npm run dev --prefix frontend`.
- Sau khi đăng nhập, bảng điều khiển nằm tại `/admin`; nút "Đăng xuất" xoá phiên và quay lại `/admin/login`.
- Phiên quản trị lưu riêng ở khoá `quizhistory-admin-session` (localStorage nếu chọn "Ghi nhớ", ngược lại sessionStorage), không ảnh hưởng phiên học viên `quizhistory-token`.
- Lưu ý: form đăng nhập hiện là bản demo phía client, chưa gọi API xác thực admin. Cần bổ sung role `admin`, endpoint đăng nhập và middleware phân quyền ở backend trước khi triển khai thật.
