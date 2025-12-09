// ============================================
// FILE: src/pages/CoursesPage.tsx (THAY ĐỔI HOÀN TOÀN)
// Integrated with real API - thay thế toàn bộ mock data
// ============================================

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Button } from '../components/ui/button'
import { Filter } from 'lucide-react'
import { toast } from 'sonner'
import {
    CourseList,
    CourseFilters,
    CourseSearch,
    CourseSortSelect,
    type CourseFiltersState,
    type SortOption,
} from '../components/Courses'
import { coursesApi } from '../lib/api'
import type { Category, Tag, PublicCourse, Course } from '../lib/api/types'

export function CoursesPage() {
    const [searchParams, setSearchParams] = useSearchParams()

    // State
    const [courses, setCourses] = useState<PublicCourse[]>([])
    const [categories, setCategories] = useState<Category[]>([])
    const [tags, setTags] = useState<Tag[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isCategoriesLoading, setIsCategoriesLoading] = useState(true)
    const [isTagsLoading, setIsTagsLoading] = useState(true)
    const [showFilters, setShowFilters] = useState(true)

    // Pagination
    const [currentPage, setCurrentPage] = useState(1)
    const [totalCourses, setTotalCourses] = useState(0)
    const [totalPages, setTotalPages] = useState(1)
    const limit = 12

    // Filters from URL
    const [searchQuery, setSearchQuery] = useState(
        searchParams.get('search') || ''
    )
    const [sortBy, setSortBy] = useState<SortOption>(
        (searchParams.get('sort') as SortOption) || 'popular'
    )
    const [filters, setFilters] = useState<CourseFiltersState>({
        categoryId: searchParams.get('categoryId')
            ? parseInt(searchParams.get('categoryId')!)
            : undefined,
        level: (searchParams.get('level') as any) || undefined,
        priceType: (searchParams.get('priceType') as any) || undefined,
        tagId: searchParams.get('tagId')
            ? parseInt(searchParams.get('tagId')!)
            : undefined,
    })

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsCategoriesLoading(true)
                const data = await coursesApi.getCategories()
                setCategories(data)
            } catch (error) {
                console.error('Error fetching categories:', error)
                toast.error('Không thể tải danh mục')
            } finally {
                setIsCategoriesLoading(false)
            }
        }

        fetchCategories()
    }, [])

    // Fetch tags
    useEffect(() => {
        const fetchTags = async () => {
            try {
                setIsTagsLoading(true)
                // Lấy top 20 tags phổ biến nhất
                const data = await coursesApi.getCourseTags({ limit: 20 })
                // Sort theo số lượng courses (descending)
                const sortedTags = data.tags.sort((a, b) => {
                    const countA = a._count?.courses || 0
                    const countB = b._count?.courses || 0
                    return countB - countA
                })
                setTags(sortedTags)
            } catch (error) {
                console.error('Error fetching tags:', error)
                toast.error('Không thể tải tags')
            } finally {
                setIsTagsLoading(false)
            }
        }

        fetchTags()
    }, [])

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true)

                const response = await coursesApi.getPublicCourses({
                    page: currentPage,
                    limit,
                    search: searchQuery || undefined,
                    categoryId: filters.categoryId,
                    level: filters.level,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    sort: sortBy,
                    tagId: filters.tagId,
                })

                console.log('CoursesPage.tsx: ', response)

                // Backend returns { courses, total } format
                setCourses(response.data || [])
                setTotalCourses(response.total)
                setTotalPages(Math.ceil(response.total / limit))

                console.log('CoursesPage.tsx-courses:', response.data || [])
                console.log('CoursesPage.tsx-total:', response.total)
                console.log(
                    'CoursesPage.tsx-totalPages:',
                    Math.ceil(response.total / limit)
                )
            } catch (error: any) {
                console.error('Error fetching courses:', error)
                toast.error(
                    error?.response?.data?.message ||
                        'Không thể tải danh sách khóa học'
                )
                setCourses([])
            } finally {
                setIsLoading(false)
            }
        }

        fetchCourses()
    }, [currentPage, searchQuery, filters, sortBy])

    // Sync URL params
    useEffect(() => {
        const params: Record<string, string> = {}

        if (searchQuery) params.search = searchQuery
        if (sortBy !== 'popular') params.sort = sortBy
        if (filters.categoryId)
            params.categoryId = filters.categoryId.toString()
        if (filters.level) params.level = filters.level
        if (filters.priceType) params.priceType = filters.priceType
        if (filters.tagId) params.tagId = filters.tagId.toString()

        setSearchParams(params, { replace: true })
    }, [searchQuery, sortBy, filters, setSearchParams])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [searchQuery, filters, sortBy])

    const handleSearchChange = (value: string) => {
        setSearchQuery(value)
    }

    const handleFiltersChange = (newFilters: CourseFiltersState) => {
        setFilters(newFilters)
    }

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
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4'>
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white'>
                                Khám phá khóa học
                            </h1>
                            <p className='text-sm text-gray-400'>
                                Tìm kiếm và học hỏi từ{' '}
                                <span className='text-white font-semibold'>
                                    {totalCourses}
                                </span>{' '}
                                khóa học chất lượng cao
                            </p>
                        </div>

                        {/* Stats */}
                        <div className='flex gap-4'>
                            <div className='text-center'>
                                <div className='text-xl font-bold text-white'>
                                    {totalCourses}
                                </div>
                                <div className='text-xs text-gray-400'>
                                    Khóa học
                                </div>
                            </div>
                            <div className='text-center'>
                                <div className='text-xl font-bold text-white'>
                                    {categories.length}
                                </div>
                                <div className='text-xs text-gray-400'>
                                    Danh mục
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Search Bar */}
                    <div className='flex gap-2'>
                        <CourseSearch
                            value={searchQuery}
                            onChange={handleSearchChange}
                            className='flex-1'
                        />
                        <Button
                            variant='outline'
                            onClick={() => setShowFilters(!showFilters)}
                            className='md:hidden h-10 border-[#2D2D2D] text-white hover:bg-[#2D2D2D]'
                        >
                            <Filter className='h-4 w-4 mr-2' />
                            Bộ lọc
                        </Button>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 py-8'>
                <div className='grid lg:grid-cols-4 gap-6'>
                    {/* Filters Sidebar */}
                    <aside
                        className={`lg:block ${
                            showFilters ? 'block' : 'hidden'
                        }`}
                    >
                        <CourseFilters
                            filters={filters}
                            onChange={handleFiltersChange}
                            categories={categories}
                            tags={tags}
                            isLoading={isCategoriesLoading || isTagsLoading}
                        />
                    </aside>

                    {/* Courses Grid */}
                    <div className='lg:col-span-3 space-y-6'>
                        {/* Sort & Results */}
                        <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                            <p className='text-gray-400'>
                                {isLoading ? (
                                    'Đang tải...'
                                ) : (
                                    <>
                                        Hiển thị {(currentPage - 1) * limit + 1}
                                        -
                                        {Math.min(
                                            currentPage * limit,
                                            totalCourses
                                        )}{' '}
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
            </div>
        </div>
    )
}
