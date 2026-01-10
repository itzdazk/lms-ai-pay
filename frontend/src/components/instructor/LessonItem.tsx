import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { GripVertical, Video, FileText, Eye, EyeOff, Edit, Trash2, Clock, MoreVertical, ChevronRight } from 'lucide-react'
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from '../ui/dropdown-menu'
import { TranscriptStatus } from './TranscriptStatus'
import { QuizInfoBadge } from './QuizInfoBadge'
import { QuizzesPage } from '../../pages/instructor/QuizzesPage'
import type { Lesson, Quiz } from '../../lib/api/types'

interface LessonItemProps {
    lesson: Lesson
    chapterId: number
    isDragged: boolean
    isDragOver: boolean
    isSwapped: boolean
    formatDuration: (seconds?: number) => string
    quizzes?: Quiz[] // Quiz data for this lesson
    onDragStart: (e: React.DragEvent) => void
    onDragOver: (e: React.DragEvent) => void
    onDragLeave: () => void
    onDrop: (e: React.DragEvent) => void
    onDragEnd: () => void
    onPublish: (isPublished: boolean) => void
    onEdit: () => void
    onDelete: () => void
    onRequestTranscript: () => void
    isQuizManagementOpen?: boolean // Whether quiz management is open for this lesson
    onToggleQuizManagement?: () => void // Callback to toggle quiz management
}

export function LessonItem({
    lesson,
    chapterId,
    isDragged,
    isDragOver,
    isSwapped,
    formatDuration,
    quizzes = [],
    onDragStart,
    onDragOver,
    onDragLeave,
    onDrop,
    onDragEnd,
    onPublish,
    onEdit,
    onDelete,
    onRequestTranscript,
    isQuizManagementOpen = false,
    onToggleQuizManagement,
}: LessonItemProps) {
    return (
        <div
            data-lesson-id={lesson.id}
            className={`flex flex-col gap-2 p-5 bg-[#232323] border border-[#2D2D2D] rounded-xl transition-all duration-150 shadow-sm ${
                isDragged
                    ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-[1.01]'
                    : isDragOver
                    ? 'border-blue-500 border-dashed bg-blue-500/5'
                    : isSwapped
                    ? 'border-green-500 bg-green-500/10'
                    : 'hover:border-blue-500/40'
            }`}
            style={{ minHeight: 72 }}
            draggable
            onDragStart={onDragStart}
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onDragEnd={onDragEnd}
        >
            <div className="flex items-center gap-4">
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
                </div>
                {/* Video info - Right side */}
                <div className="flex items-center gap-4 flex-shrink-0 mr-2">
                    {/* Transcript status */}
                    <div className="flex items-center gap-2 text-xs whitespace-nowrap min-w-[4rem] sm:min-w-[5rem] justify-end">
                        <TranscriptStatus lesson={lesson} onRequestTranscript={onRequestTranscript} />
                    </div>
                    {/* Video duration + trạng thái xuất bản/ẩn */}
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap min-w-[3rem] justify-end">
                            {lesson.videoDuration && lesson.videoDuration > 0 ? (
                                <>
                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                    <span>{formatDuration(lesson.videoDuration)}</span>
                                </>
                            ) : null}
                        </div>
                        {/* Trạng thái xuất bản/ẩn */}
                        {lesson.isPublished ? (
                            <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs" title="Bài học đã xuất bản">
                                <Eye className="h-3 w-3" /> Xuất bản
                            </Badge>
                        ) : (
                            <Badge className="bg-gray-500 text-white flex items-center gap-1 text-xs" title="Bài học đang ẩn">
                                <EyeOff className="h-3 w-3" /> Ẩn
                            </Badge>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-blue-500">
                                <MoreVertical className="h-5 w-5" />
                                <span className="sr-only">Thao tác bài học</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#181818] text-white border-[#222]">
                            <DropdownMenuItem onClick={onEdit}>
                                <Edit className="h-4 w-4 mr-2 text-blue-500" />Chỉnh sửa bài học
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onPublish(!lesson.isPublished)}>
                                {lesson.isPublished ? (
                                    <>
                                        <Eye className="h-4 w-4 mr-2 text-green-400" />Ẩn bài học
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2 text-gray-400" />Xuất bản bài học
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={onDelete} className="text-red-500">
                                <Trash2 className="h-4 w-4 mr-2" />Xóa bài học
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
            {/* Quiz info row - Always show to indicate quiz status */}
            <div className="flex items-center justify-between gap-2 ml-8 pl-1">
                <QuizInfoBadge 
                    quizzes={quizzes || []} 
                    isQuizManagementOpen={isQuizManagementOpen}
                    onToggleQuizManagement={undefined}
                />
                {/* Quiz management toggle button - positioned to the right */}
                {onToggleQuizManagement && (
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={onToggleQuizManagement}
                        className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white border-blue-600 flex-shrink-0"
                    >
                        Câu hỏi ôn tập
                        <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${isQuizManagementOpen ? 'rotate-90' : ''}`} />
                    </Button>
                )}
            </div>
            
            {/* Quiz management section - Show when toggled */}
            {isQuizManagementOpen && onToggleQuizManagement && (
                <div className="flex flex-col items-center border border-[#2D2D2D] rounded-lg bg-[#181818]">
                    <div className="w-full">
                        <QuizzesPage key={lesson.id} lessonId={lesson.id} lessonTitle={lesson.title} />
                    </div>
                </div>
            )}
        </div>
    )
}
