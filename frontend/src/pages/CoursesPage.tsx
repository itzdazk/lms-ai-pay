// ============================================
// FILE: src/pages/CoursesPage.tsx (THAY ĐỔI HOÀN TOÀN)
// Integrated with real API - thay thế toàn bộ mock data
// ============================================

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import {
    CourseList,
    CourseFilters,
    CourseSearch,
    CourseSortSelect,
    type CourseFiltersState,
    type SortOption,
} from '../components/Courses'
import { coursesApi } from '../lib/api/courses'
import type { Category, Tag, PublicCourse } from '../lib/api/types'

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
    const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(
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
        tagIds: searchParams.get('tagIds')
            ? searchParams
                  .get('tagIds')!
                  .split(',')
                  .map((id) => parseInt(id))
                  .filter((id) => !isNaN(id))
            : undefined,
        instructorId: searchParams.get('instructorId')
            ? parseInt(searchParams.get('instructorId')!)
            : undefined,
    })

    // Fetch categories
    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsCategoriesLoading(true)
                const data = await coursesApi.getCategories()
                // Sort categories by coursesCount (descending) - categories with most courses first
                const sortedData = [...data].sort((a, b) => {
                    const countA = a.coursesCount || 0
                    const countB = b.coursesCount || 0
                    return countB - countA // Descending order
                })
                setCategories(sortedData)
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
                // Lấy tất cả tags (tối đa 100 theo MAX_LIMIT của backend)
                const data = await coursesApi.getCourseTags({ limit: 100 })
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

    // Debounce search query
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearchQuery(searchQuery)
        }, 500) // 500ms delay

        return () => clearTimeout(timer)
    }, [searchQuery])

    // Fetch courses
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                setIsLoading(true)

                const response = await coursesApi.getPublicCourses({
                    page: currentPage,
                    limit,
                    search: debouncedSearchQuery || undefined,
                    categoryId: filters.categoryId,
                    level: filters.level,
                    minPrice: filters.minPrice,
                    maxPrice: filters.maxPrice,
                    sort: sortBy,
                    tagIds: filters.tagIds,
                    instructorId: filters.instructorId,
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
    }, [currentPage, debouncedSearchQuery, filters, sortBy])

    // Sync URL params
    useEffect(() => {
        const params: Record<string, string> = {}

        if (debouncedSearchQuery) params.search = debouncedSearchQuery
        if (sortBy !== 'popular') params.sort = sortBy
        if (filters.categoryId)
            params.categoryId = filters.categoryId.toString()
        if (filters.level) params.level = filters.level
        if (filters.priceType) params.priceType = filters.priceType
        if (filters.tagIds && filters.tagIds.length > 0)
            params.tagIds = filters.tagIds.join(',')
        if (filters.instructorId)
            params.instructorId = filters.instructorId.toString()

        setSearchParams(params, { replace: true })
    }, [debouncedSearchQuery, sortBy, filters, setSearchParams])

    // Reset to page 1 when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [debouncedSearchQuery, filters, sortBy])

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
            <div className='bg-[#1A1A1A]  border-b border-gray-800 dark:border-gray-800'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-6 '>
                        <div>
                            <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white dark:text-white'>
                                Khám phá khóa học
                            </h1>
                            <p className='text-base text-gray-300 dark:text-gray-300 leading-relaxed'>
                                Tìm kiếm và học hỏi từ{' '}
                                <span className='text-white dark:text-white font-semibold'>
                                    {totalCourses}
                                </span>{' '}
                                khóa học chất lượng cao
                            </p>
                        </div>

                        {/* Stats */}
                        <div className='flex gap-4'>
                            <div className='bg-black rounded-xl p-4 border border-[#2D2D2D] dark:border-[#2D2D2D] transition-all duration-200 shadow-lg group min-w-[100px]'>
                                <div className='text-2xl font-bold text-white dark:text-white transition-colors'>
                                    {totalCourses}
                                </div>
                                <div className='text-xs text-gray-400 dark:text-gray-400 transition-colors mt-1'>
                                    Khóa học
                                </div>
                            </div>
                            <div className='bg-black rounded-xl p-4 border border-[#2D2D2D] dark:border-[#2D2D2D] transition-all duration-200 shadow-lg group min-w-[100px]'>
                                <div className='text-2xl font-bold text-white dark:text-white transition-colors'>
                                    {categories.length}
                                </div>
                                <div className='text-xs text-gray-400 dark:text-gray-400 transition-colors mt-1'>
                                    Danh mục
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8'>
                <div className='grid lg:grid-cols-4 gap-6'>
                    {/* Filters Sidebar */}
                    <aside className='lg:col-span-1'>
                        <CourseFilters
                            filters={filters}
                            onChange={handleFiltersChange}
                            categories={categories}
                            tags={tags}
                            isLoading={isCategoriesLoading || isTagsLoading}
                            onToggle={() => setShowFilters(!showFilters)}
                            showFilters={showFilters}
                        />
                    </aside>

                    {/* Courses Grid */}
                    <div className='lg:col-span-3 space-y-6'>
                        {/* Sort & Search */}
                        <div className='bg-gradient-to-br from-[#1A1A1A] to-[#151515] border border-[#2D2D2D]/50 rounded-xl p-4 shadow-lg space-y-4'>
                            <div className='flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4'>
                                <p className='text-sm text-gray-300'>
                                    {isLoading ? (
                                        <span className='animate-pulse'>
                                            Đang tải...
                                        </span>
                                    ) : (
                                        <>
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
                                        </>
                                    )}
                                </p>
                                <CourseSortSelect
                                    value={sortBy}
                                    onChange={handleSortChange}
                                />
                            </div>

                            {/* Search Bar */}
                            <div className='flex gap-3'>
                                <div className='flex-1'>
                                    <CourseSearch
                                        value={searchQuery}
                                        onChange={handleSearchChange}
                                        className='flex-1'
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Course List */}
                        <CourseList
                            courses={courses}
                            isLoading={isLoading}
                            currentPage={currentPage}
                            totalPages={totalPages}
                            totalCourses={totalCourses}
                            limit={limit}
                            onPageChange={handlePageChange}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}
