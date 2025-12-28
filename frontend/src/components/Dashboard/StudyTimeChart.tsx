import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { Loader2, Clock } from 'lucide-react'
import { useStudyTime } from '../../hooks/useStudyTime'
import { formatStudyTime } from '../../lib/dashboardUtils'

export function StudyTimeChart() {
    const { analytics, loading, error } = useStudyTime()

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Thời gian học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !analytics) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Thời gian học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>
                        {error || 'Không có dữ liệu'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className='space-y-4'>
            {/* Time Totals */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Tổng thời gian học
                    </CardTitle>
                    <CardDescription className='text-gray-400'>
                        Thống kê thời gian học tập của bạn
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <TimeCard
                            label='Hôm nay'
                            value={analytics.formatted.today}
                            seconds={analytics.totals.today}
                            icon={<Clock className='h-4 w-4' />}
                        />
                        <TimeCard
                            label='Tuần này'
                            value={analytics.formatted.thisWeek}
                            seconds={analytics.totals.thisWeek}
                            icon={<Clock className='h-4 w-4' />}
                        />
                        <TimeCard
                            label='Tháng này'
                            value={analytics.formatted.thisMonth}
                            seconds={analytics.totals.thisMonth}
                            icon={<Clock className='h-4 w-4' />}
                        />
                        <TimeCard
                            label='Tổng cộng'
                            value={analytics.formatted.allTime}
                            seconds={analytics.totals.allTime}
                            icon={<Clock className='h-4 w-4' />}
                        />
                    </div>
                    <div className='mt-4 p-3 rounded-lg border border-[#2D2D2D] bg-black/40'>
                        <p className='text-sm text-gray-400'>
                            Trung bình mỗi ngày (30 ngày qua)
                        </p>
                        <p className='text-xl font-bold text-white mt-1'>
                            {formatStudyTime(analytics.dailyAverage)}
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Study Time by Course */}
            {analytics.byCourse.length > 0 && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Thời gian học theo khóa học
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Top 5 khóa học bạn dành nhiều thời gian nhất
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-3'>
                        {analytics.byCourse.map((course) => (
                            <div key={course.courseId} className='space-y-2'>
                                <div className='flex items-center justify-between'>
                                    <p className='text-sm text-white font-medium truncate flex-1'>
                                        {course.courseTitle}
                                    </p>
                                    <div className='ml-3 text-right'>
                                        <p className='text-sm text-white font-semibold'>
                                            {course.formatted}
                                        </p>
                                        <p className='text-xs text-gray-400'>
                                            {course.percentage.toFixed(1)}%
                                        </p>
                                    </div>
                                </div>
                                <div className='w-full bg-[#2D2D2D] rounded-full h-2'>
                                    <div
                                        className='bg-blue-500 h-2 rounded-full transition-all'
                                        style={{
                                            width: `${course.percentage}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Trend Chart (Simple visualization) */}
            {analytics.trend.length > 0 && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Xu hướng học tập
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Thời gian học trong 30 ngày qua
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className='h-64 flex items-end gap-1'>
                            {analytics.trend.map((day, index) => {
                                const maxTime = Math.max(
                                    ...analytics.trend.map((d) => d.studyTime)
                                )
                                const height =
                                    maxTime > 0
                                        ? (day.studyTime / maxTime) * 100
                                        : 0
                                return (
                                    <div
                                        key={index}
                                        className='flex-1 flex flex-col items-center group relative'
                                    >
                                        <div
                                            className='w-full bg-blue-500 rounded-t transition-all hover:bg-blue-400 cursor-pointer'
                                            style={{ height: `${height}%` }}
                                            title={`${day.date}: ${day.formatted}`}
                                        />
                                        {index % 7 === 0 && (
                                            <span className='text-xs text-gray-500 mt-1'>
                                                {new Date(day.date).getDate()}
                                            </span>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function TimeCard({
    label,
    value,
    seconds,
    icon,
}: {
    label: string
    value: string
    seconds: number
    icon: React.ReactNode
}) {
    return (
        <div className='rounded-lg border border-[#2D2D2D] bg-black/40 p-4'>
            <div className='flex items-center gap-2 text-gray-400 text-xs mb-2'>
                <div className='text-blue-400'>{icon}</div>
                {label}
            </div>
            <div className='text-2xl font-bold text-white'>{value}</div>
            <div className='text-xs text-gray-500 mt-1'>
                {Math.floor(seconds / 60)} phút
            </div>
        </div>
    )
}
