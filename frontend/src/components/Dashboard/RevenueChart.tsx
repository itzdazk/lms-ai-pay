import { useState, useEffect, useMemo, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Loader2, DollarSign, ShoppingCart, TrendingUp } from 'lucide-react'
import { Select, SelectValue } from '../ui/select'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../ui/dark-outline-select-trigger'
import { Label } from '../ui/label'
import { DarkOutlineButton } from '../ui/buttons'
import { useInstructorRevenue } from '../../hooks/useInstructorRevenue'
import { useInstructorRevenueByCourses } from '../../hooks/useInstructorRevenueByCourses'
import { useInstructorRevenueOrders } from '../../hooks/useInstructorRevenueOrders'
import { useInstructorRevenueChartData } from '../../hooks/useInstructorRevenueChartData'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import apiClient from '../../lib/api/client'
import type { Course } from '../../lib/api/types'
import { RevenueCoursesTable } from './RevenueCoursesTable'
import {
    BarChart,
    Bar,
    LineChart,
    Line,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from 'recharts'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

const MONTHS = [
    { value: 'all', label: 'Tất cả' },
    { value: '1', label: 'Tháng 1' },
    { value: '2', label: 'Tháng 2' },
    { value: '3', label: 'Tháng 3' },
    { value: '4', label: 'Tháng 4' },
    { value: '5', label: 'Tháng 5' },
    { value: '6', label: 'Tháng 6' },
    { value: '7', label: 'Tháng 7' },
    { value: '8', label: 'Tháng 8' },
    { value: '9', label: 'Tháng 9' },
    { value: '10', label: 'Tháng 10' },
    { value: '11', label: 'Tháng 11' },
    { value: '12', label: 'Tháng 12' },
]

interface RevenueChartProps {
    className?: string
}

export function RevenueChart({ className }: RevenueChartProps) {
    // Course selection: null = "Tổng khóa học", number = courseId
    const [selectedCourseId, setSelectedCourseId] = useState<number | null>(null)
    const [courses, setCourses] = useState<Course[]>([])
    const [loadingCourses, setLoadingCourses] = useState(false)
    
    // Year and Month selection
    const currentYear = new Date().getFullYear()
    const [selectedYear, setSelectedYear] = useState<number>(currentYear)
    const [selectedMonth, setSelectedMonth] = useState<number | null>(null) // null = all months
    const [yearOptions, setYearOptions] = useState<number[]>([])
    const [loadingYears, setLoadingYears] = useState(true)

    // Fetch courses list for dropdown
    useEffect(() => {
        const fetchCourses = async () => {
            setLoadingCourses(true)
            try {
                const response = await instructorCoursesApi.getInstructorCourses({
                    limit: 100, // Get all courses
                    page: 1,
                })
                setCourses(response.data || [])
            } catch (error) {
                console.error('Failed to fetch courses:', error)
            } finally {
                setLoadingCourses(false)
            }
        }
        fetchCourses()
    }, [])

    // Fetch available years
    useEffect(() => {
        const fetchAvailableYears = async () => {
            try {
                setLoadingYears(true)
                const response = await apiClient.get('/dashboard/instructor/revenue/years')
                const availableYears = response.data?.data || []
                // Sort descending (newest first)
                const sortedYears = availableYears.sort((a: number, b: number) => b - a)
                setYearOptions(sortedYears)
                
                // Set selected year to the newest available year if current year is not in the list
                if (sortedYears.length > 0 && !sortedYears.includes(currentYear)) {
                    setSelectedYear(sortedYears[0])
                }
            } catch (error) {
                console.error('Error fetching available years:', error)
                // Fallback to current year and last 5 years if API fails
                const fallbackYears = []
                for (let i = 0; i <= 5; i++) {
                    fallbackYears.push(currentYear - i)
                }
                setYearOptions(fallbackYears)
            } finally {
                setLoadingYears(false)
            }
        }

        fetchAvailableYears()
    }, [currentYear])

    // Memoize params to avoid recreating object on each render
    const stableCourseId = selectedCourseId === undefined ? null : selectedCourseId
    const stableYear = selectedYear
    const stableMonth = selectedMonth
    
    const revenueParams = useMemo(() => ({
        courseId: stableCourseId,
        year: stableYear,
        month: stableMonth,
        period: 'month' as const,
    }), [stableCourseId, stableYear, stableMonth])

    // Fetch revenue data
    const { revenue: revenueData, isLoading, isError } = useInstructorRevenue(revenueParams)

    // Pagination for courses table
    const [coursesPage, setCoursesPage] = useState(1)
    const coursesLimit = 20

    // Fetch revenue by courses for table (paginated, optimized)
    const {
        courses: coursesData,
        pagination: coursesPagination,
        isLoading: coursesLoading,
    } = useInstructorRevenueByCourses({
        year: stableYear,
        month: stableMonth,
        courseId: stableCourseId,
        page: coursesPage,
        limit: coursesLimit,
    })

    // Fetch all revenue orders for pie chart (no pagination, limit 1000)
    const {
        orders: allOrdersForPie,
    } = useInstructorRevenueOrders({
        year: stableYear,
        month: stableMonth,
        courseId: stableCourseId,
        page: 1,
        limit: 1000, // Get all orders for pie chart
    })

    // Fetch revenue chart data (grouped by month or day)
    const {
        chartData: revenueChartData,
        isLoading: chartDataLoading,
    } = useInstructorRevenueChartData({
        year: stableYear,
        month: stableMonth,
        courseId: stableCourseId,
    })

    // Reset courses page when filters change
    useEffect(() => {
        setCoursesPage(1)
    }, [stableYear, stableMonth, stableCourseId])

    // Handle pagination
    const handlePageChange = useCallback((page: number) => {
        setCoursesPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }, [])

    // Calculate summary stats
    const totalRevenue = revenueData?.totalRevenue || 0
    const totalOrders = revenueData?.totalOrders || 0
    const avgPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0

    // Get selected course title
    const selectedCourseTitle = selectedCourseId
        ? courses.find(c => c.id === selectedCourseId)?.title || 'Khóa học'
        : 'Tổng khóa học'

    // Format period description
    const periodDescription = selectedMonth
        ? `Tháng ${selectedMonth}/${selectedYear}`
        : `Năm ${selectedYear}`

    // Calculate growth revenue data (cumulative) for Line Chart from chart data
    // Only include days with revenue > 0 to show actual growth
    const growthRevenueData = useMemo(() => {
        if (!revenueChartData || revenueChartData.length === 0) return []

        // Filter out days with no revenue (revenue = 0)
        const daysWithRevenue = revenueChartData.filter(
            (item: { revenue: number }) => item.revenue > 0
        )

        if (daysWithRevenue.length === 0) return []

        // Calculate cumulative revenue (growth) only for days with revenue
        let cumulativeRevenue = 0
        const growthData = daysWithRevenue.map((item: { period: string | number; periodLabel: string; date: string; revenue: number }) => {
            cumulativeRevenue += item.revenue
            return {
                period: item.period,
                periodLabel: item.periodLabel,
                date: item.date,
                revenue: item.revenue,
                cumulativeRevenue,
            }
        })

        return growthData
    }, [revenueChartData])

    // Calculate course structure data for Pie Chart
    const courseStructureData = useMemo(() => {
        if (!allOrdersForPie || allOrdersForPie.length === 0) return []

        // Group orders by course
        const revenueByCourse = new Map<number, { title: string; revenue: number }>()

        allOrdersForPie.forEach((order: any) => {
            if (!order.course) return
            
            const courseId = order.course.id
            const courseTitle = order.course.title || 'Không có tên'
            const revenue = parseFloat(order.finalPrice.toString())
            
            const existing = revenueByCourse.get(courseId)
            if (existing) {
                existing.revenue += revenue
            } else {
                revenueByCourse.set(courseId, { title: courseTitle, revenue })
            }
        })

        // Convert to array and sort by revenue (descending)
        const pieData = Array.from(revenueByCourse.entries())
            .map(([courseId, { title, revenue }]) => ({
                courseId,
                name: title,
                value: revenue,
            }))
            .sort((a, b) => b.value - a.value)

        return pieData
    }, [allOrdersForPie])

    // Use chart data directly for Bar Chart
    const dailyRevenueData = useMemo(() => {
        if (!revenueChartData || revenueChartData.length === 0) return []

        return revenueChartData.map((item) => ({
            date: item.date,
            revenue: item.revenue,
            orders: item.orders || 0,
            dateLabel: item.periodLabel,
        }))
    }, [revenueChartData])

    // Colors for Pie Chart
    const PIE_COLORS = [
        '#10b981', // green-500
        '#3b82f6', // blue-500
        '#f59e0b', // amber-500
        '#ef4444', // red-500
        '#8b5cf6', // violet-500
        '#ec4899', // pink-500
        '#06b6d4', // cyan-500
        '#f97316', // orange-500
    ]

    if (isError) {
        return (
            <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
                <CardContent className="flex flex-col items-center justify-center py-12">
                    <p className="text-gray-400 mb-2">Không thể tải dữ liệu doanh thu</p>
                    <p className="text-sm text-gray-500">Vui lòng thử lại sau</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <div className="space-y-4">
                    <div>
                        <CardTitle className="text-white">Báo cáo doanh thu</CardTitle>
                        <CardDescription className="text-gray-400">
                            {periodDescription} - {selectedCourseTitle}
                        </CardDescription>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Course Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="course-select" className="text-sm text-gray-300">
                                Khóa học
                            </Label>
                            <Select
                                value={selectedCourseId === null ? 'all' : selectedCourseId.toString()}
                                onValueChange={(value) => {
                                    setSelectedCourseId(value === 'all' ? null : parseInt(value))
                                }}
                                disabled={loadingCourses}
                            >
                                <DarkOutlineSelectTrigger id="course-select">
                                    <SelectValue placeholder="Chọn khóa học" />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    <DarkOutlineSelectItem value="all">
                                        Tổng khóa học
                                    </DarkOutlineSelectItem>
                                    {courses.map((course) => (
                                        <DarkOutlineSelectItem
                                            key={course.id}
                                            value={course.id.toString()}
                                        >
                                            {course.title}
                                        </DarkOutlineSelectItem>
                                    ))}
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        {/* Year Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="year-select" className="text-sm text-gray-300">
                                Năm <span className="text-red-500">*</span>
                            </Label>
                            <Select
                                value={selectedYear.toString()}
                                onValueChange={(value) => {
                                    setSelectedYear(parseInt(value))
                                }}
                            >
                                <DarkOutlineSelectTrigger id="year-select">
                                    <SelectValue placeholder="Chọn năm" />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    {loadingYears ? (
                                        <div className='p-2 text-sm text-gray-400'>Đang tải...</div>
                                    ) : yearOptions.length === 0 ? (
                                        <div className='p-2 text-sm text-gray-400'>Chưa có dữ liệu</div>
                                    ) : (
                                        yearOptions.map((year) => (
                                            <DarkOutlineSelectItem
                                                key={year}
                                                value={year.toString()}
                                            >
                                                {year}
                                            </DarkOutlineSelectItem>
                                        ))
                                    )}
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>

                        {/* Month Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="month-select" className="text-sm text-gray-300">
                                Tháng
                            </Label>
                            <Select
                                value={selectedMonth === null ? 'all' : selectedMonth.toString()}
                                onValueChange={(value) => {
                                    setSelectedMonth(value === 'all' ? null : parseInt(value))
                                }}
                            >
                                <DarkOutlineSelectTrigger id="month-select">
                                    <SelectValue placeholder="Chọn tháng" />
                                </DarkOutlineSelectTrigger>
                                <DarkOutlineSelectContent>
                                    {MONTHS.map((month) => (
                                        <DarkOutlineSelectItem
                                            key={month.value}
                                            value={month.value}
                                        >
                                            {month.label}
                                        </DarkOutlineSelectItem>
                                    ))}
                                </DarkOutlineSelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Loading State */}
                {(isLoading || chartDataLoading) ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : (
                    <>
                        {/* Summary Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2D2D2D]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-green-500/20 rounded-lg">
                                        <DollarSign className="h-5 w-5 text-green-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Tổng doanh thu</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {formatPrice(totalRevenue)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{periodDescription}</p>
                            </div>

                            <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2D2D2D]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-blue-500/20 rounded-lg">
                                        <ShoppingCart className="h-5 w-5 text-blue-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Tổng đơn hàng</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {totalOrders.toLocaleString('vi-VN')}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">{selectedCourseTitle}</p>
                            </div>

                            <div className="bg-[#1F1F1F] rounded-lg p-6 border border-[#2D2D2D]">
                                <div className="flex items-center gap-3 mb-3">
                                    <div className="p-2 bg-yellow-500/20 rounded-lg">
                                        <TrendingUp className="h-5 w-5 text-yellow-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm text-gray-400">Trung bình/Đơn</p>
                                        <p className="text-2xl font-bold text-white mt-1">
                                            {formatPrice(avgPerOrder)}
                                        </p>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500">
                                    {totalOrders > 0 ? 'Đã có đơn hàng' : 'Chưa có đơn hàng'}
                                </p>
                            </div>
                        </div>

                        {/* Revenue Courses Table */}
                        <div className="space-y-4">
                            <div>
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Khóa học
                                </h3>
                                <RevenueCoursesTable
                                    courses={coursesData}
                                    loading={coursesLoading}
                                    pagination={coursesPagination}
                                    year={stableYear}
                                    month={stableMonth}
                                />
                            </div>

                            {/* Pagination */}
                            {coursesPagination && coursesPagination.totalPages > 1 && (
                                <div className="flex items-center justify-center gap-2 flex-wrap">
                                    <DarkOutlineButton
                                        onClick={() => handlePageChange(1)}
                                        disabled={coursesPage === 1 || coursesLoading}
                                        size="sm"
                                    >
                                        &lt;&lt;
                                    </DarkOutlineButton>
                                    <DarkOutlineButton
                                        onClick={() => handlePageChange(coursesPage - 1)}
                                        disabled={coursesPage === 1 || coursesLoading}
                                        size="sm"
                                    >
                                        &lt;
                                    </DarkOutlineButton>
                                    {Array.from({ length: coursesPagination.totalPages }, (_, i) => i + 1)
                                        .filter((page) => {
                                            const totalPages = coursesPagination.totalPages
                                            const currentPage = coursesPage
                                            if (totalPages <= 7) return true
                                            if (page === 1 || page === totalPages) return true
                                            if (Math.abs(page - currentPage) <= 1) return true
                                            return false
                                        })
                                        .map((page, index, array) => {
                                            if (index > 0 && array[index - 1] !== page - 1) {
                                                return (
                                                    <span
                                                        key={`ellipsis-${page}`}
                                                        className="px-2 text-gray-400"
                                                    >
                                                        ...
                                                    </span>
                                                )
                                            }
                                            return (
                                                <DarkOutlineButton
                                                    key={page}
                                                    onClick={() => handlePageChange(page)}
                                                    disabled={coursesLoading}
                                                    size="sm"
                                                    className={
                                                        coursesPage === page
                                                            ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                                                            : ''
                                                    }
                                                >
                                                    {page}
                                                </DarkOutlineButton>
                                            )
                                        })}
                                    <DarkOutlineButton
                                        onClick={() => handlePageChange(coursesPage + 1)}
                                        disabled={
                                            coursesPage === coursesPagination.totalPages || coursesLoading
                                        }
                                        size="sm"
                                    >
                                        &gt;
                                    </DarkOutlineButton>
                                    <DarkOutlineButton
                                        onClick={() => handlePageChange(coursesPagination.totalPages)}
                                        disabled={
                                            coursesPage === coursesPagination.totalPages || coursesLoading
                                        }
                                        size="sm"
                                    >
                                        &gt;&gt;
                                    </DarkOutlineButton>
                                </div>
                            )}
                        </div>

                        {/* Daily Revenue Bar Chart - Moved to bottom */}
                        {dailyRevenueData.length > 0 && (
                            <div className="mt-6">
                                <h3 className="text-lg font-semibold text-white mb-4">
                                    Biểu đồ doanh thu
                                </h3>
                                <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D]">
                                    <ResponsiveContainer width="100%" height={400}>
                                        <BarChart
                                            data={dailyRevenueData}
                                            margin={{
                                                top: 20,
                                                right: 30,
                                                left: 20,
                                                bottom: 60,
                                            }}
                                        >
                                            <CartesianGrid
                                                strokeDasharray="3 3"
                                                stroke="#2D2D2D"
                                                vertical={false}
                                            />
                                            <XAxis
                                                dataKey="dateLabel"
                                                stroke="#9CA3AF"
                                                style={{ fontSize: '12px' }}
                                                angle={-45}
                                                textAnchor="end"
                                                height={80}
                                            />
                                            <YAxis
                                                stroke="#9CA3AF"
                                                style={{ fontSize: '12px' }}
                                                tickFormatter={(value) => {
                                                    if (value >= 1000000) {
                                                        return `${(value / 1000000).toFixed(1)}M`
                                                    }
                                                    if (value >= 1000) {
                                                        return `${(value / 1000).toFixed(0)}K`
                                                    }
                                                    return value.toString()
                                                }}
                                            />
                                            <Tooltip
                                                contentStyle={{
                                                    backgroundColor: '#1A1A1A',
                                                    border: '1px solid #2D2D2D',
                                                    borderRadius: '8px',
                                                    color: '#fff',
                                                }}
                                                labelStyle={{ color: '#fff', marginBottom: '8px' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        const data = payload[0].payload
                                                        const orders = data?.orders || 0
                                                        const revenue = payload[0].value as number
                                                        return (
                                                            <div className="bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-3">
                                                                <p className="text-white font-semibold mb-2">{`Ngày: ${label}`}</p>
                                                                <p className="text-white mb-1">{formatPrice(revenue || 0)}</p>
                                                                <p className="text-xs text-gray-400">Số đơn: {orders.toLocaleString('vi-VN')}</p>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Bar
                                                dataKey="revenue"
                                                fill="#10b981"
                                                radius={[4, 4, 0, 0]}
                                            />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}

                        {/* Growth Revenue Line Chart and Course Structure Pie Chart - Moved to bottom */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
                            {/* Growth Revenue Line Chart */}
                            {growthRevenueData.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Biểu đồ tăng trưởng doanh thu
                                    </h3>
                                    <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D]">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <LineChart
                                                data={growthRevenueData}
                                                margin={{
                                                    top: 20,
                                                    right: 30,
                                                    left: 20,
                                                    bottom: 60,
                                                }}
                                            >
                                                <CartesianGrid
                                                    strokeDasharray="3 3"
                                                    stroke="#2D2D2D"
                                                    vertical={false}
                                                />
                                                <XAxis
                                                    dataKey="periodLabel"
                                                    stroke="#9CA3AF"
                                                    style={{ fontSize: '12px' }}
                                                    angle={-45}
                                                    textAnchor="end"
                                                    height={80}
                                                />
                                                <YAxis
                                                    stroke="#9CA3AF"
                                                    style={{ fontSize: '12px' }}
                                                    tickFormatter={(value) => {
                                                        if (value >= 1000000) {
                                                            return `${(value / 1000000).toFixed(1)}M`
                                                        }
                                                        if (value >= 1000) {
                                                            return `${(value / 1000).toFixed(0)}K`
                                                        }
                                                        return value.toString()
                                                    }}
                                                />
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1A1A1A',
                                                        border: '1px solid #2D2D2D',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                    }}
                                                    labelStyle={{ color: '#fff', marginBottom: '8px' }}
                                                    formatter={(value: number | undefined) => [
                                                        formatPrice(value || 0),
                                                        'Doanh thu tích lũy',
                                                    ]}
                                                    labelFormatter={(label, payload) => {
                                                        if (payload && payload.length > 0) {
                                                            const data = payload[0].payload
                                                            const revenue = data.revenue
                                                            return revenue > 0 
                                                                ? `${label} - Doanh thu: ${formatPrice(revenue)}`
                                                                : `${label} - Không có đơn hàng`
                                                        }
                                                        return label
                                                    }}
                                                />
                                                <Line
                                                    type="monotone"
                                                    dataKey="cumulativeRevenue"
                                                    stroke="#10b981"
                                                    strokeWidth={2}
                                                    dot={{ fill: '#10b981', r: 4 }}
                                                    activeDot={{ r: 6 }}
                                                />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}

                            {/* Course Structure Pie Chart */}
                            {courseStructureData.length > 0 && (
                                <div>
                                    <h3 className="text-lg font-semibold text-white mb-4">
                                        Biểu đồ doanh thu theo khóa học
                                    </h3>
                                    <div className="bg-[#1F1F1F] rounded-lg p-4 border border-[#2D2D2D]">
                                        <ResponsiveContainer width="100%" height={400}>
                                            <PieChart>
                                                <Pie
                                                    data={courseStructureData}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) =>
                                                        `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                                                    }
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="value"
                                                >
                                                    {courseStructureData.map((_, index) => (
                                                        <Cell
                                                            key={`cell-${index}`}
                                                            fill={PIE_COLORS[index % PIE_COLORS.length]}
                                                        />
                                                    ))}
                                                </Pie>
                                                <Tooltip
                                                    contentStyle={{
                                                        backgroundColor: '#1A1A1A',
                                                        border: '1px solid #2D2D2D',
                                                        borderRadius: '8px',
                                                        color: '#fff',
                                                    }}
                                                    labelStyle={{ color: '#fff' }}
                                                    itemStyle={{ color: '#fff' }}
                                                    formatter={(value: number | undefined) => [
                                                        formatPrice(value || 0),
                                                        'Doanh thu',
                                                    ]}
                                                />
                                                <Legend
                                                    wrapperStyle={{ color: '#fff', fontSize: '12px' }}
                                                    formatter={(value) => {
                                                        const item = courseStructureData.find(
                                                            (d) => d.name === value
                                                        )
                                                        return item ? `${value}: ${formatPrice(item.value)}` : value
                                                    }}
                                                />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
