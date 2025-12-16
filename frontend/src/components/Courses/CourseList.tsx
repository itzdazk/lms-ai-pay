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
    limit?: number
    className?: string
}

export function CourseList({
    courses,
    isLoading = false,
    currentPage,
    totalPages,
    onPageChange,
    totalCourses = 0,
    limit = 12,
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
                            className='overflow-hidden bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50'
                        >
                            <div className='aspect-video bg-gradient-to-br from-[#1F1F1F] to-[#151515] animate-pulse' />
                            <div className='p-5 space-y-3'>
                                <div className='h-4 bg-[#2D2D2D] rounded animate-pulse' />
                                <div className='h-4 bg-[#2D2D2D] rounded w-3/4 animate-pulse' />
                                <div className='h-4 bg-[#2D2D2D] rounded w-1/2 animate-pulse' />
                            </div>
                        </Card>
                    ))}
                </div>
            </div>
        )
    }

    // Empty state
    if (courses.length === 0) {
        return (
            <Card className='p-12 text-center bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50'>
                <div className='space-y-4'>
                    <div className='text-6xl'>📚</div>
                    <h3 className='text-xl font-semibold text-white'>
                        Không tìm thấy khóa học
                    </h3>
                    <p className='text-gray-400 max-w-md mx-auto'>
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

            {/* Pagination & Results Info */}
            {(totalPages > 1 || totalCourses > 0) && (
                <div className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl p-4 shadow-lg space-y-4'>
                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className='flex items-center justify-center gap-2'>
                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                    onPageChange(Math.max(1, currentPage - 1))
                                }
                                disabled={currentPage === 1}
                                className='border-[#2D2D2D] text-white bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:border-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                            >
                                <ChevronLeft className='h-4 w-4 mr-1' />
                                Trước
                            </Button>

                            <div className='flex items-center gap-1'>
                                {/* Always show first page */}
                                <Button
                                    variant={
                                        currentPage === 1
                                            ? 'default'
                                            : 'outline'
                                    }
                                    size='sm'
                                    onClick={() => onPageChange(1)}
                                    className={
                                        currentPage === 1
                                            ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-blue-500 shadow-lg cursor-pointer transition-all duration-200'
                                            : 'border-[#2D2D2D] text-white bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:border-[#3D3D3D] cursor-pointer transition-all duration-200'
                                    }
                                >
                                    1
                                </Button>

                                {/* Show ellipsis if there's a gap between page 1 and current page range */}
                                {currentPage > 3 && (
                                    <span className='px-2 text-gray-400'>
                                        ...
                                    </span>
                                )}

                                {/* Show pages around current page */}
                                {Array.from(
                                    { length: totalPages },
                                    (_, i) => i + 1
                                )
                                    .filter((page) => {
                                        // Show pages that are:
                                        // - Not page 1 (already shown)
                                        // - Not last page (will be shown later)
                                        // - Within range of current page ± 1
                                        return (
                                            page !== 1 &&
                                            page !== totalPages &&
                                            page >= currentPage - 1 &&
                                            page <= currentPage + 1
                                        )
                                    })
                                    .map((page) => (
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
                                                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-blue-500 shadow-lg cursor-pointer transition-all duration-200'
                                                    : 'border-[#2D2D2D] text-white bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:border-[#3D3D3D] cursor-pointer transition-all duration-200'
                                            }
                                        >
                                            {page}
                                        </Button>
                                    ))}

                                {/* Show ellipsis if there's a gap between current page range and last page */}
                                {currentPage < totalPages - 2 && (
                                    <span className='px-2 text-gray-400'>
                                        ...
                                    </span>
                                )}

                                {/* Always show last page (if more than 1 page) */}
                                {totalPages > 1 && (
                                    <Button
                                        variant={
                                            currentPage === totalPages
                                                ? 'default'
                                                : 'outline'
                                        }
                                        size='sm'
                                        onClick={() => onPageChange(totalPages)}
                                        className={
                                            currentPage === totalPages
                                                ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 border-blue-500 shadow-lg cursor-pointer transition-all duration-200'
                                                : 'border-[#2D2D2D] text-white bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:border-[#3D3D3D] cursor-pointer transition-all duration-200'
                                        }
                                    >
                                        {totalPages}
                                    </Button>
                                )}
                            </div>

                            <Button
                                variant='outline'
                                size='sm'
                                onClick={() =>
                                    onPageChange(
                                        Math.min(totalPages, currentPage + 1)
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className='border-[#2D2D2D] text-white bg-[#1F1F1F] hover:bg-[#2D2D2D] hover:border-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200'
                            >
                                Sau
                                <ChevronRight className='h-4 w-4 ml-1' />
                            </Button>
                        </div>
                    )}

                    {/* Results Info */}
                    {totalCourses > 0 && (
                        <div className='text-center'>
                            <p className='text-sm text-gray-300'>
                                Hiển thị{' '}
                                <span className='text-white font-semibold'>
                                    {(currentPage - 1) * limit + 1}
                                </span>
                                {' - '}
                                <span className='text-white font-semibold'>
                                    {Math.min(
                                        currentPage * limit,
                                        totalCourses
                                    )}
                                </span>{' '}
                                trong tổng số{' '}
                                <span className='text-white font-semibold'>
                                    {totalCourses}
                                </span>{' '}
                                khóa học
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
