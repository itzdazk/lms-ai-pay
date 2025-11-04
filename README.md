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

## ✅ Giai đoạn 1: Đã hoàn thành

- ✅ Tạo cấu trúc thư mục backend và frontend
- ✅ Setup Backend (Node.js + Express + Dependencies)
- ✅ Setup Frontend (React + TypeScript + TailwindCSS)
- ✅ Tạo Prisma schema từ database schema

## 📝 Next Steps

Tiếp theo sẽ triển khai:
1. **Giai đoạn 2**: Authentication & User Management
2. **Giai đoạn 3**: Course Management
3. **Giai đoạn 4**: Enrollment & Learning
4. **Giai đoạn 5**: Payment Integration
5. **Giai đoạn 6**: Video Player
6. **Giai đoạn 7**: Quiz System
7. **Giai đoạn 8**: AI Features

## 📚 Tài liệu

- [Danh sách tính năng](./tong_hop_tinh_nang_trang_web.md)
- [Kế hoạch dự án](./PROJECT_PLAN.md)
- [Database Schema](./db_schema.txt)

## 🔧 Environment Variables

Backend yêu cầu các biến môi trường trong `.env`:
- `DATABASE_URL`
- `JWT_SECRET`
- `OPENAI_API_KEY`
- `VNPAY_*` (VNPay credentials)
- `MOMO_*` (MoMo credentials)
- Và các biến khác (xem `.env.example`)

---

**Last updated**: Giai đoạn 1 - Setup hoàn tất ✅







