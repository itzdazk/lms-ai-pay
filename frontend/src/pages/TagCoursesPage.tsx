// ============================================
// FILE: src/pages/TagCoursesPage.tsx (TẠO MỚI - OPTIONAL)
// Display courses filtered by tag
// ============================================

import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { ArrowLeft, Tag as TagIcon } from 'lucide-react'
import { toast } from 'sonner'
import {
    CourseList,
    CourseSortSelect,
    type SortOption,
} from '../components/Courses'
import { coursesApi } from '../lib/api'
import type { Course, Tag } from '../lib/api/types'

export function TagCoursesPage() {
    const { tagId } = useParams<{ tagId: string }>()
    const navigate = useNavigate()

    // State
    const [tag, setTag] = useState<Tag | null>(null)
    const [courses, setCourses] = useState<Course[]>([])
    const [isLoading, setIsLoading] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCourses, setTotalCourses] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 12

    // Filters
    const [sortBy, setSortBy] = useState<SortOption>('popular')

    // Fetch tag and courses
    useEffect(() => {
        const fetchData = async () => {
            if (!tagId) return

            try {
                setIsLoading(true)

                const response = await coursesApi.getCoursesByTag(
                    parseInt(tagId),
                    {
                        page: currentPage,
                        limit,
                        sort: sortBy,
                    }
                )

                setTag(response.tag)
                setCourses(response.courses)
                setTotalCourses(response.pagination.total)
                setTotalPages(response.pagination.totalPages)
            } catch (error: any) {
                console.error('Error fetching tag courses:', error)
                toast.error(
                    error?.response?.data?.message ||
                        'Không thể tải danh sách khóa học'
                )
                setCourses([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchData()
    }, [tagId, currentPage, sortBy])

    // Reset to page 1 when sort changes
    useEffect(() => {
        setCurrentPage(1)
    }, [sortBy])

    const handleSortChange = (value: SortOption) => {
        setSortBy(value)
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className='bg-background min-h-screen'>
            {/* Header Section */}
            <div className='bg-[#1A1A1A] border-b border-[#2D2D2D]'>
                <div className='container mx-auto px-4 py-6'>
                    <div className='mb-4'>
                        <Button
                            variant='outline'
                            onClick={() => navigate('/courses')}
                            className='border-[#2D2D2D] text-white hover:bg-[#2D2D2D]'
                        >
                            <ArrowLeft className='mr-2 h-4 w-4' />
                            Quay lại tất cả khóa học
                        </Button>
                    </div>

                    <div className='flex items-center gap-3 mb-4'>
                        <TagIcon className='h-8 w-8 text-blue-600' />
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold text-white'>
                                {tag ? tag.name : 'Đang tải...'}
                            </h1>
                            <p className='text-sm text-gray-400'>
                                {isLoading ? (
                                    'Đang tải...'
                                ) : (
                                    <>
                                        Tìm thấy{' '}
                                        <span className='text-white font-semibold'>
                                            {totalCourses}
                                        </span>{' '}
                                        khóa học
                                    </>
                                )}
                            </p>
                        </div>
                    </div>

                    {tag && (
                        <Badge
                            variant='outline'
                            className='border-blue-600 text-blue-600'
                        >
                            Tag: {tag.name}
                        </Badge>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 py-8'>
                {/* Sort & Results */}
                <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6'>
                    <p className='text-gray-400'>
                        {isLoading ? (
                            'Đang tải...'
                        ) : (
                            <>
                                Hiển thị {(currentPage - 1) * limit + 1}-
                                {Math.min(currentPage * limit, totalCourses)}{' '}
                                trong tổng số {totalCourses} khóa học
                            </>
                        )}
                    </p>
                    <CourseSortSelect
                        value={sortBy}
                        onChange={handleSortChange}
                    />
                </div>

                {/* Course List */}
                <CourseList
                    courses={courses}
                    isLoading={isLoading}
                    currentPage={currentPage}
                    totalPages={totalPages}
                    totalCourses={totalCourses}
                    onPageChange={handlePageChange}
                />
            </div>
        </div>
    )
}
