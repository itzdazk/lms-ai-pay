import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from '../ui/card'
import {
    Loader2,
    Clock,
    BookOpen,
    Play,
    CheckCircle,
} from 'lucide-react'
import { dashboardApi, type StudySchedule } from '../../lib/api/dashboard'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { Progress } from '../ui/progress'

interface TodayScheduleProps {
    onScheduleUpdate?: () => void
}

export function TodaySchedule({ onScheduleUpdate }: TodayScheduleProps) {
    const [schedules, setSchedules] = useState<StudySchedule[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchTodaySchedules()
    }, [])

    const fetchTodaySchedules = async () => {
        try {
            setLoading(true)
            const data = await dashboardApi.getTodaySchedules()
            setSchedules(data)
        } catch (err: any) {
            console.error('Failed to load today schedules:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleComplete = async (id: number) => {
        try {
            await dashboardApi.completeSchedule(id)
            fetchTodaySchedules()
            onScheduleUpdate?.()
        } catch (err: any) {
            console.error('Failed to complete schedule:', err)
        }
    }

    const getTimeRemaining = (schedule: StudySchedule) => {
        const now = new Date()
        const scheduled = new Date(schedule.scheduledDate)
        const diff = scheduled.getTime() - now.getTime()
        const minutes = Math.ceil(diff / (1000 * 60))
        return minutes
    }

    const formatTime = (dateString: string) => {
        const date = new Date(dateString)
        return date.toLocaleTimeString('vi-VN', {
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Lịch học hôm nay</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (schedules.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Lịch học hôm nay</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='text-center py-8'>
                        <BookOpen className='h-12 w-12 text-gray-600 mx-auto mb-4' />
                        <p className='text-gray-400'>Không có lịch học nào hôm nay</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white flex items-center gap-2'>
                    <Clock className='h-5 w-5 text-blue-400' />
                    Lịch học hôm nay ({schedules.length})
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className='space-y-3'>
                    {schedules.map((schedule) => {
                        const timeRemaining = getTimeRemaining(schedule)
                        const isUpcoming = timeRemaining > 0 && timeRemaining <= 60
                        const isPast = timeRemaining < 0
                        const canStart = timeRemaining <= 5

                        const lessonUrl = schedule.lesson
                            ? `/courses/${schedule.course.slug}/lessons/${schedule.lesson.slug}`
                            : `/courses/${schedule.course.slug}/lessons`

                        return (
                            <div
                                key={schedule.id}
                                className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-4 hover:border-blue-500/30 transition-colors'
                            >
                                <div className='flex items-start justify-between gap-4'>
                                    <div className='flex-1'>
                                        <div className='flex items-center gap-2 mb-2'>
                                            <Clock className='h-4 w-4 text-blue-400' />
                                            <span className='text-white font-semibold'>
                                                {formatTime(schedule.scheduledDate)}
                                            </span>
                                            {isUpcoming && (
                                                <Badge className='bg-orange-500 text-white text-xs'>
                                                    Còn {timeRemaining} phút
                                                </Badge>
                                            )}
                                            {isPast && schedule.status === 'scheduled' && (
                                                <Badge className='bg-gray-500 text-white text-xs'>
                                                    Đã qua
                                                </Badge>
                                            )}
                                        </div>
                                        <h4 className='text-white font-medium mb-1'>
                                            {schedule.course.title}
                                        </h4>
                                        {schedule.lesson && (
                                            <p className='text-gray-400 text-sm mb-2'>
                                                {schedule.lesson.title}
                                            </p>
                                        )}
                                        <div className='flex items-center gap-4 text-xs text-gray-500'>
                                            <span>Thời lượng: {schedule.duration} phút</span>
                                            {schedule.notes && (
                                                <span className='truncate'>
                                                    Ghi chú: {schedule.notes}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                        {canStart && schedule.status === 'scheduled' && (
                                            <Button
                                                size='sm'
                                                className='bg-blue-600 hover:bg-blue-700'
                                                asChild
                                            >
                                                <Link to={lessonUrl}>
                                                    <Play className='h-4 w-4 mr-1' />
                                                    Bắt đầu
                                                </Link>
                                            </Button>
                                        )}
                                        {schedule.status === 'scheduled' && !canStart && (
                                            <Button
                                                size='sm'
                                                variant='outline'
                                                onClick={() => handleComplete(schedule.id)}
                                            >
                                                <CheckCircle className='h-4 w-4 mr-1' />
                                                Hoàn thành
                                            </Button>
                                        )}
                                        {schedule.status === 'completed' && (
                                            <Badge className='bg-green-500 text-white'>
                                                Đã hoàn thành
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}

