# LMS AI Pay - Hệ thống Quản lý Học tập Trực tuyến

Thiết kế và triển khai hệ thống quản lý học tập trực tuyến tích hợp AI và thanh toán trực tuyến

## 📋 Tổng quan

Dự án full-stack với:

- **Backend**: Node.js + Express.js + PostgreSQL + Prisma
- **Frontend**: React.js + TypeScript + TailwindCSS
- **AI Integration**: OpenAI GPT-4 / Ollama (Local LLM)
- **Payment Gateways**: VNPay, MoMo

## 🚀 Cài đặt

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Cập nhật DATABASE_URL trong .env
npm run prisma:generate
npm run prisma:migrate
npm run dev
```
Backend sẽ chạy tại: http://localhost:5000

### Frontend
```bash
cd frontend
npm install
npm run dev
```
Frontend sẽ chạy tại: http://localhost:3000

## 📁 Cấu trúc Dự án

```
lms-ai-pay/
├── backend
│   ├── prisma
│   │   ├── migrations
│   │   │   ├── 20251103061657_init
│   │   │   │   └── migration.sql
│   │   │   ├── 20251106010027_add_token_version_field
│   │   │   │   └── migration.sql
│   │   │   ├── 20251125115951_add_transaction_status
│   │   │   │   └── migration.sql
│   │   │   ├── 20251129175516_add_quiz_time_limit
│   │   │   │   └── migration.sql
│   │   │   ├── 20251201043003_change_timestamp_to_timestamptz
│   │   │   │   └── migration.sql
│   │   │   ├── 20251203031042_npx_prisma_migrate_deploy
│   │   │   │   └── migration.sql
│   │   │   └── migration_lock.toml
│   │   ├── schema.prisma
│   │   ├── seed-progress-test.js
│   │   └── seed.js
│   ├── src
│   │   ├── config
│   │   │   ├── app.config.js
│   │   │   ├── constants.js
│   │   │   ├── database.config.js
│   │   │   ├── logger.config.js
│   │   │   ├── momo.config.js
│   │   │   ├── multer.config.js
│   │   │   └── vnpay.config.js
│   │   ├── controllers
│   │   │   ├── admin-course.controller.js
│   │   │   ├── admin-dashboard.controller.js
│   │   │   ├── admin-order.controller.js
│   │   │   ├── admin-quizzes.controller.js
│   │   │   ├── ai-recommendation.controller.js
│   │   │   ├── ai.controller.js
│   │   │   ├── auth.controller.js
│   │   │   ├── category.controller.js
│   │   │   ├── course.controller.js
│   │   │   ├── enrollment.controller.js
│   │   │   ├── health.controller.js
│   │   │   ├── instructor-course.controller.js
│   │   │   ├── instructor-dashboard.controller.js
│   │   │   ├── instructor-quizzes.controller.js
│   │   │   ├── lessons.controller.js
│   │   │   ├── notifications.controller.js
│   │   │   ├── orders.controller.js
│   │   │   ├── payments.controller.js
│   │   │   ├── progress.controller.js
│   │   │   ├── quizzes.controller.js
│   │   │   ├── search.controller.js
│   │   │   ├── student-dashboard.controller.js
│   │   │   ├── student-quizzes.controller.js
│   │   │   ├── tags.controller.js
│   │   │   ├── transactions.controller.js
│   │   │   ├── upload.controller.js
│   │   │   └── users.controller.js
│   │   ├── cron
│   │   │   └── payment-expiration.cron.js
│   │   ├── middlewares
│   │   │   ├── authenticate.middleware.js
│   │   │   ├── error.middleware.js
│   │   │   ├── lesson.middleware.js
│   │   │   ├── role.middleware.js
│   │   │   └── validate.middleware.js
│   │   ├── routes
│   │   │   ├── admin-course.routes.js
│   │   │   ├── admin-dashboard.routes.js
│   │   │   ├── admin-order.routes.js
│   │   │   ├── admin-quizzes.routes.js
│   │   │   ├── ai-recommendation.routes.js
│   │   │   ├── ai.routes.js
│   │   │   ├── auth.routes.js
│   │   │   ├── category.routes.js
│   │   │   ├── course.routes.js
│   │   │   ├── enrollment.routes.js
│   │   │   ├── health.routes.js
│   │   │   ├── index.js
│   │   │   ├── instructor-course.routes.js
│   │   │   ├── instructor-dashboard.routes.js
│   │   │   ├── instructor-quizzes.routes.js
│   │   │   ├── instructor.routes.js
│   │   │   ├── lessons.routes.js
│   │   │   ├── notifications.routes.js
│   │   │   ├── orders.routes.js
│   │   │   ├── payments.routes.js
│   │   │   ├── progress.routes.js
│   │   │   ├── quizzes.routes.js
│   │   │   ├── search.routes.js
│   │   │   ├── student-dashboard.routes.js
│   │   │   ├── student-quizzes.routes.js
│   │   │   ├── tags.routes.js
│   │   │   ├── transactions.routes.js
│   │   │   ├── upload.routes.js
│   │   │   └── users.routes.js
│   │   ├── services
│   │   │   ├── admin-course.service.js
│   │   │   ├── admin-dashboard.service.js
│   │   │   ├── admin-order.service.js
│   │   │   ├── admin-quizzes.service.js
│   │   │   ├── ai-chat.service.js
│   │   │   ├── ai-quiz-generation.service.js
│   │   │   ├── ai-recommendation.service.js
│   │   │   ├── auth.service.js
│   │   │   ├── category.service.js
│   │   │   ├── course.service.js
│   │   │   ├── email.service.js
│   │   │   ├── enrollment.service.js
│   │   │   ├── health.service.js
│   │   │   ├── instructor-course.service.js
│   │   │   ├── instructor-dashboard.service.js
│   │   │   ├── instructor-quizzes.service.js
│   │   │   ├── knowledge-base.service.js
│   │   │   ├── lessons.service.js
│   │   │   ├── notifications.service.js
│   │   │   ├── ollama.service.js
│   │   │   ├── orders.service.js
│   │   │   ├── payment.service.js
│   │   │   ├── progress.service.js
│   │   │   ├── quizzes.service.js
│   │   │   ├── search.service.js
│   │   │   ├── student-dashboard.service.js
│   │   │   ├── student-quizzes.service.js
│   │   │   ├── tags.service.js
│   │   │   ├── transcription.service.js
│   │   │   ├── upload.service.js
│   │   │   ├── users.service.js
│   │   │   └── vnpay-expiration-handler.service.js
│   │   ├── templates
│   │   │   └── email
│   │   │       ├── enrollment-success.html
│   │   │       ├── password-change-confirmation.html
│   │   │       ├── password-reset.html
│   │   │       ├── payment-success.html
│   │   │       ├── verification.html
│   │   │       └── welcome.html
│   │   ├── utils
│   │   │   ├── bcrypt.util.js
│   │   │   ├── cookie.utils.js
│   │   │   ├── jwt.util.js
│   │   │   ├── prisma.js
│   │   │   ├── response.util.js
│   │   │   ├── slugify.util.js
│   │   │   └── transcript-parser.util.js
│   │   ├── validators
│   │   │   ├── admin-course.validator.js
│   │   │   ├── ai-recommendation.validator.js
│   │   │   ├── ai.validator.js
│   │   │   ├── auth.validator.js
│   │   │   ├── category.validator.js
│   │   │   ├── course.validator.js
│   │   │   ├── enrollment.validator.js
│   │   │   ├── instructor-course.validator.js
│   │   │   ├── lessons.validator.js
│   │   │   ├── notifications.validator.js
│   │   │   ├── orders.validator.js
│   │   │   ├── payments.validator.js
│   │   │   ├── progress.validator.js
│   │   │   ├── quizzes.validator.js
│   │   │   ├── search.validator.js
│   │   │   ├── tags.validator.js
│   │   │   ├── transactions.validator.js
│   │   │   ├── upload.validator.js
│   │   │   └── users.validator.js
│   │   ├── app.js
│   │   └── server.js
│   ├── .env.template
│   ├── .gitignore
│   ├── nodemon.json
│   └── package.json
├── frontend
│   ├── src
│   │   ├── components
│   │   │   ├── ui
│   │   │   │   ├── accordion.tsx
│   │   │   │   ├── avatar.tsx
│   │   │   │   ├── badge.tsx
│   │   │   │   ├── button.tsx
│   │   │   │   ├── buttons.tsx
│   │   │   │   ├── card.tsx
│   │   │   │   ├── checkbox.tsx
│   │   │   │   ├── dialog.tsx
│   │   │   │   ├── dropdown-menu.tsx
│   │   │   │   ├── input.tsx
│   │   │   │   ├── label.tsx
│   │   │   │   ├── progress.tsx
│   │   │   │   ├── radio-group.tsx
│   │   │   │   ├── scroll-area.tsx
│   │   │   │   ├── select.tsx
│   │   │   │   ├── separator.tsx
│   │   │   │   ├── sheet.tsx
│   │   │   │   ├── sonner.tsx
│   │   │   │   ├── table.tsx
│   │   │   │   ├── tabs.tsx
│   │   │   │   ├── textarea.tsx
│   │   │   │   └── utils.ts
│   │   │   ├── Footer.tsx
│   │   │   ├── Navbar.tsx
│   │   │   └── ScrollToTop.tsx
│   │   ├── contexts
│   │   │   ├── AuthContext.tsx
│   │   │   └── ThemeContext.tsx
│   │   ├── lib
│   │   │   ├── api
│   │   │   │   ├── auth.ts
│   │   │   │   ├── client.ts
│   │   │   │   ├── courses.ts
│   │   │   │   ├── dashboard.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── types.ts
│   │   │   └── mockData.ts
│   │   ├── pages
│   │   │   ├── AIChatPage.tsx
│   │   │   ├── AboutPage.tsx
│   │   │   ├── AdminDashboard.tsx
│   │   │   ├── CertificatePage.tsx
│   │   │   ├── CertificatesPage.tsx
│   │   │   ├── CourseDetailPage.tsx
│   │   │   ├── CoursesPage.tsx
│   │   │   ├── ForgotPasswordPage.tsx
│   │   │   ├── InstructorDashboard.tsx
│   │   │   ├── LandingPage.tsx
│   │   │   ├── LoginPage.tsx
│   │   │   ├── PaymentCheckoutPage.tsx
│   │   │   ├── PaymentFailurePage.tsx
│   │   │   ├── PaymentSuccessPage.tsx
│   │   │   ├── ProfilePage.tsx
│   │   │   ├── QuizPage.tsx
│   │   │   ├── RegisterPage.tsx
│   │   │   ├── ResetPasswordPage.tsx
│   │   │   ├── StudentDashboard.tsx
│   │   │   └── VideoPlayerPage.tsx
│   │   ├── App.tsx
│   │   ├── index.css
│   │   ├── main.test.tsx
│   │   ├── main.tsx
│   │   └── vite-env.d.ts
│   ├── .gitignore
│   ├── index.html
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── tsconfig.node.json
│   └── vite.config.ts
├── .gitignore
├── README.md
└── README.update.md
```

## 🗄️ Database Schema

Database schema có 16 bảng chính:

1. **users** - Quản lý người dùng (student, instructor, admin)
2. **categories** - Danh mục khóa học (hỗ trợ cấu trúc phân cấp)
3. **tags** - Thẻ gắn cho khóa học
4. **courses** - Thông tin khóa học
5. **course_tags** - Quan hệ Many-to-Many giữa courses và tags
6. **lessons** - Bài học trong khóa học
7. **enrollments** - Ghi danh của học viên
8. **orders** - Đơn hàng mua khóa học
9. **payment_transactions** - Giao dịch thanh toán
10. **progress** - Tiến độ học tập của học viên
11. **notifications** - Thông báo hệ thống
12. **quizzes** - Bài kiểm tra
13. **quiz_submissions** - Bài làm quiz của học viên
14. **ai_recommendations** - Gợi ý khóa học từ AI
15. **conversations** - Cuộc trò chuyện với AI chatbot
16. **chat_messages** - Tin nhắn trong conversation

## 📊 API Endpoints Overview

### 🔐 Authentication (9 endpoints)
- `POST /api/v1/auth/register` - Đăng ký tài khoản
- `POST /api/v1/auth/login` - Đăng nhập
- `POST /api/v1/auth/logout` - Đăng xuất
- `POST /api/v1/auth/refresh-token` - Làm mới token
- `POST /api/v1/auth/verify-email` - Xác thực email
- `POST /api/v1/auth/resend-verification` - Gửi lại email xác thực
- `POST /api/v1/auth/forgot-password` - Quên mật khẩu
- `POST /api/v1/auth/reset-password` - Đặt lại mật khẩu
- `GET /api/v1/auth/me` - Lấy thông tin user hiện tại

### 👤 Users Management (10 endpoints)
**Profile:**
- `GET /api/v1/users/profile` - Xem profile
- `PUT /api/v1/users/profile` - Cập nhật profile
- `PATCH /api/v1/users/profile/avatar` - Upload avatar
- `PUT /api/v1/users/change-password` - Đổi mật khẩu

**Admin Only:**
- `GET /api/v1/users` - Danh sách users (có phân trang, filter)
- `GET /api/v1/users/:id` - Chi tiết user
- `PUT /api/v1/users/:id` - Cập nhật user
- `DELETE /api/v1/users/:id` - Xóa user
- `PATCH /api/v1/users/:id/role` - Thay đổi role
- `PATCH /api/v1/users/:id/status` - Thay đổi status

### 📚 Courses - Public (8 endpoints)
- `GET /api/v1/courses` - Danh sách khóa học (filter, search, sort)
- `GET /api/v1/courses/featured` - Khóa học nổi bật
- `GET /api/v1/courses/trending` - Khóa học trending
- `GET /api/v1/courses/:id` - Chi tiết khóa học theo ID
- `GET /api/v1/courses/slug/:slug` - Chi tiết khóa học theo slug
- `GET /api/v1/courses/:id/lessons` - Danh sách bài học
- `GET /api/v1/courses/:id/instructor` - Thông tin giảng viên
- `POST /api/v1/courses/:id/view` - Tăng lượt xem

### 👨‍🏫 Instructor - Courses (14 endpoints)
- `GET /api/v1/instructor/courses` - Danh sách khóa học của instructor
- `GET /api/v1/instructor/courses/statistics` - Thống kê khóa học
- `POST /api/v1/instructor/courses` - Tạo khóa học mới
- `PUT /api/v1/instructor/courses/:id` - Cập nhật khóa học
- `DELETE /api/v1/instructor/courses/:id` - Xóa khóa học
- `PATCH /api/v1/instructor/courses/:id/status` - Đổi trạng thái khóa học
- `PATCH /api/v1/instructor/courses/:id/thumbnail` - Upload thumbnail
- `PATCH /api/v1/instructor/courses/:id/preview` - Upload video preview
- `GET /api/v1/instructor/courses/:id/analytics` - Phân tích chi tiết
- `POST /api/v1/instructor/courses/:id/tags` - Thêm tags
- `DELETE /api/v1/instructor/courses/:id/tags/:tagId` - Xóa tag

### 👨‍🏫 Instructor - Lessons (10 endpoints)
- `POST /api/v1/instructor/courses/:courseId/lessons` - Tạo bài học
- `PUT /api/v1/instructor/courses/:courseId/lessons/:id` - Cập nhật bài học
- `DELETE /api/v1/instructor/courses/:courseId/lessons/:id` - Xóa bài học
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/video` - Upload video
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/transcript` - Upload transcript
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/order` - Sắp xếp thứ tự
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/publish` - Publish/Unpublish

### 📖 Lessons - Student (3 endpoints)
- `GET /api/v1/lessons/:id` - Chi tiết bài học
- `GET /api/v1/lessons/:id/video` - URL video
- `GET /api/v1/lessons/:id/transcript` - URL transcript

### 🏷️ Categories (8 endpoints)
- `GET /api/v1/categories` - Danh sách categories
- `GET /api/v1/categories/:id` - Chi tiết category theo ID
- `GET /api/v1/categories/:id/courses` - Khóa học trong category (by ID)
- `GET /api/v1/categories/:slug/courses` - Khóa học trong category (by slug)
- `POST /api/v1/categories` - Tạo category (Instructor/Admin)
- `PUT /api/v1/categories/:id` - Cập nhật category
- `DELETE /api/v1/categories/:id` - Xóa category

### 🏷️ Tags (6 endpoints)
- `GET /api/v1/tags` - Danh sách tags
- `GET /api/v1/tags/:id` - Chi tiết tag
- `GET /api/v1/tags/:id/courses` - Khóa học có tag này
- `POST /api/v1/tags` - Tạo tag (Instructor/Admin)
- `PUT /api/v1/tags/:id` - Cập nhật tag
- `DELETE /api/v1/tags/:id` - Xóa tag

### 📝 Enrollments (6 endpoints)
- `GET /api/v1/enrollments` - Danh sách ghi danh
- `GET /api/v1/enrollments/active` - Khóa học đang học
- `GET /api/v1/enrollments/completed` - Khóa học đã hoàn thành
- `GET /api/v1/enrollments/:id` - Chi tiết ghi danh
- `GET /api/v1/enrollments/check/:courseId` - Kiểm tra đã ghi danh chưa
- `POST /api/v1/enrollments` - Ghi danh khóa học (free/paid)

### 📈 Progress Tracking (7 endpoints)
- `GET /api/v1/progress/courses/:courseId` - Tiến độ khóa học
- `GET /api/v1/progress/lessons/:lessonId` - Tiến độ bài học
- `POST /api/v1/progress/lessons/:lessonId/start` - Bắt đầu học
- `PUT /api/v1/progress/lessons/:lessonId/update` - Cập nhật tiến độ
- `POST /api/v1/progress/lessons/:lessonId/complete` - Hoàn thành bài học
- `GET /api/v1/progress/lessons/:lessonId/resume` - Vị trí tiếp tục xem

### 🛒 Orders (6 endpoints)
- `GET /api/v1/orders` - Danh sách đơn hàng
- `GET /api/v1/orders/stats` - Thống kê đơn hàng
- `GET /api/v1/orders/:id` - Chi tiết đơn hàng theo ID
- `GET /api/v1/orders/code/:orderCode` - Chi tiết theo mã đơn
- `POST /api/v1/orders` - Tạo đơn hàng
- `PATCH /api/v1/orders/:id/cancel` - Hủy đơn hàng

### 💳 Payments (8 endpoints)
**MoMo:**
- `POST /api/v1/payments/momo/create` - Tạo URL thanh toán MoMo
- `GET/POST /api/v1/payments/momo/callback` - Callback từ MoMo
- `POST /api/v1/payments/momo/webhook` - Webhook từ MoMo

**VNPay:**
- `POST /api/v1/payments/vnpay/create` - Tạo URL thanh toán VNPay
- `GET /api/v1/payments/vnpay/callback` - Callback từ VNPay
- `GET /api/v1/payments/vnpay/webhook` - Webhook từ VNPay (IPN)

**Refund:**
- `POST /api/v1/payments/refund/:orderId` - Hoàn tiền (Admin only)

### 💰 Transactions (2 endpoints)
- `GET /api/v1/transactions` - Danh sách giao dịch
- `GET /api/v1/transactions/:transactionId` - Chi tiết giao dịch

### ❓ Quizzes - Student (8 endpoints)
**View Quizzes:**
- `GET /api/v1/quizzes/:id` - Chi tiết quiz
- `GET /api/v1/lessons/:lessonId/quizzes` - Quizzes của lesson
- `GET /api/v1/courses/:courseId/quizzes` - Quizzes của course

**Submit & Results:**
- `POST /api/v1/quizzes/:quizId/submit` - Nộp bài làm
- `GET /api/v1/quizzes/:quizId/submissions` - Danh sách bài làm
- `GET /api/v1/quizzes/:quizId/submissions/:submissionId` - Chi tiết bài làm
- `GET /api/v1/quizzes/:quizId/attempts` - Tổng hợp số lần làm
- `GET /api/v1/quizzes/:quizId/result/latest` - Kết quả mới nhất

### 📝 Quizzes - Instructor (10 endpoints)
**CRUD:**
- `POST /api/v1/instructor/lessons/:lessonId/quizzes` - Tạo quiz cho lesson
- `POST /api/v1/instructor/courses/:courseId/quizzes` - Tạo quiz cho course
- `PUT /api/v1/instructor/quizzes/:id` - Cập nhật quiz
- `DELETE /api/v1/instructor/quizzes/:id` - Xóa quiz
- `PATCH /api/v1/instructor/quizzes/:id/publish` - Publish/Unpublish

**Analytics:**
- `GET /api/v1/instructor/quizzes/:quizId/submissions` - Danh sách bài làm
- `GET /api/v1/instructor/quizzes/:quizId/analytics` - Phân tích quiz

**AI Generation:**
- `POST /api/v1/instructor/quizzes/generate-from-lesson` - Tạo quiz từ lesson bằng AI
- `POST /api/v1/instructor/quizzes/generate-from-course` - Tạo quiz từ course bằng AI

### 📝 Quizzes - Admin (2 endpoints)
- `GET /api/v1/admin/quizzes` - Danh sách tất cả quizzes
- `GET /api/v1/admin/quizzes/:quizId/submissions` - Danh sách submissions

### 🔍 Search (4 endpoints)
- `GET /api/v1/search/courses` - Tìm kiếm khóa học nâng cao
- `GET /api/v1/search/instructors` - Tìm kiếm giảng viên
- `GET /api/v1/search/suggestions` - Gợi ý tìm kiếm (autocomplete)
- `POST /api/v1/search/voice` - Tìm kiếm bằng giọng nói

### 🔔 Notifications (8 endpoints)
- `GET /api/v1/notifications` - Danh sách thông báo
- `GET /api/v1/notifications/unread` - Thông báo chưa đọc
- `GET /api/v1/notifications/unread/count` - Số lượng chưa đọc
- `GET /api/v1/notifications/:id` - Chi tiết thông báo
- `PATCH /api/v1/notifications/:id/read` - Đánh dấu đã đọc
- `PATCH /api/v1/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/v1/notifications/:id` - Xóa thông báo
- `DELETE /api/v1/notifications` - Xóa tất cả thông báo

### 📤 Uploads (6 endpoints)
- `POST /api/v1/uploads/image` - Upload hình ảnh
- `POST /api/v1/uploads/video` - Upload video
- `POST /api/v1/uploads/document` - Upload tài liệu
- `DELETE /api/v1/uploads/:fileId` - Xóa file
- `GET /api/v1/uploads/:fileId/status` - Trạng thái upload
- `GET /api/v1/uploads/user/files` - Danh sách file đã upload

### 📊 Dashboards

#### Student Dashboard (4 endpoints)
- `GET /api/v1/dashboard/student` - Tổng quan dashboard
- `GET /api/v1/dashboard/student/stats` - Thống kê học tập
- `GET /api/v1/dashboard/student/enrolled-courses` - Khóa học đã ghi danh
- `GET /api/v1/dashboard/student/continue-watching` - Tiếp tục xem

#### Instructor Dashboard (5 endpoints)
- `GET /api/v1/dashboard/instructor` - Tổng quan dashboard
- `GET /api/v1/dashboard/instructor/stats` - Thống kê giảng dạy
- `GET /api/v1/dashboard/instructor/revenue` - Doanh thu
- `GET /api/v1/dashboard/instructor/analytics` - Phân tích chi tiết
- `GET /api/v1/dashboard/instructor/students` - Danh sách học viên

#### Admin Dashboard (6 endpoints)
- `GET /api/v1/dashboard/admin` - Tổng quan hệ thống
- `GET /api/v1/dashboard/admin/stats` - Thống kê hệ thống
- `GET /api/v1/dashboard/admin/users-analytics` - Phân tích người dùng
- `GET /api/v1/dashboard/admin/courses-analytics` - Phân tích khóa học
- `GET /api/v1/dashboard/admin/revenue` - Phân tích doanh thu
- `GET /api/v1/dashboard/admin/activities` - Hoạt động gần đây

### 🔧 Admin Management

#### Admin - Courses (3 endpoints)
- `GET /api/v1/admin/courses` - Quản lý tất cả khóa học
- `PATCH /api/v1/admin/courses/:id/featured` - Đặt khóa học nổi bật
- `GET /api/v1/admin/courses/analytics` - Phân tích nền tảng

#### Admin - Orders (3 endpoints)
- `GET /api/v1/admin/orders` - Quản lý đơn hàng
- `GET /api/v1/admin/orders/stats` - Thống kê đơn hàng
- `GET /api/v1/admin/orders/revenue-trend` - Xu hướng doanh thu

### 🤖 AI Features (13 endpoints)

#### AI Chatbot:
- `GET /api/v1/ai/conversations` - Danh sách cuộc trò chuyện
- `POST /api/v1/ai/conversations` - Tạo cuộc trò chuyện mới
- `GET /api/v1/ai/conversations/:id` - Chi tiết cuộc trò chuyện
- `DELETE /api/v1/ai/conversations/:id` - Xóa cuộc trò chuyện
- `PATCH /api/v1/ai/conversations/:id/archive` - Lưu trữ
- `PATCH /api/v1/ai/conversations/:id/activate` - Kích hoạt lại
- `GET /api/v1/ai/conversations/:id/messages` - Danh sách tin nhắn
- `POST /api/v1/ai/conversations/:id/messages` - Gửi tin nhắn
- `POST /api/v1/ai/messages/:id/feedback` - Đánh giá tin nhắn

#### AI Recommendations:
- `GET /api/v1/ai/recommendations` - Gợi ý khóa học cho user
- `GET /api/v1/ai/recommendations/similar/:courseId` - Khóa học tương tự
- `POST /api/v1/ai/recommendations/:id/view` - Đánh dấu đã xem

#### AI Utils:
- `GET /api/v1/ai/search` - Tìm kiếm trong knowledge base
- `GET /api/v1/ai/ollama/status` - Trạng thái Ollama service

### 🏥 Health Check (4 endpoints)
- `GET /api/v1/health` - Kiểm tra API health
- `GET /api/v1/health/db` - Kiểm tra database connection
- `GET /api/v1/health/storage` - Kiểm tra file storage
- `GET /api/v1/health/full` - Kiểm tra toàn bộ hệ thống

## 📊 Tổng kết Tiến độ

### Tổng quan
* **Đã hoàn thành: 28/28 modules (100%)** ✅
* **Endpoints: ~150/150 endpoints (100%)** ✅
* **Tính năng chính: Hoàn thành đầy đủ** ✅

---

### ✅ Modules đã hoàn thành (28/28)

#### 1. **Authentication** ✅ - 9/9 endpoints
   * Register, Login, Logout, Refresh Token
   * Email Verification, Password Reset
   * Get Current User

#### 2. **User Management** ✅ - 10/10 endpoints
   * Profile Management (View, Update, Avatar Upload)
   * Change Password
   * Admin User Management (CRUD, Role/Status Management)

#### 3. **Categories** ✅ - 8/8 endpoints
   * CRUD Categories
   * Hierarchical Structure Support
   * Category-Course Management

#### 4. **Tags** ✅ - 6/6 endpoints
   * CRUD Tags
   * Tag-Course Relationships

#### 5. **Courses - Public** ✅ - 8/8 endpoints
   * List, Featured, Trending Courses
   * Detail by ID/Slug
   * View Lessons, Instructor Info
   * View Count Tracking

#### 6. **Instructor - Courses** ✅ - 14/14 endpoints
   * Full CRUD Operations
   * Status Management, Thumbnail/Preview Upload
   * Analytics & Statistics
   * Tag Management

#### 7. **Instructor - Lessons** ✅ - 10/10 endpoints
   * Full CRUD Operations
   * Video & Transcript Upload
   * Order Management, Publish/Unpublish

#### 8. **Lessons - Student** ✅ - 3/3 endpoints
   * View Lesson Detail
   * Access Video & Transcript URLs

#### 9. **Enrollments** ✅ - 6/6 endpoints
   * Course Enrollment (Free/Paid)
   * Active/Completed Courses
   * Enrollment Check

#### 10. **Progress Tracking** ✅ - 7/7 endpoints
   * Course/Lesson Progress Tracking
   * Start, Update, Complete Lesson
   * Resume Watching Feature

#### 11. **Orders** ✅ - 6/6 endpoints
   * Order Management
   * Order Statistics
   * Create & Cancel Orders

#### 12. **Payments** ✅ - 8/8 endpoints
   * **VNPay Integration** (Create, Callback, Webhook/IPN)
   * **MoMo Integration** (Create, Callback, Webhook)
   * Refund System (Admin)

#### 13. **Transactions** ✅ - 2/2 endpoints
   * Transaction List & Details

#### 14. **Quizzes - Student** ✅ - 8/8 endpoints
   * View Quizzes (Lesson/Course)
   * Submit Quiz, View Submissions
   * Quiz Attempts & Latest Results

#### 15. **Quizzes - Instructor** ✅ - 10/10 endpoints
   * CRUD Operations
   * Publish/Unpublish
   * View Submissions & Analytics
   * **AI Quiz Generation** (from Lesson/Course)

#### 16. **Quizzes - Admin** ✅ - 2/2 endpoints
   * View All Quizzes & Submissions

#### 17. **Search** ✅ - 4/4 endpoints
   * Advanced Course Search
   * Instructor Search
   * Autocomplete Suggestions
   * Voice Search

#### 18. **Notifications** ✅ - 8/8 endpoints
   * View Notifications (All/Unread)
   * Mark as Read (Single/All)
   * Delete Notifications
   * Unread Count

#### 19. **Uploads** ✅ - 6/6 endpoints
   * Image, Video, Document Upload
   * File Status & Management
   * Delete Files

#### 20. **Student Dashboard** ✅ - 4/4 endpoints
   * Overview & Statistics
   * Enrolled Courses
   * Continue Watching

#### 21. **Instructor Dashboard** ✅ - 5/5 endpoints
   * Overview & Statistics
   * Revenue Analytics
   * Detailed Analytics
   * Student Management

#### 22. **Admin Dashboard** ✅ - 6/6 endpoints
   * System Overview
   * User Analytics
   * Course Analytics
   * Revenue Analysis
   * Recent Activities

#### 23. **Admin - Courses** ✅ - 3/3 endpoints
   * Course Management
   * Featured Course Management
   * Platform Analytics

#### 24. **Admin - Orders** ✅ - 3/3 endpoints
   * Order Management
   * Order Statistics
   * Revenue Trends

#### 25. **AI Chatbot** ✅ - 9/9 endpoints
   * Conversation Management (CRUD)
   * Message Management
   * Archive/Activate Conversations
   * Message Feedback

#### 26. **AI Recommendations** ✅ - 3/3 endpoints
   * Personalized Course Recommendations
   * Similar Courses
   * View Tracking

#### 27. **AI Utils** ✅ - 2/2 endpoints
   * Knowledge Base Search
   * Ollama Service Status

#### 28. **Health Check** ✅ - 4/4 endpoints
   * API Health
   * Database Connection
   * Storage Check
   * Full System Check

---

### 🎯 Tính năng nổi bật đã hoàn thành

#### 🤖 **AI Integration** ✅
- ✅ AI Chatbot (Ollama - Local LLM)
  - Context-aware conversation
  - Knowledge base search
  - Conversation history
  - Feedback system
- ✅ AI Recommendations
  - Personalized course suggestions
  - Similar course analysis
  - 24h caching
- ✅ AI Quiz Generation
  - Auto-generate from lessons/courses
  - Multiple difficulty levels
  - Answer explanations
  - Rate limiting (10 requests/15 min)

#### 💳 **Payment Integration** ✅
- ✅ VNPay
  - QR Code payment
  - Callback & IPN webhook
  - Auto-cancel expired orders (15 min)
- ✅ MoMo
  - App payment
  - Callback & IPN webhook
- ✅ Refund System
  - Full refund support
  - Admin management
  - Transaction history

#### 📊 **Advanced Features** ✅
- ✅ Progress Tracking
  - Lesson & course progress
  - Resume watching
  - Auto-enrollment update
- ✅ Quiz System
  - Multiple question types
  - Auto-grading
  - Attempt tracking
  - Instructor analytics
- ✅ Dashboard Analytics
  - Student: stats, continue watching
  - Instructor: revenue, performance
  - Admin: platform overview
- ✅ Search & Filter
  - Advanced filters
  - Autocomplete
  - Voice search
  - Instructor search
- ✅ Notification System
  - Auto-notifications
  - Read/Unread tracking
  - Bulk operations

#### 🔒 **Security Features** ✅
- ✅ JWT Authentication with refresh tokens
- ✅ Role-based access control
- ✅ Token versioning
- ✅ Rate limiting
- ✅ Input validation
- ✅ XSS & CSRF protection
- ✅ File upload security
- ✅ Helmet security headers

---

### 📈 Chi tiết Endpoints theo Module

| Module | Endpoints | Status |
|--------|-----------|--------|
| Authentication | 9 | ✅ 100% |
| User Management | 10 | ✅ 100% |
| Courses (Public) | 8 | ✅ 100% |
| Instructor - Courses | 14 | ✅ 100% |
| Instructor - Lessons | 10 | ✅ 100% |
| Lessons (Student) | 3 | ✅ 100% |
| Categories | 8 | ✅ 100% |
| Tags | 6 | ✅ 100% |
| Enrollments | 6 | ✅ 100% |
| Progress Tracking | 7 | ✅ 100% |
| Orders | 6 | ✅ 100% |
| Payments | 8 | ✅ 100% |
| Transactions | 2 | ✅ 100% |
| Quizzes - Student | 8 | ✅ 100% |
| Quizzes - Instructor | 10 | ✅ 100% |
| Quizzes - Admin | 2 | ✅ 100% |
| Search | 4 | ✅ 100% |
| Notifications | 8 | ✅ 100% |
| Uploads | 6 | ✅ 100% |
| Student Dashboard | 4 | ✅ 100% |
| Instructor Dashboard | 5 | ✅ 100% |
| Admin Dashboard | 6 | ✅ 100% |
| Admin - Courses | 3 | ✅ 100% |
| Admin - Orders | 3 | ✅ 100% |
| AI Chatbot | 9 | ✅ 100% |
| AI Recommendations | 3 | ✅ 100% |
| AI Utils | 2 | ✅ 100% |
| Health Check | 4 | ✅ 100% |
| **TỔNG** | **~150** | **✅ 100%** |

---
### ✅ Hoàn thành 100%

## 🎯 Tính năng nổi bật

### 🤖 AI Integration
1. **AI Chatbot (Ollama - Local LLM)**
   - Trò chuyện với AI tutor
   - Context-aware (nhận biết course, lesson đang học)
   - Tìm kiếm trong knowledge base
   - Lưu lịch sử hội thoại
   - Đánh giá chất lượng phản hồi

2. **AI Recommendations**
   - Gợi ý khóa học cá nhân hóa
   - Phân tích khóa học tương tự
   - Cache kết quả AI (24h)
   - Fallback sang rule-based nếu AI lỗi

3. **AI Quiz Generation**
   - Tạo câu hỏi quiz tự động từ nội dung lesson
   - Tạo câu hỏi từ toàn bộ course
   - Nhiều độ khó (easy, medium, hard)
   - Bao gồm giải thích đáp án
   - Rate limiting (10 requests/15 phút)

### 💳 Payment Integration
1. **VNPay**
   - Thanh toán qua QR Code
   - Callback xử lý kết quả
   - IPN webhook tự động
   - Tự động hủy đơn quá hạn (15 phút)

2. **MoMo**
   - Thanh toán qua MoMo app
   - Callback xử lý kết quả
   - IPN webhook tự động

3. **Refund System**
   - Hoàn tiền cho cả VNPay và MoMo
   - Admin only
   - Tracking refund history

### 📊 Advanced Features
1. **Progress Tracking**
   - Theo dõi tiến độ từng bài học
   - Tính % hoàn thành khóa học
   - Resume watching (tiếp tục từ vị trí dừng)
   - Auto-update enrollment status

2. **Quiz System**
   - Tạo quiz cho lesson hoặc course
   - Multiple choice, true/false
   - Tự động chấm điểm
   - Tracking attempts
   - Analytics cho instructor

3. **Dashboard Analytics**
   - Student: stats, continue watching, recent activities
   - Instructor: revenue, students, course performance
   - Admin: platform overview, revenue trend, user analytics

4. **Search & Filter**
   - Advanced search với nhiều filters
   - Autocomplete suggestions
   - Voice search (speech-to-text)
   - Search instructors

5. **Notification System**
   - Thông báo enrollment, course updates
   - Mark as read/unread
   - Unread count
   - Auto-create notifications

## 🔧 Environment Variables

Backend yêu cầu các biến môi trường trong `.env`:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/lms_ai_pay"

# Server
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
API_VERSION=v1

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Cookie
COOKIE_SECRET=your-cookie-secret

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Email (Optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_FROM=noreply@lmsaipay.com

# VNPay
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret
VNPAY_URL=https://sandbox.vnpayment.vn/paymentv2/vpcpay.html
VNPAY_RETURN_URL=http://localhost:5000/api/v1/payments/vnpay/callback
VNPAY_IPN_URL=http://localhost:5000/api/v1/payments/vnpay/webhook

# MoMo
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=http://localhost:5000/api/v1/payments/momo/callback
MOMO_IPN_URL=http://localhost:5000/api/v1/payments/momo/webhook

# AI - Ollama (Local LLM)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2:latest
AI_PROVIDER=ollama

# AI - OpenAI (Optional)
OPENAI_API_KEY=sk-your-openai-api-key
OPENAI_MODEL=gpt-4

# File Upload
MAX_FILE_SIZE=104857600  # 100MB
UPLOAD_DIR=uploads
```

## 🚦 Rate Limiting

- **Public API**: 100 requests/15 phút
- **Auth endpoints**: 10 requests/15 phút
- **AI Generation**: 10 requests/15 phút
- **File uploads**: 20 requests/15 phút

## 🔒 Security Features

1. **Authentication & Authorization**
   - JWT-based authentication
   - Refresh token rotation
   - Role-based access control (Student, Instructor, Admin)
   - Token versioning (invalidate all tokens)

2. **Data Protection**
   - Password hashing (bcrypt)
   - Input validation (express-validator)
   - XSS protection
   - CSRF protection
   - Rate limiting
   - HPP (HTTP Parameter Pollution) prevention
   - Helmet security headers

3. **File Upload Security**
   - File type validation
   - File size limits
   - Unique filename generation
   - Malware scanning (optional)
