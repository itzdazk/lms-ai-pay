import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { Loader2, TrendingUp } from 'lucide-react'
import { useStudyTime } from '../../hooks/useStudyTime'
import { formatStudyTime } from '../../lib/dashboardUtils'
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from 'recharts'

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

    // Prepare data for time totals chart
    const timeTotalsData = [
        {
            name: 'Hôm nay',
            value: analytics.totals.today,
            formatted: analytics.formatted.today,
            color: '#3B82F6',
        },
        {
            name: 'Tuần này',
            value: analytics.totals.thisWeek,
            formatted: analytics.formatted.thisWeek,
            color: '#10B981',
        },
        {
            name: 'Tháng này',
            value: analytics.totals.thisMonth,
            formatted: analytics.formatted.thisMonth,
            color: '#F59E0B',
        },
        {
            name: 'Tổng cộng',
            value: analytics.totals.allTime,
            formatted: analytics.formatted.allTime,
            color: '#8B5CF6',
        },
    ]

    return (
        <div className='space-y-4'>
            {/* Time Totals Chart */}
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
                    <ResponsiveContainer width='100%' height={300}>
                        <BarChart
                            data={timeTotalsData}
                            margin={{
                                top: 5,
                                right: 10,
                                left: 0,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray='3 3'
                                stroke='#2D2D2D'
                            />
                            <XAxis
                                dataKey='name'
                                stroke='#9CA3AF'
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke='#9CA3AF'
                                style={{ fontSize: '12px' }}
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
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                }}
                                itemStyle={{
                                    color: '#FFFFFF',
                                }}
                                formatter={(
                                    value: number | undefined,
                                    payload: any
                                ) => {
                                    if (value === undefined || !payload)
                                        return ['0m', '']
                                    const hours = Math.floor(value / 3600)
                                    const minutes = Math.floor(
                                        (value % 3600) / 60
                                    )
                                    const formatted =
                                        hours > 0
                                            ? `${hours}h ${minutes}m`
                                            : `${minutes}m`
                                    return [formatted, 'Thời gian học']
                                }}
                                labelFormatter={(label) =>
                                    `Khoảng thời gian: ${label}`
                                }
                            />
                            <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                                {timeTotalsData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                    <div className='mt-6 pt-4 border-t border-[#2D2D2D]'>
                        <div className='flex items-center justify-between'>
                            <div className='flex items-center gap-3'>
                                <div className='p-2 rounded-lg bg-blue-500/10 border border-blue-500/20'>
                                    <TrendingUp className='h-5 w-5 text-blue-400' />
                                </div>
                                <div>
                                    <p className='text-sm text-gray-400'>
                                        Trung bình mỗi ngày
                                    </p>
                                    <p className='text-xs text-gray-500 mt-0.5'>
                                        30 ngày qua
                                    </p>
                                </div>
                            </div>
                            <div className='text-right'>
                                <p className='text-2xl font-bold text-white'>
                                    {formatStudyTime(analytics.dailyAverage)}
                                </p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Trend Chart */}
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
                        <ResponsiveContainer width='100%' height={300}>
                            <AreaChart
                                data={analytics.trend}
                                margin={{
                                    top: 5,
                                    right: 10,
                                    left: 0,
                                    bottom: 0,
                                }}
                            >
                                <defs>
                                    <linearGradient
                                        id='studyTimeGradient'
                                        x1='0'
                                        y1='0'
                                        x2='0'
                                        y2='1'
                                    >
                                        <stop
                                            offset='5%'
                                            stopColor='#3B82F6'
                                            stopOpacity={0.3}
                                        />
                                        <stop
                                            offset='95%'
                                            stopColor='#3B82F6'
                                            stopOpacity={0}
                                        />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid
                                    strokeDasharray='3 3'
                                    stroke='#2D2D2D'
                                />
                                <XAxis
                                    dataKey='date'
                                    stroke='#9CA3AF'
                                    style={{ fontSize: '12px' }}
                                    tickFormatter={(value) => {
                                        const date = new Date(value)
                                        return `${date.getDate()}/${
                                            date.getMonth() + 1
                                        }`
                                    }}
                                />
                                <YAxis
                                    stroke='#9CA3AF'
                                    style={{ fontSize: '12px' }}
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
                                        backgroundColor: '#1F1F1F',
                                        border: '1px solid #2D2D2D',
                                        borderRadius: '8px',
                                        color: '#FFFFFF',
                                    }}
                                    formatter={(value: number | undefined) => {
                                        if (value === undefined)
                                            return ['0m', '']
                                        const hours = Math.floor(value / 3600)
                                        const minutes = Math.floor(
                                            (value % 3600) / 60
                                        )
                                        const formatted =
                                            hours > 0
                                                ? `${hours}h ${minutes}m`
                                                : `${minutes}m`
                                        return [formatted, 'Thời gian học']
                                    }}
                                    labelFormatter={(label) => {
                                        const date = new Date(label)
                                        return `Ngày: ${date.toLocaleDateString(
                                            'vi-VN'
                                        )}`
                                    }}
                                />
                                <Area
                                    type='monotone'
                                    dataKey='studyTime'
                                    stroke='#3B82F6'
                                    strokeWidth={2}
                                    fill='url(#studyTimeGradient)'
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
