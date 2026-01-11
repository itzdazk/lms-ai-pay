import { Star, Users, BookOpen, Clock } from 'lucide-react'
import { formatDuration } from '../../lib/courseUtils'

interface CourseStatsGridProps {
    ratingAvg?: number
    ratingCount?: number
    enrolledCount?: number
    totalLessons?: number
    durationHours?: number
}

export function CourseStatsGrid({
    ratingAvg = 0,
    ratingCount = 0,
    enrolledCount = 0,
    totalLessons = 0,
    durationHours = 0,
}: CourseStatsGridProps) {
    // Backend trả về durationHours nhưng thực chất là phút, cần chuyển đổi sang giờ
    const durationDisplay = durationHours
        ? formatDuration(durationHours / 60)
        : '0 Giờ'

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 shadow-lg'>
                <div className='flex items-center gap-2 mb-2'>
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                    <span className='text-xl font-bold text-white'>
                        {Number(ratingAvg).toFixed(1)}
                    </span>
                </div>
                <p className='text-xs text-gray-400'>
                    {ratingCount} đánh giá
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 shadow-lg'>
                <div className='flex items-center gap-2 mb-2'>
                    <Users className='h-5 w-5 text-blue-500' />
                    <span className='text-xl font-bold text-white'>
                        {enrolledCount.toLocaleString()}
                    </span>
                </div>
                <p className='text-xs text-gray-400'>
                    Học viên
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 shadow-lg'>
                <div className='flex items-center gap-2 mb-2'>
                    <BookOpen className='h-5 w-5 text-green-500' />
                    <span className='text-xl font-bold text-white'>
                        {totalLessons}
                    </span>
                </div>
                <p className='text-xs text-gray-400'>
                    Bài học
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 shadow-lg'>
                <div className='flex items-center gap-2 mb-2'>
                    <Clock className='h-5 w-5 text-purple-500' />
                    <span className='text-xl font-bold text-white'>
                        {durationDisplay}
                    </span>
                </div>
                <p className='text-xs text-gray-400'>
                    Thời lượng
                </p>
            </div>
        </div>
    )
}

