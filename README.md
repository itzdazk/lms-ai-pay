# LMS AI Pay - Hệ thống Quản lý Học tập Trực tuyến

**Thiết kế và triển khai hệ thống quản lý học tập trực tuyến tích hợp AI và thanh toán trực tuyến**

## 📋 Tổng quan

Dự án full-stack với:
- **Backend**: Node.js + Express.js + PostgreSQL + Prisma
- **Frontend**: React.js + TypeScript + TailwindCSS
- **AI Integration**: OpenAI GPT-4
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

Backend sẽ chạy tại: `http://localhost:5000`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend sẽ chạy tại: `http://localhost:3000`

## 📁 Cấu trúc Dự án

```
lms-ai-pay/
├── backend/
│   ├── src/
│   │   ├── routes/        # API routes
│   │   ├── controllers/   # Business logic
│   │   ├── middleware/    # Auth, validation, error handling
│   │   ├── services/      # External services (AI, Payment, Email)
│   │   ├── utils/         # Helpers
│   │   └── server.js      # Express server
│   ├── prisma/
│   │   └── schema.prisma  # Database schema
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── pages/         # Page components
│   │   ├── contexts/      # Context API
│   │   ├── services/      # API clients
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Helpers
│   └── package.json
└── README.md
```

## 🗄️ Database

Database schema có **14 bảng chính**:
1. users
2. categories
3. tags
4. courses
5. lessons
6. enrollments
7. orders
8. payment_transactions
9. progress
10. notifications
11. quizzes
12. quiz_submissions
13. ai_recommendations
14. conversations
15. chat_messages

## 📊 Tiến độ Dự án

### Tổng quan
- **Đã hoàn thành:** 8/14 modules (57%)
- **Endpoints:** ~70/130 endpoints (54%)
- **Tính năng:** 20/33 tính năng (61%)

### ✅ Modules đã hoàn thành

1. **Authentication** ✅ - 9/9 endpoints
   - Register, Login, Logout, Refresh Token
   - Email Verification, Password Reset
   
2. **User Management** ✅ - 10/10 endpoints
   - Profile Management, Avatar Upload
   - Admin User Management
   
3. **Categories & Tags** ✅ - 14/14 endpoints
   - CRUD Categories, Hierarchical Categories
   - CRUD Tags, Tag-Course Management
   
4. **Courses** ✅ - 22/22 endpoints
   - Public Routes (List, Detail, Filter, Search)
   - Instructor Routes (CRUD, Analytics, Tags)
   - Admin Routes (Management, Featured)
   
5. **Lessons** ✅ - 10/10 endpoints
   - Public Routes (View, Video, Transcript)
   - Instructor Routes (CRUD, Upload, Reorder)
   
6. **Enrollments** ✅ - 6/6 endpoints
   - Free Course Enrollment
   - Active/Completed Enrollments
   
7. **Progress Tracking** ✅ - 9/9 endpoints
   - Course/Lesson Progress
   - Resume Watching, Auto-calculation

### ❌ Modules chưa hoàn thành

1. **Payment Integration** ❌ (Ưu tiên cao)
   - VNPay & MoMo Integration
   - Orders & Transactions

2. **AI Features** ❌ (Ưu tiên cao)
   - AI Tutor Chatbox
   - AI Recommendations

3. **Quiz System** ❌ (Ưu tiên trung bình)
   - Quiz CRUD, Auto-grading
   - Quiz Submissions

4. **Notifications** ❌ (Ưu tiên trung bình)
   - Notification Management
   - Auto-create Notifications

5. **Dashboard APIs** 🔄 (Một phần - 19%)
   - Student/Instructor/Admin Dashboards

6. **Search & Filter** ❌ (Ưu tiên trung bình)
   - Search API, Voice Search

## 📝 Next Steps

**Ưu tiên cao:**
1. Payment Integration (VNPay, MoMo)
2. AI Features (Chatbox, Recommendations)

**Ưu tiên trung bình:**
3. Quiz System (Auto-grading)
4. Notifications
5. Dashboard APIs (Hoàn thiện)
6. Search & Filter (Voice Search)

## 📚 Tài liệu

- [Báo cáo tiến độ](./docs/BAO_CAO_TIEN_DO_DU_AN.md) - Chi tiết tiến độ dự án
- [Checklist tiến độ](./docs/CHECKLIST_TIEN_DO.md) - Checklist theo dõi
- [Kế hoạch dự án](./docs/PROJECT_PLAN%20v2.md) - Kế hoạch chi tiết
- [Danh sách tính năng](./docs/tong_hop_tinh_nang_trang_web.md) - Tổng hợp tính năng
- [API Design](./docs/API%20Design.txt) - Thiết kế API endpoints

## 🔧 Environment Variables

Backend yêu cầu các biến môi trường trong `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `VNPAY_*` (VNPay credentials)
- `MOMO_*` (MoMo credentials)
- Và các biến khác (xem `.env.example`)

---

**Last updated**: 2025-01-08 - Tiến độ: 8/14 modules (57%) ✅
