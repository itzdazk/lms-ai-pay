// ============================================
// FILE: src/components/Courses/InstructorInfo.tsx (TẠO MỚI)
// Display instructor information and other courses
// ============================================

import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import { Badge } from '../ui/badge'
import { BookOpen, Star, Users } from 'lucide-react'
import type { Instructor } from '../../lib/api/types'
import { formatNumber, getCoursePrice, getCourseUrl } from '../../lib/courseUtils'

interface InstructorInfoProps {
    instructor: Instructor
    className?: string
    showOtherCourses?: boolean
}

export function InstructorInfo({
    instructor,
    className = '',
    showOtherCourses = true,
}: InstructorInfoProps) {
    return (
        <div className={`space-y-6 ${className}`}>
            {/* Instructor Profile */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Giảng viên</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-start gap-4'>
                        <Avatar className='h-16 w-16'>
                            <AvatarImage src={instructor.avatarUrl} />
                            <AvatarFallback className='bg-blue-600 text-white text-xl'>
                                {instructor.fullName?.[0] || 'I'}
                            </AvatarFallback>
                        </Avatar>
                        <div className='flex-1'>
                            <h3 className='text-lg font-semibold text-white mb-1'>
                                {instructor.fullName}
                            </h3>
                            <p className='text-sm text-gray-400 mb-3'>
                                @{instructor.userName}
                            </p>

                            {/* Stats */}
                            <div className='flex items-center gap-4 text-sm text-gray-400'>
                                <div className='flex items-center gap-1'>
                                    <BookOpen className='h-4 w-4' />
                                    <span>
                                        {instructor.totalCourses || 0} khóa học
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bio */}
                    {instructor.bio && (
                        <div className='mt-4 pt-4 border-t border-[#2D2D2D]'>
                            <p className='text-sm text-gray-300 leading-relaxed'>
                                {instructor.bio}
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Other Courses */}
            {showOtherCourses && instructor.otherCourses && instructor.otherCourses.length > 0 && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Khóa học khác
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-4'>
                        {instructor.otherCourses.map((course) => {
                            const priceInfo = getCoursePrice(course)

                            return (
                                <Link
                                    key={course.id}
                                    to={getCourseUrl(course)}
                                    className='flex gap-3 p-2 hover:bg-[#1F1F1F] rounded-lg transition-colors group'
                                >
                                    <img
                                        src={
                                            course.thumbnailUrl ||
                                            'https://via.placeholder.com/150'
                                        }
                                        alt={course.title}
                                        className='w-24 h-16 object-cover rounded-lg flex-shrink-0'
                                    />
                                    <div className='flex-1 min-w-0'>
                                        <p className='font-medium line-clamp-2 text-sm mb-1 text-white group-hover:text-blue-600 transition-colors'>
                                            {course.title}
                                        </p>
                                        <div className='flex items-center gap-3 text-xs text-gray-400'>
                                            <div className='flex items-center gap-1'>
                                                <Star className='h-3 w-3 fill-yellow-400 text-yellow-400' />
                                                <span>
                                                    {Number(
                                                        course.ratingAvg || 0
                                                    ).toFixed(1)}
                                                </span>
                                            </div>
                                            <div className='flex items-center gap-1'>
                                                <Users className='h-3 w-3' />
                                                <span>
                                                    {formatNumber(
                                                        course.enrolledCount
                                                    )}
                                                </span>
                                            </div>
                                        </div>
                                        <p className='text-sm font-semibold text-blue-500 mt-1'>
                                            {priceInfo.displayPrice}
                                        </p>
                                    </div>
                                </Link>
                            )
                        })}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
