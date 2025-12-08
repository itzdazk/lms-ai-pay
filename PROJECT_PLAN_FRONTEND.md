TÊN ĐỀ TÀI: Thiết kế và triển khai hệ thống quản lý học tập trực tuyến tích hợp AI và thanh toán trực tuyến
TÊN ĐỀ TÀI (tiếng Anh): Design and Implementation of an AI-Integrated Learning Management System with Online Payment

## Tổng quan Frontend
Dự án frontend với React.js + TypeScript + TailwindCSS, tích hợp với Backend API đã hoàn thành 100%.

**Công nghệ Frontend:**
- React.js 18+ với TypeScript
- TailwindCSS cho styling
- React Router cho navigation
- Context API cho state management
- Axios/Fetch cho API calls
- shadcn/ui components (đã có sẵn)
- Vite làm build tool

**Backend API đã sẵn sàng:**
- ✅ 14/14 modules đã hoàn thành (100%)
- ✅ ~165+ endpoints đã implement và test
- ✅ Postman collection đã có sẵn
- ✅ Base URL: `http://localhost:5000/api/v1`

---

## 📊 TIẾN ĐỘ HIỆN TẠI (Cập nhật: 2025-12-03)

### ✅ Đã có sẵn:
- ✅ Cấu trúc project với Vite + React + TypeScript
- ✅ UI Components (shadcn/ui): Button, Card, Input, Dialog, etc.
- ✅ Context API: AuthContext, ThemeContext
- ✅ Một số pages cơ bản: LandingPage, LoginPage, RegisterPage, Dashboard
- ✅ API client setup cơ bản

### 🔄 Cần phát triển:
- 🔄 Tích hợp đầy đủ với Backend API
- 🔄 Hoàn thiện tất cả pages và components
- 🔄 Implement routing và protected routes
- 🔄 State management cho các modules
- 🔄 Error handling và loading states
- 🔄 Responsive design cho mobile

---

## 📋 CHIẾN LƯỢC PHÁT TRIỂN: ƯU TIÊN FRONTEND UI/UX

### 🎯 Nguyên tắc chính:
- ✅ **GIAI ĐOẠN 2**: Sau khi Backend API hoàn thành 100%, bắt đầu Frontend
- ✅ Chia Frontend thành các modules độc lập để 2 người làm **song song**
- ✅ Mỗi module tương ứng với Backend API module
- ✅ Sử dụng Backend API đã có sẵn, không cần chờ

### 👥 Phân công công việc Frontend:

**DEVELOPER 1 (Frontend):**
- Module A: Authentication & User Management
- Module C: Categories & Tags UI
- Module E: Courses (Public Pages)
- Module G: Enrollments
- Module I: AI Features (Chatbox, Recommendations)
- Module K: Search & Filter
- Module M: Student Dashboard

**DEVELOPER 2 (Frontend):**
- Module B: User Profile & Settings
- Module D: Lessons & Video Player
- Module F: Progress Tracking
- Module H: Payment Integration (VNPay, MoMo)
- Module J: Quiz System
- Module L: Notifications
- Module N: Instructor & Admin Dashboards

### 📅 Timeline Frontend Development (6-7 tuần):

**Week 1:** 
- Developer 1: Module A (Auth Pages: Login, Register, Forgot Password)
- Developer 2: Module B (User Profile, Settings, Avatar Upload)
- ✅ **Song song hoàn toàn** - Không conflict

**Week 2:** 
- Developer 1: Module C (Categories & Tags UI) + Module E (Courses List, Detail)
- Developer 2: Module D (Lessons, Video Player với progress tracking)
- ✅ **Song song hoàn toàn** - Không conflict

**Week 3:** 
- Developer 1: Module G (Enrollments) + Module K (Search & Filter)
- Developer 2: Module F (Progress Tracking UI) + Module H (Payment Checkout)
- ⚠️ **Lưu ý**: Enrollments và Payment có liên quan, cần communicate

**Week 4:** 
- Developer 1: Module I (AI Chatbox, Recommendations)
- Developer 2: Module J (Quiz System UI)
- ✅ **Song song hoàn toàn** - Không conflict

**Week 5:** 
- Developer 1: Module M (Student Dashboard)
- Developer 2: Module L (Notifications) + Module N (Instructor Dashboard)
- ✅ **Song song hoàn toàn** - Không conflict

**Week 6:** 
- Developer 2: Module N (Admin Dashboard)
- Cả 2: Integration testing, bug fixes, responsive design

**Week 7:** 
- Cả 2: Final testing, optimization, documentation

### 🔄 Workflow làm song song:

1. **Git Workflow:**
   - Mỗi người làm trên branch riêng: `dev1-frontend-module-name` và `dev2-frontend-module-name`
   - Daily commit và push lên GitHub
   - Merge vào `main` khi module hoàn thành và test OK

2. **Shared Resources:**
   - Components: `src/components/ui/` - ✅ Đã có sẵn (shadcn/ui)
   - API Client: `src/lib/api/` - Cần mở rộng
   - Contexts: `src/contexts/` - Cần mở rộng
   - Types: `src/lib/api/types.ts` - Cần mở rộng

3. **Conflict Prevention:**
   - Mỗi module có pages riêng → không conflict
   - Mỗi module có components riêng → không conflict
   - Chỉ conflict khi cùng sửa file `App.tsx` (routes) → cần communicate trước khi merge
   - Chỉ conflict khi cùng sửa shared components → cần communicate

4. **Communication:**
   - Update tiến độ mỗi ngày
   - Báo ngay nếu cần thay đổi shared files
   - Review code trước khi merge vào main
   - Test integration với Backend API

---

## GIAI ĐOẠN 1: Setup & Cấu trúc Frontend ✅

### 1.1 Khởi tạo Project ✅
- ✅ Vite + React + TypeScript đã setup
- ✅ TailwindCSS đã config
- ✅ shadcn/ui components đã cài đặt
- ✅ React Router đã setup

### 1.2 API Client Setup 🔄
**Files cần tạo/mở rộng:**
- `src/lib/api/client.ts` - Axios instance với interceptors
- `src/lib/api/auth.ts` - Auth API calls
- `src/lib/api/courses.ts` - Courses API calls
- `src/lib/api/users.ts` - Users API calls
- `src/lib/api/types.ts` - TypeScript types cho API responses
- Và các files khác cho từng module

**Features:**
- Base URL: `http://localhost:5000/api/v1`
- JWT token trong Authorization header
- Auto refresh token khi expired
- Error handling và retry logic
- Request/Response interceptors

### 1.3 Context Setup 🔄
**Files cần tạo/mở rộng:**
- `src/contexts/AuthContext.tsx` - ✅ Đã có, cần mở rộng
- `src/contexts/ThemeContext.tsx` - ✅ Đã có
- `src/contexts/CourseContext.tsx` - Course state management
- `src/contexts/CartContext.tsx` - Shopping cart (nếu cần)

---

## GIAI ĐOẠN 2: Authentication & User Management (DEVELOPER 1)

### 2.1 Authentication Pages 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/LoginPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/RegisterPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/ForgotPasswordPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/ResetPasswordPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/EmailVerificationPage.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `POST /api/v1/auth/refresh-token`
- `POST /api/v1/auth/verify-email`
- `POST /api/v1/auth/forgot-password`
- `POST /api/v1/auth/reset-password`
- `GET /api/v1/auth/me`

**Features:**
- Form validation với react-hook-form hoặc zod
- Error handling và display
- Loading states
- Redirect sau khi login/register thành công
- Remember me functionality
- Email verification flow

### 2.2 User Profile & Settings (DEVELOPER 2)
**Files cần tạo/hoàn thiện:**
- `src/pages/ProfilePage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/SettingsPage.tsx` - Cần tạo mới
- `src/components/Profile/AvatarUpload.tsx` - Cần tạo mới
- `src/components/Profile/ChangePassword.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/users/profile`
- `PUT /api/v1/users/profile`
- `PATCH /api/v1/users/profile/avatar`
- `PUT /api/v1/users/change-password`

**Features:**
- View và edit profile
- Avatar upload với preview
- Change password form
- Form validation
- Success/Error notifications

### 2.3 User Management (Admin) - Developer 2
**Files cần tạo:**
- `src/pages/admin/UsersPage.tsx` - Cần tạo mới
- `src/components/admin/UserTable.tsx` - Cần tạo mới
- `src/components/admin/UserForm.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/users` - Danh sách users (Admin)
- `GET /api/v1/users/:id` - Chi tiết user
- `PUT /api/v1/users/:id` - Cập nhật user
- `PATCH /api/v1/users/:id/role` - Thay đổi role
- `PATCH /api/v1/users/:id/status` - Thay đổi status
- `DELETE /api/v1/users/:id` - Xóa user

**Features:**
- User list với pagination
- Search và filter users
- Edit user modal/form
- Change role dropdown
- Change status toggle
- Delete confirmation dialog

---

## GIAI ĐOẠN 3: Categories & Tags (DEVELOPER 1)

### 3.1 Categories UI 🔄
**Files cần tạo:**
- `src/components/Categories/CategoryList.tsx` - Cần tạo mới
- `src/components/Categories/CategoryCard.tsx` - Cần tạo mới
- `src/pages/CategoriesPage.tsx` - Cần tạo mới (nếu cần)

**API Endpoints sử dụng:**
- `GET /api/v1/categories` - Danh sách categories
- `GET /api/v1/categories/:id` - Chi tiết category
- `GET /api/v1/categories/:id/courses` - Khóa học trong category

**Features:**
- Hiển thị hierarchical categories (parent/child)
- Category cards với thumbnail
- Filter courses by category
- Breadcrumb navigation

### 3.2 Tags UI 🔄
**Files cần tạo:**
- `src/components/Tags/TagList.tsx` - Cần tạo mới
- `src/components/Tags/TagBadge.tsx` - Cần tạo mới
- `src/components/Courses/CourseTags.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/tags` - Danh sách tags
- `GET /api/v1/tags/:id/courses` - Khóa học có tag này

**Features:**
- Tag badges với colors
- Click tag để filter courses
- Popular tags display
- Tag cloud (optional)

---

## GIAI ĐOẠN 4: Courses (DEVELOPER 1)

### 4.1 Public Courses Pages 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/CoursesPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/CourseDetailPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Courses/CourseCard.tsx` - Cần tạo mới
- `src/components/Courses/CourseList.tsx` - Cần tạo mới
- `src/components/Courses/CourseFilters.tsx` - Cần tạo mới
- `src/components/Courses/CourseSearch.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/courses` - Danh sách khóa học (có filter, search, sort)
- `GET /api/v1/courses/featured` - Khóa học nổi bật
- `GET /api/v1/courses/trending` - Khóa học trending
- `GET /api/v1/courses/:id` - Chi tiết khóa học
- `GET /api/v1/courses/:id/lessons` - Danh sách bài học
- `GET /api/v1/courses/:id/instructor` - Thông tin giảng viên
- `POST /api/v1/courses/:id/view` - Tăng view count

**Features:**
- Course grid/list view
- Filter by: category, tags, level, price, rating
- Search functionality
- Sort options: newest, price, rating, enrolled
- Pagination
- Featured courses section
- Trending courses section
- Course detail với:
  - Course info, instructor info
  - Lessons list
  - Reviews (nếu có)
  - Enroll button
  - Share functionality

### 4.2 Instructor Course Management (DEVELOPER 2)
**Files cần tạo:**
- `src/pages/instructor/CoursesPage.tsx` - Cần tạo mới
- `src/pages/instructor/CourseCreatePage.tsx` - Cần tạo mới
- `src/pages/instructor/CourseEditPage.tsx` - Cần tạo mới
- `src/components/instructor/CourseForm.tsx` - Cần tạo mới
- `src/components/instructor/CourseAnalytics.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/instructor/courses` - Khóa học của instructor
- `POST /api/v1/instructor/courses` - Tạo khóa học mới
- `PUT /api/v1/instructor/courses/:id` - Cập nhật khóa học
- `DELETE /api/v1/instructor/courses/:id` - Xóa khóa học
- `PATCH /api/v1/instructor/courses/:id/status` - Thay đổi status
- `PATCH /api/v1/instructor/courses/:id/thumbnail` - Upload thumbnail
- `PATCH /api/v1/instructor/courses/:id/preview` - Upload video preview
- `GET /api/v1/instructor/courses/:id/analytics` - Analytics khóa học
- `POST /api/v1/instructor/courses/:id/tags` - Thêm tags
- `DELETE /api/v1/instructor/courses/:id/tags/:tagId` - Xóa tag

**Features:**
- Course list với status badges
- Create/Edit course form với:
  - Basic info (title, description, price, level)
  - Category selection
  - Tags selection
  - Thumbnail upload
  - Preview video upload
  - Rich text editor cho description
- Course status management (draft/published/archived)
- Course analytics dashboard
- Tag management

### 4.3 Admin Course Management (DEVELOPER 2)
**Files cần tạo:**
- `src/pages/admin/CoursesPage.tsx` - Cần tạo mới
- `src/components/admin/CourseManagement.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/admin/courses` - Tất cả khóa học
- `PATCH /api/v1/admin/courses/:id/featured` - Đánh dấu featured
- `GET /api/v1/admin/courses/analytics` - Tổng quan analytics

**Features:**
- All courses list với filters
- Featured toggle
- Course analytics overview

---

## GIAI ĐOẠN 5: Lessons & Video Player (DEVELOPER 2)

### 5.1 Video Player Page 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/VideoPlayerPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/VideoPlayer/VideoPlayer.tsx` - Cần tạo mới
- `src/components/VideoPlayer/LessonList.tsx` - Cần tạo mới
- `src/components/VideoPlayer/Transcript.tsx` - Cần tạo mới
- `src/components/VideoPlayer/Notes.tsx` - Cần tạo mới (optional)

**API Endpoints sử dụng:**
- `GET /api/v1/lessons/:id` - Chi tiết bài học
- `GET /api/v1/lessons/:id/video` - URL video bài học
- `GET /api/v1/lessons/:id/transcript` - Transcript bài học
- `GET /api/v1/courses/:id/lessons` - Danh sách bài học

**Features:**
- Video player với controls:
  - Play/pause, volume, fullscreen
  - Playback speed control
  - Quality selection (nếu có)
  - Subtitle support (nếu có)
- Lesson list sidebar với:
  - Lesson titles
  - Duration
  - Completion status
  - Locked/unlocked state
- Transcript display
- Auto-save progress
- Next/Previous lesson navigation
- Course info sidebar

### 5.2 Instructor Lesson Management (DEVELOPER 2)
**Files cần tạo:**
- `src/pages/instructor/LessonsPage.tsx` - Cần tạo mới
- `src/components/instructor/LessonForm.tsx` - Cần tạo mới
- `src/components/instructor/LessonReorder.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `POST /api/v1/instructor/courses/:courseId/lessons` - Tạo bài học
- `PUT /api/v1/instructor/courses/:courseId/lessons/:id` - Cập nhật bài học
- `DELETE /api/v1/instructor/courses/:courseId/lessons/:id` - Xóa bài học
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/video` - Upload video
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/transcript` - Upload transcript
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/order` - Đổi thứ tự
- `PATCH /api/v1/instructor/courses/:courseId/lessons/:id/publish` - Publish/Unpublish

**Features:**
- Lesson list với drag-and-drop reorder
- Create/Edit lesson form:
  - Title, description
  - Video upload với progress
  - Transcript upload
  - Duration input
- Publish/Unpublish toggle
- Delete confirmation

---

## GIAI ĐOẠN 6: Enrollments (DEVELOPER 1)

### 6.1 Enrollment Pages 🔄
**Files cần tạo:**
- `src/components/Enrollments/EnrollmentButton.tsx` - Cần tạo mới
- `src/components/Enrollments/EnrollmentList.tsx` - Cần tạo mới
- `src/pages/MyCoursesPage.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/enrollments` - Danh sách khóa học đã đăng ký
- `GET /api/v1/enrollments/:id` - Chi tiết enrollment
- `GET /api/v1/enrollments/active` - Khóa học đang học
- `GET /api/v1/enrollments/completed` - Khóa học đã hoàn thành
- `POST /api/v1/enrollments` - Đăng ký khóa học miễn phí
- `GET /api/v1/enrollments/check/:courseId` - Kiểm tra đã đăng ký chưa

**Features:**
- Enroll button trên Course Detail Page
- Auto-enroll cho free courses
- My Courses page với:
  - Active courses
  - Completed courses
  - Progress bars
  - Continue learning button
- Enrollment status badges

---

## GIAI ĐOẠN 7: Progress Tracking (DEVELOPER 2)

### 7.1 Progress UI 🔄
**Files cần tạo:**
- `src/components/Progress/ProgressBar.tsx` - Cần tạo mới
- `src/components/Progress/CourseProgress.tsx` - Cần tạo mới
- `src/components/Progress/LessonProgress.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/progress/courses/:courseId` - Tiến độ khóa học
- `GET /api/v1/progress/lessons/:lessonId` - Tiến độ bài học
- `POST /api/v1/progress/lessons/:lessonId/start` - Bắt đầu học bài
- `PUT /api/v1/progress/lessons/:lessonId/update` - Cập nhật vị trí video
- `POST /api/v1/progress/lessons/:lessonId/complete` - Đánh dấu hoàn thành
- `GET /api/v1/progress/lessons/:lessonId/resume` - Lấy vị trí resume

**Features:**
- Progress bar trên course cards
- Course progress overview
- Lesson completion indicators
- Auto-save video position
- Resume watching functionality
- Completion badges

---

## GIAI ĐOẠN 8: Payment Integration (DEVELOPER 2)

### 8.1 Payment Checkout 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/PaymentCheckoutPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/PaymentSuccessPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/pages/PaymentFailurePage.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Payment/PaymentMethod.tsx` - Cần tạo mới
- `src/components/Payment/OrderSummary.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `POST /api/v1/orders` - Tạo đơn hàng mới
- `GET /api/v1/orders/:id` - Chi tiết đơn hàng
- `GET /api/v1/orders` - Lịch sử đơn hàng
- `POST /api/v1/payments/vnpay/create` - Tạo payment VNPay
- `POST /api/v1/payments/momo/create` - Tạo payment MoMo
- `GET /api/v1/payments/vnpay/callback` - VNPay callback
- `POST /api/v1/payments/momo/callback` - MoMo callback

**Features:**
- Checkout page với:
  - Order summary
  - Payment method selection (VNPay/MoMo)
  - Order confirmation
- Redirect to payment gateway
- Payment success page
- Payment failure page với retry option
- Order history page

---

## GIAI ĐOẠN 9: AI Features (DEVELOPER 1)

### 9.1 AI Chatbox 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/AIChatPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/AI/Chatbox.tsx` - Cần tạo mới
- `src/components/AI/ConversationList.tsx` - Cần tạo mới
- `src/components/AI/MessageBubble.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/ai/conversations` - Danh sách conversations
- `GET /api/v1/ai/conversations/:id` - Chi tiết conversation
- `POST /api/v1/ai/conversations` - Tạo conversation mới
- `DELETE /api/v1/ai/conversations/:id` - Xóa conversation
- `PATCH /api/v1/ai/conversations/:id/archive` - Archive conversation
- `GET /api/v1/ai/conversations/:id/messages` - Lịch sử chat
- `POST /api/v1/ai/conversations/:id/messages` - Gửi tin nhắn
- `POST /api/v1/ai/messages/:id/feedback` - Feedback tin nhắn

**Features:**
- Chat interface với:
  - Message bubbles (user/AI)
  - Typing indicator
  - Message timestamps
  - Copy message button
  - Feedback buttons (helpful/not helpful)
- Conversation list sidebar
- Create new conversation
- Archive/Delete conversations
- Context-aware (course/lesson context)
- Markdown support cho AI responses

### 9.2 AI Recommendations 🔄
**Files cần tạo:**
- `src/components/AI/Recommendations.tsx` - Cần tạo mới
- `src/components/Courses/RecommendedCourses.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/ai/recommendations` - Gợi ý khóa học cho user
- `GET /api/v1/ai/recommendations/similar/:courseId` - Khóa học tương tự
- `POST /api/v1/ai/recommendations/:id/view` - Đánh dấu đã xem gợi ý

**Features:**
- Recommended courses section trên homepage
- Similar courses trên Course Detail Page
- Recommendation cards với:
  - Course thumbnail
  - Title, instructor
  - Why recommended (AI explanation)
  - Enroll button

---

## GIAI ĐOẠN 10: Quiz System (DEVELOPER 2)

### 10.1 Quiz Pages 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/QuizPage.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Quiz/QuizCard.tsx` - Cần tạo mới
- `src/components/Quiz/QuestionCard.tsx` - Cần tạo mới
- `src/components/Quiz/QuizResults.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/quizzes/:id` - Chi tiết quiz
- `GET /api/v1/lessons/:lessonId/quizzes` - Danh sách quiz trong bài học
- `GET /api/v1/courses/:courseId/quizzes` - Danh sách quiz trong khóa học
- `POST /api/v1/quizzes/:quizId/submit` - Submit bài làm quiz
- `GET /api/v1/quizzes/:quizId/submissions` - Lịch sử bài làm
- `GET /api/v1/quizzes/:quizId/submissions/:id` - Chi tiết bài làm
- `GET /api/v1/quizzes/:quizId/attempts` - Số lần đã làm bài
- `GET /api/v1/quizzes/:quizId/result/latest` - Kết quả lần làm gần nhất

**Features:**
- Quiz page với:
  - Question display
  - Multiple choice options
  - Timer (nếu có time limit)
  - Progress indicator
  - Submit button
- Quiz results với:
  - Score display
  - Pass/Fail status
  - Correct/Incorrect answers
  - Explanation (nếu có)
  - Retry button (nếu allowed)
- Quiz list trên Lesson/Course pages

### 10.2 Instructor Quiz Management (DEVELOPER 2)
**Files cần tạo:**
- `src/pages/instructor/QuizzesPage.tsx` - Cần tạo mới
- `src/components/instructor/QuizForm.tsx` - Cần tạo mới
- `src/components/instructor/QuizAnalytics.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `POST /api/v1/instructor/lessons/:lessonId/quizzes` - Tạo quiz cho lesson
- `POST /api/v1/instructor/courses/:courseId/quizzes` - Tạo quiz cho course
- `PUT /api/v1/instructor/quizzes/:id` - Cập nhật quiz
- `DELETE /api/v1/instructor/quizzes/:id` - Xóa quiz
- `PATCH /api/v1/instructor/quizzes/:id/publish` - Publish/Unpublish
- `GET /api/v1/instructor/quizzes/:id/submissions` - Xem bài làm của học viên
- `GET /api/v1/instructor/quizzes/:id/analytics` - Phân tích kết quả quiz

**Features:**
- Create/Edit quiz form:
  - Title, description
  - Questions với:
    - Question text
    - Multiple choice options
    - Correct answer selection
    - Points per question
  - Passing score
  - Time limit (optional)
  - Attempts limit (optional)
- Quiz analytics:
  - Submission statistics
  - Average score
  - Pass rate
  - Question analysis
- Student submissions list

---

## GIAI ĐOẠN 11: Notifications (DEVELOPER 2)

### 11.1 Notifications UI 🔄
**Files cần tạo:**
- `src/components/Notifications/NotificationBell.tsx` - Cần tạo mới
- `src/components/Notifications/NotificationList.tsx` - Cần tạo mới
- `src/components/Notifications/NotificationItem.tsx` - Cần tạo mới
- `src/pages/NotificationsPage.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/notifications` - Danh sách notifications
- `GET /api/v1/notifications/unread` - Notifications chưa đọc
- `GET /api/v1/notifications/unread/count` - Số lượng chưa đọc
- `PATCH /api/v1/notifications/:id/read` - Đánh dấu đã đọc
- `PATCH /api/v1/notifications/read-all` - Đánh dấu tất cả đã đọc
- `DELETE /api/v1/notifications/:id` - Xóa notification
- `DELETE /api/v1/notifications` - Xóa tất cả notifications

**Features:**
- Notification bell icon trên Navbar với unread count badge
- Notification dropdown với:
  - Recent notifications
  - Unread indicators
  - Mark as read on click
  - Mark all as read button
- Notifications page với:
  - All notifications list
  - Filter by type
  - Delete individual notification
  - Clear all button
- Real-time updates (WebSocket hoặc polling)
- Notification types:
  - Enrollment success
  - Payment success/failed
  - Lesson completed
  - Course completed
  - Quiz graded
  - etc.

---

## GIAI ĐOẠN 12: Dashboard (DEVELOPER 1 & 2)

### 12.1 Student Dashboard (DEVELOPER 1) 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/StudentDashboard.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Dashboard/StatsCards.tsx` - Cần tạo mới
- `src/components/Dashboard/EnrolledCourses.tsx` - Cần tạo mới
- `src/components/Dashboard/ContinueWatching.tsx` - Cần tạo mới
- `src/components/Dashboard/RecentActivity.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/dashboard/student` - Dashboard tổng quan
- `GET /api/v1/dashboard/student/stats` - Thống kê học tập
- `GET /api/v1/dashboard/student/enrolled-courses` - Khóa học đã đăng ký
- `GET /api/v1/dashboard/student/continue-watching` - Resume watching

**Features:**
- Stats cards:
  - Total enrolled courses
  - Completed courses
  - In progress courses
  - Total learning hours
- Enrolled courses grid với progress bars
- Continue watching section
- Recent activity timeline
- Quick actions

### 12.2 Instructor Dashboard (DEVELOPER 2) 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/InstructorDashboard.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Dashboard/InstructorStats.tsx` - Cần tạo mới
- `src/components/Dashboard/RevenueChart.tsx` - Cần tạo mới
- `src/components/Dashboard/CourseAnalytics.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/dashboard/instructor` - Dashboard instructor
- `GET /api/v1/dashboard/instructor/stats` - Thống kê khóa học
- `GET /api/v1/dashboard/instructor/revenue` - Doanh thu
- `GET /api/v1/dashboard/instructor/analytics` - Analytics chi tiết
- `GET /api/v1/dashboard/instructor/students` - Danh sách học viên

**Features:**
- Stats cards:
  - Total courses
  - Total students
  - Total revenue
  - Average rating
- Revenue chart (line/bar chart)
- Course performance analytics
- Student list với enrollment stats
- Recent enrollments

### 12.3 Admin Dashboard (DEVELOPER 2) 🔄
**Files cần tạo/hoàn thiện:**
- `src/pages/AdminDashboard.tsx` - ✅ Đã có, cần tích hợp API
- `src/components/Dashboard/AdminStats.tsx` - Cần tạo mới
- `src/components/Dashboard/UsersAnalytics.tsx` - Cần tạo mới
- `src/components/Dashboard/CoursesAnalytics.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/dashboard/admin` - Dashboard admin
- `GET /api/v1/dashboard/admin/stats` - Thống kê hệ thống
- `GET /api/v1/dashboard/admin/users-analytics` - Phân tích users
- `GET /api/v1/dashboard/admin/courses-analytics` - Phân tích courses
- `GET /api/v1/dashboard/admin/revenue` - Doanh thu hệ thống
- `GET /api/v1/dashboard/admin/activities` - Hoạt động gần đây

**Features:**
- Stats cards:
  - Total users
  - Total courses
  - Total instructors
  - Total revenue
- Users analytics chart
- Courses analytics chart
- Revenue overview
- Recent activities feed
- Quick links to management pages

---

## GIAI ĐOẠN 13: Search & Filter (DEVELOPER 1)

### 13.1 Search UI 🔄
**Files cần tạo:**
- `src/components/Search/SearchBar.tsx` - Cần tạo mới
- `src/components/Search/VoiceSearch.tsx` - Cần tạo mới
- `src/components/Search/SearchResults.tsx` - Cần tạo mới
- `src/pages/SearchPage.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `GET /api/v1/search/courses` - Tìm kiếm khóa học
- `GET /api/v1/search/instructors` - Tìm kiếm giảng viên
- `GET /api/v1/search/suggestions` - Gợi ý tìm kiếm
- `POST /api/v1/search/voice` - Voice search (speech-to-text)

**Features:**
- Search bar trên Navbar
- Search suggestions dropdown
- Search results page với:
  - Courses results
  - Instructors results
  - Filters sidebar
- Voice search button với:
  - Microphone icon
  - Speech-to-text conversion
  - Visual feedback khi recording
- Advanced filters:
  - Category
  - Tags
  - Level
  - Price range
  - Rating
  - Sort options

---

## GIAI ĐOẠN 14: File Upload & Miscellaneous (DEVELOPER 2)

### 14.1 File Upload Components 🔄
**Files cần tạo:**
- `src/components/Upload/ImageUpload.tsx` - Cần tạo mới
- `src/components/Upload/VideoUpload.tsx` - Cần tạo mới
- `src/components/Upload/DocumentUpload.tsx` - Cần tạo mới
- `src/components/Upload/UploadProgress.tsx` - Cần tạo mới

**API Endpoints sử dụng:**
- `POST /api/v1/uploads/image` - Upload hình ảnh
- `POST /api/v1/uploads/video` - Upload video
- `POST /api/v1/uploads/document` - Upload tài liệu
- `DELETE /api/v1/uploads/:fileId` - Xóa file
- `GET /api/v1/uploads/:fileId/status` - Check upload status

**Features:**
- Image upload với preview
- Video upload với progress bar
- Document upload
- File validation (type, size)
- Upload progress indicator
- Error handling

### 14.2 Protected Routes & Error Handling 🔄
**Files cần tạo:**
- `src/components/ProtectedRoute.tsx` - Cần tạo mới
- `src/components/ErrorBoundary.tsx` - Cần tạo mới (có thể đã có)
- `src/pages/NotFoundPage.tsx` - Cần tạo mới
- `src/pages/UnauthorizedPage.tsx` - Cần tạo mới

**Features:**
- Protected routes với role checking
- Error boundary cho error handling
- 404 Not Found page
- 401 Unauthorized page
- 403 Forbidden page
- Loading states
- Error messages display

---

## 📝 Checklist Frontend Development

### Module A: Authentication & User Management (DEVELOPER 1)
- [ ] LoginPage - Tích hợp API
- [ ] RegisterPage - Tích hợp API
- [ ] ForgotPasswordPage - Tích hợp API
- [ ] ResetPasswordPage - Tích hợp API
- [ ] EmailVerificationPage - Tạo mới
- [ ] AuthContext - Mở rộng với API calls
- [ ] Protected routes setup

### Module B: User Profile & Settings (DEVELOPER 2)
- [ ] ProfilePage - Tích hợp API
- [ ] SettingsPage - Tạo mới
- [ ] AvatarUpload component - Tạo mới
- [ ] ChangePassword component - Tạo mới
- [ ] User Management (Admin) - Tạo mới

### Module C: Categories & Tags (DEVELOPER 1)
- [ ] CategoryList component - Tạo mới
- [ ] CategoryCard component - Tạo mới
- [ ] TagList component - Tạo mới
- [ ] TagBadge component - Tạo mới
- [ ] Filter by category/tags

### Module D: Lessons & Video Player (DEVELOPER 2)
- [ ] VideoPlayerPage - Tích hợp API
- [ ] VideoPlayer component - Tạo mới
- [ ] LessonList component - Tạo mới
- [ ] Transcript component - Tạo mới
- [ ] Instructor Lesson Management - Tạo mới

### Module E: Courses (DEVELOPER 1)
- [ ] CoursesPage - Tích hợp API
- [ ] CourseDetailPage - Tích hợp API
- [ ] CourseCard component - Tạo mới
- [ ] CourseFilters component - Tạo mới
- [ ] CourseSearch component - Tạo mới
- [ ] Instructor Course Management (DEVELOPER 2)
- [ ] Admin Course Management (DEVELOPER 2)

### Module F: Progress Tracking (DEVELOPER 2)
- [ ] ProgressBar component - Tạo mới
- [ ] CourseProgress component - Tạo mới
- [ ] LessonProgress component - Tạo mới
- [ ] Auto-save progress
- [ ] Resume watching

### Module G: Enrollments (DEVELOPER 1)
- [ ] EnrollmentButton component - Tạo mới
- [ ] EnrollmentList component - Tạo mới
- [ ] MyCoursesPage - Tạo mới
- [ ] Auto-enroll for free courses

### Module H: Payment Integration (DEVELOPER 2)
- [ ] PaymentCheckoutPage - Tích hợp API
- [ ] PaymentSuccessPage - Tích hợp API
- [ ] PaymentFailurePage - Tích hợp API
- [ ] PaymentMethod component - Tạo mới
- [ ] OrderSummary component - Tạo mới
- [ ] VNPay/MoMo integration

### Module I: AI Features (DEVELOPER 1)
- [ ] AIChatPage - Tích hợp API
- [ ] Chatbox component - Tạo mới
- [ ] ConversationList component - Tạo mới
- [ ] MessageBubble component - Tạo mới
- [ ] Recommendations component - Tạo mới

### Module J: Quiz System (DEVELOPER 2)
- [ ] QuizPage - Tích hợp API
- [ ] QuizCard component - Tạo mới
- [ ] QuestionCard component - Tạo mới
- [ ] QuizResults component - Tạo mới
- [ ] Instructor Quiz Management - Tạo mới

### Module K: Search & Filter (DEVELOPER 1)
- [ ] SearchBar component - Tạo mới
- [ ] VoiceSearch component - Tạo mới
- [ ] SearchResults component - Tạo mới
- [ ] SearchPage - Tạo mới

### Module L: Notifications (DEVELOPER 2)
- [ ] NotificationBell component - Tạo mới
- [ ] NotificationList component - Tạo mới
- [ ] NotificationItem component - Tạo mới
- [ ] NotificationsPage - Tạo mới
- [ ] Real-time updates

### Module M: Dashboard (DEVELOPER 1 & 2)
- [ ] StudentDashboard - Tích hợp API (DEVELOPER 1)
- [ ] InstructorDashboard - Tích hợp API (DEVELOPER 2)
- [ ] AdminDashboard - Tích hợp API (DEVELOPER 2)
- [ ] Stats components - Tạo mới
- [ ] Charts components - Tạo mới

### Module N: File Upload & Miscellaneous (DEVELOPER 2)
- [ ] ImageUpload component - Tạo mới
- [ ] VideoUpload component - Tạo mới
- [ ] DocumentUpload component - Tạo mới
- [ ] ProtectedRoute component - Tạo mới
- [ ] ErrorBoundary - Hoàn thiện
- [ ] NotFoundPage - Tạo mới

---

## 📁 Cấu trúc Files Frontend

### Pages (`src/pages/`)
```
pages/
├── auth/
│   ├── LoginPage.tsx ✅
│   ├── RegisterPage.tsx ✅
│   ├── ForgotPasswordPage.tsx ✅
│   ├── ResetPasswordPage.tsx ✅
│   └── EmailVerificationPage.tsx (cần tạo)
├── admin/
│   ├── AdminDashboard.tsx ✅
│   ├── UsersPage.tsx (cần tạo)
│   └── CoursesPage.tsx (cần tạo)
├── instructor/
│   ├── InstructorDashboard.tsx ✅
│   ├── CoursesPage.tsx (cần tạo)
│   ├── CourseCreatePage.tsx (cần tạo)
│   ├── CourseEditPage.tsx (cần tạo)
│   ├── LessonsPage.tsx (cần tạo)
│   └── QuizzesPage.tsx (cần tạo)
├── CoursesPage.tsx ✅
├── CourseDetailPage.tsx ✅
├── VideoPlayerPage.tsx ✅
├── StudentDashboard.tsx ✅
├── MyCoursesPage.tsx (cần tạo)
├── AIChatPage.tsx ✅
├── QuizPage.tsx ✅
├── PaymentCheckoutPage.tsx ✅
├── PaymentSuccessPage.tsx ✅
├── PaymentFailurePage.tsx ✅
├── ProfilePage.tsx ✅
├── SettingsPage.tsx (cần tạo)
├── NotificationsPage.tsx (cần tạo)
├── SearchPage.tsx (cần tạo)
├── NotFoundPage.tsx (cần tạo)
└── LandingPage.tsx ✅
```

### Components (`src/components/`)
```
components/
├── ui/ ✅ (đã có sẵn)
├── Courses/
│   ├── CourseCard.tsx (cần tạo)
│   ├── CourseList.tsx (cần tạo)
│   ├── CourseFilters.tsx (cần tạo)
│   └── CourseSearch.tsx (cần tạo)
├── VideoPlayer/
│   ├── VideoPlayer.tsx (cần tạo)
│   ├── LessonList.tsx (cần tạo)
│   └── Transcript.tsx (cần tạo)
├── Quiz/
│   ├── QuizCard.tsx (cần tạo)
│   ├── QuestionCard.tsx (cần tạo)
│   └── QuizResults.tsx (cần tạo)
├── AI/
│   ├── Chatbox.tsx (cần tạo)
│   ├── ConversationList.tsx (cần tạo)
│   ├── MessageBubble.tsx (cần tạo)
│   └── Recommendations.tsx (cần tạo)
├── Dashboard/
│   ├── StatsCards.tsx (cần tạo)
│   ├── EnrolledCourses.tsx (cần tạo)
│   ├── ContinueWatching.tsx (cần tạo)
│   └── RevenueChart.tsx (cần tạo)
├── Notifications/
│   ├── NotificationBell.tsx (cần tạo)
│   ├── NotificationList.tsx (cần tạo)
│   └── NotificationItem.tsx (cần tạo)
├── Search/
│   ├── SearchBar.tsx (cần tạo)
│   ├── VoiceSearch.tsx (cần tạo)
│   └── SearchResults.tsx (cần tạo)
├── Upload/
│   ├── ImageUpload.tsx (cần tạo)
│   ├── VideoUpload.tsx (cần tạo)
│   └── UploadProgress.tsx (cần tạo)
├── ProtectedRoute.tsx (cần tạo)
└── ErrorBoundary.tsx (cần hoàn thiện)
```

### API Client (`src/lib/api/`)
```
api/
├── client.ts ✅ (cần mở rộng)
├── auth.ts ✅ (cần mở rộng)
├── courses.ts ✅ (cần mở rộng)
├── users.ts (cần tạo)
├── categories.ts (cần tạo)
├── tags.ts (cần tạo)
├── lessons.ts (cần tạo)
├── enrollments.ts (cần tạo)
├── progress.ts (cần tạo)
├── payments.ts (cần tạo)
├── orders.ts (cần tạo)
├── quizzes.ts (cần tạo)
├── ai.ts (cần tạo)
├── notifications.ts (cần tạo)
├── dashboard.ts ✅ (cần mở rộng)
├── search.ts (cần tạo)
├── upload.ts (cần tạo)
├── types.ts ✅ (cần mở rộng)
└── index.ts ✅
```

---

## 🔧 Tech Stack Frontend

### Core
- React.js 18+
- TypeScript 5+
- Vite 5+
- React Router 6+

### Styling
- TailwindCSS 3+
- shadcn/ui components
- Lucide React (icons)

### State Management
- React Context API
- React Hooks (useState, useEffect, useReducer)

### API & Data Fetching
- Axios hoặc Fetch API
- React Query (optional, recommended)

### Forms
- react-hook-form
- zod (validation)

### Charts & Visualization
- Recharts hoặc Chart.js
- react-chartjs-2

### Video Player
- react-player hoặc video.js

### Other Libraries
- date-fns (date formatting)
- react-markdown (markdown rendering)
- socket.io-client (real-time updates, optional)

---

## 📝 Ghi chú về Development

### ✅ Đã hoàn thành:
1. **Frontend Setup:**
   - ✅ Vite + React + TypeScript đã setup
   - ✅ TailwindCSS đã config
   - ✅ shadcn/ui components đã cài đặt
   - ✅ React Router đã setup
   - ✅ Một số pages cơ bản đã có

2. **Backend API:**
   - ✅ Tất cả 14 modules đã hoàn thành 100%
   - ✅ ~165+ endpoints đã implement và test
   - ✅ Postman collection đã có sẵn
   - ✅ API documentation đã hoàn thành

### 🔄 Cần làm:
1. **API Integration:**
   - Mở rộng API client với tất cả endpoints
   - Implement error handling
   - Implement loading states
   - Implement token refresh logic

2. **Components & Pages:**
   - Hoàn thiện các pages đã có
   - Tạo các components còn thiếu
   - Implement responsive design
   - Implement accessibility

3. **State Management:**
   - Mở rộng Context API
   - Implement global state management
   - Implement caching strategy

4. **Testing:**
   - Unit tests cho components
   - Integration tests cho pages
   - E2E tests (optional)

### ⚠️ Lưu ý:
- Frontend sử dụng **TypeScript** cho type safety
- Sử dụng **TailwindCSS** cho styling, không dùng CSS modules
- Sử dụng **shadcn/ui** components làm base, customize khi cần
- API calls phải handle errors và loading states
- Responsive design cho mobile, tablet, desktop
- Accessibility (a11y) compliance

### 🔄 Next Steps:
1. ✅ Backend API đã hoàn thành 100%
2. 🔄 Bắt đầu Frontend development
3. 🔄 Tích hợp với Backend API
4. 🔄 Testing và optimization

---

**Last updated**: 2025-12-03
**Status**: Backend API hoàn thành 100%, Frontend development bắt đầu

