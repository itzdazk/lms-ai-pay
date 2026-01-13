import { Clock, BookOpen, Users, Star } from 'lucide-react'
import { formatDuration } from '../../../lib/courseUtils'
import type { Course } from './types'

interface CourseRecommendationCardProps {
    course: Course
}

export function CourseRecommendationCard({ course }: CourseRecommendationCardProps) {
    const courseTitle = course.courseTitle || course.title || 'Khóa học'
    const courseSlug = course.courseSlug || course.slug
    const courseId = course.courseId
    const finalPrice = course.discountPrice ? course.discountPrice : (course.price || 0)
    const priceDisplay = finalPrice > 0 ? `${Number(finalPrice).toLocaleString('vi-VN')}đ` : 'Miễn phí'
    const courseLink = courseSlug ? `/courses/${courseSlug}` : (courseId ? `/courses/${courseId}` : '#')
    const instructorName = typeof course.instructor === 'string'
        ? course.instructor
        : (course.instructor?.fullName || course.instructor?.name || '')
    const thumbnail = course.thumbnail || course.thumbnailUrl
    const duration = course.duration || course.durationHours

    return (
        <a
            href={courseLink}
            target="_blank"
            rel="noopener noreferrer"
            className="block bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-3 cursor-pointer hover:border-purple-500/50 transition-colors"
        >
            <div className="flex gap-3">
                {thumbnail && (
                    <div className="flex-shrink-0 w-16 h-16 rounded overflow-hidden bg-gray-700">
                        <img
                            src={thumbnail}
                            alt={courseTitle}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}
                <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                        <h4 className="text-sm font-semibold text-white truncate">{courseTitle}</h4>
                        {course.level && (
                            <p className="text-xs text-gray-400 mt-1">{course.level}</p>
                        )}
                        {course.description && (
                            <p className="text-xs text-gray-400 mt-2 line-clamp-2">{course.description}</p>
                        )}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {course.rating && (
                                <div className="flex items-center gap-1 text-xs text-yellow-400">
                                    <Star className="h-3 w-3 fill-yellow-400" />
                                    <span>{course.rating}/5</span>
                                </div>
                            )}
                            {course.ratingCount && (
                                <span className="text-[10px] text-gray-500">({course.ratingCount} đánh giá)</span>
                            )}
                            {course.enrolledCount && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Users className="h-3 w-3" />
                                    <span>{course.enrolledCount}</span>
                                </div>
                            )}
                            {duration && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <Clock className="h-3 w-3" />
                                    <span>{formatDuration(duration / 60)}</span>
                                </div>
                            )}
                            {course.lessons && (
                                <div className="flex items-center gap-1 text-xs text-gray-400">
                                    <BookOpen className="h-3 w-3" />
                                    <span>{course.lessons} bài học</span>
                                </div>
                            )}
                        </div>
                        {instructorName && (
                            <p className="text-[11px] text-gray-500 mt-1 truncate">Giảng viên: {instructorName}</p>
                        )}
                    </div>
                    <div className="mt-3 flex items-center justify-between">
                        <span className="text-sm font-semibold text-blue-400">{priceDisplay}</span>
                        <span className="text-xs text-blue-400 font-medium">Xem chi tiết →</span>
                    </div>
                </div>
            </div>
        </a>
    )
}
