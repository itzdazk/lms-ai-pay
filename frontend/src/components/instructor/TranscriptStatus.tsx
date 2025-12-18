import { Button } from '../ui/button'
import { CheckCircle2, Loader2, AlertCircle, FileText, Sparkles } from 'lucide-react'
import type { Lesson } from '../../lib/api/types'

interface TranscriptStatusProps {
    lesson: Lesson
    onRequestTranscript: () => void
}

export function TranscriptStatus({ lesson, onRequestTranscript }: TranscriptStatusProps) {
    if (lesson.transcriptStatus === 'completed' || (lesson.transcriptUrl && !lesson.transcriptStatus)) {
        return (
            <div className="flex items-center gap-1 text-green-400" title="Đã có transcript">
                <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                <span className="hidden sm:inline">Transcript</span>
            </div>
        )
    }

    if (lesson.transcriptStatus === 'processing') {
        return (
            <div className="flex items-center gap-1 text-yellow-400" title="Đang tạo transcript">
                <Loader2 className="h-3 w-3 flex-shrink-0 animate-spin" />
                <span className="hidden sm:inline">Đang tải...</span>
            </div>
        )
    }

    if (lesson.transcriptStatus === 'failed') {
        return (
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-red-400" title="Tạo transcript thất bại">
                    <AlertCircle className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Lỗi</span>
                </div>
                {lesson.videoUrl && (
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onRequestTranscript}
                        className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                        title="Yêu cầu tạo lại transcript"
                    >
                        <Sparkles className="h-3 w-3" />
                    </Button>
                )}
            </div>
        )
    }

    if (lesson.videoUrl) {
        return (
            <div className="flex items-center gap-1">
                <div className="flex items-center gap-1 text-gray-500" title="Chưa có transcript">
                    <FileText className="h-3 w-3 flex-shrink-0" />
                    <span className="hidden sm:inline">Chưa có</span>
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={onRequestTranscript}
                    className="h-6 w-6 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                    title="Yêu cầu tạo transcript"
                >
                    <Sparkles className="h-3 w-3" />
                </Button>
            </div>
        )
    }

    return null
}

