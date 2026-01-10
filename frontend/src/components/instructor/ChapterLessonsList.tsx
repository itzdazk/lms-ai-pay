import { Button } from '../ui/button'
import { Plus } from 'lucide-react'
import { LessonItem } from './LessonItem'
import type { Lesson, Chapter, Quiz } from '../../lib/api/types'

interface ChapterLessonsListProps {
    chapter: Chapter
    lessons: Lesson[]
    lessonsQuizzes?: Map<number, Quiz[]> // Map of lessonId to quizzes array
    draggedLessonId: number | null
    draggedLessonChapterId: number | null
    dragOverLessonId: number | null
    dragOverLessonChapterId: number | null
    lessonScrollHint: { chapterId: number | null; top: boolean; bottom: boolean }
    swappedLessonIds: Set<number>
    formatDuration: (seconds?: number) => string
    containerRef: (el: HTMLDivElement | null) => void
    onLessonDragStart: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragOver: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragLeave: () => void
    onLessonDrop: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragEnd: () => void
    onPublishLesson: (lesson: Lesson, isPublished: boolean) => void
    onEditLesson: (lesson: Lesson, chapterId: number) => void
    onDeleteLesson: (lesson: Lesson, chapterId: number) => void
    onRequestTranscript: (lesson: Lesson) => void
    onCreateLesson: (chapterId: number) => void
    onClearDragStates: () => void
    openLessonQuiz?: number | null // ID of lesson with open quiz management
    onToggleLessonQuiz?: (lesson: Lesson) => void // Callback to toggle quiz management
}

export function ChapterLessonsList({
    chapter,
    lessons,
    lessonsQuizzes = new Map(),
    draggedLessonId,
    draggedLessonChapterId,
    dragOverLessonId,
    dragOverLessonChapterId,
    lessonScrollHint,
    swappedLessonIds,
    formatDuration,
    containerRef,
    onLessonDragStart,
    onLessonDragOver,
    onLessonDragLeave,
    onLessonDrop,
    onLessonDragEnd,
    onPublishLesson,
    onEditLesson,
    onDeleteLesson,
    onRequestTranscript,
    onCreateLesson,
    onClearDragStates,
    openLessonQuiz = null,
    onToggleLessonQuiz,
}: ChapterLessonsListProps) {
    return (
        <div
            className="relative border-t border-[#2D2D2D] p-4 space-y-4"
            ref={containerRef}
            onPointerUp={onClearDragStates}
        >
            {lessons.length === 0 ? (
                <div className="text-center py-4">
                    <p className="text-gray-500 text-sm">Chưa có bài học nào</p>
                </div>
            ) : (
                lessons.map((lesson) => (
                    <LessonItem
                        key={lesson.id}
                        lesson={lesson}
                        chapterId={chapter.id}
                        quizzes={lessonsQuizzes.get(lesson.id) || []}
                        isDragged={draggedLessonId === lesson.id}
                        isDragOver={dragOverLessonId === lesson.id && dragOverLessonChapterId === chapter.id}
                        isSwapped={swappedLessonIds.has(lesson.id)}
                        formatDuration={formatDuration}
                        onDragStart={(e) => onLessonDragStart(e, lesson.id, chapter.id)}
                        onDragOver={(e) => onLessonDragOver(e, lesson.id, chapter.id)}
                        onDragLeave={onLessonDragLeave}
                        onDrop={(e) => onLessonDrop(e, lesson.id, chapter.id)}
                        onDragEnd={onLessonDragEnd}
                        onPublish={(isPublished) => onPublishLesson(lesson, isPublished)}
                        onEdit={() => onEditLesson(lesson, chapter.id)}
                        onDelete={() => onDeleteLesson(lesson, chapter.id)}
                        onRequestTranscript={() => onRequestTranscript(lesson)}
                        isQuizManagementOpen={openLessonQuiz === lesson.id}
                        onToggleQuizManagement={onToggleLessonQuiz ? () => onToggleLessonQuiz(lesson) : undefined}
                    />
                ))
            )}

            {/* Add lesson button at the end */}
            <div className="flex justify-center pt-2 pb-1">
                <Button
                    size="sm"
                    onClick={() => onCreateLesson(chapter.id)}
                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                    title="Tạo bài học mới"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Tạo Bài học
                </Button>
            </div>
        </div>
    )
}

