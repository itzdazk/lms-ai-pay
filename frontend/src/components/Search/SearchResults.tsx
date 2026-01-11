import { Link } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar'
import {
    Star,
    Users,
    BookOpen,
    Clock,
    Loader2,
    SearchX,
} from 'lucide-react'
import type { PublicCourse } from '../../lib/api/types'
import { formatPrice, formatDuration } from '../../lib/courseUtils'

interface SearchResultsProps {
    courses: PublicCourse[]
    loading?: boolean
    query?: string
    total?: number
    onLoadMore?: () => void
    hasMore?: boolean
}

export function SearchResults({
    courses,
    loading = false,
    query,
    total,
    onLoadMore,
    hasMore = false,
}: SearchResultsProps) {
    if (loading && courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Đang tìm kiếm...</p>
            </div>
        )
    }

    if (!loading && courses.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12">
                <SearchX className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">
                    Không tìm thấy kết quả
                </h3>
                <p className="text-muted-foreground text-center max-w-md">
                    {query
                        ? `Không có khóa học nào phù hợp với "${query}". Hãy thử tìm kiếm với từ khóa khác.`
                        : 'Hãy thử tìm kiếm với từ khóa khác.'}
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {query && (
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-bold mb-1">
                            Kết quả tìm kiếm
                        </h2>
                        <p className="text-muted-foreground">
                            Tìm thấy {total || courses.length} khóa học
                            {query && ` cho "${query}"`}
                        </p>
                    </div>
                </div>
            )}

            <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {courses.map((course) => (
                    <Card
                        key={course.id}
                        className="overflow-hidden hover:shadow-lg transition-shadow flex flex-col bg-[#1A1A1A] border-[#2D2D2D]"
                    >
                        <Link to={`/courses/${course.slug}`}>
                            <div className="relative aspect-video overflow-hidden rounded-t-lg">
                                <img
                                    src={
                                        course.thumbnailUrl ||
                                        'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=400&h=300&fit=crop'
                                    }
                                    alt={course.title}
                                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                                />
                                <Badge className="absolute top-3 left-3 bg-blue-600">
                                    {course.level === 'BEGINNER' && 'Cơ bản'}
                                    {course.level === 'INTERMEDIATE' &&
                                        'Trung cấp'}
                                    {course.level === 'ADVANCED' && 'Nâng cao'}
                                </Badge>
                                {course.isFeatured && (
                                    <Badge className="absolute top-3 right-3 bg-yellow-500">
                                        ⭐ Nổi bật
                                    </Badge>
                                )}
                            </div>
                        </Link>

                        <CardHeader className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                <Avatar className="h-8 w-8">
                                    <AvatarImage
                                        src={course.instructor?.avatarUrl}
                                    />
                                    <AvatarFallback>
                                        {course.instructor?.fullName?.[0] || 'U'}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="text-sm text-gray-400">
                                    {course.instructor?.fullName || 'Unknown'}
                                </span>
                            </div>
                            <CardTitle className="line-clamp-2 hover:text-primary transition-colors text-white">
                                <Link to={`/courses/${course.slug}`}>
                                    {course.title}
                                </Link>
                            </CardTitle>
                            <p className="line-clamp-2 text-gray-400 text-sm mt-2">
                                {course.shortDescription || course.description}
                            </p>
                        </CardHeader>

                        <CardContent>
                            <div className="flex items-center gap-4 text-sm text-gray-400 mb-3">
                                <div className="flex items-center gap-1">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                    <span>
                                        {course.ratingAvg
                                            ? course.ratingAvg.toFixed(1)
                                            : '0.0'}
                                    </span>
                                    <span className="text-gray-400">
                                        ({course.ratingCount || 0})
                                    </span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Users className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {course.enrolledCount.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm text-gray-400">
                                <div className="flex items-center gap-1">
                                    <BookOpen className="h-4 w-4 text-gray-400" />
                                    <span>{course.totalLessons} bài</span>
                                </div>
                                <div className="flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-gray-400" />
                                    <span>
                                        {course.durationHours > 0
                                            ? formatDuration(course.durationHours / 60)
                                            : 'N/A'}
                                    </span>
                                </div>
                            </div>
                        </CardContent>

                        <div className="border-t border-[#2D2D2D] pt-4 px-6 pb-4">
                            <div className="flex items-center justify-between w-full">
                                {course.isFree ? (
                                    <span className="text-2xl text-green-500">
                                        Miễn phí
                                    </span>
                                ) : (
                                    <div>
                                        {course.discountPrice ? (
                                            <div className="flex items-center gap-2">
                                                <span className="text-2xl text-blue-500">
                                                    {formatPrice(
                                                        course.discountPrice
                                                    )}
                                                </span>
                                                <span className="text-sm text-gray-500 line-through">
                                                    {formatPrice(course.price)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className="text-2xl text-blue-500">
                                                {formatPrice(course.price)}
                                            </span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Tags */}
                        {course.tags && course.tags.length > 0 && (
                            <div className="px-6 pb-4">
                                <div className="flex flex-wrap gap-2">
                                    {course.tags.slice(0, 3).map((tag) => (
                                        <Badge
                                            key={tag.id}
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            {tag.name}
                                        </Badge>
                                    ))}
                                    {course.tags.length > 3 && (
                                        <Badge
                                            variant="outline"
                                            className="text-xs"
                                        >
                                            +{course.tags.length - 3}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                        )}
                    </Card>
                ))}
            </div>

            {hasMore && onLoadMore && (
                <div className="flex justify-center pt-6">
                    <button
                        onClick={onLoadMore}
                        disabled={loading}
                        className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                                Đang tải...
                            </>
                        ) : (
                            'Tải thêm'
                        )}
                    </button>
                </div>
            )}
        </div>
    )
}

