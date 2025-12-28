import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, Flame } from 'lucide-react'
import { dashboardApi } from '../../lib/api/dashboard'

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

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Flame className='h-5 w-5 text-orange-500' />
                    Chuỗi học tập
                </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
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
