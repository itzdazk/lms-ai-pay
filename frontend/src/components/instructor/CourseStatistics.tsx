import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Clock, Plus } from 'lucide-react'
import type { Chapter } from '../../lib/api/types'

interface CourseStatisticsProps {
    chapters: Chapter[]
    onCreateChapter: () => void
    formatDuration: (seconds?: number) => string
}

export function CourseStatistics({ chapters, onCreateChapter, formatDuration }: CourseStatisticsProps) {
    const totalCourseDurationSeconds = chapters.reduce((courseAcc, ch) => {
        const chapterSeconds = ch.lessons?.reduce((acc, l) => acc + (l.videoDuration || 0), 0) || 0
        return courseAcc + chapterSeconds
    }, 0)

    const totalLessons = chapters.reduce(
        (acc, ch) => acc + (ch.lessons?.length || 0),
        0
    )
    const totalLessonsPublished = chapters.reduce(
        (acc, ch) => acc + (ch.lessons?.filter((l) => l.isPublished).length || 0),
        0
    )
    const totalLessonsHidden = totalLessons - totalLessonsPublished

    return (
        <div className="flex items-center justify-between mt-4">
            {/* Left side - Statistics */}
            <div className="flex items-center gap-3 flex-wrap">
                {/* Chương */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-400 border-blue-400/50 px-3 py-1">
                        {chapters.length} chương
                    </Badge>
                    <Badge variant="outline" className="text-green-400 border-green-400/50 px-3 py-1">
                        {chapters.filter(ch => ch.isPublished).length} hiện
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 border-gray-400/50 px-3 py-1">
                        {chapters.filter(ch => !ch.isPublished).length} ẩn
                    </Badge>
                </div>

                <span className="text-gray-500">|</span>

                {/* Bài */}
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-blue-300 border-blue-300/50 px-3 py-1">
                        {totalLessons} bài
                    </Badge>
                    <Badge variant="outline" className="text-green-400 border-green-400/50 px-3 py-1">
                        {totalLessonsPublished} hiện
                    </Badge>
                    <Badge variant="outline" className="text-gray-400 border-gray-400/50 px-3 py-1">
                        {totalLessonsHidden} ẩn
                    </Badge>
                </div>

                <span className="text-gray-500">|</span>

                {/* Thời lượng */}
                <Badge variant="outline" className="text-blue-300 border-blue-300/50 px-3 py-1 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {formatDuration(totalCourseDurationSeconds)}
                </Badge>
            </div>

            {/* Right side - Create Chapter Button */}
            <Button
                onClick={onCreateChapter}
                size="default"
                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                title="Tạo chương mới"
            >
                <Plus className="h-4 w-4" />
                Tạo Chương
            </Button>
        </div>
    )
}

