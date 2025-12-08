// Common API response types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Auth types
export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  userName: string;
  email: string;
  password: string;
  fullName: string;
  role?: 'student' | 'instructor';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface User {
  id: string;
  userName: string;
  email: string;
  fullName: string;
  phone?: string;
  role: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
  avatar?: string; // Legacy field name (for backward compatibility)
  avatarUrl?: string; // Backend field name
  bio?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

// Course types
export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  shortDescription?: string;
  thumbnail?: string;
  previewVideoUrl?: string;
  instructorId: string;
  instructor?: {
    id: string;
    fullName: string;
    avatar?: string;
  };
  categoryId: string;
  category?: {
    id: string;
    name: string;
    slug: string;
  };
  level: 'beginner' | 'intermediate' | 'advanced';
  originalPrice: number;
  discountPrice?: number;
  isFree: boolean;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  viewsCount: number;
  enrolledCount: number;
  ratingAvg: number;
  ratingCount: number;
  tags?: Tag[];
  lessonsCount?: number;
  durationMinutes?: number;
  requirements?: string;
  whatYouLearn?: string;
  courseObjectives?: string;
  targetAudience?: string;
  language?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  isActive: boolean;
}

export interface Tag {
  id: string;
  name: string;
  slug: string;
}

export interface CourseFilters {
  categoryId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  minPrice?: number;
  maxPrice?: number;
  isFree?: boolean;
  featured?: boolean;
  search?: string;
  tags?: string[];
  sortBy?: 'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc';
  page?: number;
  limit?: number;
}

// Enrollment types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  progress: number;
  completed: boolean;
  enrolledAt: string;
  completedAt?: string;
}

// Lesson types
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  durationMinutes?: number;
  order: number;
  isPreview: boolean;
}

// Payment types
export interface PaymentRequest {
  courseId: string;
  paymentMethod: 'credit_card' | 'bank_transfer' | 'wallet';
}

export interface PaymentResponse {
  id: string;
  status: 'pending' | 'completed' | 'failed';
  paymentUrl?: string;
}

// Quiz types
export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  questions: QuizQuestion[];
  timeLimitMinutes?: number;
  maxAttempts?: number;
  passingScore?: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple_choice' | 'true_false';
  options: string[];
  correctAnswer: number;
  points: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  userId: string;
  answers: Record<string, number>;
  score: number;
  passed: boolean;
  completedAt: string;
}

// Certificate types
export interface Certificate {
  id: string;
  courseId: string;
  userId: string;
  issuedAt: string;
  certificateNumber: string;
}

// Dashboard types
export interface DashboardStats {
  totalCourses: number;
  enrolledCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalHours: number;
  certificates: number;
}

export interface LearningProgress {
  courseId: string;
  courseTitle: string;
  progress: number;
  lastAccessedAt: string;
}