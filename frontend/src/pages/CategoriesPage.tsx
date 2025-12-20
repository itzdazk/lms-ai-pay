import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft } from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { categoriesApi, coursesApi } from '../lib/api'
import type { Category, PublicCourse } from '../lib/api/types'
import { Breadcrumb, CategoryList } from '../components/Categories'
import { CourseFiltersState, SortOption } from '../components/Courses'

type ViewMode = 'list' | 'detail'

interface ViewState {
    mode: ViewMode
    selectedCategory: Category | null
    courses: PublicCourse[]
}

export function CategoriesPage() {
    const [viewState, setViewState] = useState<ViewState>({
        mode: 'list',
        selectedCategory: null,
        courses: [],
    })

    const [searchParams, setSearchParams] = useSearchParams()
    const [categories, setCategories] = useState<Category[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [courses, setCourses] = useState<PublicCourse[]>([])
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
    })

    const navigate = useNavigate()

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                setIsLoading(true)
                const response = await categoriesApi.getCategories({
                    isActive: true,
                    limit: 20,
                })
                setCategories(response.data)
            } catch (error) {
                console.error('Error fetching categories:', error)
                toast.error('Không thể tải danh mục')
            } finally {
                setIsLoading(false)
            }
        }
        console.log('CategoriesPage.tsx: ', categories)

        fetchCategories()
    }, [])

    useEffect(() => {
        console.log('CategoriesPage.tsx:', categories)
    }, [categories])

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

    const breadcrumbItems = useMemo(
        () => [
            {
                label: 'Danh mục',
                href: '/categories',
            },
        ],
        []
    )

    const handleCategoryClick = (category: Category) => {
        navigate(`/categories/${category.id}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handleBackToList = () => {
        setViewState({
            mode: 'list',
            selectedCategory: null,
            courses: [],
        })
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className='min-h-screen bg-gray-50 dark:bg-black'>
            {/* Header */}
            <div className='bg-white dark:bg-[#1A1A1A] border-b border-gray-200 dark:border-[#2D2D2D]'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
                    <div className='flex items-center gap-4'>
                        {viewState.mode === 'detail' && (
                            <button
                                onClick={handleBackToList}
                                className='p-2 hover:bg-gray-100 dark:hover:bg-[#2D2D2D] rounded-lg transition-colors'
                            >
                                <ArrowLeft className='w-5 h-5 text-gray-900 dark:text-white' />
                            </button>
                        )}
                        <div className='flex-1'>
                            <h1 className='mb-2 text-gray-900 dark:text-white'>
                                {viewState.mode === 'list'
                                    ? 'Khám phá danh mục'
                                    : viewState.selectedCategory?.name}
                            </h1>
                            {viewState.mode === 'list' && (
                                <p className='text-gray-600 dark:text-gray-400'>
                                    Tìm kiếm khóa học phù hợp với mục tiêu học
                                    tập của bạn
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
                <Breadcrumb items={breadcrumbItems} />

                {viewState.mode === 'list' ? (
                    <CategoryList
                        categories={categories}
                        onCategoryClick={handleCategoryClick}
                        showFilters={true}
                    />
                ) : viewState.selectedCategory ? (
                    //* Đang sửa đến đây => xem 2 cái nút filter ở đâu, sửa từ từ
                    // <CategoriesDetailPage
                    //     categories={viewState.selectedCategory}
                    //     courses={viewState.courses}
                    //     onChildClick={handleChildCategoryClick}
                    // />
                    <h2 className='text-gray-900 dark:text-white'>Hello</h2>
                ) : null}
            </div>

            {/* Footer Info */}
            <div className='bg-white dark:bg-[#1A1A1A] border-t border-gray-200 dark:border-[#2D2D2D] mt-16'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12'>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-8'>
                        <div>
                            <h3 className='mb-3 font-semibold text-gray-900 dark:text-white'>
                                Học tập linh hoạt
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
                                Truy cập khóa học mọi lúc, mọi nơi với thiết bị
                                của bạn.
                            </p>
                        </div>
                        <div>
                            <h3 className='mb-3 font-semibold text-gray-900 dark:text-white'>
                                Giảng viên chuyên nghiệp
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
                                Học từ các chuyên gia hàng đầu trong ngành.
                            </p>
                        </div>
                        <div>
                            <h3 className='mb-3 font-semibold text-gray-900 dark:text-white'>
                                Chứng chỉ hoàn thành
                            </h3>
                            <p className='text-gray-600 dark:text-gray-400 text-sm leading-relaxed'>
                                Nhận chứng chỉ sau khi hoàn thành khóa học.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
