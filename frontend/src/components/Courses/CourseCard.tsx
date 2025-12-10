// ============================================
// FILE: src/components/Courses/CourseCard.tsx (TẠO MỚI)
// Reusable course card component
// ============================================

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
import type { Course } from '../../lib/api/types'
import {
    formatDuration,
    getCoursePrice,
    getCourseLevelBadge,
    formatNumber,
    formatPrice,
} from '../../lib/courseUtils'

interface CourseCardProps {
    course: Course
    className?: string
}

export function CourseCard({ course, className = '' }: CourseCardProps) {
    console.log('CourseCard.tsx:', course)

    const levelBadge = getCourseLevelBadge(course.level)
    const priceInfo = getCoursePrice(course)

    return (
        <Card
            className={`overflow-hidden hover:shadow-2xl hover:shadow-blue-500/10 transition-all duration-300 flex flex-col bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 hover:border-[#3D3D3D]/70 group ${className}`}
        >
            <Link to={`/courses/${course.id}`}>
                <div className='relative aspect-video overflow-hidden rounded-t-lg bg-gradient-to-br from-[#1F1F1F] to-[#151515]'>
                    <img
                        src={
                            course.thumbnailUrl ||
                            'https://via.placeholder.com/400x225?text=No+Image'
                        }
                        alt={course.title}
                        className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-500'
                    />
                    <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                    <Badge
                        className={`absolute top-3 left-3 shadow-lg ${levelBadge.className} transition-transform group-hover:scale-105`}
                    >
                        {levelBadge.label}
                    </Badge>
                    {course.isFeatured && (
                        <Badge className='absolute top-3 right-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white shadow-lg transition-transform group-hover:scale-105'>
                            ⭐ Nổi bật
                        </Badge>
                    )}
                    {priceInfo.hasDiscount && (
                        <Badge className='absolute bottom-3 left-3 bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-lg transition-transform group-hover:scale-105'>
                            Giảm {priceInfo.discountPercentage}%
                        </Badge>
                    )}
                </div>
            </Link>

            <CardHeader className='flex-1 p-4'>
                <div className='flex items-center gap-2 mb-2'>
                    <Avatar className='h-7 w-7 border-2 border-[#2D2D2D] hover:border-blue-500/50 transition-colors'>
                        <AvatarImage src={course.instructor?.avatarUrl} />
                        <AvatarFallback className='bg-gradient-to-br from-blue-600 to-blue-700 text-white text-xs'>
                            {course.instructor?.fullName?.[0] || 'I'}
                        </AvatarFallback>
                    </Avatar>
                    <span className='text-xs text-gray-400 hover:text-white transition-colors truncate'>
                        {course.instructor?.fullName || 'Instructor'}
                    </span>
                </div>
                <CardTitle className='line-clamp-2 hover:text-blue-400 transition-colors text-white text-base font-bold mb-1.5 group-hover:text-blue-400'>
                    <Link to={`/courses/${course.id}`}>{course.title}</Link>
                </CardTitle>
                <CardDescription className='line-clamp-3 text-gray-400 leading-relaxed text-sm'>
                    {course.shortDescription ||
                        course.description ||
                        'Khóa học chất lượng cao'}
                </CardDescription>
                {course.tags && course.tags.length > 0 && (
                    <div className='flex flex-wrap gap-1.5 mt-2'>
                        {course.tags.slice(0, 3).map((tag, index) => {
                            const tagName =
                                typeof tag === 'string' ? tag : tag.name
                            return (
                                <Badge
                                    key={index}
                                    variant='outline'
                                    className='text-xs text-gray-400 border-[#2D2D2D] hover:border-gray-500 hover:text-gray-300 transition-colors'
                                >
                                    {tagName}
                                </Badge>
                            )
                        })}
                        {course.tags.length > 3 && (
                            <Badge
                                variant='outline'
                                className='text-xs text-gray-500 border-[#2D2D2D]'
                            >
                                +{course.tags.length - 3}
                            </Badge>
                        )}
                    </div>
                )}
            </CardHeader>

            <CardContent className='px-4 pb-3'>
                <div className='grid grid-cols-2 gap-2'>
                    <div className='flex items-center gap-1.5 text-sm group/item'>
                        <Star className='h-4 w-4 fill-yellow-400 text-yellow-400 group-hover/item:scale-110 transition-transform' />
                        <span className='text-white font-semibold'>
                            {Number(course.ratingAvg || 0).toFixed(1)}
                        </span>
                        <span className='text-gray-500 text-xs'>
                            ({formatNumber(course.ratingCount)})
                        </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-sm group/item'>
                        <Users className='h-4 w-4 text-blue-400 group-hover/item:scale-110 transition-transform' />
                        <span className='text-gray-300'>
                            {formatNumber(course.enrolledCount)}
                        </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-sm group/item'>
                        <BookOpen className='h-4 w-4 text-green-400 group-hover/item:scale-110 transition-transform' />
                        <span className='text-gray-300'>
                            {course.totalLessons} bài
                        </span>
                    </div>
                    <div className='flex items-center gap-1.5 text-sm group/item'>
                        <Clock className='h-4 w-4 text-purple-400 group-hover/item:scale-110 transition-transform' />
                        <span className='text-gray-300'>
                            {formatDuration(course.durationHours)}
                        </span>
                    </div>
                </div>
            </CardContent>

            <CardFooter className='border-t border-[#2D2D2D]/50 pt-3 px-4 pb-4'>
                <div className='flex items-center justify-between w-full'>
                    {priceInfo.isFree ? (
                        <span className='text-lg font-bold bg-gradient-to-r from-green-500 to-emerald-500 bg-clip-text text-transparent'>
                            Miễn phí
                        </span>
                    ) : (
                        <div className='flex flex-col gap-0.5'>
                            <div className='flex items-center gap-2'>
                                <span className='text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent'>
                                    {priceInfo.displayPrice}
                                </span>
                                {priceInfo.hasDiscount && (
                                    <span className='text-xs text-gray-500 line-through'>
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
