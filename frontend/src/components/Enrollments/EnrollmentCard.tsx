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

interface EnrollmentCardProps {
    enrollment: EnrollmentWithCourse
}

export function EnrollmentCard({ enrollment }: EnrollmentCardProps) {
    const navigate = useNavigate()
    const { course } = enrollment

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
        navigate(`/learn/${course.id}`)
    }

    const handleViewCertificate = () => {
        navigate(`/certificate/${enrollment.courseId}`)
    }

    return (
        <div className='group relative animate-fade-in-up'>
            <div className='relative bg-card border border-border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-1'>
                {/* Thumbnail Section */}
                <div className='relative h-48 overflow-hidden bg-muted'>
                    {course.thumbnailUrl ? (
                        <img
                            src={course.thumbnailUrl}
                            alt={course.title}
                            className='w-full h-full object-cover group-hover:scale-105 transition-transform duration-500'
                        />
                    ) : (
                        <div className='w-full h-full flex items-center justify-center bg-muted'>
                            <BookOpen className='h-16 w-16 text-muted-foreground' />
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
                                {enrollment.progressPercentage}% Hoàn thành
                            </span>
                        </div>
                    </div>
                </div>

                {/* Content Section */}
                <div className='p-6'>
                    {/* Course Title */}
                    <h3 className='mb-3 line-clamp-2 group-hover:text-primary transition-colors font-semibold text-lg text-foreground'>
                        {course.title}
                    </h3>

                    {/* Instructor Info */}
                    <div className='flex items-center gap-2 mb-4'>
                        <Avatar className='h-8 w-8 border-2 border-border'>
                            <AvatarImage src={course.instructor.avatarUrl} />
                            <AvatarFallback className='bg-muted text-foreground text-xs'>
                                {course.instructor.fullName
                                    .split(' ')
                                    .map((n) => n[0])
                                    .join('')}
                            </AvatarFallback>
                        </Avatar>
                        <span className='text-sm text-muted-foreground'>
                            {course.instructor.fullName}
                        </span>
                        {course.ratingAvg > 0 && (
                            <div className='flex items-center gap-1 ml-auto'>
                                <Star className='h-4 w-4 fill-foreground text-foreground' />
                                <span className='text-sm font-medium text-foreground'>
                                    {course.ratingAvg.toFixed(1)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Progress Bar */}
                    <div className='mb-4'>
                        <Progress
                            value={enrollment.progressPercentage}
                            className='h-2 bg-muted'
                        />
                    </div>

                    {/* Course Stats */}
                    <div className='grid grid-cols-2 gap-3 mb-4 p-3 bg-muted rounded-xl'>
                        <div className='flex items-center gap-2'>
                            <div className='p-2 bg-background rounded-lg border border-border'>
                                <BookOpen className='h-4 w-4 text-foreground' />
                            </div>
                            <div>
                                <p className='text-xs text-muted-foreground'>
                                    Bài học
                                </p>
                                <p className='text-sm font-medium text-foreground'>
                                    {course.totalLessons}
                                </p>
                            </div>
                        </div>
                        <div className='flex items-center gap-2'>
                            <div className='p-2 bg-background rounded-lg border border-border'>
                                <Clock className='h-4 w-4 text-foreground' />
                            </div>
                            <div>
                                <p className='text-xs text-muted-foreground'>
                                    Thời lượng
                                </p>
                                <p className='text-sm font-medium text-foreground'>
                                    {course.durationHours}h
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Enrollment Info */}
                    <div className='flex items-center gap-2 text-xs text-muted-foreground mb-4'>
                        <Calendar className='h-3 w-3' />
                        <span>Đăng ký {formatDate(enrollment.enrolledAt)}</span>
                    </div>

                    {/* Action Buttons */}
                    {enrollment.status === 'COMPLETED' ? (
                        <div className='grid grid-cols-2 gap-2'>
                            <Button
                                onClick={handleViewCertificate}
                                className='bg-foreground text-background hover:bg-foreground/90 border-0 shadow-sm'
                                size='sm'
                            >
                                <Award className='mr-2 h-4 w-4' />
                                Chứng chỉ
                            </Button>
                            <Button
                                onClick={handleContinueLearning}
                                variant='outline'
                                size='sm'
                                className='border-border hover:bg-muted'
                            >
                                <PlayCircle className='mr-2 h-4 w-4' />
                                Xem lại
                            </Button>
                        </div>
                    ) : (
                        <Button
                            onClick={handleContinueLearning}
                            className='w-full bg-foreground text-background hover:bg-foreground/90 border-0 shadow-sm'
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
