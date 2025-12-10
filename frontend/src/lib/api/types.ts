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

// =====================================================
// AUTH TYPES
// =====================================================
export interface LoginRequest {
    email: string
    password: string
}

export interface RegisterRequest {
    userName: string
    email: string
    password: string
    fullName: string
    role?: 'STUDENT' | 'INSTRUCTOR'
}

export interface AuthResponse {
    user: User
    tokens?: {
        accessToken: string
        refreshToken: string
    }
}

export interface RefreshTokenRequest {
    refreshToken?: string
}

// =====================================================
// USER TYPES
// =====================================================
export interface User {
    id: number
    userName: string
    email: string
    fullName: string
    phone?: string
    role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT' | 'GUEST'
    avatar?: string // Legacy field name (for backward compatibility)
    avatarUrl?: string // Backend field name
    bio?: string
    status: 'ACTIVE' | 'INACTIVE' | 'BANNED'
    emailVerified: boolean
    emailVerifiedAt?: string
    lastLoginAt?: string
    createdAt: string
    updatedAt: string
}

export interface UpdateUserRequest {
    fullName?: string
    phone?: string
    bio?: string
    avatarUrl?: string
}

export interface ChangePasswordRequest {
    currentPassword: string
    newPassword: string
}

// =====================================================
// CATEGORY TYPES
// =====================================================
export interface Category {
    id: number
    name: string
    slug: string
    description?: string
    imageUrl?: string
    parentId?: number
    parent?: Category
    children?: Category[]
    sortOrder: number
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// =====================================================
// TAG TYPES
// =====================================================
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

// =====================================================
// COURSE TYPES
// =====================================================
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
    instructor?: {
        id: number
        fullName: string
        avatarUrl?: string
        avatar?: string // Legacy
    }
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
    featured?: boolean // Legacy
    ratingAvg: number
    ratingCount: number
    enrolledCount: number
    viewsCount: number
    completionRate: number
    publishedAt?: string
    createdAt: string
    updatedAt: string
    tags?: Tag[]
    lessonsCount?: number // Legacy
    enrollmentsCount?: number // Legacy
    // Computed fields
    isFree?: boolean
    originalPrice?: number
}

export interface PublicCourse extends Course {
    isFree: boolean
    originalPrice: number
}

export interface CreateCourseRequest {
    title: string
    slug?: string
    description?: string
    shortDescription?: string
    categoryId: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    price?: number
    discountPrice?: number
    language?: string
    requirements?: string
    whatYouLearn?: string
    courseObjectives?: string
    targetAudience?: string
    isFeatured?: boolean
}

export interface UpdateCourseRequest extends Partial<CreateCourseRequest> {
    status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
}

export interface PublicCourseFilters {
    page?: number
    limit?: number
    search?: string
    categoryId?: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    minPrice?: number
    maxPrice?: number
    isFeatured?: boolean
    instructorId?: number
    sort?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
    tagId?: number
}

export interface CourseFilters {
    categoryId?: number | string
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
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

// =====================================================
// LESSON TYPES
// =====================================================
export interface Lesson {
    id: number
    courseId: number
    course?: {
        id: number
        title: string
        slug: string
    }
    title: string
    slug: string
    description?: string
    content?: string
    videoUrl?: string
    videoDuration?: number
    transcriptUrl?: string
    transcriptStatus: 'idle' | 'processing' | 'completed' | 'failed' | 'cancelled'
    transcriptJsonUrl?: string
    lessonOrder: number
    isPreview: boolean
    isPublished: boolean
    createdAt: string
    updatedAt: string
}

export interface CreateLessonRequest {
    courseId: number
    title: string
    slug?: string
    description?: string
    content?: string
    videoUrl?: string
    videoDuration?: number
    lessonOrder: number
    isPreview?: boolean
    isPublished?: boolean
}

export interface UpdateLessonRequest extends Partial<CreateLessonRequest> {}

export interface CourseLessonsResponse {
    course: {
        id: number
        title: string
        slug: string
    }
    lessons: Lesson[]
    totalLessons: number
}

// =====================================================
// ENROLLMENT TYPES
// =====================================================
export interface Enrollment {
    id: number
    userId: number
    user?: User
    courseId: number
    course?: Course
    enrolledAt: string
    startedAt?: string
    completedAt?: string
    progressPercentage: number
    lastAccessedAt?: string
    expiresAt?: string
    status: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
    createdAt: string
    updatedAt: string
}

export interface EnrollmentFilters {
    page?: number
    limit?: number
    status?: 'ACTIVE' | 'COMPLETED' | 'DROPPED'
    search?: string
    sort?: 'newest' | 'oldest' | 'progress'
}

export interface EnrollCourseRequest {
    courseId: number
}

// =====================================================
// ORDER TYPES
// =====================================================
export interface Order {
    id: number
    userId: number
    user?: User
    courseId: number
    course?: Course
    orderCode: string
    originalPrice: number
    discountAmount: number
    finalPrice: number
    paymentMethod?: string
    paymentGateway: 'VNPay' | 'MoMo'
    paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
    transactionId?: string
    refundAmount: number
    refundedAt?: string
    paidAt?: string
    billingAddress?: {
        fullName?: string
        email?: string
        phone?: string
        address?: string
        city?: string
        country?: string
    }
    notes?: string
    createdAt: string
    updatedAt: string
    paymentTransactions?: PaymentTransaction[]
}

export interface CreateOrderRequest {
    courseId: number
    paymentGateway: 'VNPay' | 'MoMo'
    billingAddress?: Order['billingAddress']
}

export interface OrderFilters {
    page?: number
    limit?: number
    paymentStatus?: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED' | 'PARTIALLY_REFUNDED'
    paymentGateway?: 'VNPay' | 'MoMo'
    startDate?: string
    endDate?: string
    sort?: 'newest' | 'oldest' | 'amount'
}

// =====================================================
// PAYMENT TRANSACTION TYPES
// =====================================================
export interface PaymentTransaction {
    id: number
    orderId: number
    order?: Order
    transactionId?: string
    paymentGateway: 'VNPay' | 'MoMo'
    amount: number
    currency: string
    status?: 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED'
    gatewayResponse?: Record<string, any>
    errorMessage?: string
    ipAddress?: string
    createdAt: string
    updatedAt: string
}

export interface CreatePaymentRequest {
    orderId: number
}

export interface PaymentResponse {
    paymentUrl: string
    orderId: number
    transactionId?: string
}

export interface PaymentCallbackResponse {
    order: Order
    enrollment?: Enrollment
    paymentTransaction: PaymentTransaction
    alreadyPaid: boolean
}

// =====================================================
// PROGRESS TYPES
// =====================================================
export interface Progress {
    id: number
    userId: number
    user?: User
    lessonId: number
    lesson?: Lesson
    courseId: number
    isCompleted: boolean
    completedAt?: string
    watchDuration: number
    lastPosition: number
    attemptsCount: number
    createdAt: string
    updatedAt: string
}

export interface UpdateProgressRequest {
    position?: number
    watchDuration?: number
}

export interface CourseProgress {
    courseId: number
    course: Course
    enrollment: Enrollment
    totalLessons: number
    completedLessons: number
    progressPercentage: number
    lastAccessedAt?: string
    lessons: Array<{
        lesson: Lesson
        progress?: Progress
    }>
}

export interface LessonProgress {
    lesson: Lesson
    progress?: Progress
    enrollment: Enrollment
    course: Course
}

// =====================================================
// QUIZ TYPES
// =====================================================
export interface QuizQuestion {
    id: string
    question: string
    type: 'multiple_choice' | 'true_false'
    options: string[]
    correctAnswer: number
    points: number
    explanation?: string
}

export interface Quiz {
    id: number
    lessonId?: number
    lesson?: Lesson
    courseId?: number
    course?: Course
    title: string
    description?: string
    questions: QuizQuestion[] | Record<string, any> // JSON field
    passingScore: number
    attemptsAllowed: number
    timeLimitMinutes?: number
    isPublished: boolean
    createdAt: string
    updatedAt: string
    submissions?: QuizSubmission[]
}

export interface CreateQuizRequest {
    lessonId?: number
    courseId?: number
    title: string
    description?: string
    questions: QuizQuestion[]
    passingScore?: number
    attemptsAllowed?: number
    timeLimitMinutes?: number
    isPublished?: boolean
}

export interface UpdateQuizRequest extends Partial<CreateQuizRequest> {}

export interface QuizSubmission {
    id: number
    userId: number
    user?: User
    quizId: number
    quiz?: Quiz
    answers: Record<string, number> | Record<string, any> // JSON field
    score?: number
    isPassed?: boolean
    startedAt?: string
    submittedAt: string
}

export interface SubmitQuizRequest {
    quizId: number
    answers: Record<string, number>
    startedAt?: string
}

export interface QuizSubmissionResponse {
    submission: QuizSubmission
    quiz: Quiz
    passed: boolean
    score: number
    correctAnswers: number
    totalQuestions: number
}

// =====================================================
// NOTIFICATION TYPES
// =====================================================
export interface Notification {
    id: number
    userId: number
    user?: User
    type: 'COURSE_ENROLLED' | 'LESSON_COMPLETED' | 'COURSE_COMPLETED' | 'QUIZ_PASSED' | 'QUIZ_FAILED' | 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'ORDER_CANCELLED' | 'NEW_COURSE_PUBLISHED' | 'COURSE_UPDATE'
    title: string
    message: string
    relatedId?: number
    relatedType?: string
    isRead: boolean
    readAt?: string
    createdAt: string
}

export interface NotificationFilters {
    page?: number
    limit?: number
    isRead?: boolean
    type?: Notification['type']
}

export interface UnreadCountResponse {
    count: number
}

// =====================================================
// AI RECOMMENDATION TYPES
// =====================================================
export interface AiRecommendation {
    id: number
    userId: number
    user?: User
    courseId: number
    course?: Course
    recommendationType?: 'QUICK_QA' | 'LESSON_HELP' | 'COURSE_RECOMMENDATION' | 'COURSE_OVERVIEW' | 'CONCEPT_EXPLANATION' | 'CODE_REVIEW' | 'GENERAL_CHAT'
    score?: number
    reason?: string
    isViewed: boolean
    isEnrolled: boolean
    createdAt: string
}

// =====================================================
// CONVERSATION TYPES
// =====================================================
export interface Conversation {
    id: number
    userId: number
    user?: User
    courseId?: number
    course?: {
        id: number
        title: string
        slug: string
        thumbnailUrl?: string
    }
    lessonId?: number
    lesson?: {
        id: number
        title: string
        slug: string
    }
    title?: string
    aiModel: string
    contextType?: 'QUICK_QA' | 'LESSON_HELP' | 'COURSE_RECOMMENDATION' | 'COURSE_OVERVIEW' | 'CONCEPT_EXPLANATION' | 'CODE_REVIEW' | 'GENERAL_CHAT'
    isActive: boolean
    isArchived: boolean
    createdAt: string
    updatedAt: string
    lastMessageAt?: string
    messages?: ChatMessage[]
    _count?: {
        messages: number
    }
}

export interface CreateConversationRequest {
    courseId?: number
    lessonId?: number
    title?: string
    aiModel?: string
    contextType?: Conversation['contextType']
}

export interface ConversationFilters {
    page?: number
    limit?: number
    isArchived?: boolean
}

// =====================================================
// CHAT MESSAGE TYPES
// =====================================================
export interface ChatMessage {
    id: number
    conversationId: number
    conversation?: Conversation
    senderType: 'user' | 'assistant'
    message: string
    messageType: 'text' | 'code' | 'markdown'
    attachments?: Record<string, any> // JSON field
    metadata?: Record<string, any> // JSON field
    isHelpful?: boolean
    feedbackText?: string
    createdAt: string
}

export interface SendMessageRequest {
    conversationId: number
    message: string
    messageType?: 'text' | 'code' | 'markdown'
    attachments?: Record<string, any>
}

export interface ChatMessageResponse {
    message: ChatMessage
    conversation: Conversation
}

// =====================================================
// DASHBOARD TYPES
// =====================================================
export interface DashboardStats {
    totalCourses: number
    enrolledCourses: number
    completedCourses: number
    inProgressCourses: number
    totalHours: number
    certificates: number
}

export interface InstructorDashboardStats {
    totalCourses: number
    publishedCourses: number
    draftCourses: number
    totalStudents: number
    totalRevenue: number
    monthlyRevenue: number
    averageRating: number
    totalEnrollments: number
    recentEnrollments: Enrollment[]
    topCourses: Course[]
}

export interface AdminDashboardStats {
    totalUsers: number
    totalInstructors: number
    totalStudents: number
    totalCourses: number
    totalOrders: number
    totalRevenue: number
    monthlyRevenue: number
    pendingOrders: number
    recentOrders: Order[]
    recentUsers: User[]
}

export interface StudentDashboardStats {
    enrolledCourses: number
    completedCourses: number
    inProgressCourses: number
    totalHours: number
    certificates: number
    recentEnrollments: Enrollment[]
    recommendedCourses: Course[]
}

export interface LearningProgress {
    courseId: number
    courseTitle: string
    progress: number
    lastAccessedAt: string
}

// =====================================================
// UPLOAD TYPES
// =====================================================
export interface UploadResponse {
    url: string
    filename: string
    size: number
    mimetype: string
}

export interface UploadRequest {
    file: File
    type: 'avatar' | 'thumbnail' | 'general' | 'lesson' | 'preview' | 'transcript' | 'material'
}

// =====================================================
// SEARCH TYPES
// =====================================================
export interface SearchFilters {
    query: string
    type?: 'course' | 'instructor' | 'all'
    page?: number
    limit?: number
}

export interface SearchResult {
    courses: Course[]
    instructors: User[]
    total: number
}

// =====================================================
// LEGACY TYPES (for backward compatibility)
// =====================================================
export interface CoursesListResponse {
    courses: Course[]
    total: number
    page: number
    limit: number
    totalPages: number
}

export interface PaymentRequest {
    courseId: string | number
    paymentMethod?: 'credit_card' | 'bank_transfer' | 'wallet'
}

export interface Certificate {
    id: string
    courseId: string
    userId: string
    issuedAt: string
    certificateNumber: string
}

// Remove duplicate Instructor interface - use Course.instructor instead