import { useState, useEffect } from 'react';
import { CheckCircle, Lock, PlayCircle, Clock, BookOpen, FileQuestion } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useTheme } from '../../contexts/ThemeContext';
import type { Lesson, Chapter, Quiz } from '../../lib/api/types';
import { quizzesApi } from '../../lib/api/quizzes';
import { progressApi, LessonQuizProgress } from '../../lib/api/progress';

interface LessonListProps {
  lessons: Lesson[];
  chapters?: Chapter[];
  selectedLessonId?: number;
  onLessonSelect: (lesson: Lesson) => void;
  enrollmentProgress?: number;
  completedLessonIds?: number[];
  isEnrolled?: boolean;
  courseTitle?: string;
  completedLessons?: number;
  totalLessons?: number;
  courseId?: number;
  courseSlug?: string;
  onQuizSelect?: (quiz: Quiz) => void;
  activeQuizId?: string;
}

export function LessonList({
  lessons,
  chapters = [],
  selectedLessonId,
  onLessonSelect,
  // enrollmentProgress intentionally unused (progress bar removed here)
  completedLessonIds = [],
  isEnrolled = false,
  // unused props retained for compatibility (can be removed if not needed elsewhere)
  courseTitle: _courseTitle,
  activeQuizId,
  completedLessons: _completedLessons = 0,
  totalLessons: _totalLessons = 0,
  courseId: _courseId,
  onQuizSelect,
}: LessonListProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [lessonQuizzes, setLessonQuizzes] = useState<Record<number, Quiz[]>>({});
  const [loadingQuizzes, setLoadingQuizzes] = useState<Record<number, boolean>>({});
  const [lessonQuizCompleted, setLessonQuizCompleted] = useState<Record<number, boolean>>({});
  const [lessonQuizProgress, setLessonQuizProgress] = useState<Record<number, LessonQuizProgress>>({});

  // ...existing code...
  // Fetch quizzes for all lessons
  useEffect(() => {
    const fetchQuizzesForLessons = async () => {
      const allLessonIds = lessons.map(l => l.id);
      
      for (const lessonId of allLessonIds) {
        try {
          setLoadingQuizzes(prev => ({ ...prev, [lessonId]: true }));
          const quizzes = await quizzesApi.getQuizzesByLesson(lessonId.toString());
          setLessonQuizzes(prev => ({ ...prev, [lessonId]: quizzes }));
        } catch (error) {
          console.error(`Error fetching quizzes for lesson ${lessonId}:`, error);
          setLessonQuizzes(prev => ({ ...prev, [lessonId]: [] }));
        } finally {
          setLoadingQuizzes(prev => ({ ...prev, [lessonId]: false }));
        }
      }
    };

    if (lessons.length > 0) {
      fetchQuizzesForLessons();
    }
  }, [lessons]);

  // Fetch lesson/quiz progress for LessonList UI
  useEffect(() => {
    async function fetchLessonQuizProgress() {
      if (!_courseId) return;
      try {
        const progressList = await progressApi.getCourseLessonProgressList(_courseId);
        const progressMap: Record<number, LessonQuizProgress> = {};
        progressList.forEach((p) => {
          progressMap[p.lessonId] = p;
        });
        setLessonQuizProgress(progressMap);
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error('Failed to fetch lesson/quiz progress:', err);
      }
    }
    fetchLessonQuizProgress();
  }, [_courseId]);

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

  // Only count/display published/visible chapters & lessons
  const visibleChapters = chapters.filter(
    (chapter) =>
      chapter.isPublished !== false &&
      (chapter.lessons?.some((lesson) => lesson.isPublished !== false) ?? false)
  );
  const visibleLessonsFlat = lessons.filter((lesson) => lesson.isPublished !== false);

  // Flatten only visible lessons from visible chapters (fallback to visibleLessonsFlat)
  const allLessons: Lesson[] = [];
  if (visibleChapters.length > 0) {
    visibleChapters.forEach((chapter) => {
      if (chapter.lessons) {
        allLessons.push(...chapter.lessons.filter((lesson) => lesson.isPublished !== false));
      }
    });
  } else {
    allLessons.push(...visibleLessonsFlat);
  }

  // Check if lesson is locked
  const isLessonLocked = (lesson: Lesson, lessonIndex: number, allLessonsArray: Lesson[]): boolean => {
    // Preview lessons are always unlocked
    if (lesson.isPreview) return false;

    // If not enrolled, all non-preview lessons are locked
    if (!isEnrolled) return true;

    // First lesson is always unlocked if enrolled
    if (lessonIndex === 0) return false;

    // Check if previous lesson is completed AND quizCompleted
    const previousLesson = allLessonsArray[lessonIndex - 1];
    if (!previousLesson) return false;

    // If previous lesson is preview, current lesson is unlocked
    if (previousLesson.isPreview) return false;

    // Use lessonQuizProgress to check both isCompleted and quizCompleted
    const prevProgress = lessonQuizProgress[previousLesson.id];
    if (prevProgress) {
      return !(prevProgress.isCompleted && prevProgress.quizCompleted);
    }
    // Fallback: if no progress, keep locked
    return true;
  };

  // Group lessons by sections (if needed in future)
  const sortedLessons = [...visibleLessonsFlat].sort((a, b) => a.lessonOrder - b.lessonOrder);

  // Calculate total lessons count
  const totalLessonsCount = visibleChapters.length > 0
    ? visibleChapters.reduce(
        (acc, chapter) =>
          acc + (chapter.lessons?.filter((lesson) => lesson.isPublished !== false).length || 0),
        0
      )
    : visibleLessonsFlat.length;

  // Find chapter containing selected lesson or active quiz and set default open chapters
  const getDefaultOpenChapters = () => {
    if (!selectedLessonId && !activeQuizId) return [];
    const open: string[] = [];
    visibleChapters.forEach((chapter) => {
      const chapterLessons = (chapter.lessons || []).filter((lesson) => lesson.isPublished !== false);
      // Expand if selected lesson in chapter
      if (selectedLessonId && chapterLessons.some((lesson) => lesson.id === selectedLessonId)) {
        open.push(`chapter-${chapter.id}`);
        return;
      }
      // Expand if active quiz in chapter
      if (activeQuizId) {
        for (const lesson of chapterLessons) {
          const quizzes = lessonQuizzes[lesson.id] || [];
          if (quizzes.some((quiz) => quiz.id === activeQuizId)) {
            open.push(`chapter-${chapter.id}`);
            return;
          }
        }
      }
    });
    return open;
  };

  const [openChapters, setOpenChapters] = useState<string[]>(getDefaultOpenChapters());

  // Update openChapters when selectedLessonId or activeQuizId changes
  useEffect(() => {
    setOpenChapters(getDefaultOpenChapters());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedLessonId, activeQuizId, JSON.stringify(lessonQuizzes)]);

  
   
  return (
    <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} h-full flex flex-col rounded-none pb-8`}>
      <CardHeader className="flex-shrink-0 rounded-none">
        <CardTitle className={`flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span>Nội dung khóa học</span>
          <Badge
            variant="outline"
            className={`${isDark ? 'border-[#2D2D2D] text-gray-300' : 'border-gray-300 text-gray-700'}`}
          >
            {visibleChapters.length > 0 ? `${visibleChapters.length} chương • ${totalLessonsCount} bài` : `${totalLessonsCount} bài`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0 overflow-y-auto custom-scrollbar min-h-0">
        <div>
          {visibleChapters.length > 0 ? (
            <Accordion 
              type="multiple" 
              className=""
              value={openChapters}
              onValueChange={setOpenChapters}
            >
              {visibleChapters.map((chapter) => {
                const chapterLessons = (chapter.lessons || []).filter((lesson) => lesson.isPublished !== false);
                const isCurrentChapter = selectedLessonId
                  ? chapterLessons.some((lesson) => lesson.id === selectedLessonId)
                  : false;

                // Find the index of each lesson in the flattened array
                const getLessonGlobalIndex = (lesson: Lesson): number => {
                  return allLessons.findIndex((l) => l.id === lesson.id);
                };

                return (
                <AccordionItem
                  key={chapter.id}
                  value={`chapter-${chapter.id}`}
                  className={`border rounded-none p-3 transition-colors ${
                    isCurrentChapter
                      ? `border-blue-600 ${isDark ? 'bg-[#151515]' : 'bg-white'}`
                      : isDark
                        ? 'border-[#2D2D2D] bg-[#151515]'
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <AccordionTrigger
                    className={`px-3 py-2 hover:no-underline rounded-none ${
                      isDark ? 'hover:bg-[#1A1A1A]' : 'hover:bg-gray-100'
                    }`}
                  >
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="text-left">
                            <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                              {chapter.title}
                            </p>
                            {chapter.description && (
                              <p className={`text-xs mt-0.5 line-clamp-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-xs ${isDark ? 'border-[#2D2D2D] text-gray-400' : 'border-gray-300 text-gray-700'}`}
                        >
                          {chapterLessons.length} bài
                        </Badge>
                      </div>
                    </AccordionTrigger>
                  <AccordionContent className="px-3 pb-2 rounded-none">
                    <div className="space-y-1 mt-2 rounded-none ">
                        {chapterLessons.map((lesson) => {
                          const globalIndex = getLessonGlobalIndex(lesson);
                          const lessonNumber = globalIndex + 1;
                          const isSelected = selectedLessonId === lesson.id;
                          const isLocked = isLessonLocked(lesson, globalIndex, allLessons);
                          const quizzes = lessonQuizzes[lesson.id] || [];
                          // Lấy trạng thái hoàn thành bài học và quiz từ lessonQuizProgress
                          const progress = lessonQuizProgress[lesson.id];
                          const isCompleted = progress ? progress.isCompleted : false;
                          const quizCompleted = progress ? progress.quizCompleted : false; // luôn định nghĩa để dùng cho icon
                          const hasActiveQuiz = quizzes.some((quiz) => activeQuizId && quiz.id === activeQuizId);
                          return (
                            <div key={lesson.id} className="space-y-1">
                              {/* Lesson Item */}
                            <div
                              onClick={() => {
                                if (!isLocked) {
                                  onLessonSelect(lesson);
                                }
                              }}
                            className={`flex items-center justify-between p-2 border border-blue-500/30 rounded-none transition-colors ${
                                hasActiveQuiz
                                  ? ''
                                  : isSelected
                                    ? 'bg-blue-600/20 border border-blue-600 '
                                    : isLocked
                                      ? 'opacity-50 cursor-not-allowed '
                                      : isDark
                                        ? 'border border-blue-500/30 hover:bg-[#1F1F1F] cursor-pointer '
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0 ">
                                {/* Status icon */}
                                <div className="flex-shrink-0">
                                  {isLocked ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#2D2D2D] flex items-center justify-center">
                                      <Lock className="h-2.5 w-2.5 text-gray-500" />
                                    </div>
                                  ) : isCompleted ? (
                                    <div className="w-5 h-5 rounded-full  bg-green-600/20 flex items-center justify-center ">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                                      <PlayCircle className="h-3 w-3 text-blue-500" />
                                    </div>
                                  )}
                                </div>

                                {/* Lesson info */}
                                <div className="flex-1 min-w-0">
                                  <p
                                    className={`text-xs font-medium truncate ${
                                      isSelected ? 'text-blue-500 dark:text-blue-400' : isDark ? 'text-white' : 'text-gray-900'
                                    }`}
                                  >
                                    Bài {lessonNumber}. {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                      <Clock className="h-2.5 w-2.5" />
                                      <span>{formatDuration(lesson.videoDuration)}</span>
                                    </div>
                                    {lesson.isPreview && (
                                      <Badge variant="outline" className="text-xs border-blue-500/50 text-blue-400 px-1 py-0">
                                        Preview
                                      </Badge>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>

                              {/* Quiz Items */}
                              {quizzes.length > 0 && onQuizSelect && (
                                <div className=" space-y-1 ">
                                  {quizzes.map((quiz) => {
                                    const isQuizActive = activeQuizId && quiz.id === activeQuizId;
                                    // Quiz mở khi lesson đã hoàn thành (isCompleted)
                                    return (
                                      <div
                                        key={quiz.id}
                                        onClick={isCompleted ? () => onQuizSelect(quiz) : undefined}
                                        className={`flex items-center gap-2 p-2 transition-colors border border-blue-500/30 ${
                                          !isCompleted
                                            ? 'opacity-50 cursor-not-allowed'
                                            : isQuizActive
                                              ? 'bg-blue-600/20 border border-blue-600 cursor-pointer'
                                              : isDark
                                                ? 'hover:bg-[#1F1F1F] bg-[#151515] cursor-pointer'
                                                : 'hover:bg-gray-50 bg-gray-50 cursor-pointer'
                                        }`}
                                      >
                                        {/* Status icon cho quiz giống lesson */}
                                        <div className="flex-shrink-0">
                                          {!isCompleted ? (
                                            <div className="w-5 h-5 rounded-full border-2 border-[#2D2D2D] flex items-center justify-center">
                                              <Lock className="h-2.5 w-2.5 text-gray-500" />
                                            </div>
                                          ) : !quizCompleted ? (
                                            <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                                              <PlayCircle className="h-3 w-3 text-blue-500" />
                                            </div>
                                          ) : (
                                            <div className="w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center">
                                              <CheckCircle className="h-3 w-3 text-green-500" />
                                            </div>
                                          )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                          <p
                                            className={`text-xs font-medium truncate ${
                                              isQuizActive
                                                ? 'text-blue-500 dark:text-blue-400'
                                                : isDark
                                                  ? 'text-white'
                                                  : 'text-gray-900'
                                            }`}
                                          >
                                            {quiz.title}
                                          </p>
                                          <p className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                            <FileQuestion className="h-2.5 w-2.5" />
                                            <span>{quiz.questionCount || quiz.questions?.length || 0} câu hỏi</span>
                                          </p>
                                        </div>
                                        {quiz.isPublished && (
                                          <Badge variant="outline" className="text-xs border-green-500/30 text-green-400 px-1 py-0">
                                            Câu hỏi ôn tập
                                          </Badge>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          ) : (
                <div className="space-y-1 rounded-none">
              {sortedLessons.map((lesson, index) => {
                const lessonNumber = index + 1;
                const isSelected = selectedLessonId === lesson.id;
                const isCompleted = completedLessonIds.includes(lesson.id);
                const isLocked = isLessonLocked(lesson, index, allLessons);
                const quizzes = lessonQuizzes[lesson.id] || [];

                return (
                  <div key={lesson.id} className="space-y-1">
                    {/* Lesson Item */}
                  <div
                    onClick={() => {
                      if (!isLocked) {
                        onLessonSelect(lesson);
                      }
                    }}
                  className={`flex items-center justify-between p-3 rounded-none transition-colors ${
                      isSelected
                        ? 'bg-blue-600/20 border border-blue-600'
                        : isLocked
                        ? 'opacity-50 cursor-not-allowed'
                        : isDark
                          ? 'border border-transparent hover:bg-[#1F1F1F] cursor-pointer'
                          : 'bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer'
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
                            isSelected ? 'text-blue-500 dark:text-blue-400' : isDark ? 'text-white' : 'text-gray-900'
                          }`}
                        >
                          Bài {lessonNumber}. {lesson.title}
                        </p>
                        <div className="flex items-center gap-2 mt-1">
                          <div className={`flex items-center gap-1 text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
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

                    {/* Quiz Items */}
                    {quizzes.length > 0 && onQuizSelect && (
                      <div className="ml-9 space-y-1">
                        {quizzes.map((quiz) => {
                          // Quiz chỉ mở khi lesson đã hoàn thành
                          return (
                            <div
                              key={quiz.id}
                              onClick={isCompleted ? () => onQuizSelect(quiz) : undefined}
                              className={`flex items-center gap-2 p-2 rounded-lg transition-colors border-l-2 border-blue-500/30 ${
                                !isCompleted
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                        ? 'border border-blue-500/30 hover:bg-[#1F1F1F] cursor-pointer '
                                        : 'bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <FileQuestion className="h-4 w-4 text-blue-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                                  {quiz.title}
                                </p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-600'}`}>
                                  {quiz.questionCount || quiz.questions?.length || 0} câu hỏi
                                </p>
                              </div>
                              {quiz.isPublished && (
                                <Badge variant="outline" className="text-xs border-green-500/30 text-green-400">
                                  Quiz
                                </Badge>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


