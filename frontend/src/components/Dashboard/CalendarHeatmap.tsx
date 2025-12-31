import { useState, useEffect, useRef } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import {
    Loader2,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Clock,
    BookOpen,
    TrendingUp,
    Target,
    Activity,
} from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'

interface DayData {
    date: string
    studyMinutes: number
    lessonCount: number
    level: 'HIGH' | 'MEDIUM' | 'LOW' | 'NONE'
}

interface HeatmapData {
    days: DayData[]
    summary: {
        activeDays: number
        totalLessons: number
        totalStudyMinutes: number
        totalDays: number
    }
}

const MONTH_NAMES = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
]

export function CalendarHeatmap() {
    const [heatmap, setHeatmap] = useState<HeatmapData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentMonth, setCurrentMonth] = useState(new Date().getMonth() + 1)
    const [currentYear, setCurrentYear] = useState(new Date().getFullYear())
    const [hoveredDay, setHoveredDay] = useState<DayData | null>(null)
    const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 })
    const [previousMonthData, setPreviousMonthData] =
        useState<HeatmapData | null>(null)
    const tooltipRef = useRef<HTMLDivElement>(null)

    const today = new Date()
    const isCurrentMonth =
        currentMonth === today.getMonth() + 1 &&
        currentYear === today.getFullYear()

    useEffect(() => {
        const fetchHeatmap = async () => {
            try {
                setLoading(true)
                setError(null)

                // Fetch current month data
                const data = await dashboardApi.getCalendarHeatmap(
                    currentYear,
                    currentMonth
                )
                setHeatmap(data)

                // Fetch previous month for comparison
                const prevMonth = currentMonth === 1 ? 12 : currentMonth - 1
                const prevYear =
                    currentMonth === 1 ? currentYear - 1 : currentYear
                try {
                    const prevData = await dashboardApi.getCalendarHeatmap(
                        prevYear,
                        prevMonth
                    )
                    setPreviousMonthData(prevData)
                } catch {
                    // Ignore error for previous month
                }
            } catch (err: any) {
                setError(err.message || 'Failed to load calendar heatmap')
            } finally {
                setLoading(false)
            }
        }

        fetchHeatmap()
    }, [currentYear, currentMonth])

    const getGradientStyle = (level: string) => {
        switch (level) {
            case 'HIGH':
                return {
                    background:
                        'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                }
            case 'MEDIUM':
                return {
                    background:
                        'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                }
            case 'LOW':
                return {
                    background:
                        'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                }
            default:
                return {
                    background: '#2D2D2D',
                }
        }
    }

    const getBorderColor = (level: string) => {
        switch (level) {
            case 'HIGH':
                return 'border-green-500/30'
            case 'MEDIUM':
                return 'border-blue-500/30'
            case 'LOW':
                return 'border-orange-500/30'
            default:
                return 'border-[#2D2D2D]'
        }
    }

    const isToday = (dateString: string) => {
        if (!isCurrentMonth) return false
        const date = new Date(dateString)
        const today = new Date()
        return (
            date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
        )
    }

    const handleDayHover = (
        day: DayData,
        event: React.MouseEvent<HTMLDivElement>
    ) => {
        setHoveredDay(day)
        const rect = event.currentTarget.getBoundingClientRect()
        setTooltipPosition({
            x: rect.left + rect.width / 2,
            y: rect.top - 10,
        })
    }

    const handleDayLeave = () => {
        setHoveredDay(null)
    }

    const goToPreviousMonth = () => {
        if (currentMonth > 1) {
            setCurrentMonth(currentMonth - 1)
        } else {
            setCurrentMonth(12)
            setCurrentYear(currentYear - 1)
        }
    }

    const goToNextMonth = () => {
        if (currentMonth < 12) {
            setCurrentMonth(currentMonth + 1)
        } else {
            setCurrentMonth(1)
            setCurrentYear(currentYear + 1)
        }
    }

    const goToToday = () => {
        const today = new Date()
        setCurrentMonth(today.getMonth() + 1)
        setCurrentYear(today.getFullYear())
    }

    const getComparisonText = () => {
        if (!previousMonthData || !heatmap) return null

        const currentActiveDays = heatmap.summary.activeDays
        const previousActiveDays = previousMonthData.summary.activeDays
        const diff = currentActiveDays - previousActiveDays

        if (diff > 0) {
            return {
                text: `Tăng ${diff} ngày`,
                color: 'text-green-400',
                icon: TrendingUp,
            }
        } else if (diff < 0) {
            return {
                text: `Giảm ${Math.abs(diff)} ngày`,
                color: 'text-orange-400',
                icon: TrendingUp,
            }
        }
        return {
            text: 'Không đổi',
            color: 'text-gray-400',
            icon: Activity,
        }
    }

    const renderCalendarGrid = () => {
        if (!heatmap) return null

        const firstDayOfMonth = new Date(
            currentYear,
            currentMonth - 1,
            1
        ).getDay()

        // Create array of all days in month
        const calendarDays: (DayData | null)[] = []

        // Add empty cells for days before month starts
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(null)
        }

        // Add actual days
        heatmap.days.forEach((day) => {
            const dayIndex = new Date(day.date).getDate() - 1
            calendarDays[firstDayOfMonth + dayIndex] = day
        })

        return (
            <div className='grid grid-cols-7 gap-1.5'>
                {calendarDays.map((day, index) => {
                    if (!day) {
                        return (
                            <div
                                key={`empty-${index}`}
                                className='aspect-square rounded bg-[#1A1A1A]'
                            />
                        )
                    }

                    const date = new Date(day.date)
                    const dayOfMonth = date.getDate()
                    const isTodayDay = isToday(day.date)

                    return (
                        <div
                            key={day.date}
                            className={`aspect-square rounded transition-all duration-200 cursor-pointer group relative overflow-hidden ${
                                isTodayDay
                                    ? 'ring-2 ring-blue-500 ring-offset-2 ring-offset-[#1A1A1A]'
                                    : ''
                            } ${getBorderColor(
                                day.level
                            )} border-2 hover:scale-110 hover:z-10`}
                            style={getGradientStyle(day.level)}
                            onMouseEnter={(e) => handleDayHover(day, e)}
                            onMouseLeave={handleDayLeave}
                        >
                            {/* Day number */}
                            <div className='absolute top-1 left-1 text-xs font-medium text-white/80'>
                                {dayOfMonth}
                            </div>

                            {/* Hover overlay */}
                            <div className='absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center'>
                                <div className='text-xs text-white text-center px-1'>
                                    <div className='font-semibold'>
                                        {day.studyMinutes}m
                                    </div>
                                    <div className='text-white/80'>
                                        {day.lessonCount} bài
                                    </div>
                                </div>
                            </div>

                            {/* Pulse animation for today */}
                            {isTodayDay && (
                                <div className='absolute inset-0 rounded animate-pulse bg-blue-500/20' />
                            )}
                        </div>
                    )
                })}
            </div>
        )
    }

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] animate-in fade-in duration-300'>
                <CardHeader>
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Calendar className='h-5 w-5 text-blue-400' />
                        Lịch học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-12'>
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
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Calendar className='h-5 w-5 text-blue-400' />
                        Lịch học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex flex-col items-center justify-center py-12 text-center'>
                        <Calendar className='h-12 w-12 text-gray-600 mb-4' />
                        <p className='text-red-400 text-sm mb-2'>
                            {error || 'Không có dữ liệu'}
                        </p>
                        <p className='text-gray-500 text-xs'>
                            Hãy bắt đầu học để xem lịch học tập của bạn
                        </p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const comparison = getComparisonText()

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] animate-in fade-in duration-300'>
            <CardHeader>
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div>
                        <CardTitle className='text-white flex items-center gap-2'>
                            <Calendar className='h-5 w-5 text-blue-400' />
                            Lịch học tập
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            {MONTH_NAMES[currentMonth - 1]} {currentYear}
                        </CardDescription>
                    </div>
                    <div className='flex items-center gap-2'>
                        <button
                            onClick={goToPreviousMonth}
                            className='p-2 text-gray-400 hover:text-white border border-[#2D2D2D] rounded-lg hover:border-white/30 hover:bg-white/5 transition-all duration-200'
                            aria-label='Tháng trước'
                        >
                            <ChevronLeft className='h-4 w-4' />
                        </button>
                        {!isCurrentMonth && (
                            <button
                                onClick={goToToday}
                                className='px-3 py-2 text-xs text-gray-400 hover:text-white border border-[#2D2D2D] rounded-lg hover:border-white/30 hover:bg-white/5 transition-all duration-200'
                            >
                                Hôm nay
                            </button>
                        )}
                        <button
                            onClick={goToNextMonth}
                            className='p-2 text-gray-400 hover:text-white border border-[#2D2D2D] rounded-lg hover:border-white/30 hover:bg-white/5 transition-all duration-200'
                            aria-label='Tháng sau'
                        >
                            <ChevronRight className='h-4 w-4' />
                        </button>
                    </div>
                </div>
            </CardHeader>
            <CardContent className='space-y-6'>
                {/* Legend */}
                <div className='flex items-center justify-between flex-wrap gap-4'>
                    <div className='flex items-center gap-4'>
                        <span className='text-xs text-gray-400'>Mức độ:</span>
                        <div className='flex items-center gap-3'>
                            <div className='flex items-center gap-1.5'>
                                <div className='w-3 h-3 rounded bg-[#2D2D2D] border border-[#2D2D2D]' />
                                <span className='text-xs text-gray-500'>
                                    Không có
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <div
                                    className='w-3 h-3 rounded border border-orange-500/30'
                                    style={getGradientStyle('LOW')}
                                />
                                <span className='text-xs text-gray-500'>
                                    Thấp
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <div
                                    className='w-3 h-3 rounded border border-blue-500/30'
                                    style={getGradientStyle('MEDIUM')}
                                />
                                <span className='text-xs text-gray-500'>
                                    Trung bình
                                </span>
                            </div>
                            <div className='flex items-center gap-1.5'>
                                <div
                                    className='w-3 h-3 rounded border border-green-500/30'
                                    style={getGradientStyle('HIGH')}
                                />
                                <span className='text-xs text-gray-500'>
                                    Cao
                                </span>
                            </div>
                        </div>
                    </div>
                    {comparison && (
                        <div
                            className={`flex items-center gap-1.5 text-xs ${comparison.color}`}
                        >
                            <comparison.icon className='h-3.5 w-3.5' />
                            <span>So với tháng trước: {comparison.text}</span>
                        </div>
                    )}
                </div>

                {/* Calendar Grid */}
                <div>
                    <div className='grid grid-cols-7 gap-1.5 mb-2'>
                        {['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'].map(
                            (day) => (
                                <div
                                    key={day}
                                    className='text-xs text-gray-400 text-center font-medium'
                                >
                                    {day}
                                </div>
                            )
                        )}
                    </div>
                    {renderCalendarGrid()}
                </div>

                {/* Tooltip */}
                {hoveredDay && (
                    <div
                        ref={tooltipRef}
                        className='fixed z-50 pointer-events-none animate-in fade-in slide-in-from-bottom-2 duration-200'
                        style={{
                            left: `${tooltipPosition.x}px`,
                            top: `${tooltipPosition.y}px`,
                            transform: 'translate(-50%, -100%)',
                        }}
                    >
                        <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg shadow-xl p-3 min-w-[160px]'>
                            <div className='text-xs text-gray-400 mb-1'>
                                {new Date(hoveredDay.date).toLocaleDateString(
                                    'vi-VN',
                                    {
                                        weekday: 'long',
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    }
                                )}
                            </div>
                            <div className='space-y-1.5'>
                                <div className='flex items-center gap-2'>
                                    <Clock className='h-3.5 w-3.5 text-blue-400' />
                                    <span className='text-sm text-white font-medium'>
                                        {hoveredDay.studyMinutes} phút
                                    </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <BookOpen className='h-3.5 w-3.5 text-green-400' />
                                    <span className='text-sm text-white font-medium'>
                                        {hoveredDay.lessonCount} bài học
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className='absolute left-1/2 top-full -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[#2D2D2D]' />
                    </div>
                )}

                {/* Summary Section */}
                {heatmap.summary && (
                    <div className='pt-4 border-t border-[#2D2D2D]'>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            <div className='bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D] hover:border-blue-500/30 transition-colors'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='p-2 rounded-lg bg-blue-500/10'>
                                        <Activity className='h-4 w-4 text-blue-400' />
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Ngày hoạt động
                                    </p>
                                </div>
                                <p className='text-2xl font-bold text-white'>
                                    {heatmap.summary.activeDays}
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>
                                    / {heatmap.summary.totalDays} ngày
                                </p>
                            </div>

                            <div className='bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D] hover:border-green-500/30 transition-colors'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='p-2 rounded-lg bg-green-500/10'>
                                        <BookOpen className='h-4 w-4 text-green-400' />
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Tổng bài học
                                    </p>
                                </div>
                                <p className='text-2xl font-bold text-white'>
                                    {heatmap.summary.totalLessons}
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>
                                    bài học
                                </p>
                            </div>

                            <div className='bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D] hover:border-orange-500/30 transition-colors'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='p-2 rounded-lg bg-orange-500/10'>
                                        <Clock className='h-4 w-4 text-orange-400' />
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Tổng thời gian
                                    </p>
                                </div>
                                <p className='text-2xl font-bold text-white'>
                                    {Math.floor(
                                        heatmap.summary.totalStudyMinutes / 60
                                    )}
                                    h
                                </p>
                                <p className='text-xs text-gray-500 mt-1'>
                                    {heatmap.summary.totalStudyMinutes % 60}m
                                </p>
                            </div>

                            <div className='bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D] hover:border-purple-500/30 transition-colors'>
                                <div className='flex items-center gap-2 mb-2'>
                                    <div className='p-2 rounded-lg bg-purple-500/10'>
                                        <Target className='h-4 w-4 text-purple-400' />
                                    </div>
                                    <p className='text-xs text-gray-400'>
                                        Tỷ lệ hoạt động
                                    </p>
                                </div>
                                <p className='text-2xl font-bold text-white'>
                                    {Math.round(
                                        (heatmap.summary.activeDays /
                                            heatmap.summary.totalDays) *
                                            100
                                    )}
                                    %
                                </p>
                                <div className='mt-2 w-full bg-[#2D2D2D] rounded-full h-1.5'>
                                    <div
                                        className='bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500'
                                        style={{
                                            width: `${Math.round(
                                                (heatmap.summary.activeDays /
                                                    heatmap.summary.totalDays) *
                                                    100
                                            )}%`,
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
