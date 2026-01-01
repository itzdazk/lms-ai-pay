import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
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
    Plus,
    Clock,
    BookOpen,
    Bell,
    ChevronLeft,
    ChevronRight,
    Edit,
    Trash2,
    Play,
} from 'lucide-react'
import { dashboardApi, type StudySchedule } from '../../lib/api/dashboard'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { CreateScheduleModal } from './CreateScheduleModal'
import { EditScheduleModal } from './EditScheduleModal'
import { TodaySchedule } from './TodaySchedule'
import { toast } from 'sonner'

const DAYS_OF_WEEK = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7']
const TIME_SLOTS = [8, 10, 14, 19, 21] // 8:00, 10:00, 14:00, 19:00, 21:00

export function StudySchedule() {
    const [schedules, setSchedules] = useState<StudySchedule[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [currentWeekStart, setCurrentWeekStart] = useState(() => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1) // Monday
        const monday = new Date(today.setDate(diff))
        monday.setHours(0, 0, 0, 0)
        return monday
    })
    const [createModalOpen, setCreateModalOpen] = useState(false)
    const [editModalOpen, setEditModalOpen] = useState(false)
    const [selectedSchedule, setSelectedSchedule] = useState<StudySchedule | null>(null)

    const weekEnd = new Date(currentWeekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)

    useEffect(() => {
        fetchSchedules()
    }, [currentWeekStart])

    const fetchSchedules = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await dashboardApi.getStudySchedules({
                dateFrom: currentWeekStart.toISOString(),
                dateTo: weekEnd.toISOString(),
            })
            setSchedules(data)
        } catch (err: any) {
            setError(err.message || 'Failed to load study schedules')
            toast.error('Không thể tải lịch học')
        } finally {
            setLoading(false)
        }
    }

    const handleDelete = async (id: number) => {
        if (!confirm('Bạn có chắc muốn xóa lịch học này?')) return

        try {
            await dashboardApi.deleteStudySchedule(id)
            toast.success('Đã xóa lịch học')
            fetchSchedules()
        } catch (err: any) {
            toast.error('Không thể xóa lịch học')
        }
    }

    const handleComplete = async (id: number) => {
        try {
            await dashboardApi.completeSchedule(id)
            toast.success('Đã đánh dấu hoàn thành')
            fetchSchedules()
        } catch (err: any) {
            toast.error('Không thể cập nhật lịch học')
        }
    }

    const goToPreviousWeek = () => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(newDate.getDate() - 7)
        setCurrentWeekStart(newDate)
    }

    const goToNextWeek = () => {
        const newDate = new Date(currentWeekStart)
        newDate.setDate(newDate.getDate() + 7)
        setCurrentWeekStart(newDate)
    }

    const goToToday = () => {
        const today = new Date()
        const day = today.getDay()
        const diff = today.getDate() - day + (day === 0 ? -6 : 1)
        const monday = new Date(today.setDate(diff))
        monday.setHours(0, 0, 0, 0)
        setCurrentWeekStart(monday)
    }

    const getSchedulesForDay = (dayIndex: number) => {
        const day = new Date(currentWeekStart)
        day.setDate(day.getDate() + dayIndex)
        day.setHours(0, 0, 0, 0)
        const dayEnd = new Date(day)
        dayEnd.setHours(23, 59, 59, 999)

        return schedules.filter((schedule) => {
            const scheduleDate = new Date(schedule.scheduledDate)
            return scheduleDate >= day && scheduleDate <= dayEnd
        })
    }

    const getScheduleTimeSlot = (schedule: StudySchedule) => {
        const date = new Date(schedule.scheduledDate)
        const hour = date.getHours()
        return TIME_SLOTS.findIndex((slot) => slot >= hour)
    }

    const isToday = (dayIndex: number) => {
        const day = new Date(currentWeekStart)
        day.setDate(day.getDate() + dayIndex)
        const today = new Date()
        return (
            day.getDate() === today.getDate() &&
            day.getMonth() === today.getMonth() &&
            day.getFullYear() === today.getFullYear()
        )
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
                    <CardTitle className='text-white flex items-center gap-2'>
                        <Calendar className='h-5 w-5 text-blue-400' />
                        Lịch học
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

    return (
        <div className='space-y-6'>
            <TodaySchedule onScheduleUpdate={fetchSchedules} />

            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <div className='flex items-center justify-between flex-wrap gap-4'>
                        <div>
                            <CardTitle className='text-white flex items-center gap-2'>
                                <Calendar className='h-5 w-5 text-blue-400' />
                                Lịch học tuần
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                {currentWeekStart.toLocaleDateString('vi-VN', {
                                    day: 'numeric',
                                    month: 'long',
                                })}{' '}
                                -{' '}
                                {weekEnd.toLocaleDateString('vi-VN', {
                                    day: 'numeric',
                                    month: 'long',
                                    year: 'numeric',
                                })}
                            </CardDescription>
                        </div>
                        <div className='flex items-center gap-2'>
                            <Button
                                onClick={goToPreviousWeek}
                                variant='outline'
                                size='sm'
                                className='border-[#2D2D2D]'
                            >
                                <ChevronLeft className='h-4 w-4' />
                            </Button>
                            <Button
                                onClick={goToToday}
                                variant='outline'
                                size='sm'
                                className='border-[#2D2D2D]'
                            >
                                Hôm nay
                            </Button>
                            <Button
                                onClick={goToNextWeek}
                                variant='outline'
                                size='sm'
                                className='border-[#2D2D2D]'
                            >
                                <ChevronRight className='h-4 w-4' />
                            </Button>
                            <Button
                                onClick={() => setCreateModalOpen(true)}
                                className='bg-blue-600 hover:bg-blue-700'
                            >
                                <Plus className='h-4 w-4 mr-2' />
                                Tạo lịch học
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {error ? (
                        <div className='text-center py-8'>
                            <p className='text-red-400 text-sm mb-2'>{error}</p>
                            <Button
                                onClick={fetchSchedules}
                                variant='outline'
                                size='sm'
                            >
                                Thử lại
                            </Button>
                        </div>
                    ) : (
                        <div className='space-y-4'>
                            {/* Time slots header */}
                            <div className='grid grid-cols-8 gap-2'>
                                <div className='text-xs text-gray-400 font-medium'>
                                    Giờ
                                </div>
                                {DAYS_OF_WEEK.map((day, index) => (
                                    <div
                                        key={day}
                                        className={`text-xs text-center font-medium ${
                                            isToday(index)
                                                ? 'text-blue-400'
                                                : 'text-gray-400'
                                        }`}
                                    >
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Schedule grid */}
                            {TIME_SLOTS.map((hour, slotIndex) => (
                                <div
                                    key={hour}
                                    className='grid grid-cols-8 gap-2'
                                >
                                    <div className='text-sm text-gray-400 py-2'>
                                        {hour}:00
                                    </div>
                                    {DAYS_OF_WEEK.map((_, dayIndex) => {
                                        const daySchedules = getSchedulesForDay(
                                            dayIndex
                                        ).filter(
                                            (s) => getScheduleTimeSlot(s) === slotIndex
                                        )

                                        return (
                                            <div
                                                key={dayIndex}
                                                className={`min-h-[60px] p-1 space-y-1 ${
                                                    isToday(dayIndex)
                                                        ? 'bg-blue-950/20 border border-blue-500/30 rounded'
                                                        : ''
                                                }`}
                                            >
                                                {daySchedules.map((schedule) => (
                                                    <ScheduleCard
                                                        key={schedule.id}
                                                        schedule={schedule}
                                                        onEdit={() => {
                                                            setSelectedSchedule(schedule)
                                                            setEditModalOpen(true)
                                                        }}
                                                        onDelete={() =>
                                                            handleDelete(schedule.id)
                                                        }
                                                        onComplete={() =>
                                                            handleComplete(schedule.id)
                                                        }
                                                    />
                                                ))}
                                            </div>
                                        )
                                    })}
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <CreateScheduleModal
                open={createModalOpen}
                onOpenChange={setCreateModalOpen}
                onSuccess={() => {
                    setCreateModalOpen(false)
                    fetchSchedules()
                }}
            />

            {selectedSchedule && (
                <EditScheduleModal
                    open={editModalOpen}
                    onOpenChange={setEditModalOpen}
                    schedule={selectedSchedule}
                    onSuccess={() => {
                        setEditModalOpen(false)
                        setSelectedSchedule(null)
                        fetchSchedules()
                    }}
                />
            )}
        </div>
    )
}

function ScheduleCard({
    schedule,
    onEdit,
    onDelete,
    onComplete,
}: {
    schedule: StudySchedule
    onEdit: () => void
    onDelete: () => void
    onComplete: () => void
}) {
    const [showActions, setShowActions] = useState(false)
    const isUpcoming =
        new Date(schedule.scheduledDate) > new Date() &&
        new Date(schedule.scheduledDate).getTime() - Date.now() < 3600000 // 1 hour

    const getStatusColor = () => {
        switch (schedule.status) {
            case 'completed':
                return 'bg-green-500/20 border-green-500/30'
            case 'skipped':
                return 'bg-gray-500/20 border-gray-500/30'
            case 'cancelled':
                return 'bg-red-500/20 border-red-500/30'
            default:
                return 'bg-blue-500/20 border-blue-500/30'
        }
    }

    const lessonUrl = schedule.lesson
        ? `/courses/${schedule.course.slug}/lessons/${schedule.lesson.slug}`
        : `/courses/${schedule.course.slug}/lessons`

    return (
        <div
            className={`relative group rounded p-2 text-xs border ${getStatusColor()} cursor-pointer hover:scale-105 transition-all`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            <div className='font-semibold text-white truncate'>
                {schedule.course.title}
            </div>
            {schedule.lesson && (
                <div className='text-gray-300 truncate text-[10px]'>
                    {schedule.lesson.title}
                </div>
            )}
            <div className='flex items-center gap-1 mt-1'>
                <Clock className='h-3 w-3 text-gray-400' />
                <span className='text-gray-400'>
                    {new Date(schedule.scheduledDate).toLocaleTimeString('vi-VN', {
                        hour: '2-digit',
                        minute: '2-digit',
                    })}
                </span>
            </div>
            {isUpcoming && schedule.status === 'scheduled' && (
                <Badge className='absolute top-1 right-1 bg-orange-500 text-white text-[9px] px-1 py-0'>
                    Sắp tới
                </Badge>
            )}
            {schedule.isReminderSent && (
                <Bell className='absolute top-1 left-1 h-3 w-3 text-yellow-400' />
            )}

            {showActions && (
                <div className='absolute inset-0 bg-black/80 rounded flex items-center justify-center gap-2 z-10'>
                    <Button
                        size='sm'
                        variant='ghost'
                        className='h-6 px-2'
                        onClick={(e) => {
                            e.stopPropagation()
                            onEdit()
                        }}
                    >
                        <Edit className='h-3 w-3' />
                    </Button>
                    <Button
                        size='sm'
                        variant='ghost'
                        className='h-6 px-2'
                        asChild
                    >
                        <Link to={lessonUrl}>
                            <Play className='h-3 w-3' />
                        </Link>
                    </Button>
                    {schedule.status === 'scheduled' && (
                        <Button
                            size='sm'
                            variant='ghost'
                            className='h-6 px-2'
                            onClick={(e) => {
                                e.stopPropagation()
                                onComplete()
                            }}
                        >
                            <BookOpen className='h-3 w-3' />
                        </Button>
                    )}
                    <Button
                        size='sm'
                        variant='ghost'
                        className='h-6 px-2 text-red-400'
                        onClick={(e) => {
                            e.stopPropagation()
                            onDelete()
                        }}
                    >
                        <Trash2 className='h-3 w-3' />
                    </Button>
                </div>
            )}
        </div>
    )
}

