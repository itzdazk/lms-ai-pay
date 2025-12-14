import { CheckCircle, Lock, PlayCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import type { Lesson } from '../../lib/api/types';

interface LessonListProps {
  lessons: Lesson[];
  selectedLessonId?: number;
  onLessonSelect: (lesson: Lesson) => void;
  enrollmentProgress?: number;
  completedLessonIds?: number[];
  isEnrolled?: boolean;
  courseTitle?: string;
}

export function LessonList({
  lessons,
  selectedLessonId,
  onLessonSelect,
  enrollmentProgress = 0,
  completedLessonIds = [],
  isEnrolled = false,
  courseTitle,
}: LessonListProps) {
  // Ensure enrollmentProgress is a number
  const progress = typeof enrollmentProgress === 'number' 
    ? enrollmentProgress 
    : parseFloat(String(enrollmentProgress)) || 0;
  // Format duration from seconds to readable format
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '0 phút';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return minutes > 0 ? `${hours}h ${minutes}p` : `${hours}h`;
    }
    return `${minutes} phút`;
  };

  // Check if lesson is locked
  const isLessonLocked = (lesson: Lesson, index: number): boolean => {
    // Preview lessons are always unlocked
    if (lesson.isPreview) return false;
    
    // If not enrolled, all non-preview lessons are locked
    if (!isEnrolled) return true;
    
    // First lesson is always unlocked if enrolled
    if (index === 0) return false;
    
    // Check if previous lesson is completed
    const previousLesson = lessons[index - 1];
    if (!previousLesson) return false;
    
    // If previous lesson is preview, current lesson is unlocked
    if (previousLesson.isPreview) return false;
    
    // If previous lesson is completed, current lesson is unlocked
    return !completedLessonIds.includes(previousLesson.id);
  };

  // Group lessons by sections (if needed in future)
  const sortedLessons = [...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder);

  return (
    <Card className="sticky top-24 bg-[#1A1A1A] border-[#2D2D2D]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Nội dung khóa học</span>
          <Badge variant="outline" className="border-[#2D2D2D] text-gray-300">
            {lessons.length} bài
          </Badge>
        </CardTitle>
        {courseTitle && (
          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{courseTitle}</p>
        )}
        {isEnrolled && (
          <>
            <Progress value={progress} className="mt-2" />
            <p className="text-sm text-gray-400 mt-2">
              {progress.toFixed(0)}% hoàn thành
            </p>
          </>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-1 max-h-[600px] overflow-y-auto custom-scrollbar">
          {sortedLessons.map((lesson, index) => {
            const isSelected = selectedLessonId === lesson.id;
            const isCompleted = completedLessonIds.includes(lesson.id);
            const isLocked = isLessonLocked(lesson, index);

            return (
              <div
                key={lesson.id}
                onClick={() => {
                  if (!isLocked) {
                    onLessonSelect(lesson);
                  }
                }}
                className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                  isSelected
                    ? 'bg-blue-600/20 border border-blue-600'
                    : isLocked
                    ? 'opacity-50 cursor-not-allowed'
                    : 'hover:bg-[#1F1F1F] cursor-pointer'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  {/* Status icon */}
                  <div className="flex-shrink-0">
                    {isLocked ? (
                      <div className="w-6 h-6 rounded-full border-2 border-[#2D2D2D] flex items-center justify-center">
                        <Lock className="h-3 w-3 text-gray-500" />
                      </div>
                    ) : isCompleted ? (
                      <div className="w-6 h-6 rounded-full bg-green-600/20 flex items-center justify-center">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      </div>
                    ) : lesson.isPreview ? (
                      <div className="w-6 h-6 rounded-full bg-blue-600/20 flex items-center justify-center">
                        <PlayCircle className="h-4 w-4 text-blue-500" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-[#2D2D2D]" />
                    )}
                  </div>

                  {/* Lesson info */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-sm font-medium truncate ${
                        isSelected ? 'text-blue-400' : 'text-white'
                      }`}
                    >
                      {lesson.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{formatDuration(lesson.videoDuration)}</span>
                      </div>
                      {lesson.isPreview && (
                        <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400">
                          Xem trước
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lock icon for locked lessons */}
                {isLocked && (
                  <Lock className="h-4 w-4 text-gray-500 flex-shrink-0 ml-2" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}


