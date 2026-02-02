// ============================================
// FILE: src/components/Courses/LessonsList.tsx (TẠO MỚI)
// Display course lessons/curriculum
// ============================================

import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from '../ui/accordion'
import { Badge } from '../ui/badge'
import { PlayCircle, Lock, Clock, CheckCircle, BookOpen } from 'lucide-react'
import type { Lesson, Chapter } from '../../lib/api/types'
import { formatDuration } from '../../lib/courseUtils'

interface LessonsListProps {
    lessons: Lesson[]
    chapters?: Chapter[]
    isEnrolled?: boolean
    totalDuration?: number
    className?: string
}

export function LessonsList({
    lessons,
    chapters = [],
    isEnrolled = false,
    totalDuration,
    className = '',
}: LessonsListProps) {
    // Convert videoDuration (minutes) to hours for display
    const totalHours = totalDuration
        ? totalDuration / 60
        : lessons.reduce(
              (acc, lesson) => acc + (lesson.videoDuration || 0),
              0,
          ) / 60

    const totalLessonsCount =
        chapters.length > 0
            ? chapters.reduce(
                  (acc, chapter) => acc + (chapter.lessonsCount || 0),
                  0,
              )
            : lessons.length

    // If we have chapters, display them grouped by chapter
    if (chapters.length > 0) {
        return (
            <div className={className}>
                <div className='mb-4 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold text-white'>
                        Nội dung khóa học
                    </h3>
                    <div className='text-sm text-gray-400'>
                        {chapters.length} chương • {totalLessonsCount} bài học •{' '}
                        {formatDuration(totalHours)}
                    </div>
                </div>

                <Accordion type='multiple' className='w-full space-y-2'>
                    {chapters.map((chapter) => {
                        const chapterLessons = chapter.lessons || []
                        if (chapterLessons.length === 0) return null

                        return (
                            <AccordionItem
                                key={chapter.id}
                                value={`chapter-${chapter.id}`}
                                className='border border-[#2D2D2D] rounded-lg bg-[#1A1A1A]'
                            >
                                <AccordionTrigger className='px-4 hover:no-underline hover:bg-[#1F1F1F] rounded-t-lg'>
                                    <div className='flex items-center justify-between w-full pr-4'>
                                        <div className='flex items-center gap-3 flex-1 min-w-0'>
                                            <div className='h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0'>
                                                <BookOpen className='h-4 w-4 text-blue-400' />
                                            </div>
                                            <div className='text-left flex-1 min-w-0'>
                                                <span className='text-white font-medium block'>
                                                    {chapter.title}
                                                </span>
                                                {chapter.description && (
                                                    <span className='text-xs text-gray-400 block mt-0.5'>
                                                        {chapter.description}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        <span className='text-sm text-gray-400 flex-shrink-0 ml-4'>
                                            {chapterLessons.length} bài
                                        </span>
                                    </div>
                                </AccordionTrigger>
                                <AccordionContent className='px-4 pb-2'>
                                    <div className='space-y-1'>
                                        {chapterLessons.map((lesson, index) => (
                                            <LessonItem
                                                key={lesson.id}
                                                lesson={lesson}
                                                index={index + 1}
                                                isEnrolled={isEnrolled}
                                            />
                                        ))}
                                    </div>
                                </AccordionContent>
                            </AccordionItem>
                        )
                    })}
                </Accordion>
            </div>
        )
    }

    // Fallback: Display all lessons without chapters
    if (lessons.length === 0) {
        return (
            <div className='text-center py-8 text-gray-400'>
                <p>Chưa có bài học nào được công bố</p>
            </div>
        )
    }

    return (
        <div className={className}>
            <div className='mb-4 flex items-center justify-between'>
                <h3 className='text-lg font-semibold text-white'>
                    Nội dung khóa học
                </h3>
                <div className='text-sm text-gray-400'>
                    {lessons.length} bài học • {formatDuration(totalHours)}
                </div>
            </div>

            <Accordion type='single' collapsible className='w-full space-y-2'>
                <AccordionItem
                    value='section-1'
                    className='border border-[#2D2D2D] rounded-lg bg-[#1A1A1A]'
                >
                    <AccordionTrigger className='px-4 hover:no-underline hover:bg-[#1F1F1F] rounded-t-lg'>
                        <div className='flex items-center justify-between w-full pr-4'>
                            <span className='text-white font-medium'>
                                Tất cả bài học
                            </span>
                            <span className='text-sm text-gray-400'>
                                {lessons.length} bài
                            </span>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className='px-4 pb-2'>
                        <div className='space-y-1'>
                            {lessons.map((lesson, index) => (
                                <LessonItem
                                    key={lesson.id}
                                    lesson={lesson}
                                    index={index + 1}
                                    isEnrolled={isEnrolled}
                                />
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </div>
    )
}

interface LessonItemProps {
    lesson: Lesson
    index: number
    isEnrolled: boolean
}

function LessonItem({ lesson, index, isEnrolled }: LessonItemProps) {
    const canAccess = lesson.isPreview || isEnrolled
    const duration = lesson.videoDuration
        ? `${Math.round(lesson.videoDuration / 60)} phút`
        : null

    return (
        <div
            className={`flex items-center justify-between p-3 rounded-lg transition-colors ${
                canAccess
                    ? 'hover:bg-[#1F1F1F] cursor-pointer'
                    : 'cursor-not-allowed opacity-60'
            }`}
        >
            <div className='flex items-center gap-3 flex-1 min-w-0'>
                {/* Icon */}
                <div className='flex-shrink-0'>
                    {canAccess ? (
                        <PlayCircle className='h-5 w-5 text-blue-600' />
                    ) : (
                        <Lock className='h-5 w-5 text-gray-400' />
                    )}
                </div>

                {/* Lesson info */}
                <div className='flex-1 min-w-0'>
                    <div className='flex items-center gap-2 mb-1'>
                        <span className='text-xs text-gray-500 font-mono'>
                            #{index}
                        </span>
                        <p className='font-medium text-white text-sm truncate'>
                            {lesson.title}
                        </p>
                    </div>

                    {lesson.description && (
                        <p className='text-xs text-gray-400 line-clamp-1'>
                            {lesson.description}
                        </p>
                    )}

                    {/* Badges */}
                    <div className='flex items-center gap-2 mt-1'>
                        {lesson.isPreview && !isEnrolled && (
                            <Badge
                                variant='outline'
                                className='text-xs border-blue-600 text-blue-600 px-1.5 py-0'
                            >
                                Preview
                            </Badge>
                        )}
                        {isEnrolled && (
                            <Badge
                                variant='outline'
                                className='text-xs border-green-600 text-green-600 px-1.5 py-0'
                            >
                                <CheckCircle className='h-3 w-3 mr-1' />
                                Đã mở khóa
                            </Badge>
                        )}
                    </div>
                </div>
            </div>

            {/* Duration */}
            {duration && (
                <div className='flex items-center gap-1 text-sm text-gray-400 flex-shrink-0 ml-2'>
                    <Clock className='h-4 w-4' />
                    <span>{duration}</span>
                </div>
            )}
        </div>
    )
}
