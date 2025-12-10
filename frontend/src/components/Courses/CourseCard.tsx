import { Link } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Star, Users, BookOpen, Clock } from 'lucide-react'
import type { PublicCourse } from '../../lib/api/types'
import {
    formatDuration,
    getCoursePrice,
    getCourseLevelBadge,
    formatNumber,
    formatPrice,
} from '../../lib/courseUtils'

interface CourseCardProps {
    course: PublicCourse
    className?: string
}

export function CourseCard({ course, className = '' }: CourseCardProps) {
    console.log('CourseCard.tsx:', course)

    const levelBadge = getCourseLevelBadge(course.level)
    const priceInfo = getCoursePrice(course)

    return (
        <Card
            className={`overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-[#1A1A1A] border-[#2D2D2D] ${className}`}
        >
            <Link to={`/courses/${course.id}`}>
                <div className='relative aspect-video overflow-hidden rounded-t-lg'>
                    <img
                        src={
                            course.thumbnailUrl ||
                            'https://via.placeholder.com/400x225?text=No+Image'
                        }
                        alt={course.title}
                        className='w-full h-full object-cover hover:scale-105 transition-transform duration-300'
                    />
                    <Badge
                        className={`absolute top-3 left-3 ${levelBadge.className}`}
                    >
                        {levelBadge.label}
                    </Badge>
                    {course.isFeatured && (
                        <Badge className='absolute top-3 right-3 bg-yellow-500 text-white'>
                            ⭐ Nổi bật
                        </Badge>
                    )}
                    {priceInfo.hasDiscount && (
                        <Badge className='absolute bottom-3 left-3 bg-red-500 text-white'>
                            Giảm {priceInfo.discountPercentage}%
                        </Badge>
                    )}
                </div>
            </Link>

            <CardHeader className='flex-1'>
                <div className='flex items-center gap-2 mb-2'>
                    <Avatar className='h-8 w-8'>
                        <AvatarImage src={course.instructor?.avatarUrl} />
                        <AvatarFallback className='bg-blue-600 text-white text-xs'>
                            {course.instructor?.fullName?.[0] || 'I'}
                        </AvatarFallback>
                    </Avatar>
                    <span className='text-sm text-gray-400 truncate'>
                        {course.instructor?.fullName || 'Instructor'}
                    </span>
                </div>
                <CardTitle className='line-clamp-2 hover:text-blue-600 transition-colors text-white'>
                    <Link to={`/courses/${course.id}`}>{course.title}</Link>
                </CardTitle>
                <CardDescription className='line-clamp-2 text-gray-400'>
                    {course.shortDescription ||
                        course.description ||
                        'Khóa học chất lượng cao'}
                </CardDescription>
            </CardHeader>

            <CardContent>
                <div className='flex items-center gap-4 text-sm text-gray-400 mb-3'>
                    <div className='flex items-center gap-1'>
                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400' />
                        <span className='text-white font-medium'>
                            {Number(course.ratingAvg || 0).toFixed(1)}
                        </span>
                        <span className='text-gray-500'>
                            ({formatNumber(course.ratingCount)})
                        </span>
                    </div>
                    <div className='flex items-center gap-1'>
                        <Users className='h-4 w-4 text-gray-400' />
                        <span>{formatNumber(course.enrolledCount)}</span>
                    </div>
                </div>
                <div className='flex items-center justify-between text-sm text-gray-400'>
                    <div className='flex items-center gap-1'>
                        <BookOpen className='h-4 w-4 text-gray-400' />
                        <span>{course.totalLessons} bài</span>
                    </div>
                    <div className='flex items-center gap-1'>
                        <Clock className='h-4 w-4 text-gray-400' />
                        <span>{formatDuration(course.durationHours)}</span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className='border-t border-[#2D2D2D] pt-4'>
                <div className='flex items-center justify-between w-full'>
                    {priceInfo.isFree ? (
                        <span className='text-2xl font-bold text-green-600'>
                            Miễn phí
                        </span>
                    ) : (
                        <div className='flex flex-col'>
                            <div className='flex items-center gap-2'>
                                <span className='text-2xl font-bold text-blue-500'>
                                    {priceInfo.displayPrice}
                                </span>
                                {priceInfo.hasDiscount && (
                                    <span className='text-sm text-gray-500 line-through'>
                                        {formatPrice(priceInfo.originalPrice)}
                                    </span>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </CardFooter>
        </Card>
    )
}
