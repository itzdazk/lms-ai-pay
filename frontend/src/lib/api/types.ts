// Common API response types
export interface ApiResponse<T> {
    success: boolean
    data: T
    message?: string
}

export interface PublicCoursesPagination<T> {
    courses?: T[]
    data?: T[]
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

export interface PaginatedResponse<T> {
    data: T[]
    pagination: {
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
    id: string
    userName: string
    email: string
    fullName: string
    phone?: string
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT'
    avatar?: string // Legacy field name (for backward compatibility)
    avatarUrl?: string // Backend field name
    bio?: string
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
    emailVerified: boolean
    createdAt: string
    updatedAt: string
}

// Public course types
export interface PublicCourse {
    id: number
    title: string
    slug: string
    description?: string
    shortDescription?: string
    thumbnailUrl?: string
    videoPreviewUrl?: string
    videoPreviewDuration?: number
    isFree: boolean
    price: number
    originalPrice: number
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
    featured: boolean
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

export interface Course {
    id: number
    title: string
    slug: string
    description: string
    shortDescription?: string
    thumbnail?: string
    previewVideoUrl?: string
    instructorId: string
    instructor?: {
        id: string
        fullName: string
        avatar?: string
    }
    categoryId: string
    category?: {
        id: string
        name: string
        slug: string
    }
    level: 'beginner' | 'intermediate' | 'advanced'
    originalPrice: number
    discountPrice?: number
    isFree: boolean
    status: 'draft' | 'published' | 'archived'
    featured: boolean
    viewsCount: number
    enrolledCount: number
    ratingAvg: number
    ratingCount: number
    completionRate?: number
    tags?: Tag[]
    lessonsCount?: number
    durationMinutes?: number
    requirements?: string
    whatYouLearn?: string
    courseObjectives?: string
    targetAudience?: string
    language?: string
    createdAt: string
    updatedAt: string
}
export interface Instructor {
    id: string
    fullName?: string
    userName?: string
    avatarUrl?: string
    title: string
    slug: string
    bio?: string
    description: string
    shortDescription?: string
    thumbnail?: string
    previewVideoUrl?: string
    instructorId: string
    instructor?: {
        id: string
        fullName: string
        avatar?: string
    }
    categoryId: string
    category?: {
        id: string
        name: string
        slug: string
    }
    level: 'beginner' | 'intermediate' | 'advanced'
    originalPrice: number
    discountPrice?: number
    isFree: boolean
    status: 'draft' | 'published' | 'archived'
    featured: boolean
    viewsCount: number
    enrolledCount: number
    ratingAvg: number
    ratingCount: number
    completionRate?: number
    tags?: Tag[]
    lessonsCount?: number
    durationMinutes?: number
    requirements?: string
    whatYouLearn?: string
    courseObjectives?: string
    targetAudience?: string
    language?: string
    createdAt: string
    updatedAt: string
}

export interface Category {
    id: number
    name: string
    slug: string
    description?: string
    imageUrl?: string
    parentId?: number
    sortOrder?: number
    isActive: boolean
    createdAt?: string
    updatedAt?: string
}

export interface Tag {
    id: string
    name: string
    slug: string
    description?: string
    createdAt: string
    _count?: {
        courses: number // Số lượng courses có tag này
    }
}

export interface PublicCourseFilters {
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

export interface CourseFilters {
    categoryId?: string
    level?: 'beginner' | 'intermediate' | 'advanced'
    minPrice?: number
    maxPrice?: number
    isFree?: boolean
    featured?: boolean
    search?: string
    tags?: string[]
    sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
    page?: number
    limit?: number
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
