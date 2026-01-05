import { useState, useMemo } from 'react'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { Loader2, Calendar, Clock } from 'lucide-react'
import { useStudyTime } from '../../hooks/useStudyTime'
import { formatStudyTime } from '../../lib/dashboardUtils'
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

type PeriodType = 'day' | 'month' | 'year'

export function StudyTimeAnalytics() {
    const { analytics, loading, error } = useStudyTime()
    const [period, setPeriod] = useState<PeriodType>('day')

    // Process data based on selected period
    const chartData = useMemo(() => {
        if (!analytics?.trend || analytics.trend.length === 0) return []

        const data = analytics.trend.map((item) => ({
            ...item,
            dateObj: new Date(item.date),
        }))

        switch (period) {
            case 'day': {
                // Last 30 days
                const last30Days = data.slice(-30)
                return last30Days.map((item) => {
                    const date = item.dateObj
                    return {
                        label: date.toLocaleDateString('vi-VN', {
                            day: '2-digit',
                            month: '2-digit',
                        }),
                        fullLabel: date.toLocaleDateString('vi-VN', {
                            weekday: 'long',
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                        }),
                        value: item.studyTime,
                        formatted: item.formatted,
                        date: item.date,
                    }
                })
            }
            case 'month': {
                // Group by month - last 12 months
                const monthlyMap = new Map<string, number>()
                const monthLabels = new Map<string, string>()

                data.forEach((item) => {
                    const date = item.dateObj
                    const monthKey = `${date.getFullYear()}-${date.getMonth()}`
                    const fullMonthLabel = date.toLocaleDateString('vi-VN', {
                        month: 'long',
                        year: 'numeric',
                    })

                    if (!monthlyMap.has(monthKey)) {
                        monthlyMap.set(monthKey, 0)
                        monthLabels.set(monthKey, fullMonthLabel)
                    }
                    monthlyMap.set(
                        monthKey,
                        monthlyMap.get(monthKey)! + item.studyTime
                    )
                })

                // Get last 12 months
                const sortedMonths = Array.from(monthlyMap.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .slice(-12)

                return sortedMonths.map(([monthKey, totalTime]) => {
                    const [year, month] = monthKey.split('-').map(Number)
                    const date = new Date(year, month, 1)
                    const fullLabel =
                        monthLabels.get(monthKey) ||
                        date.toLocaleDateString('vi-VN', {
                            month: 'long',
                            year: 'numeric',
                        })
                    return {
                        label: date.toLocaleDateString('vi-VN', {
                            month: 'short',
                            year: 'numeric',
                        }),
                        fullLabel,
                        value: totalTime,
                        formatted: formatStudyTime(totalTime),
                        date: date.toISOString(),
                    }
                })
            }
            case 'year': {
                // Group by year - all available years
                const yearlyMap = new Map<number, number>()

                data.forEach((item) => {
                    const year = item.dateObj.getFullYear()
                    if (!yearlyMap.has(year)) {
                        yearlyMap.set(year, 0)
                    }
                    yearlyMap.set(year, yearlyMap.get(year)! + item.studyTime)
                })

                return Array.from(yearlyMap.entries())
                    .sort((a, b) => a[0] - b[0])
                    .map(([year, totalTime]) => {
                        return {
                            label: year.toString(),
                            fullLabel: `Năm ${year}`,
                            value: totalTime,
                            formatted: formatStudyTime(totalTime),
                            date: new Date(year, 0, 1).toISOString(),
                        }
                    })
            }
            default:
                return []
        }
    }, [analytics, period])

    // Calculate statistics for current period
    const stats = useMemo(() => {
        if (!chartData || chartData.length === 0) return null

        const total = chartData.reduce((sum, item) => sum + item.value, 0)
        const average = chartData.length > 0 ? total / chartData.length : 0

        // Find max value and item
        const max = Math.max(...chartData.map((item) => item.value))
        const maxItem = chartData.find((item) => item.value === max)

        // Find min value and item (exclude 0 if all values are > 0)
        const values = chartData.map((item) => item.value)
        const min = Math.min(...values)
        const minItem = chartData.find((item) => item.value === min)

        // Calculate trend (compare last 2 periods)
        let trend = 0
        let trendLabel = ''
        if (chartData.length >= 2) {
            const current = chartData[chartData.length - 1]?.value || 0
            const previous = chartData[chartData.length - 2]?.value || 0
            if (previous > 0) {
                trend = ((current - previous) / previous) * 100
                trendLabel = `So với ${
                    period === 'day'
                        ? 'ngày'
                        : period === 'month'
                        ? 'tháng'
                        : 'năm'
                } trước`
            }
        }

        return {
            total,
            average,
            max,
            maxItem,
            min,
            minItem,
            trend,
            trendLabel,
            count: chartData.length,
        }
    }, [chartData, period])

    // Get color for bars based on value
    const getBarColor = (value: number, max: number) => {
        if (max === 0) return '#3B82F6'
        const percentage = (value / max) * 100
        if (percentage >= 80) return '#10B981' // Green for high
        if (percentage >= 50) return '#3B82F6' // Blue for medium
        if (percentage >= 20) return '#F59E0B' // Orange for low-medium
        return '#6B7280' // Gray for low
    }

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>
                        Phân tích thời gian học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-12'>
                        <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
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
                        Phân tích thời gian học tập
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm py-8'>
                        {error || 'Không có dữ liệu'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const maxValue = stats
        ? Math.max(...chartData.map((item) => item.value))
        : 0

    return (
        <div className='space-y-6'>
            {/* Header with Filter */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4'>
                        <div>
                            <CardTitle className='text-white flex items-center gap-2 mb-2'>
                                <Calendar className='h-5 w-5 text-blue-400' />
                                Phân tích thời gian học tập
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Xem chi tiết thời gian học của bạn theo ngày,
                                tháng hoặc năm
                            </CardDescription>
                        </div>
                        <div className='flex gap-2'>
                            <button
                                onClick={() => setPeriod('day')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    period === 'day'
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D] hover:text-white'
                                }`}
                            >
                                Theo ngày
                            </button>
                            <button
                                onClick={() => setPeriod('month')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    period === 'month'
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D] hover:text-white'
                                }`}
                            >
                                Theo tháng
                            </button>
                            <button
                                onClick={() => setPeriod('year')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                    period === 'year'
                                        ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/20'
                                        : 'bg-[#2D2D2D] text-gray-400 hover:bg-[#3D3D3D] hover:text-white'
                                }`}
                            >
                                Theo năm
                            </button>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Statistics Summary */}
            {stats && (
                <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Tổng thời gian
                                    </p>
                                    <p className='text-xl font-bold text-white'>
                                        {formatStudyTime(stats.total)}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        {stats.count}{' '}
                                        {period === 'day'
                                            ? 'ngày'
                                            : period === 'month'
                                            ? 'tháng'
                                            : 'năm'}
                                    </p>
                                </div>
                                <div className='p-2 rounded-lg bg-blue-500/10 border border-blue-500/20'>
                                    <Clock className='h-5 w-5 text-blue-400' />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Trung bình
                                    </p>
                                    <p className='text-xl font-bold text-white'>
                                        {formatStudyTime(stats.average)}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1'>
                                        Mỗi{' '}
                                        {period === 'day'
                                            ? 'ngày'
                                            : period === 'month'
                                            ? 'tháng'
                                            : 'năm'}
                                    </p>
                                </div>
                                <div className='p-2 rounded-lg bg-green-500/10 border border-green-500/20'>
                                    <Clock className='h-5 w-5 text-green-400' />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Cao nhất
                                    </p>
                                    <p className='text-xl font-bold text-white'>
                                        {formatStudyTime(stats.max)}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1 truncate max-w-[100px]'>
                                        {stats.maxItem?.fullLabel ||
                                            stats.maxItem?.label ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div className='p-2 rounded-lg bg-purple-500/10 border border-purple-500/20'>
                                    <Clock className='h-5 w-5 text-purple-400' />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardContent className='pt-6'>
                            <div className='flex items-center justify-between'>
                                <div>
                                    <p className='text-sm text-gray-400 mb-1'>
                                        Thấp nhất
                                    </p>
                                    <p className='text-xl font-bold text-white'>
                                        {formatStudyTime(stats.min)}
                                    </p>
                                    <p className='text-xs text-gray-500 mt-1 truncate max-w-[100px]'>
                                        {stats.minItem?.fullLabel ||
                                            stats.minItem?.label ||
                                            'N/A'}
                                    </p>
                                </div>
                                <div className='p-2 rounded-lg bg-orange-500/10 border border-orange-500/20'>
                                    <Clock className='h-5 w-5 text-orange-400' />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Main Chart */}
            {chartData && chartData.length > 0 ? (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Biểu đồ thời gian học tập
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            {period === 'day'
                                ? 'Thời gian học trong 30 ngày qua (giờ/phút)'
                                : period === 'month'
                                ? 'Thời gian học trong 12 tháng qua (giờ/phút)'
                                : 'Thời gian học theo năm (giờ/phút)'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ResponsiveContainer width='100%' height={500}>
                            <BarChart
                                data={chartData}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 60,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='#2D2D2D'
                                    vertical={false}
                                />
                                <XAxis
                                    dataKey='label'
                                    stroke='#9CA3AF'
                                    style={{ fontSize: '12px' }}
                                    angle={period === 'day' ? -45 : 0}
                                    textAnchor={
                                        period === 'day' ? 'end' : 'middle'
                                    }
                                    height={period === 'day' ? 80 : 40}
                                />
                                <YAxis
                                    stroke='#9CA3AF'
                                    style={{ fontSize: '12px' }}
                                    label={{
                                        value: 'Thời gian học (giờ/phút)',
                                        angle: -90,
                                        position: 'insideLeft',
                                        style: {
                                            textAnchor: 'middle',
                                            fill: '#9CA3AF',
                                        },
                                    }}
                                    tickFormatter={(value) => {
                                        const hours = Math.floor(value / 3600)
                                        const minutes = Math.floor(
                                            (value % 3600) / 60
                                        )
                                        if (hours > 0) {
                                            return `${hours}h`
                                        }
                                        return `${minutes}m`
                                    }}
                                />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: '#FFFFFF',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '8px',
                                        color: '#1F2937',
                                        padding: '12px',
                                        boxShadow:
                                            '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    }}
                                    formatter={(value: number | undefined) => {
                                        if (
                                            value === undefined ||
                                            value === null
                                        ) {
                                            return ['0 phút', 'Thời gian học']
                                        }
                                        const hours = Math.floor(value / 3600)
                                        const minutes = Math.floor(
                                            (value % 3600) / 60
                                        )
                                        const seconds = value % 60
                                        let formatted = ''
                                        if (hours > 0) {
                                            formatted += `${hours} giờ `
                                        }
                                        if (minutes > 0) {
                                            formatted += `${minutes} phút `
                                        }
                                        if (seconds > 0 && hours === 0) {
                                            formatted += `${seconds} giây`
                                        }
                                        return [
                                            formatted.trim() || '0 phút',
                                            'Thời gian học',
                                        ]
                                    }}
                                    labelFormatter={(label, payload) => {
                                        if (payload && payload[0]) {
                                            return payload[0].payload.fullLabel
                                        }
                                        return label
                                    }}
                                />
                                <Bar
                                    dataKey='value'
                                    radius={[8, 8, 0, 0]}
                                    animationDuration={800}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={getBarColor(
                                                entry.value,
                                                maxValue
                                            )}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>

                        {/* Chart Legend */}
                        <div className='mt-6 pt-6 border-t border-[#2D2D2D]'>
                            <div className='flex flex-wrap items-center gap-4 text-sm'>
                                <div className='flex items-center gap-2'>
                                    <div className='w-4 h-4 rounded bg-[#10B981]'></div>
                                    <span className='text-gray-400'>
                                        Cao (≥80% max)
                                    </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className='w-4 h-4 rounded bg-[#3B82F6]'></div>
                                    <span className='text-gray-400'>
                                        Trung bình (50-79%)
                                    </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className='w-4 h-4 rounded bg-[#F59E0B]'></div>
                                    <span className='text-gray-400'>
                                        Thấp-trung bình (20-49%)
                                    </span>
                                </div>
                                <div className='flex items-center gap-2'>
                                    <div className='w-4 h-4 rounded bg-[#6B7280]'></div>
                                    <span className='text-gray-400'>
                                        Thấp (&lt;20%)
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardContent className='py-12'>
                        <p className='text-gray-400 text-center'>
                            Chưa có dữ liệu để hiển thị
                        </p>
                    </CardContent>
                </Card>
            )}

            {/* Additional Info */}
            {analytics && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white text-lg'>
                            Tổng quan
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                            <div className='p-3 rounded-lg border border-[#2D2D2D] bg-black/40'>
                                <p className='text-xs text-gray-400 mb-1'>
                                    Hôm nay
                                </p>
                                <p className='text-lg font-semibold text-white'>
                                    {analytics.formatted.today}
                                </p>
                            </div>
                            <div className='p-3 rounded-lg border border-[#2D2D2D] bg-black/40'>
                                <p className='text-xs text-gray-400 mb-1'>
                                    Tuần này
                                </p>
                                <p className='text-lg font-semibold text-white'>
                                    {analytics.formatted.thisWeek}
                                </p>
                            </div>
                            <div className='p-3 rounded-lg border border-[#2D2D2D] bg-black/40'>
                                <p className='text-xs text-gray-400 mb-1'>
                                    Tháng này
                                </p>
                                <p className='text-lg font-semibold text-white'>
                                    {analytics.formatted.thisMonth}
                                </p>
                            </div>
                            <div className='p-3 rounded-lg border border-[#2D2D2D] bg-black/40'>
                                <p className='text-xs text-gray-400 mb-1'>
                                    Tổng cộng
                                </p>
                                <p className='text-lg font-semibold text-white'>
                                    {analytics.formatted.allTime}
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
