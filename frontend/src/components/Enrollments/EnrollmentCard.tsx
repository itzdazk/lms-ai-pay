import { useNavigate } from 'react-router-dom'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Progress } from '../ui/progress'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
    BookOpen,
    Clock,
    PlayCircle,
    Award,
    Calendar,
    TrendingUp,
    Star,
} from 'lucide-react'
import type { EnrollmentWithCourse } from '../../lib/api/enrollments'
import { formatDuration } from '../../lib/courseUtils'

interface EnrollmentCardProps {
    enrollment: EnrollmentWithCourse
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
    const navigate = useNavigate()
    const { course } = enrollment

    // Convert progressPercentage to number (it can be string from backend)
    const progressPercentage =
        typeof enrollment.progressPercentage === 'string'
            ? parseFloat(enrollment.progressPercentage) || 0
            : enrollment.progressPercentage || 0

    const getStatusConfig = () => {
        switch (enrollment.status) {
            case 'ACTIVE':
                return {
                    badge: 'Đang học',
                    className: 'bg-foreground text-background border-0',
                }
            case 'COMPLETED':
                return {
                    badge: 'Hoàn thành',
                    className: 'bg-muted text-foreground border border-border',
                }
            case 'DROPPED':
                return {
                    badge: 'Đã hủy',
                    className:
                        'bg-muted text-muted-foreground border border-border',
                }
            default:
                return {
                    badge: 'Không xác định',
                    className:
                        'bg-muted text-muted-foreground border border-border',
                }
        }
    }

    const statusConfig = getStatusConfig()

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('vi-VN', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        })
    }

    const handleContinueLearning = () => {
        navigate(`/courses/${course.slug}/lessons`)
    }

    const handleViewCertificate = () => {
        navigate(`/certificate/${enrollment.courseId}`)
    }

    const handleViewDetail = () => {
        navigate(`/enrollments/${enrollment.id}`)
    }

    return (
        <div className='group relative animate-fade-in-up'>
            <div className='relative bg-[#1a1a1a] border border-[#2d2d2d] rounded-2xl overflow-hidden shadow-[0_2px_8px_rgba(0,0,0,0.3)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)] transition-all duration-300 hover:-translate-y-1'>
                {/* Thumbnail Section */}
                <div
                    className='relative h-48 overflow-hidden bg-[#1f1f1f] cursor-pointer'
                    onClick={handleViewDetail}
                >
                    {course.thumbnailUrl ? (
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        />
                    ) : (
                        <div className='w-full h-full flex items-center justify-center bg-[#1f1f1f]'>
                            <BookOpen className='h-16 w-16 text-gray-600' />
                        </div>
                    )}

                    {/* Overlay */}
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent'></div>

                    {/* Status Badge */}
                    <div className='absolute top-4 right-4'>
                        <Badge
                            className={`${statusConfig.className} shadow-lg`}
                        >
                            {statusConfig.badge}
                        </Badge>
                    </div>

                    {/* Progress Badge */}
                    <div className='absolute bottom-4 left-4 right-4'>
                        <div className='flex items-center gap-2 text-white'>
                            <TrendingUp className='h-4 w-4' />
                            <span className='text-sm font-medium'>
                                {progressPercentage}% Hoàn thành
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className='p-6 bg-[#1a1a1a]'>
                    {/* Course Title */}
                    <h3
                        onClick={handleViewDetail}
                        className='mb-3 line-clamp-2 min-h-16 group-hover:text-blue-400 transition-colors font-semibold text-lg text-white cursor-pointer'
                    >
                        {course.title}
                    </h3>

                    {/* Instructor Info */}
                    <div className='flex items-center gap-2 mb-4'>
                        <Avatar className='h-8 w-8 border-2 border-[#2d2d2d]'>
                            <AvatarImage src={course.instructor.avatarUrl} />
                            <AvatarFallback className='bg-[#1f1f1f] text-gray-300 text-xs'>
                                {course.instructor.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className='text-sm text-gray-400'>
                            {course.instructor.fullName}
                        </span>
                        {course.ratingAvg !== undefined &&
                            course.ratingAvg > 0 && (
                                <div className='flex items-center gap-1 ml-auto'>
                                    <Star className='h-4 w-4 fill-yellow-400 text-yellow-400 group-hover/item:scale-110 transition-transform' />
                                    <span className='text-sm font-medium text-white'>
                                        {Number(course.ratingAvg || 0).toFixed(
                                            1
                                        )}
                                    </span>
                                </div>
                            )}
                    </div>

                    {/* Progress Bar */}
                    <div className='mb-4'>
                        <Progress
                            value={progressPercentage}
                            className='h-2 bg-[#1f1f1f]'
                        />
                    </div>

                    {/* Course Stats */}
                    <div className='grid grid-cols-2 gap-3 mb-4 p-3 bg-[#1f1f1f] rounded-xl'>
                        <div className='flex items-center gap-2'>
                            <div className='p-2 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d]'>
                                <BookOpen className='h-4 w-4 text-gray-300' />
                            </div>
                            <div>
                                <p className='text-xs text-gray-500'>Bài học</p>
                                <p className='text-sm font-medium text-white'>
                                    {course.totalLessons}
                                </p>
                            </div>
                        </div>
                        {course.durationHours > 0 && (
                            <div className='flex items-center gap-2'>
                                <div className='p-2 bg-[#1a1a1a] rounded-lg border border-[#2d2d2d]'>
                                    <Clock className='h-4 w-4 text-gray-300' />
                                </div>
                                <div>
                                    <p className='text-xs text-gray-500'>
                                        Thời lượng
                                    </p>
                                    <p className='text-sm font-medium text-white'>
                                        {formatDuration(course.durationHours / 60)}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Enrollment Info */}
                    <div className='flex items-center gap-2 text-xs text-gray-500 mb-4'>
                        <Calendar className='h-3 w-3' />
                        <span>Đăng ký {formatDate(enrollment.enrolledAt)}</span>
                    </div>

                    {/* Action Buttons */}
                    {enrollment.status === 'COMPLETED' ? (
                        <div className='grid grid-cols-2 gap-2'>
                            <Button
                                onClick={handleViewCertificate}
                                className='bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-sm transition-colors'
                                size='sm'
                            >
                                <Award className='mr-2 h-4 w-4' />
                                Chứng chỉ
                            </Button>
                            <Button
                                onClick={handleContinueLearning}
                                variant='outline'
                                size='sm'
                                className='border-[#2d2d2d] hover:bg-[#1f1f1f] text-gray-300 transition-colors'
                            >
                                <PlayCircle className='mr-2 h-4 w-4' />
                                Xem lại
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleContinueLearning}
                            className='w-full bg-white text-gray-900 hover:bg-gray-100 border-0 shadow-sm transition-colors'
                        >
                            <PlayCircle className='mr-2 h-4 w-4' />
                            Tiếp tục học
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
