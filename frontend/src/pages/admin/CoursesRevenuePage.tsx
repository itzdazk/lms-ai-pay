import { useState, useEffect } from 'react'
import { Loader2, BookOpen } from 'lucide-react'
import apiClient from '../../lib/api/client'
import { toast } from 'sonner'
import {
    CoursesRevenueFilters,
    CoursesSummaryCards,
    CoursesRevenueTable,
    CoursesRevenuePieChart,
} from '../../components/admin/revenue-stats/courses'

interface CourseRevenue {
    courseId: number
    courseTitle: string
    thumbnailUrl: string | null
    instructorName: string
    coursePrice: number
    orderCount: number
    totalRevenue: number
}

interface CoursesRevenueResponse {
    courses: CourseRevenue[]
    chartData?: CourseRevenue[] // All courses for pie chart
    summary: {
        totalRevenue: number
        courseCount: number
        totalOrders: number
    }
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export function CoursesRevenuePage() {
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
    const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'revenue' | 'orderCount'>('revenue')
    const [currentPage, setCurrentPage] = useState(1)
    const [data, setData] = useState<CoursesRevenueResponse | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchData = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (selectedYear) {
                params.append('year', selectedYear.toString())
            }
            if (selectedMonth) {
                params.append('month', selectedMonth.toString())
            }
            if (selectedInstructorId) {
                params.append('instructorId', selectedInstructorId.toString())
            }
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim())
            }
            params.append('sortBy', sortBy)
            params.append('page', currentPage.toString())
            params.append('limit', '10')

            const response = await apiClient.get(`/admin/revenue/courses?${params}`)
            setData(response.data?.data || null)
        } catch (error: any) {
            console.error('Failed to fetch courses revenue:', error)
            if (error?.response?.status === 404) {
                toast.info('API endpoint chưa được triển khai. Đang sử dụng dữ liệu mẫu.')
                setData({
                    courses: [],
                    summary: {
                        totalRevenue: 0,
                        courseCount: 0,
                        totalOrders: 0,
                    },
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                })
            } else {
                toast.error('Không thể tải dữ liệu doanh thu khóa học')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedYear, selectedMonth, selectedInstructorId, sortBy, currentPage])

    const handleSearch = () => {
        setCurrentPage(1)
        fetchData()
    }

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    if (loading && !data) {
        return (
            <div className='flex items-center justify-center h-96'>
                <Loader2 className='h-8 w-8 animate-spin text-blue-500' />
            </div>
        )
    }

    return (
        <div className='space-y-6'>
            {/* Header */}
            <div className='flex items-center justify-between'>
                <div>
                    <h1 className='text-2xl font-bold text-foreground flex items-center gap-2'>
                        <BookOpen className='h-6 w-6 text-blue-400' />
                        Doanh thu theo khóa học
                    </h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Thống kê doanh thu và hiệu suất của từng khóa học
                    </p>
                </div>
            </div>

            {/* Filters */}
            <CoursesRevenueFilters
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                selectedInstructorId={selectedInstructorId}
                searchQuery={searchQuery}
                sortBy={sortBy}
                onYearChange={(year) => {
                    setSelectedYear(year)
                    setCurrentPage(1)
                }}
                onMonthChange={(month) => {
                    setSelectedMonth(month)
                    setCurrentPage(1)
                }}
                onInstructorChange={(instructorId) => {
                    setSelectedInstructorId(instructorId)
                    setCurrentPage(1)
                }}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                onSortChange={(sort) => {
                    setSortBy(sort)
                    setCurrentPage(1)
                }}
            />

            {/* Summary Cards */}
            <CoursesSummaryCards
                totalRevenue={data?.summary.totalRevenue || 0}
                courseCount={data?.summary.courseCount || 0}
                totalOrders={data?.summary.totalOrders || 0}
                formatPrice={formatPrice}
            />

            {/* Table */}
            <CoursesRevenueTable
                data={data?.courses || []}
                loading={loading}
                currentPage={data?.pagination.page || 1}
                totalPages={data?.pagination.totalPages || 0}
                totalItems={data?.pagination.total || 0}
                sortBy={sortBy}
                onPageChange={(page) => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onSort={() => {
                    setSortBy(sortBy === 'revenue' ? 'orderCount' : 'revenue')
                    setCurrentPage(1)
                }}
                formatPrice={formatPrice}
            />

            {/* Pie Chart */}
            <CoursesRevenuePieChart
                data={data?.chartData || []}
                formatPrice={formatPrice}
            />
        </div>
    )
}
