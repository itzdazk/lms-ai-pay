import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, Flame } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'
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

export function LearningStreakCard() {
    const [streak, setStreak] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        const fetchStreak = async () => {
            try {
                setLoading(true)
                setError(null)
                const data = await dashboardApi.getLearningStreak()
                setStreak(data)
            } catch (err: any) {
                setError(err.message || 'Failed to load learning streak')
            } finally {
                setLoading(false)
            }
        }

        fetchStreak()
    }, [])

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Chuỗi học tập</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !streak) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Chuỗi học tập</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>
                        {error || 'Không có dữ liệu'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Prepare data for weekly pattern chart
    const weeklyPatternData = [
        {
            day: 'T2',
            value: streak.weeklyPattern?.monday ? 1 : 0,
            fullName: 'Thứ 2',
        },
        {
            day: 'T3',
            value: streak.weeklyPattern?.tuesday ? 1 : 0,
            fullName: 'Thứ 3',
        },
        {
            day: 'T4',
            value: streak.weeklyPattern?.wednesday ? 1 : 0,
            fullName: 'Thứ 4',
        },
        {
            day: 'T5',
            value: streak.weeklyPattern?.thursday ? 1 : 0,
            fullName: 'Thứ 5',
        },
        {
            day: 'T6',
            value: streak.weeklyPattern?.friday ? 1 : 0,
            fullName: 'Thứ 6',
        },
        {
            day: 'T7',
            value: streak.weeklyPattern?.saturday ? 1 : 0,
            fullName: 'Thứ 7',
        },
        {
            day: 'CN',
            value: streak.weeklyPattern?.sunday ? 1 : 0,
            fullName: 'Chủ nhật',
        },
    ]

    const activeDaysCount = weeklyPatternData.filter((d) => d.value > 0).length

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Flame className='h-5 w-5 text-orange-500' />
                    Chuỗi học tập
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-6'>
                <div className='text-center'>
                    <div className='flex items-center justify-center gap-2 mb-2'>
                        <Flame
                            className={`h-12 w-12 ${
                                streak.currentStreak > 0
                                    ? 'text-orange-500'
                                    : 'text-gray-500'
                            }`}
                        />
                        <div>
                            <div className='text-4xl font-bold text-white'>
                                {streak.currentStreak}
                            </div>
                            <p className='text-sm text-gray-400'>
                                ngày liên tiếp
                            </p>
                        </div>
                    </div>
                    {streak.streakMaintained && (
                        <Badge className='bg-green-500/20 text-green-400 border-green-500/30'>
                            Đang duy trì
                        </Badge>
                    )}
                    {!streak.streakMaintained && streak.currentStreak === 0 && (
                        <Badge className='bg-gray-500/20 text-gray-400 border-gray-500/30'>
                            Chưa bắt đầu
                        </Badge>
                    )}
                </div>

                <div className='grid grid-cols-2 gap-4 pt-4 border-t border-[#2D2D2D]'>
                    <div>
                        <p className='text-xs text-gray-400 mb-1'>
                            Kỷ lục dài nhất
                        </p>
                        <p className='text-xl font-semibold text-white'>
                            {streak.longestStreak} ngày
                        </p>
                    </div>
                    <div>
                        <p className='text-xs text-gray-400 mb-1'>
                            Lần học cuối
                        </p>
                        <p className='text-sm text-white'>
                            {streak.lastLearningDate
                                ? new Date(
                                      streak.lastLearningDate
                                  ).toLocaleDateString('vi-VN')
                                : 'Chưa có'}
                        </p>
                    </div>
                </div>

                {/* Weekly Pattern Chart */}
                <div className='pt-4 border-t border-[#2D2D2D]'>
                    <div className='mb-3'>
                        <h3 className='text-sm font-semibold text-white mb-1'>
                            Pattern học tập trong tuần
                        </h3>
                        <p className='text-xs text-gray-400'>
                            Ngày nào trong tuần bạn thường học (
                            {activeDaysCount}/7 ngày)
                        </p>
                    </div>
                    <ResponsiveContainer width='100%' height={200}>
                        <BarChart
                            data={weeklyPatternData}
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
                                dataKey='day'
                                stroke='#9CA3AF'
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke='#9CA3AF'
                                domain={[0, 1]}
                                style={{ fontSize: '12px' }}
                                hide
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                }}
                                formatter={(value: number | undefined) => [
                                    value === 1 ? 'Có học' : 'Không học',
                                    '',
                                ]}
                                labelFormatter={(label, payload) => {
                                    const data = payload?.[0]?.payload
                                    return data?.fullName || label
                                }}
                            />
                            <Bar dataKey='value' radius={[4, 4, 0, 0]}>
                                {weeklyPatternData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={
                                            entry.value === 1
                                                ? '#F97316'
                                                : '#2D2D2D'
                                        }
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {streak.daysUntilStreakBreak > 0 && (
                    <div className='p-3 rounded-lg bg-orange-500/10 border border-orange-500/30'>
                        <p className='text-xs text-orange-400'>
                            ⚠️ Còn {streak.daysUntilStreakBreak} ngày để duy trì
                            chuỗi
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
