import { useState, useEffect } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { Loader2, Calendar } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'

export function CalendarHeatmap() {
    const [heatmap, setHeatmap] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getCalendarHeatmap(
                    currentYear,
                    currentMonth
                )
                setHeatmap(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load calendar heatmap')
            } finally {
                setLoading(false)
            }
        }

        fetchHeatmap()
    }, [currentYear, currentMonth])

    const getColorClass = (level: string) => {
        switch (level) {
            case 'HIGH':
                return 'bg-green-500'
            case 'MEDIUM':
                return 'bg-yellow-500'
            case 'LOW':
                return 'bg-orange-500'
            default:
                return 'bg-[#2D2D2D]'
        }
    }

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Lịch học tập</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !heatmap) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Lịch học tập</CardTitle>
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
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <div>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <Calendar className='h-5 w-5 text-blue-400' />
                            Lịch học tập
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Tháng {currentMonth}/{currentYear}
                        </CardDescription>
                    </div>
                    <div className='flex gap-2'>
                        <button
                            onClick={() => {
                                if (currentMonth > 1) {
                                    setCurrentMonth(currentMonth - 1)
                                } else {
                                    setCurrentMonth(12)
                                    setCurrentYear(currentYear - 1)
                                }
                            }}
                            className='px-3 py-1 text-sm text-gray-400 hover:text-white border border-[#2D2D2D] rounded hover:border-white/30'
                        >
                            ←
                        </button>
                        <button
                            onClick={() => {
                                if (currentMonth < 12) {
                                    setCurrentMonth(currentMonth + 1)
                                } else {
                                    setCurrentMonth(1)
                                    setCurrentYear(currentYear + 1)
                                }
                            }}
                            className='px-3 py-1 text-sm text-gray-400 hover:text-white border border-[#2D2D2D] rounded hover:border-white/30'
                        >
                            →
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className='grid grid-cols-7 gap-1 mb-4'>
                    {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map((day) => (
                        <div
                            key={day}
                            className='text-xs text-gray-400 text-center p-1'
                        >
                            {day}
                        </div>
                    ))}
                </div>
                <div className='grid grid-cols-7 gap-1'>
                    {heatmap.days.map((day: any, index: number) => {
                        const date = new Date(day.date)
                        const dayOfWeek = date.getDay()
                        const dayOfMonth = date.getDate()

                        // Calculate grid position
                        const firstDayOfMonth = new Date(
                            currentYear,
                            currentMonth - 1,
                            1
                        ).getDay()
                        const gridPosition = index + firstDayOfMonth

                        return (
                            <div
                                key={index}
                                className={`aspect-square rounded ${getColorClass(
                                    day.level
                                )} hover:opacity-80 transition-opacity cursor-pointer group relative`}
                                title={`${day.date}: ${day.studyMinutes} phút, ${day.lessonCount} bài học`}
                                style={{
                                    gridColumn:
                                        index === 0
                                            ? `span ${7 - firstDayOfMonth}`
                                            : undefined,
                                }}
                            >
                                <div className='absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 rounded'>
                                    <div className='text-xs text-white text-center p-1'>
                                        <div>{day.studyMinutes}m</div>
                                        <div>{day.lessonCount} bài</div>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
                {heatmap.summary && (
                    <div className='mt-4 pt-4 border-t border-[#2D2D2D] grid grid-cols-2 md:grid-cols-4 gap-4 text-center'>
                        <div>
                            <p className='text-xs text-gray-400'>
                                Ngày hoạt động
                            </p>
                            <p className='text-lg font-semibold text-white'>
                                {heatmap.summary.activeDays}
                            </p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>
                                Tổng bài học
                            </p>
                            <p className='text-lg font-semibold text-white'>
                                {heatmap.summary.totalLessons}
                            </p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>
                                Tổng thời gian
                            </p>
                            <p className='text-lg font-semibold text-white'>
                                {Math.floor(
                                    heatmap.summary.totalStudyMinutes / 60
                                )}
                                h
                            </p>
                        </div>
                        <div>
                            <p className='text-xs text-gray-400'>Tỷ lệ</p>
                            <p className='text-lg font-semibold text-white'>
                                {Math.round(
                                    (heatmap.summary.activeDays /
                                        heatmap.summary.totalDays) *
                                        100
                                )}
                                %
                            </p>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
