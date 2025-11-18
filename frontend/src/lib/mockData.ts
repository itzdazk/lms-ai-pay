// Mock data for LMS system

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'admin' | 'instructor' | 'student';
  avatar?: string;
  bio?: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
}

export interface Tag {
  id: string;
  name: string;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  thumbnail: string;
  preview_video_url?: string;
  instructor_id: string;
  instructor_name: string;
  instructor_avatar?: string;
  category_id: string;
  category_name: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  original_price: number;
  discount_price?: number;
  is_free: boolean;
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  views_count: number;
  enrolled_count: number;
  rating_avg: number;
  rating_count: number;
  completion_rate: number;
  tags: Tag[];
  lessons_count: number;
  duration_minutes: number;
  created_at: string;
}

export interface Lesson {
  id: string;
  course_id: string;
  title: string;
  description?: string;
  video_url: string;
  duration_minutes: number;
  lesson_order: number;
  is_preview: boolean;
  status: 'draft' | 'published';
  transcript?: string;
}

export interface Enrollment {
  id: string;
  user_id: string;
  course_id: string;
  progress_percentage: number;
  status: 'active' | 'completed' | 'dropped';
  enrolled_at: string;
  completed_at?: string;
}

export interface LessonProgress {
  id: string;
  enrollment_id: string;
  lesson_id: string;
  is_completed: boolean;
  watch_duration_seconds: number;
  last_position_seconds: number;
  attempts_count: number;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct_answer: number;
  explanation?: string;
}

export interface Quiz {
  id: string;
  course_id: string;
  lesson_id?: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  passing_score: number;
  max_attempts: number;
  time_limit_minutes?: number;
}

export interface QuizAttempt {
  id: string;
  user_id: string;
  quiz_id: string;
  score: number;
  passed: boolean;
  answers: number[];
  completed_at: string;
}

export interface Certificate {
  id: string;
  user_id: string;
  course_id: string;
  issued_at: string;
  certificate_url: string;
}

// Mock Users
export const mockUsers: User[] = [
  {
    id: '1',
    email: 'admin@lms.com',
    full_name: 'Admin User',
    role: 'admin',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin',
  },
  {
    id: '2',
    email: 'instructor@lms.com',
    full_name: 'Nguyễn Văn A',
    role: 'instructor',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    bio: 'Senior Software Engineer with 10+ years experience',
  },
  {
    id: '3',
    email: 'student@lms.com',
    full_name: 'Trần Thị B',
    role: 'student',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=student1',
  },
];

// Mock Categories - Chỉ lập trình
export const mockCategories: Category[] = [
  { id: '1', name: 'Web Development', slug: 'web-development', description: 'Khóa học về phát triển web với các công nghệ hiện đại' },
  { id: '2', name: 'Mobile Development', slug: 'mobile-development', description: 'Khóa học về phát triển ứng dụng mobile' },
  { id: '3', name: 'Backend Development', slug: 'backend-development', description: 'Khóa học về phát triển backend và server' },
  { id: '4', name: 'Frontend Development', slug: 'frontend-development', description: 'Khóa học về phát triển giao diện người dùng' },
  { id: '5', name: 'Data Science & AI', slug: 'data-science-ai', description: 'Khóa học về khoa học dữ liệu và trí tuệ nhân tạo' },
  { id: '6', name: 'DevOps & Cloud', slug: 'devops-cloud', description: 'Khóa học về DevOps và điện toán đám mây' },
];

// Mock Tags - Chỉ lập trình
export const mockTags: Tag[] = [
  { id: '1', name: 'JavaScript' },
  { id: '2', name: 'React' },
  { id: '3', name: 'Node.js' },
  { id: '4', name: 'Python' },
  { id: '5', name: 'TypeScript' },
  { id: '6', name: 'Vue.js' },
  { id: '7', name: 'Angular' },
  { id: '8', name: 'Next.js' },
  { id: '9', name: 'Express.js' },
  { id: '10', name: 'MongoDB' },
  { id: '11', name: 'PostgreSQL' },
  { id: '12', name: 'Docker' },
  { id: '13', name: 'Kubernetes' },
  { id: '14', name: 'AWS' },
  { id: '15', name: 'Machine Learning' },
];

// Mock Courses - Chỉ lập trình
export const mockCourses: Course[] = [
  {
    id: '1',
    title: 'Lập trình Web Full-Stack với React & Node.js',
    slug: 'lap-trinh-web-full-stack-react-nodejs',
    description: 'Học cách xây dựng ứng dụng web hiện đại từ frontend đến backend với React, Node.js, Express và MongoDB. Khóa học bao gồm authentication, REST API, database design và deployment.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '1',
    category_name: 'Web Development',
    level: 'intermediate',
    original_price: 2999000,
    discount_price: 1999000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 15420,
    enrolled_count: 3240,
    rating_avg: 4.8,
    rating_count: 856,
    completion_rate: 68,
    tags: [{ id: '1', name: 'JavaScript' }, { id: '2', name: 'React' }, { id: '3', name: 'Node.js' }],
    lessons_count: 120,
    duration_minutes: 2400,
    created_at: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    title: 'Python cho Data Science & Machine Learning',
    slug: 'python-data-science-machine-learning',
    description: 'Học Python từ cơ bản đến nâng cao, xử lý dữ liệu với Pandas, NumPy, visualization với Matplotlib, Seaborn và machine learning với Scikit-learn.',
    thumbnail: 'https://images.unsplash.com/photo-1608986596619-eb50cc56831f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjIxMDE0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '5',
    category_name: 'Data Science & AI',
    level: 'intermediate',
    original_price: 3999000,
    discount_price: 2499000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 18920,
    enrolled_count: 4120,
    rating_avg: 4.7,
    rating_count: 1024,
    completion_rate: 62,
    tags: [{ id: '4', name: 'Python' }, { id: '15', name: 'Machine Learning' }],
    lessons_count: 150,
    duration_minutes: 3000,
    created_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '3',
    title: 'Lập Trình Mobile với React Native',
    slug: 'lap-trinh-mobile-react-native',
    description: 'Xây dựng ứng dụng mobile đa nền tảng iOS và Android với React Native. Học navigation, state management, API integration và publish app.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '2',
    category_name: 'Mobile Development',
    level: 'intermediate',
    original_price: 0,
    is_free: true,
    status: 'published',
    featured: true,
    views_count: 22340,
    enrolled_count: 8920,
    rating_avg: 4.5,
    rating_count: 1842,
    completion_rate: 58,
    tags: [{ id: '1', name: 'JavaScript' }, { id: '2', name: 'React' }],
    lessons_count: 95,
    duration_minutes: 2000,
    created_at: '2024-01-10T00:00:00Z',
  },
  {
    id: '4',
    title: 'TypeScript từ Cơ Bản đến Nâng Cao',
    slug: 'typescript-co-ban-nang-cao',
    description: 'Học TypeScript từ đầu, type system, generics, decorators, và cách tích hợp với React, Node.js. Xây dựng ứng dụng type-safe và maintainable.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '4',
    category_name: 'Frontend Development',
    level: 'intermediate',
    original_price: 2499000,
    discount_price: 1499000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 12500,
    enrolled_count: 2800,
    rating_avg: 4.9,
    rating_count: 720,
    completion_rate: 70,
    tags: [{ id: '5', name: 'TypeScript' }, { id: '2', name: 'React' }],
    lessons_count: 100,
    duration_minutes: 2200,
    created_at: '2024-02-01T00:00:00Z',
  },
  {
    id: '5',
    title: 'Node.js & Express.js - Backend Development',
    slug: 'nodejs-expressjs-backend',
    description: 'Xây dựng RESTful API và GraphQL API với Node.js và Express.js. Học authentication, authorization, database integration, testing và deployment.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '3',
    category_name: 'Backend Development',
    level: 'intermediate',
    original_price: 2799000,
    discount_price: 1799000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 11200,
    enrolled_count: 2450,
    rating_avg: 4.6,
    rating_count: 580,
    completion_rate: 65,
    tags: [{ id: '1', name: 'JavaScript' }, { id: '3', name: 'Node.js' }, { id: '9', name: 'Express.js' }],
    lessons_count: 110,
    duration_minutes: 2300,
    created_at: '2024-02-15T00:00:00Z',
  },
  {
    id: '6',
    title: 'Vue.js 3 - Modern Frontend Framework',
    slug: 'vuejs-3-modern-frontend',
    description: 'Học Vue.js 3 với Composition API, Pinia state management, Vue Router, và cách xây dựng SPA hiện đại. So sánh với React và Angular.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '4',
    category_name: 'Frontend Development',
    level: 'beginner',
    original_price: 1999000,
    discount_price: 999000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 9800,
    enrolled_count: 2100,
    rating_avg: 4.7,
    rating_count: 450,
    completion_rate: 72,
    tags: [{ id: '1', name: 'JavaScript' }, { id: '6', name: 'Vue.js' }],
    lessons_count: 90,
    duration_minutes: 1900,
    created_at: '2024-03-01T00:00:00Z',
  },
  {
    id: '7',
    title: 'Next.js 14 - Full-Stack React Framework',
    slug: 'nextjs-14-fullstack-react',
    description: 'Xây dựng ứng dụng full-stack với Next.js 14, Server Components, App Router, API Routes, và deployment với Vercel. SSR, SSG, và ISR.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '1',
    category_name: 'Web Development',
    level: 'advanced',
    original_price: 3499000,
    discount_price: 2299000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 14500,
    enrolled_count: 3200,
    rating_avg: 4.8,
    rating_count: 890,
    completion_rate: 60,
    tags: [{ id: '2', name: 'React' }, { id: '8', name: 'Next.js' }, { id: '5', name: 'TypeScript' }],
    lessons_count: 130,
    duration_minutes: 2600,
    created_at: '2024-01-25T00:00:00Z',
  },
  {
    id: '8',
    title: 'MongoDB & Database Design',
    slug: 'mongodb-database-design',
    description: 'Học MongoDB từ cơ bản, schema design, indexing, aggregation pipeline, và tích hợp với Node.js. So sánh với SQL databases.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '3',
    category_name: 'Backend Development',
    level: 'beginner',
    original_price: 1799000,
    discount_price: 899000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 8500,
    enrolled_count: 1800,
    rating_avg: 4.5,
    rating_count: 380,
    completion_rate: 75,
    tags: [{ id: '10', name: 'MongoDB' }, { id: '3', name: 'Node.js' }],
    lessons_count: 75,
    duration_minutes: 1600,
    created_at: '2024-03-10T00:00:00Z',
  },
  {
    id: '9',
    title: 'Docker & Kubernetes - Containerization',
    slug: 'docker-kubernetes-containerization',
    description: 'Học Docker containerization, Docker Compose, Kubernetes orchestration, và cách deploy ứng dụng với containers. CI/CD với containers.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '6',
    category_name: 'DevOps & Cloud',
    level: 'advanced',
    original_price: 3299000,
    discount_price: 2099000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 10200,
    enrolled_count: 2200,
    rating_avg: 4.7,
    rating_count: 520,
    completion_rate: 55,
    tags: [{ id: '12', name: 'Docker' }, { id: '13', name: 'Kubernetes' }],
    lessons_count: 105,
    duration_minutes: 2100,
    created_at: '2024-02-20T00:00:00Z',
  },
  {
    id: '10',
    title: 'AWS Cloud Computing - Từ Zero đến Hero',
    slug: 'aws-cloud-computing',
    description: 'Học AWS services: EC2, S3, Lambda, RDS, CloudFront, và nhiều hơn nữa. Xây dựng và deploy ứng dụng scalable trên AWS cloud.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '6',
    category_name: 'DevOps & Cloud',
    level: 'intermediate',
    original_price: 3799000,
    discount_price: 2499000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 13200,
    enrolled_count: 2900,
    rating_avg: 4.9,
    rating_count: 780,
    completion_rate: 58,
    tags: [{ id: '14', name: 'AWS' }, { id: '12', name: 'Docker' }],
    lessons_count: 140,
    duration_minutes: 2800,
    created_at: '2024-01-30T00:00:00Z',
  },
];

// Mock Lessons for Course 1
export const mockLessons: Lesson[] = [
  {
    id: '1',
    course_id: '1',
    title: 'Giới thiệu về Full-Stack Development',
    description: 'Tổng quan về full-stack development, công nghệ sử dụng và lộ trình học tập.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 15,
    lesson_order: 1,
    is_preview: true,
    status: 'published',
  },
  {
    id: '2',
    course_id: '1',
    title: 'Cài đặt môi trường phát triển',
    description: 'Hướng dẫn cài đặt Node.js, npm, VS Code và các công cụ cần thiết.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 20,
    lesson_order: 2,
    is_preview: true,
    status: 'published',
  },
  {
    id: '3',
    course_id: '1',
    title: 'JavaScript ES6+ - Arrow Functions',
    description: 'Tìm hiểu về arrow functions, destructuring, spread operator và các tính năng ES6+.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 25,
    lesson_order: 3,
    is_preview: false,
    status: 'published',
  },
  {
    id: '4',
    course_id: '1',
    title: 'React Basics - Components & Props',
    description: 'Học cách tạo components, props và state trong React.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 30,
    lesson_order: 4,
    is_preview: false,
    status: 'published',
  },
  {
    id: '5',
    course_id: '1',
    title: 'React Hooks - useState & useEffect',
    description: 'Tìm hiểu về React Hooks và cách sử dụng useState, useEffect.',
    video_url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    duration_minutes: 35,
    lesson_order: 5,
    is_preview: false,
    status: 'published',
  },
];

// Current logged in user (for demo)
export const currentUser: User = mockUsers[2]; // Student

// Mock Enrollments for current user
export const mockEnrollments: Enrollment[] = [
  {
    id: '1',
    user_id: currentUser.id,
    course_id: '1',
    progress_percentage: 45,
    status: 'active',
    enrolled_at: '2024-10-15T00:00:00Z',
  },
  {
    id: '2',
    user_id: currentUser.id,
    course_id: '2',
    progress_percentage: 100,
    status: 'completed',
    enrolled_at: '2024-09-01T00:00:00Z',
    completed_at: '2024-10-20T00:00:00Z',
  },
  {
    id: '4',
    user_id: currentUser.id,
    course_id: '4',
    progress_percentage: 30,
    status: 'active',
    enrolled_at: '2024-10-20T00:00:00Z',
  },
  {
    id: '3',
    user_id: currentUser.id,
    course_id: '3',
    progress_percentage: 20,
    status: 'active',
    enrolled_at: '2024-10-25T00:00:00Z',
  },
];

// Helper functions
export function getCourseById(id: string): Course | undefined {
  return mockCourses.find(course => course.id === id);
}

export function getCoursesByCategory(categoryId: string): Course[] {
  return mockCourses.filter(course => course.category_id === categoryId);
}

export function getFeaturedCourses(): Course[] {
  return mockCourses.filter(course => course.featured);
}

export function getEnrolledCourses(userId: string): Course[] {
  const enrollments = mockEnrollments.filter(e => e.user_id === userId);
  return enrollments
    .map(e => getCourseById(e.course_id))
    .filter((course): course is Course => course !== undefined);
}

export function isEnrolled(userId: string, courseId: string): boolean {
  return mockEnrollments.some(e => e.user_id === userId && e.course_id === courseId);
}

export function getEnrollment(userId: string, courseId: string): Enrollment | undefined {
  return mockEnrollments.find(e => e.user_id === userId && e.course_id === courseId);
}

export function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
}

export function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
}

// Mock Quizzes
export const mockQuizzes: Quiz[] = [
  {
    id: '1',
    course_id: '1',
    lesson_id: '5',
    title: 'Quiz: React Hooks',
    description: 'Kiểm tra kiến thức của bạn về React Hooks',
    passing_score: 70,
    max_attempts: 3,
    time_limit_minutes: 15,
    questions: [
      {
        question: 'useState hook được sử dụng để làm gì?',
        options: [
          'Quản lý side effects',
          'Quản lý state trong functional component',
          'Tạo refs',
          'Tối ưu hiệu suất'
        ],
        correct_answer: 1,
        explanation: 'useState được dùng để quản lý state trong functional components, trả về một cặp giá trị: state hiện tại và function để cập nhật state đó.'
      },
      {
        question: 'useEffect hook chạy khi nào?',
        options: [
          'Chỉ khi component mount',
          'Sau mỗi lần render',
          'Trước khi component render',
          'Chỉ khi component unmount'
        ],
        correct_answer: 1,
        explanation: 'useEffect chạy sau mỗi lần render. Bạn có thể kiểm soát khi nào nó chạy bằng dependency array.'
      },
      {
        question: 'Cú pháp nào đúng để khai báo useState?',
        options: [
          'const [count] = useState(0)',
          'const count = useState(0)',
          'const [count, setCount] = useState(0)',
          'useState(count, 0)'
        ],
        correct_answer: 2,
        explanation: 'useState trả về một array với 2 phần tử: giá trị state và function để update state.'
      },
      {
        question: 'Làm thế nào để cleanup trong useEffect?',
        options: [
          'Sử dụng try-catch',
          'Return một function',
          'Gọi cleanup() method',
          'Không thể cleanup'
        ],
        correct_answer: 1,
        explanation: 'Cleanup function được thực thi bằng cách return một function trong useEffect.'
      },
      {
        question: 'useContext được dùng để làm gì?',
        options: [
          'Tạo context mới',
          'Truy cập giá trị từ Context',
          'Update context',
          'Xóa context'
        ],
        correct_answer: 1,
        explanation: 'useContext cho phép bạn subscribe và đọc giá trị từ Context mà không cần Consumer.'
      }
    ]
  }
];

// Mock Quiz Attempts
export const mockQuizAttempts: QuizAttempt[] = [
  {
    id: '1',
    user_id: currentUser.id,
    quiz_id: '1',
    score: 60,
    passed: false,
    answers: [1, 1, 2, 0, 1],
    completed_at: '2024-10-20T10:30:00Z'
  }
];

// Mock Certificates
export const mockCertificates: Certificate[] = [
  {
    id: '1',
    user_id: currentUser.id,
    course_id: '2',
    issued_at: '2024-10-21T00:00:00Z',
    certificate_url: '#'
  }
];

// Quiz helper functions
export function getQuizById(id: string): Quiz | undefined {
  return mockQuizzes.find(quiz => quiz.id === id);
}

export function getQuizzesByCourse(courseId: string): Quiz[] {
  return mockQuizzes.filter(quiz => quiz.course_id === courseId);
}

export function getQuizAttempts(userId: string, quizId: string): QuizAttempt[] {
  return mockQuizAttempts.filter(attempt => attempt.user_id === userId && attempt.quiz_id === quizId);
}

export function calculateQuizScore(quiz: Quiz, answers: number[]): number {
  let correct = 0;
  quiz.questions.forEach((question, index) => {
    if (answers[index] === question.correct_answer) {
      correct++;
    }
  });
  return Math.round((correct / quiz.questions.length) * 100);
}

// Instructor helper functions
export function getCoursesByInstructor(instructorId: string): Course[] {
  return mockCourses.filter(course => course.instructor_id === instructorId);
}

export function getInstructorStats(instructorId: string) {
  const courses = getCoursesByInstructor(instructorId);
  const totalCourses = courses.length;
  const publishedCourses = courses.filter(c => c.status === 'published').length;
  const draftCourses = courses.filter(c => c.status === 'draft').length;
  const totalStudents = courses.reduce((sum, c) => sum + c.enrolled_count, 0);
  const totalRevenue = courses.reduce((sum, c) => {
    const price = c.is_free ? 0 : (c.discount_price || c.original_price);
    return sum + (price * c.enrolled_count);
  }, 0);
  const avgRating = courses.reduce((sum, c) => sum + c.rating_avg, 0) / (courses.length || 1);

  return {
    totalCourses,
    publishedCourses,
    draftCourses,
    totalStudents,
    totalRevenue,
    avgRating: Math.round(avgRating * 10) / 10
  };
}

// Certificate helper functions
export function getCertificate(userId: string, courseId: string): Certificate | undefined {
  return mockCertificates.find(cert => cert.user_id === userId && cert.course_id === courseId);
}

export function getUserCertificates(userId: string): Certificate[] {
  return mockCertificates.filter(cert => cert.user_id === userId);
}
