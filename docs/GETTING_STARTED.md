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

Endpoint quản trị: `POST /api/admin/auth/login`, `GET /api/admin/auth/me`, `GET /api/admin/overview`, `GET|POST /api/admin/users`, `PATCH|DELETE /api/admin/users/:id`, `GET|POST /api/admin/categories`, `PATCH|DELETE /api/admin/categories/:id`. Tất cả trừ `login` yêu cầu header `Authorization: Bearer <admin token>` và trả `401` nếu token là của học sinh.

`GET /api/admin/overview` trả toàn bộ số liệu trang Tổng quan, tính trực tiếp từ MongoDB (không có dữ liệu mẫu):

- `totals`: `users`, `students`, `admins`, `newUsers7d`, `packages`, `activePackages`, `questionSets`, `activeQuestionSets`, `questions`, `categories`, `attempts`, `completedAttempts`, `avgAccuracy`.
- `growth["7d"]` / `growth["30d"]`: chuỗi theo ngày (múi giờ `REPORT_TIMEZONE`, mặc định `Asia/Ho_Chi_Minh`) gồm `labels`, `attempts` (lượt hoàn thành), `users` (học viên đăng ký mới) và `peak`.
- `distribution`: số câu hỏi theo chủ đề (gộp qua câu hỏi → bộ → gói → chủ đề) kèm `percent` và `color`.
- `latestPackages`: 5 gói cập nhật gần nhất với `setCount`, `questionCount`, `passRate` (tỷ lệ đạt, `null` nếu chưa có lượt làm bài).
- `activities`: nhật ký hoạt động gần đây dựng từ tài khoản mới, lượt làm bài hoàn thành và gói vừa cập nhật.
- `latestUsers` / `latestAttempts`: 5 bản ghi mới nhất để đối chiếu nhanh.

Múi giờ báo cáo có thể đổi bằng biến môi trường `REPORT_TIMEZONE`.

### Quản lý người dùng

Trang `/admin/users` đọc và ghi trực tiếp collection `users`, không còn dữ liệu mẫu:

- `GET /api/admin/users?q=&role=&status=&sort=&page=&limit=` — `q` tìm theo họ tên/email, `role` (`student`/`admin`), `status` (`active`/`locked`), `sort` (`newest`/`oldest`/`name`/`score`), phân trang mặc định 10 dòng.
  - `stats`: `total`, `students`, `admins`, `active`, `locked`, `activeRatio`, `newUsers7d`, `newUsers30d`, `questionSets`.
  - `items`: `id`, `name`, `email`, `role`, `status`, `totalScore`, `attempts`, `completedAttempts`, `completedSets`, `avgAccuracy`, `lastActiveAt`, `joinedAt`.
  - `pagination`: `page`, `limit`, `total`, `totalPages`.
- `POST /api/admin/users` — `fullName`, `email`, `password` (tối thiểu 8 ký tự), `role`, `status`; mật khẩu được băm bcrypt (12 vòng).
- `PATCH /api/admin/users/:id` — cập nhật `fullName`, `email`, `role`, `status`; trả `409` nếu tự hạ quyền/tự khóa hoặc làm mất quản trị viên đang hoạt động cuối cùng.
- `DELETE /api/admin/users/:id` — xóa tài khoản kèm attempts, progress và rankings của người đó; không cho xóa tài khoản đang đăng nhập.

### Quản lý chủ đề

Trang `/admin/categories` tổng hợp số liệu thật từ `categories`, `packages`, `questionSets`, `questions`:

- `GET /api/admin/categories?q=&status=&sort=&page=&limit=` — `sort` (`newest`/`oldest`/`mostPackages`/`mostQuestions`).
  - `stats`: `total`, `active`, `inactive`, `openRatio`, `packages`, `assignedPackages`, `unassignedPackages`, `questions`, `categoriesWithQuestions`.
  - `items`: `id`, `name`, `description`, `status`, `packageCount`, `questionCount`, `createdAt`, `updatedAt`.
- `POST /api/admin/categories` / `PATCH /api/admin/categories/:id` — `name` (2–120 ký tự, không trùng), `description`, `status` (`active`/`inactive`).
- `DELETE /api/admin/categories/:id` — trả `409` nếu chủ đề còn gói câu hỏi.

### Quản lý gói câu hỏi

Trang `/admin/packages` đọc và ghi trực tiếp collection `packages`; số bộ đề / số câu hỏi được đếm thật từ `questionSets` và `questions`:

- `GET /api/admin/packages?q=&difficulty=&status=&categoryId=&sort=&page=&limit=` — `q` tìm theo tên, mô tả và tên chủ đề; `difficulty` (`easy`/`medium`/`hard`); `status` (`draft`/`active`/`inactive`); `categoryId` (mã chủ đề hoặc `none` cho gói chưa gán chủ đề); `sort` (`newest`/`oldest`/`mostSets`/`mostXp`/`name`); phân trang mặc định 10 dòng.
  - `stats`: `total`, `active`, `draft`, `inactive`, `openRatio`, `totalSets`, `packagesWithSets`, `setCoverage`, `totalQuestions`, `totalXp`, `averageXp`, `totalAttempts`, `completedAttempts`, `completionRate`.
  - `items`: `id`, `name`, `description`, `image`, `difficulty`, `order`, `totalScore`, `estimatedTime`, `status`, `categoryId`, `categoryName`, `setCount`, `questionCount`, `createdAt`, `updatedAt`.
  - `pagination`: `page`, `limit`, `total`, `totalPages`.
- `POST /api/admin/packages` — `name` (2–120 ký tự, không trùng), `categoryId` (có thể `null`), `description`, `image`, `difficulty`, `order`, `totalScore`, `estimatedTime`, `status`.
- `PATCH /api/admin/packages/:id` — cập nhật từng phần với cùng bộ ràng buộc; trả `409` khi đổi sang tên đã tồn tại.
- `DELETE /api/admin/packages/:id` — trả `409` nếu gói còn bộ câu hỏi.

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