export interface LessonProgress {
  lessonId: string;
  courseId: string;
  userId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  progress: number; // 0-100
  currentTime: number; // seconds
  duration: number; // seconds
  lastWatchedAt: Date;
  completedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CourseProgress {
  courseId: string;
  userId: string;
  totalLessons: number;
  completedLessons: number;
  inProgressLessons: number;
  progress: number; // 0-100
  estimatedTimeRemaining: number; // minutes
  lastActivityAt: Date;
  completedAt?: Date;
  lessons: LessonProgress[];
  createdAt: Date;
  updatedAt: Date;
}

export interface ProgressUpdateRequest {
  lessonId: string;
  currentTime: number;
  duration: number;
  progress?: number;
}

export interface ResumePosition {
  lessonId: string;
  currentTime: number;
  progress: number;
  lastWatchedAt: Date;
}

export interface CourseProgressStats {
  totalCourses: number;
  completedCourses: number;
  inProgressCourses: number;
  totalProgress: number;
  averageProgress: number;
}

export interface LessonCompletionRequest {
  lessonId: string;
  completed: boolean;
}

export interface ProgressBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  earnedAt: Date;
  type: 'completion' | 'milestone' | 'streak' | 'achievement';
}
