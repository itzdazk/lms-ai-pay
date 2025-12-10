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
    const durationDisplay = durationHours
        ? formatDuration(durationHours).split(' ')[0] + 'h'
        : '0 Giờ'

    return (
        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-yellow-500/50 transition-all duration-200 shadow-lg hover:shadow-yellow-500/10 group'>
                <div className='flex items-center gap-2 mb-2'>
                    <Star className='h-5 w-5 fill-yellow-400 text-yellow-400 group-hover:scale-110 transition-transform' />
                    <span className='text-xl font-bold text-white group-hover:text-yellow-400 transition-colors'>
                        {Number(ratingAvg).toFixed(1)}
                    </span>
                </div>
                <p className='text-xs text-gray-400 group-hover:text-gray-300 transition-colors'>
                    {ratingCount} đánh giá
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-blue-500/50 transition-all duration-200 shadow-lg hover:shadow-blue-500/10 group'>
                <div className='flex items-center gap-2 mb-2'>
                    <Users className='h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform' />
                    <span className='text-xl font-bold text-white group-hover:text-blue-400 transition-colors'>
                        {enrolledCount.toLocaleString()}
                    </span>
                </div>
                <p className='text-xs text-gray-400 group-hover:text-gray-300 transition-colors'>
                    Học viên
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-green-500/50 transition-all duration-200 shadow-lg hover:shadow-green-500/10 group'>
                <div className='flex items-center gap-2 mb-2'>
                    <BookOpen className='h-5 w-5 text-green-500 group-hover:scale-110 transition-transform' />
                    <span className='text-xl font-bold text-white group-hover:text-green-400 transition-colors'>
                        {totalLessons}
                    </span>
                </div>
                <p className='text-xs text-gray-400 group-hover:text-gray-300 transition-colors'>
                    Bài học
                </p>
            </div>
            <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] rounded-xl p-4 border border-[#2D2D2D]/50 hover:border-purple-500/50 transition-all duration-200 shadow-lg hover:shadow-purple-500/10 group'>
                <div className='flex items-center gap-2 mb-2'>
                    <Clock className='h-5 w-5 text-purple-500 group-hover:scale-110 transition-transform' />
                    <span className='text-xl font-bold text-white group-hover:text-purple-400 transition-colors'>
                        {durationDisplay}
                    </span>
                </div>
                <p className='text-xs text-gray-400 group-hover:text-gray-300 transition-colors'>
                    Thời lượng
                </p>
            </div>
        </div>
    )
}

