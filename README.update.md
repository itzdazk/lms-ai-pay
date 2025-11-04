# 🎓 E-Learning Platform Backend

Backend API cho nền tảng E-Learning được xây dựng với Node.js, Express, Prisma ORM và PostgreSQL.

## 📋 Mục lục

-   [Tính năng](#tính-năng)
-   [Công nghệ sử dụng](#công-nghệ-sử-dụng)
-   [Cài đặt](#cài-đặt)
-   [Cấu hình](#cấu-hình)
-   [Chạy ứng dụng](#chạy-ứng-dụng)
-   [API Documentation](#api-documentation)
-   [Cấu trúc thư mục](#cấu-trúc-thư-mục)

## ✨ Tính năng

-   🔐 **Authentication & Authorization**: JWT-based authentication với role-based access control
-   👥 **User Management**: Quản lý người dùng với các role: Admin, Instructor, Student
-   📚 **Course Management**: CRUD operations cho khóa học
-   📖 **Lesson Management**: Quản lý bài học với video và tài liệu
-   🎯 **Quiz System**: Hệ thống quiz với auto-grading
-   📊 **Progress Tracking**: Theo dõi tiến độ học tập
-   💳 **Payment Integration**: Tích hợp VNPay, MoMo
-   🤖 **AI Features**: AI chatbot và recommendations
-   📧 **Email Service**: Gửi email verification, password reset
-   📁 **File Upload**: Upload images, videos, documents
-   🔍 **Search & Filter**: Tìm kiếm và lọc khóa học
-   📈 **Analytics Dashboard**: Thống kê cho admin và instructor

## 🛠️ Công nghệ sử dụng

-   **Runtime**: Node.js v18+
-   **Framework**: Express.js
-   **Database**: PostgreSQL
-   **ORM**: Prisma
-   **Authentication**: JWT
-   **Validation**: express-validator, Joi
-   **File Upload**: Multer, Sharp
-   **Email**: Nodemailer
-   **Logging**: Winston
-   **Security**: Helmet, CORS, Rate Limiting
-   **Documentation**: Swagger

## 📦 Cài đặt

### Yêu cầu hệ thống

-   Node.js v18 trở lên
-   PostgreSQL v14 trở lên
-   npm hoặc yarn

### Bước 1: Clone repository

```bash
git clone <repository-url>
cd elearning-backend
```

### Bước 2: Cài đặt dependencies

```bash
npm install
```

### Bước 3: Cấu hình database

Tạo database PostgreSQL:

```sql
CREATE DATABASE elearning_db;
```

### Bước 4: Cấu hình environment variables

Sao chép file `.env.example` thành `.env`:

```bash
cp .env.example .env
```

Cập nhật các giá trị trong file `.env` (xem phần [Cấu hình](#cấu-hình))

### Bước 5: Chạy migrations

```bash
npm run prisma:generate
npm run prisma:migrate
```

### Bước 6: Seed database (Optional)

```bash
npm run prisma:seed
```

## ⚙️ Cấu hình

Cấu hình các biến môi trường trong file `.env`:

### Server Configuration

```env
NODE_ENV=development
PORT=5000
SERVER_URL=http://localhost:5000
```

### Database

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/elearning_db?schema=public"
```

### JWT Secrets

```env
JWT_SECRET=your-super-secret-jwt-key-min-32-characters-long
JWT_REFRESH_SECRET=your-super-secret-refresh-token-key-min-32-characters
```

### Email (Gmail)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

**Lưu ý**: Với Gmail, bạn cần tạo App Password thay vì dùng password thông thường.

### Payment Gateways

```env
# VNPay
VNPAY_TMN_CODE=your-vnpay-tmn-code
VNPAY_HASH_SECRET=your-vnpay-hash-secret

# MoMo
MOMO_PARTNER_CODE=your-momo-partner-code
MOMO_ACCESS_KEY=your-momo-access-key
MOMO_SECRET_KEY=your-momo-secret-key
```

### AI Configuration

```env
OPENAI_API_KEY=your-openai-api-key
OPENAI_MODEL=gpt-4
```

## 🚀 Chạy ứng dụng

### Development mode

```bash
npm run dev
```

### Production mode

```bash
npm start
```

### Prisma Studio (Database GUI)

```bash
npm run prisma:studio
```

Server sẽ chạy tại: `http://localhost:5000`

## 📖 API Documentation

### Swagger Documentation

Khi chạy ở development mode, truy cập:

```
http://localhost:5000/api-docs
```

### API Endpoints

#### Authentication

```
POST   /api/v1/auth/register          - Đăng ký tài khoản
POST   /api/v1/auth/login             - Đăng nhập
POST   /api/v1/auth/logout            - Đăng xuất
POST   /api/v1/auth/refresh-token     - Refresh token
POST   /api/v1/auth/verify-email      - Xác thực email
POST   /api/v1/auth/forgot-password   - Quên mật khẩu
POST   /api/v1/auth/reset-password    - Reset mật khẩu
GET    /api/v1/auth/me                - Thông tin user hiện tại
```

#### Users

```
GET    /api/v1/users/profile          - Xem profile
PUT    /api/v1/users/profile          - Cập nhật profile
GET    /api/v1/users                  - Danh sách users (Admin)
GET    /api/v1/users/:id              - Chi tiết user
PUT    /api/v1/users/:id              - Cập nhật user
DELETE /api/v1/users/:id              - Xóa user (Admin)
```

#### Courses

```
GET    /api/v1/courses                - Danh sách khóa học
GET    /api/v1/courses/featured       - Khóa học nổi bật
GET    /api/v1/courses/trending       - Khóa học trending
GET    /api/v1/courses/:id            - Chi tiết khóa học
POST   /api/v1/courses                - Tạo khóa học (Instructor)
PUT    /api/v1/courses/:id            - Cập nhật khóa học
DELETE /api/v1/courses/:id            - Xóa khóa học
GET    /api/v1/courses/:id/lessons    - Danh sách bài học
```

#### Categories

```
GET    /api/v1/categories             - Danh sách categories
GET    /api/v1/categories/:id         - Chi tiết category
GET    /api/v1/categories/:id/courses - Khóa học trong category
POST   /api/v1/categories             - Tạo category (Admin/Instructor)
PUT    /api/v1/categories/:id         - Cập nhật category
DELETE /api/v1/categories/:id         - Xóa category (Admin)
```

### Response Format

#### Success Response

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... }
}
```

#### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errors": [ ... ]
}
```

#### Paginated Response

```json
{
  "success": true,
  "message": "Success message",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

## 📁 Cấu trúc thư mục

```
elearning-backend/
├── prisma/
│   ├── schema.prisma          # Prisma schema
│   ├── migrations/            # Database migrations
│   └── seed.js                # Database seeding
├── src/
│   ├── config/
│   │   ├── app.config.js      # App configuration
│   │   ├── database.config.js # Database connection
│   │   ├── logger.config.js   # Winston logger
│   │   └── constants.js       # Constants
│   ├── middlewares/
│   │   ├── auth.middleware.js # Authentication
│   │   ├── role.middleware.js # Authorization
│   │   ├── error.middleware.js # Error handling
│   │   └── validate.middleware.js # Validation
│   ├── utils/
│   │   ├── jwt.util.js        # JWT utilities
│   │   ├── bcrypt.util.js     # Password hashing
│   │   └── response.util.js   # Response formatting
│   ├── validators/
│   │   ├── auth.validator.js  # Auth validation
│   │   └── ...
│   ├── services/
│   │   ├── auth.service.js    # Auth business logic
│   │   └── ...
│   ├── controllers/
│   │   ├── auth.controller.js # Auth controllers
│   │   └── ...
│   ├── routes/
│   │   ├── index.js           # Routes entry point
│   │   ├── auth.routes.js     # Auth routes
│   │   └── ...
│   ├── app.js                 # Express app setup
│   └── server.js              # Server entry point
├── logs/                      # Log files
├── uploads/                   # Uploaded files
├── .env                       # Environment variables
├── .env.example               # Environment template
├── .gitignore
├── package.json
└── README.md
```

## 🔒 Security Features

-   JWT authentication với access và refresh tokens
-   Password hashing với bcrypt
-   Rate limiting để chống brute force
-   Input validation và sanitization
-   XSS protection
-   CORS configuration
-   Helmet security headers
-   SQL injection protection (Prisma ORM)

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

## 📝 Scripts

```bash
npm start              # Start production server
npm run dev            # Start development server
npm run prisma:generate # Generate Prisma Client
npm run prisma:migrate  # Run migrations
npm run prisma:seed     # Seed database
npm run prisma:studio   # Open Prisma Studio
npm test               # Run tests
npm run lint           # Run ESLint
npm run format         # Format code with Prettier
```

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Tạo Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👥 Authors

Your Name - your.email@example.com

## 🙏 Acknowledgments

-   Express.js documentation
-   Prisma documentation
-   Node.js best practices

---

Được xây dựng với ❤️ cho đồ án tốt nghiệp

