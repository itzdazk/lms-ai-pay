import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Edit, Trash2, Plus, Clock, MoreVertical } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../ui/dropdown-menu'
import { ChapterLessonsList } from './ChapterLessonsList'
import type { Chapter, Lesson, Quiz } from '../../lib/api/types'
import { useState } from 'react'
import { PublishChapterDialog } from './PublishChapterDialog'

interface ChapterItemProps {
    chapter: Chapter
    isExpanded: boolean
    isDragged: boolean
    isDragOver: boolean
    hasOrderChanged: boolean
    lessonsQuizzes?: Map<number, Quiz[]> // Map of lessonId to quizzes array
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
    openLessonQuiz?: number | null // ID of lesson with open quiz management
    onToggleLessonQuiz?: (lesson: Lesson) => void // Callback to toggle quiz management
}

export function ChapterItem({
    chapter,
    isExpanded,
    isDragged,
    isDragOver,
    hasOrderChanged,
    lessonsQuizzes = new Map(),
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
    openLessonQuiz = null,
    onToggleLessonQuiz,
}: ChapterItemProps) {
    const chapterDurationSeconds =
        chapter.lessons?.reduce((acc, l) => acc + (l.videoDuration || 0), 0) || 0

    const lessons = chapter.lessons || []

    // Dialog state for publish/unpublish
    const [showPublishDialog, setShowPublishDialog] = useState(false)
    const [publishing, setPublishing] = useState(false)
    const [toPublished, setToPublished] = useState(true)

    // Handler for dropdown click
    const handlePublishClick = (nextPublished: boolean) => {
        setToPublished(nextPublished)
        setShowPublishDialog(true)
    }

    const handleConfirmPublish = async () => {
        setPublishing(true)
        try {
            await onPublish(toPublished)
            setShowPublishDialog(false)
        } finally {
            setPublishing(false)
        }
    }

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
                                                                        {/* Status badge for chapter publish state */}
                                                                        {chapter.isPublished ? (
                                                                            <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs ml-2" title="Chương đã xuất bản">
                                                                                <Eye className="h-3 w-3" /> Xuất bản
                                                                            </Badge>
                                                                        ) : (
                                                                            <Badge className="bg-gray-500 text-white flex items-center gap-1 text-xs ml-2" title="Chương đang ẩn">
                                                                                <EyeOff className="h-3 w-3" /> Ẩn
                                                                            </Badge>
                                                                        )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="ml-1 h-8 w-8 text-gray-400 hover:text-blue-500">
                                                <MoreVertical className="h-5 w-5" />
                                                <span className="sr-only">Thao tác chương</span>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-[#181818] text-white border-[#222]">
                                            <DropdownMenuItem onClick={onCreateLesson}>
                                                <Plus className="h-4 w-4 mr-2 text-green-500" />Tạo bài học mới
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={onEdit}>
                                                <Edit className="h-4 w-4 mr-2 text-blue-500" />Chỉnh sửa chương
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handlePublishClick(!chapter.isPublished)}>
                                                {chapter.isPublished ? (
                                                    <>
                                                        <Eye className="h-4 w-4 mr-2 text-green-400" />Ẩn chương
                                                    </>
                                                ) : (
                                                    <>
                                                        <EyeOff className="h-4 w-4 mr-2 text-gray-400" />Xuất bản chương
                                                    </>
                                                )}
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={onDelete} className="text-red-500">
                                                <Trash2 className="h-4 w-4 mr-2" />Xóa chương
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
            </div>

            {isExpanded && (
                <ChapterLessonsList
                    chapter={chapter}
                    lessons={lessons}
                    lessonsQuizzes={lessonsQuizzes}
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
                    openLessonQuiz={openLessonQuiz}
                    onToggleLessonQuiz={onToggleLessonQuiz}
                />
            )}
            {/* Publish/Unpublish confirmation dialog */}
            <PublishChapterDialog
                open={showPublishDialog}
                onOpenChange={setShowPublishDialog}
                chapter={chapter}
                publishing={publishing}
                toPublished={toPublished}
                onSubmit={handleConfirmPublish}
                onCancel={() => setShowPublishDialog(false)}
            />
        </div>
    )
}

