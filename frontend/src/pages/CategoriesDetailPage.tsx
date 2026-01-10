import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { categoriesApi, getCategoryPath } from '../lib/api/categories'
import type { Category, PublicCourse } from '../lib/api/types'
import { Breadcrumb, CategoryDetail } from '../components/Categories'
import { Card } from '../components/ui/card'
import { Button } from '../components/ui/button'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select'

const limit = 12

export function CategoriesDetailPage() {
    const { id } = useParams<{ id: string }>()
    const navigate = useNavigate()

    const [category, setCategory] = useState<Category | null>(null)
    const [children, setChildren] = useState<Category[]>([])
    const [courses, setCourses] = useState<PublicCourse[]>([])

    const [isLoadingCategory, setIsLoadingCategory] = useState(true)
    const [isLoadingCourses, setIsLoadingCourses] = useState(false)

    const [currentPage, setCurrentPage] = useState(1)
    const [totalCourses, setTotalCourses] = useState(0)
    const [totalPages, setTotalPages] = useState(1)

    const [level, setLevel] = useState<
        'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined
    >(undefined)
    const [sort, setSort] = useState<
        'newest' | 'popular' | 'rating' | 'price_asc' | 'price_desc'
    >('newest')

    // Reset pagination when filters change
    useEffect(() => {
        setCurrentPage(1)
    }, [level, sort, id])

    useEffect(() => {
        if (!id) return

        const fetchCategory = async () => {
            try {
                setIsLoadingCategory(true)
                const data = await categoriesApi.getCategoryById(Number(id))
                setCategory(data)
                setChildren(data.children || [])
            } catch (error) {
                console.error('Error fetching category:', error)
                toast.error('Không thể tải thông tin danh mục')
                setCategory(null)
            } finally {
                setIsLoadingCategory(false)
            }
        }

        fetchCategory()
    }, [id])

    useEffect(() => {
        if (!id) return

        const fetchCourses = async () => {
            try {
                setIsLoadingCourses(true)
                const response = await categoriesApi.getCoursesByCategoryId(
                    Number(id),
                    {
                        page: currentPage,
                        limit,
                        level,
                        sort,
                    }
                )
                setCourses(response.data)
                setTotalCourses(response.pagination.total)
                setTotalPages(response.pagination.totalPages)
            } catch (error) {
                console.error('Error fetching courses:', error)
                toast.error('Không thể tải danh sách khóa học')
                setCourses([])
            } finally {
                setIsLoadingCourses(false)
            }
        }

        fetchCourses()
    }, [id, currentPage, level, sort])

    const breadcrumbItems = useMemo(() => {
        const base = [{ label: 'Danh mục', href: '/categories' }]
        if (!category) return base
        const path = getCategoryPath(category).map((cat) => ({
            label: cat.name,
            href: `/categories/${cat.id}`,
        }))
        return [...base, ...path]
    }, [category])

    const handleBack = () => {
        navigate('/categories')
    }

    const handleChildClick = (child: Category) => {
        navigate(`/categories/${child.id}`)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const handlePageChange = (page: number) => {
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    const filtersSlot = (
        <>
            <Select
                value={level || 'all'}
                onValueChange={(value) =>
                    setLevel(
                        value === 'all'
                            ? undefined
                            : (value as
                                  | 'BEGINNER'
                                  | 'INTERMEDIATE'
                                  | 'ADVANCED')
                    )
                }
            >
                <SelectTrigger className='w-[160px] bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <SelectValue placeholder='Cấp độ' />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='all'>Tất cả cấp độ</SelectItem>
                    <SelectItem value='BEGINNER'>Cơ bản</SelectItem>
                    <SelectItem value='INTERMEDIATE'>Trung cấp</SelectItem>
                    <SelectItem value='ADVANCED'>Nâng cao</SelectItem>
                </SelectContent>
            </Select>

            <Select
                value={sort}
                onValueChange={(value) =>
                    setSort(
                        value as
                            | 'newest'
                            | 'popular'
                            | 'rating'
                            | 'price_asc'
                            | 'price_desc'
                    )
                }
            >
                <SelectTrigger className='w-[180px] bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                    <SelectValue placeholder='Sắp xếp' />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value='newest'>Mới nhất</SelectItem>
                    <SelectItem value='popular'>Phổ biến</SelectItem>
                    <SelectItem value='rating'>Đánh giá cao</SelectItem>
                    <SelectItem value='price_asc'>Giá tăng dần</SelectItem>
                    <SelectItem value='price_desc'>Giá giảm dần</SelectItem>
                </SelectContent>
            </Select>
        </>
    )

    const isLoading = isLoadingCategory && !category

    return (
        <div className='min-h-screen bg-white dark:bg-black'>
            {/* Header */}
            <div className='bg-[#1A1A1A] border-b border-gray-800 dark:border-gray-800'>
                <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6'>
                    <div className='flex items-center gap-4'>
                        <Button
                            variant='ghost'
                            size='icon'
                            onClick={handleBack}
                            className='bg-[#1A1A1A] hover:bg-[#2D2D2D] border border-[#2D2D2D] rounded-lg'
                        >
                            <ArrowLeft className='h-5 w-5 text-gray-200' />
                        </Button>
                        <div className='space-y-2'>
                            <h1 className='text-2xl md:text-3xl font-bold text-white'>
                                {category
                                    ? category.name
                                    : 'Đang tải danh mục...'}
                            </h1>
                            <p className='text-gray-300'>
                                Khám phá các khóa học trong danh mục đã chọn
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6'>
                <Breadcrumb items={breadcrumbItems} />

                {isLoading ? (
                    <Card className='p-10 flex flex-col items-center justify-center text-center space-y-3 bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-[#2D2D2D]'>
                        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
                        <p className='text-sm text-muted-foreground'>
                            Đang tải danh mục...
                        </p>
                    </Card>
                ) : category ? (
                    <CategoryDetail
                        category={category}
                        childrenCategories={children}
                        courses={courses}
                        isLoadingCourses={isLoadingCourses}
                        currentPage={currentPage}
                        totalPages={totalPages}
                        totalCourses={totalCourses}
                        limit={limit}
                        onPageChange={handlePageChange}
                        onChildClick={handleChildClick}
                        filtersSlot={filtersSlot}
                    />
                ) : (
                    <Card className='p-8 text-center text-muted-foreground bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-[#2D2D2D]'>
                        Không tìm thấy danh mục.
                    </Card>
                )}
            </div>
        </div>
    )
}
