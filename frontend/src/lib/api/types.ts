// Common API response types
export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export interface PaginatedResponse<T> {
    courses?: T[] // Backend trả về field này cho courses API
    data?: T[] // Generic field
    total: number
    page?: number
    limit?: number
    totalPages?: number
    pagination?: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export interface PaginatedApiResponse<T> {
    success: boolean
    message?: string
    data: T[]
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

// Auth types
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    userName: string
    email: string
    password: string
    fullName: string
    role?: 'student' | 'instructor'
}

export interface AuthResponse {
    user: User
}

export interface User {
    id: number
    userName: string
    email: string
    fullName: string
    phone?: string
    role: 'admin' | 'instructor' | 'student'
    avatarUrl?: string
    bio?: string
    status: 'active' | 'inactive' | 'suspended'
    emailVerified: boolean
    createdAt: string
    updatedAt: string
}

// Course types
export interface Course {
    id: number
    title: string
    slug: string
    description?: string
    shortDescription?: string
    thumbnailUrl?: string
    videoPreviewUrl?: string
    videoPreviewDuration?: number
    price: number
    discountPrice?: number
    instructorId: number
    instructor?: Instructor
    categoryId: number
    category?: Category
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    durationHours: number
    totalLessons: number
    language: string
    requirements?: string
    whatYouLearn?: string
    courseObjectives?: string
    targetAudience?: string
    status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
    isFeatured: boolean
    ratingAvg: number
    ratingCount: number
    enrolledCount: number
    viewsCount: number
    completionRate: number
    publishedAt?: string
    createdAt: string
    updatedAt: string
    tags?: Tag[]
    lessonsCount?: number
    enrollmentsCount?: number
}

export interface Instructor {
    id: number
    userName: string
    fullName: string
    avatarUrl?: string
    bio?: string
    createdAt?: string
    totalCourses?: number
    otherCourses?: Course[]
}

export interface Category {
    id: number
    name: string
    slug: string
    description?: string
    imageUrl?: string
    parentId?: number
    sortOrder: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

export interface Tag {
    id: number
    name: string
    slug: string
    description?: string
    createdAt: string
    _count?: {
        courses: number // Số lượng courses có tag này
    }
}

export interface CourseFilters {
    page?: number
    limit?: number
    search?: string
    categoryId?: number // ⚠️ ĐỔI từ string sang number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    minPrice?: number
    maxPrice?: number
    isFeatured?: boolean
    instructorId?: number
    sort?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
    tagId?: number
}

// Enrollment types
export interface Enrollment {
    id: number // ⚠️ ĐỔI từ string sang number
    userId: number
    courseId: number
    enrolledAt: string
    startedAt?: string
    completedAt?: string
    progressPercentage: number
    lastAccessedAt?: string
    expiresAt?: string
    status: 'active' | 'expired' | 'cancelled'
    createdAt: string
    updatedAt: string
}

// Lesson types
export interface Lesson {
    id: number
    courseId: number
    title: string
    slug: string
    description?: string
    content?: string
    videoUrl?: string
    videoDuration?: number
    transcriptUrl?: string
    transcriptStatus: string
    transcriptJsonUrl?: string
    lessonOrder: number
    isPreview: boolean
    isPublished: boolean
    createdAt: string
    updatedAt: string
}

export interface CourseLessonsResponse {
    course: {
        id: number
        title: string
    }
    lessons: Lesson[]
    totalLessons: number
}

export interface CoursesListResponse {
    courses: Course[]
    total: number
    page: number
    limit: number
    totalPages: number
}

// Payment types
export interface PaymentRequest {
    courseId: string
    paymentMethod: 'credit_card' | 'bank_transfer' | 'wallet'
}

export interface PaymentResponse {
    id: string
    status: 'pending' | 'completed' | 'failed'
    paymentUrl?: string
}

// Quiz types
export interface Quiz {
    id: string
    courseId: string
    title: string
    description?: string
    questions: QuizQuestion[]
    timeLimitMinutes?: number
    maxAttempts?: number
    passingScore?: number
}

export interface QuizQuestion {
    id: string
    question: string
    type: 'multiple_choice' | 'true_false'
    options: string[]
    correctAnswer: number
    points: number
}

export interface QuizAttempt {
    id: string
    quizId: string
    userId: string
    answers: Record<string, number>
    score: number
    passed: boolean
    completedAt: string
}

// Certificate types
export interface Certificate {
    id: string
    courseId: string
    userId: string
    issuedAt: string
    certificateNumber: string
}

// Dashboard types
export interface DashboardStats {
    totalCourses: number
    enrolledCourses: number
    completedCourses: number
    inProgressCourses: number
    totalHours: number
    certificates: number
}

export interface LearningProgress {
    courseId: string
    courseTitle: string
    progress: number
    lastAccessedAt: string
}
