import { useState, useEffect } from 'react';
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

  // Find chapter containing selected lesson and set default open chapters
  const [openChapters, setOpenChapters] = useState<string[]>([]);

  useEffect(() => {
    if (chapters.length > 0 && selectedLessonId) {
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
  }, [selectedLessonId, chapters]);

  return (
    <Card className="sticky top-24 bg-[#1A1A1A] border-[#2D2D2D]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-white">
          <span>Nội dung khóa học</span>
          <Badge variant="outline" className="border-[#2D2D2D] text-gray-300">
            {chapters.length > 0 ? `${chapters.length} chương • ${totalLessonsCount} bài` : `${totalLessonsCount} bài`}
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
        <div className="max-h-[600px] overflow-y-auto custom-scrollbar">
          {chapters.length > 0 ? (
            <Accordion 
              type="multiple" 
              className="space-y-2"
              value={openChapters}
              onValueChange={setOpenChapters}
            >
              {chapters.map((chapter) => {
                const chapterLessons = chapter.lessons || [];
                if (chapterLessons.length === 0) return null;

                // Find the index of each lesson in the flattened array
                const getLessonGlobalIndex = (lesson: Lesson): number => {
                  return allLessons.findIndex((l) => l.id === lesson.id);
                };

                return (
                  <AccordionItem
                    key={chapter.id}
                    value={`chapter-${chapter.id}`}
                    className="border border-[#2D2D2D] rounded-lg bg-[#151515]"
                  >
                    <AccordionTrigger className="px-3 py-2 hover:no-underline hover:bg-[#1A1A1A] rounded-t-lg">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-blue-400 flex-shrink-0" />
                          <div className="text-left">
                            <p className="text-sm font-medium text-white">
                              {chapter.title}
                            </p>
                            {chapter.description && (
                              <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                                {chapter.description}
                              </p>
                            )}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs border-[#2D2D2D] text-gray-400">
                          {chapterLessons.length} bài
                        </Badge>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-3 pb-2">
                      <div className="space-y-1 mt-2">
                        {chapterLessons.map((lesson) => {
                          const globalIndex = getLessonGlobalIndex(lesson);
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
                              className={`flex items-center justify-between p-2 rounded-lg transition-colors ${
                                isSelected
                                  ? 'bg-blue-600/20 border border-blue-600'
                                  : isLocked
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:bg-[#1F1F1F] cursor-pointer'
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
                                      isSelected ? 'text-blue-400' : 'text-white'
                                    }`}
                                  >
                                    {lesson.title}
                                  </p>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <div className="flex items-center gap-1 text-xs text-gray-500">
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
            <div className="space-y-1">
              {sortedLessons.map((lesson, index) => {
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
          )}
        </div>
      </CardContent>
    </Card>
  );
}


