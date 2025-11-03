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

// Mock Categories
export const mockCategories: Category[] = [
  { id: '1', name: 'Lập trình', slug: 'lap-trinh', description: 'Khóa học về lập trình và phát triển phần mềm' },
  { id: '2', name: 'Thiết kế', slug: 'thiet-ke', description: 'Khóa học về thiết kế UI/UX và đồ họa' },
  { id: '3', name: 'Kinh doanh', slug: 'kinh-doanh', description: 'Khóa học về quản trị kinh doanh và marketing' },
  { id: '4', name: 'Marketing', slug: 'marketing', description: 'Khóa học về marketing và truyền thông' },
  { id: '5', name: 'Phát triển cá nhân', slug: 'phat-trien-ca-nhan', description: 'Khóa học về kỹ năng mềm' },
];

// Mock Tags
export const mockTags: Tag[] = [
  { id: '1', name: 'JavaScript' },
  { id: '2', name: 'React' },
  { id: '3', name: 'Node.js' },
  { id: '4', name: 'Python' },
  { id: '5', name: 'AI' },
  { id: '6', name: 'UI/UX' },
  { id: '7', name: 'Figma' },
  { id: '8', name: 'Marketing Digital' },
];

// Mock Courses
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
    category_name: 'Lập trình',
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
    title: 'Thiết kế UI/UX với Figma từ A-Z',
    slug: 'thiet-ke-ui-ux-voi-figma',
    description: 'Khóa học toàn diện về thiết kế giao diện người dùng và trải nghiệm người dùng. Học cách sử dụng Figma, design system, prototyping và user research.',
    thumbnail: 'https://images.unsplash.com/photo-1742440711276-679934f5b988?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBjcmVhdGl2ZSUyMHdvcmtzcGFjZXxlbnwxfHx8fDE3NjIwNjY5NTR8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '2',
    category_name: 'Thiết kế',
    level: 'beginner',
    original_price: 1999000,
    discount_price: 999000,
    is_free: false,
    status: 'published',
    featured: true,
    views_count: 12350,
    enrolled_count: 2890,
    rating_avg: 4.9,
    rating_count: 654,
    completion_rate: 75,
    tags: [{ id: '6', name: 'UI/UX' }, { id: '7', name: 'Figma' }],
    lessons_count: 85,
    duration_minutes: 1800,
    created_at: '2024-02-10T00:00:00Z',
  },
  {
    id: '3',
    title: 'Python cho Data Science & Machine Learning',
    slug: 'python-data-science-machine-learning',
    description: 'Học Python từ cơ bản đến nâng cao, xử lý dữ liệu với Pandas, NumPy, visualization với Matplotlib, Seaborn và machine learning với Scikit-learn.',
    thumbnail: 'https://images.unsplash.com/photo-1608986596619-eb50cc56831f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxvbmxpbmUlMjBsZWFybmluZyUyMGVkdWNhdGlvbnxlbnwxfHx8fDE3NjIxMDE0ODh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '1',
    category_name: 'Lập trình',
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
    tags: [{ id: '4', name: 'Python' }, { id: '5', name: 'AI' }],
    lessons_count: 150,
    duration_minutes: 3000,
    created_at: '2024-01-20T00:00:00Z',
  },
  {
    id: '4',
    title: 'Marketing Digital - Từ Cơ Bản Đến Chuyên Nghiệp',
    slug: 'marketing-digital-co-ban-chuyen-nghiep',
    description: 'Khóa học về marketing số, bao gồm SEO, SEM, Social Media Marketing, Content Marketing, Email Marketing và Analytics. Thực hành với các case study thực tế.',
    thumbnail: 'https://images.unsplash.com/photo-1711097383282-28097ae16b1d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtYXJrZXRpbmclMjBzdHJhdGVneSUyMGRhdGF8ZW58MXx8fHwxNzYyMTQ4MzIzfDA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '4',
    category_name: 'Marketing',
    level: 'beginner',
    original_price: 1499000,
    discount_price: 799000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 8540,
    enrolled_count: 1920,
    rating_avg: 4.6,
    rating_count: 432,
    completion_rate: 71,
    tags: [{ id: '8', name: 'Marketing Digital' }],
    lessons_count: 70,
    duration_minutes: 1500,
    created_at: '2024-03-05T00:00:00Z',
  },
  {
    id: '5',
    title: 'Quản Trị Kinh Doanh & Leadership',
    slug: 'quan-tri-kinh-doanh-leadership',
    description: 'Học các kỹ năng quản lý, lãnh đạo đội nhóm, ra quyết định chiến lược, quản lý dự án và phát triển tổ chức. Phù hợp cho manager và startup founder.',
    thumbnail: 'https://images.unsplash.com/photo-1594867158829-ceb9d4e8ac91?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBjb25mZXJlbmNlfGVufDF8fHx8MTc2MjA0NDUxMHww&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '3',
    category_name: 'Kinh doanh',
    level: 'advanced',
    original_price: 2499000,
    discount_price: 1499000,
    is_free: false,
    status: 'published',
    featured: false,
    views_count: 6780,
    enrolled_count: 1450,
    rating_avg: 4.8,
    rating_count: 312,
    completion_rate: 65,
    tags: [],
    lessons_count: 60,
    duration_minutes: 1200,
    created_at: '2024-02-25T00:00:00Z',
  },
  {
    id: '6',
    title: 'Lập Trình Mobile với React Native',
    slug: 'lap-trinh-mobile-react-native',
    description: 'Xây dựng ứng dụng mobile đa nền tảng iOS và Android với React Native. Học navigation, state management, API integration và publish app.',
    thumbnail: 'https://images.unsplash.com/photo-1652696290920-ee4c836c711e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9ncmFtbWluZyUyMGNvZGluZyUyMGxhcHRvcHxlbnwxfHx8fDE3NjIwNTQ3MDh8MA&ixlib=rb-4.1.0&q=80&w=1080',
    instructor_id: '2',
    instructor_name: 'Nguyễn Văn A',
    instructor_avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=instructor1',
    category_id: '1',
    category_name: 'Lập trình',
    level: 'intermediate',
    original_price: 0,
    is_free: true,
    status: 'published',
    featured: false,
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
    id: '3',
    user_id: currentUser.id,
    course_id: '6',
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
