import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { GripVertical, Video, FileText, Eye, EyeOff, Edit, Trash2, Clock } from 'lucide-react'
import { TranscriptStatus } from './TranscriptStatus'
import type { Lesson } from '../../lib/api/types'

interface LessonItemProps {
    lesson: Lesson
    chapterId: number
    isDragged: boolean
    isDragOver: boolean
    isSwapped: boolean
    formatDuration: (seconds?: number) => string
    onDragStart: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: () => void
    onDrop: (e: React.DragEvent) => void
    onDragEnd: () => void
    onPublish: (isPublished: boolean) => void
    onEdit: () => void
    onDelete: () => void
    onRequestTranscript: () => void
}

export function LessonItem({
    lesson,
    chapterId,
    isDragged,
    isDragOver,
    isSwapped,
    formatDuration,
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onPublish,
    onEdit,
    onDelete,
    onRequestTranscript,
}: LessonItemProps) {
    return (
        <div
            data-lesson-id={lesson.id}
            className={`flex items-center gap-3 p-3 bg-[#1A1A1A] border rounded-lg transition-all duration-150 ${
                isDragged
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                    : isDragOver
                    ? 'border-blue-500 border-dashed bg-blue-500/5'
                    : isSwapped
                    ? 'border-green-500 bg-green-500/10'
                    : 'border-[#2D2D2D] hover:bg-[#252525]'
            }`}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <span title="Kéo để sắp xếp bài học">
                <GripVertical className="h-4 w-4 text-gray-500 cursor-move" />
            </span>
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {lesson.videoUrl ? (
                    <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                    <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                )}
                <span className="text-blue-500 font-semibold text-sm mr-2 flex-shrink-0">#{lesson.lessonOrder}</span>
                <span className="text-white text-sm truncate">{lesson.title}</span>
                {lesson.isPreview && (
                    <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500 flex-shrink-0">
                        Preview
                    </Badge>
                )}
                {!lesson.isPublished && (
                    <Badge variant="outline" className="text-xs text-gray-500 border-gray-500 flex-shrink-0">
                        Đang ẩn
                    </Badge>
                )}
            </div>
            {/* Video info - Right side */}
            <div className="flex items-center gap-4 flex-shrink-0 mr-2">
                {/* Video duration */}
                <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap min-w-[3rem] justify-end">
                    {lesson.videoDuration && lesson.videoDuration > 0 ? (
                        <>
                            <Clock className="h-3 w-3 flex-shrink-0" />
                            <span>{formatDuration(lesson.videoDuration)}</span>
                        </>
                    ) : null}
                </div>
                {/* Transcript status */}
                <div className="flex items-center gap-2 text-xs whitespace-nowrap min-w-[4rem] sm:min-w-[5rem] justify-end">
                    <TranscriptStatus lesson={lesson} onRequestTranscript={onRequestTranscript} />
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onPublish(!lesson.isPublished)}
                    className={lesson.isPublished ? "text-green-500 hover:text-green-600 hover:bg-green-500/10" : "text-gray-500 hover:text-gray-400 hover:bg-gray-500/10"}
                    title={lesson.isPublished ? "Ẩn bài học" : "Xuất bản bài học"}
                >
                    {lesson.isPublished ? (
                        <Eye className="h-4 w-4" />
                    ) : (
                        <EyeOff className="h-4 w-4" />
                    )}
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onEdit}
                    className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    title="Chỉnh sửa bài học"
                >
                    <Edit className="h-4 w-4" />
                </Button>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onDelete}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                    title="Xóa bài học"
                >
                    <Trash2 className="h-4 w-4" />
                </Button>
            </div>
        </div>
    )
}

