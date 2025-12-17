import { useState, useEffect, useCallback } from 'react';
import { CheckCircle, Lock, PlayCircle, Clock, BookOpen, ChevronDown, ChevronRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Progress } from '../ui/progress';
import { Badge } from '../ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '../ui/accordion';
import { useTheme } from '../../contexts/ThemeContext';
import type { Lesson, Chapter } from '../../lib/api/types';

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
}

export function LessonList({
  lessons,
  chapters = [],
  selectedLessonId,
  onLessonSelect,
  enrollmentProgress = 0,
  completedLessonIds = [],
  isEnrolled = false,
  courseTitle,
  completedLessons = 0,
  totalLessons = 0,
  courseId,
  courseSlug,
}: LessonListProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
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

  // Flatten all lessons from chapters for navigation logic
  const allLessons: Lesson[] = [];
  if (chapters.length > 0) {
    chapters.forEach((chapter) => {
      if (chapter.lessons) {
        allLessons.push(...chapter.lessons);
      }
    });
  } else {
    allLessons.push(...lessons);
  }

  // Check if lesson is locked
  const isLessonLocked = (lesson: Lesson, lessonIndex: number, allLessonsArray: Lesson[]): boolean => {
    // Preview lessons are always unlocked
    if (lesson.isPreview) return false;
    
    // If not enrolled, all non-preview lessons are locked
    if (!isEnrolled) return true;
    
    // First lesson is always unlocked if enrolled
    if (lessonIndex === 0) return false;
    
    // Check if previous lesson is completed
    const previousLesson = allLessonsArray[lessonIndex - 1];
    if (!previousLesson) return false;
    
    // If previous lesson is preview, current lesson is unlocked
    if (previousLesson.isPreview) return false;
    
    // If previous lesson is completed, current lesson is unlocked
    return !completedLessonIds.includes(previousLesson.id);
  };

  // Group lessons by sections (if needed in future)
  const sortedLessons = [...lessons].sort((a, b) => a.lessonOrder - b.lessonOrder);
  
  // Calculate total lessons count
  const totalLessonsCount = chapters.length > 0
    ? chapters.reduce((acc, chapter) => acc + (chapter.lessonsCount || chapter.lessons?.length || 0), 0)
    : lessons.length;

  // Helper functions to save/load expanded chapters state
  const getExpandedChaptersKey = useCallback((): string | null => {
    if (courseId) {
      return `lesson_page_course_${courseId}_expanded_chapters`;
    }
    if (courseSlug) {
      return `lesson_page_course_${courseSlug}_expanded_chapters`;
    }
    return null;
  }, [courseId, courseSlug]);

  const loadExpandedChaptersFromStorage = useCallback((): string[] => {
    const key = getExpandedChaptersKey();
    if (!key) return [];
    
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        const chapterValues = JSON.parse(saved) as string[];
        return chapterValues;
      }
    } catch (error) {
      console.error('Error loading expanded chapters from storage:', error);
    }
    return [];
  }, [getExpandedChaptersKey]);

  const saveExpandedChaptersToStorage = useCallback((expandedChapters: string[]) => {
    const key = getExpandedChaptersKey();
    if (!key) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(expandedChapters));
    } catch (error) {
      console.error('Error saving expanded chapters to storage:', error);
    }
  }, [getExpandedChaptersKey]);

  // Find chapter containing selected lesson and set default open chapters
  const [openChapters, setOpenChapters] = useState<string[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Load saved state when chapters or courseId/courseSlug changes
  useEffect(() => {
    if (chapters.length > 0 && !isInitialized) {
      const saved = loadExpandedChaptersFromStorage();
      // Only include chapter values that actually exist
      const validSaved = saved.filter(savedValue => {
        const chapterId = savedValue.replace('chapter-', '');
        return chapters.some(ch => ch.id.toString() === chapterId);
      });
      
      // Always set openChapters (empty array if nothing valid)
      setOpenChapters(validSaved);
      setIsInitialized(true);
    }
  }, [chapters, isInitialized, loadExpandedChaptersFromStorage]);

  // Auto-open chapter containing selected lesson (only if not already loaded from storage)
  useEffect(() => {
    if (chapters.length > 0 && selectedLessonId && isInitialized) {
      // Find chapter containing the selected lesson
      const chapterWithSelectedLesson = chapters.find((chapter) =>
        chapter.lessons?.some((lesson) => lesson.id === selectedLessonId)
      );

      if (chapterWithSelectedLesson) {
        const chapterValue = `chapter-${chapterWithSelectedLesson.id}`;
        // Set the chapter as open if not already in the array
        setOpenChapters((prev) => {
          if (!prev.includes(chapterValue)) {
            return [...prev, chapterValue];
          }
          return prev;
        });
      }
    }
  }, [selectedLessonId, chapters, isInitialized]);

  // Save to localStorage whenever openChapters changes (but not during initialization)
  useEffect(() => {
    if (isInitialized && openChapters.length >= 0) {
      saveExpandedChaptersToStorage(openChapters);
    }
  }, [openChapters, isInitialized, saveExpandedChaptersToStorage]);

  return (
    <Card className={`${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D]' : 'bg-white border-gray-200'} h-full flex flex-col rounded-none pb-8`}>
      <CardHeader className="flex-shrink-0 rounded-none">
        <CardTitle className={`flex items-center justify-between ${isDark ? 'text-white' : 'text-gray-900'}`}>
          <span>Nội dung khóa học</span>
          <Badge
            variant="outline"
            className={`${isDark ? 'border-[#2D2D2D] text-gray-300' : 'border-gray-300 text-gray-700'}`}
          >
            {chapters.length > 0 ? `${chapters.length} chương • ${totalLessonsCount} bài` : `${totalLessonsCount} bài`}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 px-0 overflow-y-auto custom-scrollbar min-h-0">
        <div>
          {chapters.length > 0 ? (
            <Accordion 
              type="multiple" 
              className=""
              value={openChapters}
              onValueChange={setOpenChapters}
            >
              {chapters.map((chapter) => {
                const chapterLessons = chapter.lessons || [];
                if (chapterLessons.length === 0) return null;
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
                    <div className="space-y-1 mt-2 rounded-none">
                        {chapterLessons.map((lesson) => {
                          const globalIndex = getLessonGlobalIndex(lesson);
                          const lessonNumber = globalIndex + 1;
                          const isSelected = selectedLessonId === lesson.id;
                          const isCompleted = completedLessonIds.includes(lesson.id);
                          const isLocked = isLessonLocked(lesson, globalIndex, allLessons);

                          return (
                            <div
                              key={lesson.id}
                              onClick={() => {
                                if (!isLocked) {
                                  onLessonSelect(lesson);
                                }
                              }}
                            className={`flex items-center justify-between p-2 rounded-none transition-colors ${
                                isSelected
                                  ? 'bg-blue-600/20 border border-blue-600'
                                : isLocked
                                  ? 'opacity-50 cursor-not-allowed'
                                  : isDark
                                    ? 'border border-transparent hover:bg-[#1F1F1F] cursor-pointer'
                                    : 'bg-white border border-gray-200 hover:bg-gray-50 cursor-pointer'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                {/* Status icon */}
                                <div className="flex-shrink-0">
                                  {isLocked ? (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#2D2D2D] flex items-center justify-center">
                                      <Lock className="h-2.5 w-2.5 text-gray-500" />
                                    </div>
                                  ) : isCompleted ? (
                                    <div className="w-5 h-5 rounded-full bg-green-600/20 flex items-center justify-center">
                                      <CheckCircle className="h-3 w-3 text-green-500" />
                                    </div>
                                  ) : lesson.isPreview ? (
                                    <div className="w-5 h-5 rounded-full bg-blue-600/20 flex items-center justify-center">
                                      <PlayCircle className="h-3 w-3 text-blue-500" />
                                    </div>
                                  ) : (
                                    <div className="w-5 h-5 rounded-full border-2 border-[#2D2D2D]" />
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

                return (
                  <div
                    key={lesson.id}
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
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


