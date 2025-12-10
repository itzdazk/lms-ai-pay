// ============================================
// FILE: src/components/Courses/CourseList.tsx (CẬP NHẬT)
// Course grid with pagination with light/dark theme support
// ============================================

import { CourseCard } from './CourseCard'
import { Button } from '../ui/button'
import { Card } from '../ui/card'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { PublicCourse } from '../../lib/api/types'

interface CourseListProps {
    courses: PublicCourse[]
    isLoading?: boolean
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    totalCourses?: number
    className?: string
}

export function CourseList({
    courses,
    isLoading = false,
    currentPage,
    totalPages,
    onPageChange,
    totalCourses = 0,
    className = '',
}: CourseListProps) {
    // Loading skeleton
    if (isLoading) {
        return (
            <div className={className}>
                <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                    {Array.from({ length: 6 }).map((_, i) => (
                        <Card
                            key={i}
                            className='overflow-hidden bg-card border-border'
                        >
                            <div className='aspect-video bg-muted animate-pulse' />
                            <div className='p-6 space-y-4'>
                                <div className='h-4 bg-muted rounded animate-pulse' />
                                <div className='h-4 bg-muted rounded w-3/4 animate-pulse' />
                                <div className='h-4 bg-muted rounded w-1/2 animate-pulse' />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    console.log('CourseList.tsx', courses)

    // Empty state
    if (courses.length === 0) {
        return (
            <Card className='p-12 text-center bg-card border-border'>
                <div className='space-y-3'>
                    <div className='text-6xl'>📚</div>
                    <h3 className='text-xl font-semibold text-foreground'>
                        Không tìm thấy khóa học
                    </h3>
                    <p className='text-muted-foreground'>
                        Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm để xem thêm
                        khóa học
                    </p>
                </div>
            </Card>
        )
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Course Grid */}
            <div className='grid md:grid-cols-2 xl:grid-cols-3 gap-6'>
                {courses.map((course) => (
                    <CourseCard key={course.id} course={course} />
                ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className='flex items-center justify-center gap-2 pt-4'>
                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                            onPageChange(Math.max(1, currentPage - 1))
                        }
                        disabled={currentPage === 1}
                        className='border-border text-foreground hover:bg-secondary disabled:opacity-50 cursor-pointer'
                    >
                        <ChevronLeft className='h-4 w-4 mr-1' />
                        Trước
                    </Button>

                    <div className='flex items-center gap-1'>
                        {Array.from(
                            { length: totalPages },
                            (_, i) => i + 1
                        ).map((page) => {
                            // Show first page, last page, current page and adjacent pages
                            if (
                                page === 1 ||
                                page === totalPages ||
                                (page >= currentPage - 1 &&
                                    page <= currentPage + 1)
                            ) {
                                return (
                                    <Button
                                        key={page}
                                        variant={
                                            currentPage === page
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() => onPageChange(page)}
                                        className={
                                            currentPage === page
                                                ? 'bg-primary text-primary-foreground hover:bg-primary/90 cursor-pointer'
                                                : 'border-border text-foreground hover:bg-secondary cursor-pointer'
                                        }
                                    >
                                        {page}
                                    </Button>
                                )
                            } else if (
                                page === currentPage - 2 ||
                                page === currentPage + 2
                            ) {
                                return (
                                    <span
                                        key={page}
                                        className='px-2 text-muted-foreground'
                                    >
                                        ...
                                    </span>
                                )
                            }
                            return null
                        })}
                    </div>

                    <Button
                        variant='outline'
                        size='sm'
                        onClick={() =>
                            onPageChange(Math.min(totalPages, currentPage + 1))
                        }
                        disabled={currentPage === totalPages}
                        className='border-border text-foreground hover:bg-secondary disabled:opacity-50 cursor-pointer'
                    >
                        Sau
                        <ChevronRight className='h-4 w-4 ml-1' />
                    </Button>
                </div>
            )}

            {/* Results info */}
            {totalCourses > 0 && (
                <p className='text-center text-sm text-muted-foreground'>
                    Hiển thị {(currentPage - 1) * 12 + 1}-
                    {Math.min(currentPage * 12, totalCourses)} trong tổng số{' '}
                    {totalCourses} khóa học
                </p>
            )}
        </div>
    )
}
