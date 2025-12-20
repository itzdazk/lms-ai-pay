import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Edit, Trash2, Plus, Clock } from 'lucide-react'
import { ChapterLessonsList } from './ChapterLessonsList'
import type { Chapter, Lesson } from '../../lib/api/types'

interface ChapterItemProps {
    chapter: Chapter
    isExpanded: boolean
    isDragged: boolean
    isDragOver: boolean
    hasOrderChanged: boolean
    draggedLessonId: number | null
    draggedLessonChapterId: number | null
    dragOverLessonId: number | null
    dragOverLessonChapterId: number | null
    lessonScrollHint: { chapterId: number | null; top: boolean; bottom: boolean }
    swappedLessonIds: Set<number>
    formatDuration: (seconds?: number) => string
    containerRef: (el: HTMLDivElement | null) => void
    onToggle: () => void
    onDragStart: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: () => void
    onDrop: (e: React.DragEvent) => void
    onDragEnd: () => void
    onPublish: (isPublished: boolean) => void
    onEdit: () => void
    onDelete: () => void
    onCreateLesson: () => void
    onLessonDragStart: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragOver: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragLeave: () => void
    onLessonDrop: (e: React.DragEvent, lessonId: number, chapterId: number) => void
    onLessonDragEnd: () => void
    onPublishLesson: (lesson: Lesson, isPublished: boolean) => void
    onEditLesson: (lesson: Lesson, chapterId: number) => void
    onDeleteLesson: (lesson: Lesson, chapterId: number) => void
    onRequestTranscript: (lesson: Lesson) => void
    onClearDragStates: () => void
}

export function ChapterItem({
    chapter,
    isExpanded,
    isDragged,
    isDragOver,
    hasOrderChanged,
    draggedLessonId,
    draggedLessonChapterId,
    dragOverLessonId,
    dragOverLessonChapterId,
    lessonScrollHint,
    swappedLessonIds,
    formatDuration,
    containerRef,
    onToggle,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onPublish,
    onEdit,
    onDelete,
    onCreateLesson,
    onLessonDragStart,
    onLessonDragOver,
    onLessonDragLeave,
    onLessonDrop,
    onLessonDragEnd,
    onPublishLesson,
    onEditLesson,
    onDeleteLesson,
    onRequestTranscript,
    onClearDragStates,
}: ChapterItemProps) {
    const chapterDurationSeconds =
        chapter.lessons?.reduce((acc, l) => acc + (l.videoDuration || 0), 0) || 0

    const lessons = chapter.lessons || []

    return (
        <div
            data-chapter-id={chapter.id}
            className={`bg-[#121212] border rounded-lg overflow-hidden transition-all duration-150 shadow-sm mb-4 ${
                isDragged
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-[1.01]'
                    : isDragOver
                    ? 'border-blue-500 border-dashed bg-blue-500/5'
                    : hasOrderChanged
                    ? 'border-green-500 bg-green-500/5'
                    : 'border-[#2D2D2D] hover:border-blue-500/40'
            }`}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <div className="flex items-center gap-3 p-4 bg-[#333333] hover:bg-[#333333] transition-colors">
                <span title="Kéo để sắp xếp chương">
                    <GripVertical className="h-5 w-5 text-gray-500 cursor-move" />
                </span>
                <button
                    onClick={onToggle}
                    className="flex items-center gap-2 flex-1 text-left"
                >
                    {isExpanded ? (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronRight className="h-4 w-4 text-gray-400" />
                    )}
                    <span className="text-blue-500 font-semibold text-sm mr-2">#{chapter.chapterOrder}</span>
                    <span className="text-white font-medium">{chapter.title}</span>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                            {chapter.lessonsCount || lessons.length} bài
                        </Badge>
                        <Badge variant="outline" className="text-green-400 border-green-400/50">
                            {(lessons.filter(l => l.isPublished).length)} hiện
                        </Badge>
                        <Badge variant="outline" className="text-gray-400">
                            {(lessons.filter(l => !l.isPublished).length)} ẩn
                        </Badge>
                    </div>
                </button>
                <div className="flex items-center gap-1">
                    <Badge variant="outline" className="text-xs text-blue-300 border-blue-300/50 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(chapterDurationSeconds)}
                    </Badge>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onPublish(!chapter.isPublished)}
                        className={`ml-2 h-6 px-2 text-xs ${
                            chapter.isPublished
                                ? 'text-green-400 hover:text-green-500 hover:bg-green-500/10'
                                : 'text-gray-500 hover:text-gray-400 hover:bg-gray-500/10'
                        }`}
                        title={chapter.isPublished ? 'Click để ẩn chương' : 'Click để xuất bản chương'}
                    >
                        {chapter.isPublished ? (
                            <>
                                <Eye className="h-3 w-3 mr-1" />
                                Xuất bản
                            </>
                        ) : (
                            <>
                                <EyeOff className="h-3 w-3 mr-1" />
                                Ẩn
                            </>
                        )}
                    </Button>
                    <Button
                        variant="ghost"
                        size="default"
                        onClick={onEdit}
                        className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        title="Chỉnh sửa chương"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="default"
                        onClick={onDelete}
                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                        title="Xóa chương"
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="default"
                        onClick={onCreateLesson}
                        className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                        title="Tạo bài học mới"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {isExpanded && (
                <ChapterLessonsList
                    chapter={chapter}
                    lessons={lessons}
                    draggedLessonId={draggedLessonId}
                    draggedLessonChapterId={draggedLessonChapterId}
                    dragOverLessonId={dragOverLessonId}
                    dragOverLessonChapterId={dragOverLessonChapterId}
                    lessonScrollHint={lessonScrollHint}
                    swappedLessonIds={swappedLessonIds}
                    formatDuration={formatDuration}
                    containerRef={containerRef}
                    onLessonDragStart={onLessonDragStart}
                    onLessonDragOver={onLessonDragOver}
                    onLessonDragLeave={onLessonDragLeave}
                    onLessonDrop={onLessonDrop}
                    onLessonDragEnd={onLessonDragEnd}
                    onPublishLesson={onPublishLesson}
                    onEditLesson={onEditLesson}
                    onDeleteLesson={onDeleteLesson}
                    onRequestTranscript={onRequestTranscript}
                    onCreateLesson={onCreateLesson}
                    onClearDragStates={onClearDragStates}
                />
            )}
        </div>
    )
}

