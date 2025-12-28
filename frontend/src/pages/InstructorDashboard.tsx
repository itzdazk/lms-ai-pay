import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '../components/ui/card'
import { Button } from '../components/ui/button'
import { DarkOutlineButton } from '../components/ui/buttons'
import { Tabs, TabsContent } from '../components/ui/tabs'
import { DarkTabsList, DarkTabsTrigger } from '../components/ui/dark-tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../components/ui/select'
import {
    BookOpen,
    Users,
    DollarSign,
    Star,
    BarChart3,
    Loader2,
    ShoppingCart,
    GraduationCap,
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../components/ui/dialog'
import { toast } from 'sonner'
import type { Course } from '../lib/api/types'
import { CoursesPage } from './instructor/CoursesPage'
import { useInstructorOrders } from '../hooks/useInstructorOrders'
import { OrderTable } from '../components/Payment/OrderTable'
import {
    OrderFilters,
    type OrderFilters as OrderFiltersType,
} from '../components/Payment/OrderFilters'
import { useInstructorStats } from '../hooks/useInstructorStats'
import { RevenueChart } from '../components/Dashboard/RevenueChart'
import { EnrollmentTrendChart } from '../components/Dashboard/EnrollmentTrendChart'
import { CoursePerformanceTable } from '../components/Dashboard/CoursePerformanceTable'
import { EnrollmentsList } from '../components/Dashboard/EnrollmentsList'
import { instructorCoursesApi } from '../lib/api/instructor-courses'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
    }).format(price)
}

export function InstructorDashboard() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const [courses, setCourses] = useState<Course[]>([])
    const { stats: apiStats, isLoading: statsLoading } = useInstructorStats({
        autoRefresh: true,
    })
    const [loading, setLoading] = useState(true)
    const [pagination, setPagination] = useState({
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
    })
    const [filters] = useState({
        page: 1,
        limit: 10,
        search: '',
        status: undefined as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
        categoryId: undefined as string | undefined,
        level: undefined as
            | 'beginner'
            | 'intermediate'
            | 'advanced'
            | undefined,
        sort: 'newest' as string,
    })
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false)
    const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
    const [actionLoading, setActionLoading] = useState(false)
    const [newStatus, setNewStatus] = useState<
        'draft' | 'published' | 'archived'
    >('draft')
    const scrollPositionRef = useRef<number>(0)
    const isPageChangingRef = useRef<boolean>(false)
    const shouldRestoreScrollRef = useRef<boolean>(false)

    // Check if user is instructor - early return to prevent API calls
    useEffect(() => {
        if (authLoading) return

        if (!currentUser) {
            navigate('/login')
            return
        }

        if (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
            // RoleRoute component already handles permission check and redirect
            // Don't navigate here to avoid duplicate redirects
            return
        }
    }, [currentUser, authLoading, navigate])

    // Check if we need to restore scroll position on mount
    useEffect(() => {
        const savedScrollPosition = sessionStorage.getItem(
            'instructorDashboardScroll'
        )
        if (savedScrollPosition) {
            shouldRestoreScrollRef.current = true
            scrollPositionRef.current = parseInt(savedScrollPosition, 10)
        }
    }, [])

    // Restore scroll position when courses are loaded and not loading
    useEffect(() => {
        if (shouldRestoreScrollRef.current && !loading && courses.length > 0) {
            const restoreScroll = () => {
                // Try multiple scroll containers
                const scrollContainer =
                    document.querySelector('main') ||
                    document.documentElement ||
                    document.body

                if (
                    !scrollContainer ||
                    scrollContainer === document.documentElement ||
                    scrollContainer === document.body
                ) {
                    window.scrollTo({
                        top: scrollPositionRef.current,
                        left: 0,
                        behavior: 'auto',
                    })
                } else {
                    ;(scrollContainer as HTMLElement).scrollTop =
                        scrollPositionRef.current
                }
            }

            // Use requestAnimationFrame to ensure DOM is ready
            requestAnimationFrame(() => {
                restoreScroll()

                // Try multiple times with increasing delays to ensure it works
                setTimeout(() => {
                    requestAnimationFrame(restoreScroll)
                }, 100)

                setTimeout(() => {
                    requestAnimationFrame(restoreScroll)
                }, 300)

                setTimeout(() => {
                    requestAnimationFrame(() => {
                        restoreScroll()
                        shouldRestoreScrollRef.current = false
                        sessionStorage.removeItem('instructorDashboardScroll')
                    })
                }, 500)
            })
        }
    }, [loading, courses.length])

    // Load courses when filters change
    useEffect(() => {
        // Only load if user is instructor/admin
        if (
            currentUser &&
            (currentUser.role === 'INSTRUCTOR' || currentUser.role === 'ADMIN')
        ) {
            loadCourses()
        }
    }, [
        filters.page,
        filters.limit,
        filters.search,
        filters.status,
        filters.categoryId,
        filters.level,
        filters.sort,
        currentUser,
    ])

    // Restore scroll position (only when page changes, not when courses update)
    useEffect(() => {
        if (isPageChangingRef.current && scrollPositionRef.current > 0) {
            const restoreScroll = () => {
                const scrollContainer = document.querySelector('main')
                if (!scrollContainer) {
                    window.scrollTo({
                        top: scrollPositionRef.current,
                        behavior: 'auto',
                    })
                } else {
                    ;(scrollContainer as HTMLElement).scrollTop =
                        scrollPositionRef.current
                }
            }

            restoreScroll()
            setTimeout(restoreScroll, 0)
            requestAnimationFrame(() => {
                restoreScroll()
                isPageChangingRef.current = false
            })
        }
    }, [pagination.page]) // Only trigger on page change, not on courses update

    // Transform backend course data to frontend format
    const transformCourse = (course: any): Course => {
        return {
            id: Number(course.id),
            title: course.title || '',
            slug: course.slug || '',
            description: course.description || course.shortDescription || '',
            thumbnailUrl: course.thumbnailUrl || '',
            videoPreviewUrl: course.videoPreviewUrl || '',
            instructorId: Number(course.instructorId || 0),
            categoryId: Number(course.categoryId || course.category?.id || 0),
            category: course.category
                ? {
                      id: Number(course.category.id),
                      name: course.category.name,
                      slug: course.category.slug,
                      sortOrder: course.category.sortOrder || 0,
                      isActive:
                          course.category.isActive !== undefined
                              ? course.category.isActive
                              : true,
                      createdAt:
                          course.category.createdAt || new Date().toISOString(),
                      updatedAt:
                          course.category.updatedAt || new Date().toISOString(),
                  }
                : undefined,
            level: (course.level || 'BEGINNER') as
                | 'BEGINNER'
                | 'INTERMEDIATE'
                | 'ADVANCED',
            price: parseFloat(String(course.price || 0)) || 0,
            discountPrice: course.discountPrice
                ? parseFloat(String(course.discountPrice))
                : undefined,
            isFree: parseFloat(String(course.price || 0)) === 0,
            status: course.status
                ? (course.status.toUpperCase() as
                      | 'DRAFT'
                      | 'PUBLISHED'
                      | 'ARCHIVED')
                : 'DRAFT',
            isFeatured: course.isFeatured || false,
            viewsCount: course.viewsCount || 0,
            enrolledCount: course.enrolledCount || 0,
            ratingAvg: course.ratingAvg
                ? parseFloat(String(course.ratingAvg))
                : 0,
            ratingCount: course.ratingCount || 0,
            totalLessons: course.totalLessons || course.lessonsCount || 0,
            durationHours: course.durationHours || 0,
            language: course.language || 'vi',
            completionRate: course.completionRate || 0,
            createdAt: course.createdAt || new Date().toISOString(),
            updatedAt: course.updatedAt || new Date().toISOString(),
        }
    }

    const loadCourses = async () => {
        try {
            setLoading(true)
            const requestParams: any = {
                page: filters.page,
                limit: filters.limit,
                ...(filters.search && filters.search.trim()
                    ? { search: filters.search.trim() }
                    : {}),
                ...(filters.status ? { status: filters.status } : {}),
                ...(filters.categoryId
                    ? { categoryId: filters.categoryId }
                    : {}),
                ...(filters.level ? { level: filters.level } : {}),
                sort: filters.sort,
            }
            const coursesData = await instructorCoursesApi.getInstructorCourses(
                requestParams
            )

            // Transform courses data - preserve order from backend
            const coursesArray: any[] = coursesData?.data || []
            const transformedCourses = coursesArray.map(transformCourse)

            // Create a deep copy to ensure new reference and prevent any mutation
            const coursesToSet = JSON.parse(
                JSON.stringify(transformedCourses)
            ) as Course[]
            setCourses(coursesToSet)

            const paginationData = coursesData.pagination || {
                page: 1,
                limit: 10,
                total: 0,
                totalPages: 0,
            }
            setPagination(paginationData)

            // Stats are loaded via useInstructorStats hook
        } catch (error: any) {
            console.error('Error loading courses:', error)
            // Error toast is already shown by API client interceptor
            setCourses([])
        } finally {
            setLoading(false)
        }
    }

    // Stats are now loaded via useInstructorStats hook
    const stats = apiStats || {
        totalCourses: 0,
        publishedCourses: 0,
        draftCourses: 0,
        totalEnrollments: 0,
        activeEnrollments: 0,
        totalStudents: 0,
        totalRevenue: 0,
        averageRating: 0,
    }

    const handleDeleteCourse = async () => {
        if (!selectedCourse) return

        try {
            setActionLoading(true)
            await instructorCoursesApi.deleteInstructorCourse(
                String(selectedCourse.id)
            )
            toast.success('Xóa khóa học thành công')
            setIsDeleteDialogOpen(false)
            setSelectedCourse(null)
            loadCourses()
        } catch (error: any) {
            console.error('Error deleting course:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setActionLoading(false)
        }
    }

    const handleChangeStatus = async () => {
        if (!selectedCourse) return

        try {
            setActionLoading(true)
            await instructorCoursesApi.changeCourseStatus(
                String(selectedCourse.id),
                newStatus
            )
            toast.success('Thay đổi trạng thái thành công')
            setIsStatusDialogOpen(false)
            setSelectedCourse(null)
            loadCourses()
        } catch (error: any) {
            console.error('Error changing status:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setActionLoading(false)
        }
    }

    // Early return if user doesn't have permission (RoleRoute will handle redirect)
    if (
        currentUser &&
        currentUser.role !== 'INSTRUCTOR' &&
        currentUser.role !== 'ADMIN'
    ) {
        return null
    }

    // Early return if not authenticated (ProtectedRoute will handle redirect)
    if (!currentUser) {
        return null
    }

    return (
        <div className='bg-white dark:bg-black min-h-screen'>
            {/* Header Section */}
            <div className='bg-[#1A1A1A] border-b border-[#2d2d2d]'>
                <div className='container mx-auto px-4 md:px-6 lg:px-8 py-8 pb-10'>
                    <div className='mb-2'>
                        <h1 className='text-2xl md:text-3xl font-bold mb-2 text-white'>
                            Dashboard Giảng viên
                        </h1>
                        <p className='text-base text-gray-300 leading-relaxed'>
                            Xin chào, {currentUser?.fullName || 'Giảng viên'}!
                            👋
                        </p>
                    </div>
                </div>
            </div>
            <div className='container mx-auto px-4 py-4 bg-background min-h-screen'>
                {/* Stats Cards */}
                <div className='grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8'>
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm text-gray-400'>
                                Tổng khóa học
                            </CardTitle>
                            <BookOpen className='h-4 w-4 text-gray-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl text-white'>
                                {statsLoading ? (
                                    <Loader2 className='h-6 w-6 animate-spin' />
                                ) : (
                                    stats.totalCourses
                                )}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                {stats.publishedCourses} đã xuất bản •{' '}
                                {stats.draftCourses} bản nháp
                            </p>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm text-gray-400'>
                                Tổng học viên
                            </CardTitle>
                            <Users className='h-4 w-4 text-blue-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl text-white'>
                                {statsLoading ? (
                                    <Loader2 className='h-6 w-6 animate-spin' />
                                ) : (
                                    stats.totalStudents.toLocaleString()
                                )}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Đã đăng ký các khóa học
                            </p>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm text-gray-400'>
                                Tổng doanh thu
                            </CardTitle>
                            <DollarSign className='h-4 w-4 text-green-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl text-white'>
                                {statsLoading ? (
                                    <Loader2 className='h-6 w-6 animate-spin' />
                                ) : (
                                    formatPrice(stats.totalRevenue)
                                )}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Tổng thu nhập
                            </p>
                        </CardContent>
                    </Card>

                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader className='flex flex-row items-center justify-between pb-2'>
                            <CardTitle className='text-sm text-gray-400'>
                                Đánh giá TB
                            </CardTitle>
                            <Star className='h-4 w-4 text-yellow-500' />
                        </CardHeader>
                        <CardContent>
                            <div className='text-3xl flex items-center gap-2 text-white'>
                                {statsLoading ? (
                                    <Loader2 className='h-6 w-6 animate-spin' />
                                ) : stats.averageRating > 0 ? (
                                    <>
                                        {stats.averageRating.toFixed(1)}
                                        <Star className='h-5 w-5 fill-yellow-400 text-yellow-400' />
                                    </>
                                ) : (
                                    '-'
                                )}
                            </div>
                            <p className='text-xs text-gray-500 mt-1'>
                                Từ học viên
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Main Content */}
                <Tabs defaultValue='courses' className='space-y-6'>
                    <DarkTabsList>
                        <DarkTabsTrigger value='courses' variant='blue'>
                            <BookOpen className='h-4 w-4 mr-2' />
                            Quản lí khóa học
                        </DarkTabsTrigger>
                        <DarkTabsTrigger value='orders' variant='blue'>
                            <ShoppingCart className='h-4 w-4 mr-2' />
                            Quản lí đơn hàng
                        </DarkTabsTrigger>
                        <DarkTabsTrigger value='enrollments' variant='blue'>
                            <Users className='h-4 w-4 mr-2' />
                            Quản lí học viên
                        </DarkTabsTrigger>
                        <DarkTabsTrigger value='analytics' variant='blue'>
                            <BarChart3 className='h-4 w-4 mr-2' />
                            Phân tích
                        </DarkTabsTrigger>
                        <DarkTabsTrigger value='revenue' variant='blue'>
                            <DollarSign className='h-4 w-4 mr-2' />
                            Doanh thu
                        </DarkTabsTrigger>
                    </DarkTabsList>
                    {/* Courses Management Tab */}
                    <TabsContent value='courses' className='space-y-4'>
                        <CoursesPage />
                    </TabsContent>

                    {/* Orders Management Tab */}
                    <TabsContent value='orders' className='space-y-4'>
                        <InstructorOrdersTabContent />
                    </TabsContent>

                    {/* Enrollments Management Tab */}
                    <TabsContent value='enrollments' className='space-y-4'>
                        <EnrollmentsList />
                    </TabsContent>

                    {/* Analytics Tab */}
                    <TabsContent value='analytics' className='space-y-4'>
                        <EnrollmentTrendChart />
                        <CoursePerformanceTable />
                    </TabsContent>

                    {/* Revenue Tab */}
                    <TabsContent value='revenue' className='space-y-4'>
                        <RevenueChart />
                    </TabsContent>
                </Tabs>

                {/* Delete Course Dialog */}
                <Dialog
                    open={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                        <DialogHeader>
                            <DialogTitle>Xác nhận xóa</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Bạn có chắc muốn xóa khóa học "
                                {selectedCourse?.title}"? Hành động này không
                                thể hoàn tác.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter>
                            <DarkOutlineButton
                                onClick={() => {
                                    setIsDeleteDialogOpen(false)
                                    setSelectedCourse(null)
                                }}
                                disabled={actionLoading}
                            >
                                Hủy
                            </DarkOutlineButton>
                            <Button
                                onClick={handleDeleteCourse}
                                disabled={actionLoading}
                                className='bg-red-600 hover:bg-red-700 text-white'
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang xóa...
                                    </>
                                ) : (
                                    'Xóa'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Status Change Dialog */}
                <Dialog
                    open={isStatusDialogOpen}
                    onOpenChange={setIsStatusDialogOpen}
                >
                    <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white'>
                        <DialogHeader>
                            <DialogTitle>Thay đổi trạng thái</DialogTitle>
                            <DialogDescription className='text-gray-400'>
                                Chọn trạng thái mới cho khóa học "
                                {selectedCourse?.title}"
                            </DialogDescription>
                        </DialogHeader>
                        <div className='space-y-4'>
                            <Select
                                value={newStatus}
                                onValueChange={(value: any) =>
                                    setNewStatus(value)
                                }
                            >
                                <SelectTrigger className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className='bg-[#1A1A1A] border-[#2D2D2D]'>
                                    <SelectItem
                                        value='draft'
                                        className='text-white focus:bg-[#2D2D2D]'
                                    >
                                        Bản nháp
                                    </SelectItem>
                                    <SelectItem
                                        value='published'
                                        className='text-white focus:bg-[#2D2D2D]'
                                    >
                                        Đã xuất bản
                                    </SelectItem>
                                    <SelectItem
                                        value='archived'
                                        className='text-white focus:bg-[#2D2D2D]'
                                    >
                                        Đã lưu trữ
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <DarkOutlineButton
                                onClick={() => {
                                    setIsStatusDialogOpen(false)
                                    setSelectedCourse(null)
                                }}
                                disabled={actionLoading}
                            >
                                Hủy
                            </DarkOutlineButton>
                            <Button
                                onClick={handleChangeStatus}
                                disabled={actionLoading}
                                className='bg-blue-600 hover:bg-blue-700 text-white'
                            >
                                {actionLoading ? (
                                    <>
                                        <Loader2 className='h-4 w-4 mr-2 animate-spin' />
                                        Đang cập nhật...
                                    </>
                                ) : (
                                    'Cập nhật'
                                )}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    )
}

// Component for Orders Management Tab
function InstructorOrdersTabContent() {
    const [searchParams, setSearchParams] = useSearchParams()
    const [courses, setCourses] = useState<Course[]>([])

    // Filters state
    const [filters, setFilters] = useState<
        OrderFiltersType & { courseId?: number }
    >({
        page: parseInt(searchParams.get('page') || '1'),
        limit: 10,
        paymentStatus: (searchParams.get('paymentStatus') as any) || undefined,
        paymentGateway:
            (searchParams.get('paymentGateway') as any) || undefined,
        courseId: (() => {
            const courseIdParam = searchParams.get('courseId')
            if (courseIdParam) {
                const parsed = parseInt(courseIdParam)
                return isNaN(parsed) ? undefined : parsed
            }
            return undefined
        })(),
        startDate: searchParams.get('startDate') || undefined,
        endDate: searchParams.get('endDate') || undefined,
        sort: (searchParams.get('sort') as any) || 'newest',
        search: searchParams.get('search') || undefined,
    })

    // Fetch courses for filter
    useEffect(() => {
        const fetchCourses = async () => {
            try {
                const data = await instructorCoursesApi.getInstructorCourses({
                    page: 1,
                    limit: 100,
                })
                setCourses(data.data || [])
            } catch (error) {
                console.error('Error fetching courses:', error)
            }
        }
        fetchCourses()
    }, [])

    // Hooks
    const { orders, pagination, isLoading } = useInstructorOrders(filters)

    // Update URL when filters change
    useEffect(() => {
        const params = new URLSearchParams()
        if (filters.page && filters.page > 1)
            params.set('page', filters.page.toString())
        if (filters.paymentStatus)
            params.set('paymentStatus', filters.paymentStatus)
        if (filters.paymentGateway)
            params.set('paymentGateway', filters.paymentGateway)
        if (filters.courseId)
            params.set('courseId', filters.courseId.toString())
        if (filters.startDate) params.set('startDate', filters.startDate)
        if (filters.endDate) params.set('endDate', filters.endDate)
        if (filters.sort && filters.sort !== 'newest')
            params.set('sort', filters.sort)
        if (filters.search) params.set('search', filters.search)

        setSearchParams(params, { replace: true })
    }, [filters, setSearchParams])

    // Handle filter changes
    const handleFilterChange = useCallback(
        (key: keyof typeof filters, value: any) => {
            setFilters((prev) => ({
                ...prev,
                [key]: value,
                page: 1, // Reset to first page when filter changes
            }))
        },
        []
    )

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setFilters((prev) => ({ ...prev, page }))
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Clear filters
    const clearFilters = useCallback(() => {
        setFilters({
            page: 1,
            limit: 10,
            sort: 'newest',
        })
    }, [])

    // Render pagination
    const renderPagination = () => {
        const pages: (number | string)[] = []
        const totalPages = pagination.totalPages
        const currentPage = pagination.page

        if (totalPages <= 7) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            pages.push(1)
            if (currentPage > 3) {
                pages.push('...')
            }
            for (
                let i = Math.max(2, currentPage - 1);
                i <= Math.min(totalPages - 1, currentPage + 1);
                i++
            ) {
                pages.push(i)
            }
            if (currentPage < totalPages - 2) {
                pages.push('...')
            }
            pages.push(totalPages)
        }

        return (
            <div className='flex items-center justify-center gap-2 flex-wrap mt-6'>
                <DarkOutlineButton
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || isLoading}
                    size='sm'
                >
                    &lt;
                </DarkOutlineButton>
                {pages.map((page, index) => {
                    if (page === '...') {
                        return (
                            <span
                                key={`ellipsis-${index}`}
                                className='px-2 text-gray-400'
                            >
                                ...
                            </span>
                        )
                    }
                    const pageNum = page as number
                    return (
                        <DarkOutlineButton
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            disabled={isLoading}
                            size='sm'
                            className={
                                currentPage === pageNum
                                    ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                    : ''
                            }
                        >
                            {pageNum}
                        </DarkOutlineButton>
                    )
                })}
                <DarkOutlineButton
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                    onClick={() => handlePageChange(totalPages)}
                    disabled={currentPage === totalPages || isLoading}
                    size='sm'
                >
                    &gt;&gt;
                </DarkOutlineButton>
            </div>
        )
    }

    return (
        <div className='space-y-4'>
            {/* Course Filter */}
            <div className='mb-4'>
                <div className='flex items-center gap-4'>
                    <label className='text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap'>
                        Lọc theo khóa học:
                    </label>
                    <Select
                        value={
                            filters.courseId
                                ? filters.courseId.toString()
                                : 'all'
                        }
                        onValueChange={(value) => {
                            if (value === 'all') {
                                handleFilterChange('courseId', undefined)
                            } else {
                                const parsed = parseInt(value)
                                if (!isNaN(parsed)) {
                                    handleFilterChange('courseId', parsed)
                                }
                            }
                        }}
                    >
                        <SelectTrigger className='w-[300px] bg-[#1f1f1f] border-[#2d2d2d] text-white'>
                            <SelectValue placeholder='Tất cả khóa học' />
                        </SelectTrigger>
                        <SelectContent className='bg-[#1f1f1f] border-[#2d2d2d]'>
                            <SelectItem value='all' className='text-white'>
                                Tất cả khóa học
                            </SelectItem>
                            {courses.map((course) => (
                                <SelectItem
                                    key={course.id}
                                    value={course.id.toString()}
                                    className='text-white'
                                >
                                    {course.title}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Filters */}
            <OrderFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                onClearFilters={clearFilters}
                totalResults={pagination.total}
            />

            {/* Orders Table - No actions for instructor */}
            <OrderTable
                orders={orders}
                loading={isLoading}
                onCancel={undefined}
                showActions={false}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && renderPagination()}
        </div>
    )
}
