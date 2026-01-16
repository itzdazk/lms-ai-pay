import { useState, useEffect } from 'react'
import { Loader2, Users } from 'lucide-react'
import apiClient from '../../lib/api/client'
import { toast } from 'sonner'
import {
    InstructorsRevenueFilters,
    InstructorsSummaryCards,
    InstructorsRevenueTable,
    InstructorsRevenuePieChart,
} from '../../components/admin/revenue-stats/instructors'

interface InstructorRevenue {
    instructorId: number
    instructorName: string
    email: string
    avatarUrl: string | null
    courseCount: number
    orderCount: number
    totalRevenue: number
    rank: number
}

interface InstructorsRevenueResponse {
    instructors: InstructorRevenue[]
    chartData?: InstructorRevenue[] // Top instructors for pie chart
    summary: {
        totalRevenue: number
        instructorCount: number
        totalCoursesSold: number
    }
    pagination: {
        page: number
        limit: number
        total: number
        totalPages: number
    }
}

export function InstructorsRevenuePage() {
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
    const [searchQuery, setSearchQuery] = useState('')
    const [sortBy, setSortBy] = useState<'revenue' | 'courseCount'>('revenue')
    const [currentPage, setCurrentPage] = useState(1)
    const [data, setData] = useState<InstructorsRevenueResponse | null>(null)
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
            if (searchQuery.trim()) {
                params.append('search', searchQuery.trim())
            }
            params.append('sortBy', sortBy)
            params.append('page', currentPage.toString())
            params.append('limit', '10')

            const response = await apiClient.get(`/admin/revenue/instructors?${params}`)
            setData(response.data?.data || null)
        } catch (error: any) {
            console.error('Failed to fetch instructors revenue:', error)
            if (error?.response?.status === 404) {
                toast.info('API endpoint chưa được triển khai. Đang sử dụng dữ liệu mẫu.')
                setData({
                    instructors: [],
                    summary: {
                        totalRevenue: 0,
                        instructorCount: 0,
                        totalCoursesSold: 0,
                    },
                    pagination: {
                        page: 1,
                        limit: 10,
                        total: 0,
                        totalPages: 0,
                    },
                })
            } else {
                toast.error('Không thể tải dữ liệu doanh thu giảng viên')
            }
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [selectedYear, selectedMonth, sortBy, currentPage])

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
                        <Users className='h-6 w-6 text-blue-400' />
                        Doanh thu theo giảng viên
                    </h1>
                    <p className='text-sm text-muted-foreground mt-1'>
                        Thống kê doanh thu và hiệu suất của từng giảng viên
                    </p>
                </div>
            </div>

            {/* Filters */}
            <InstructorsRevenueFilters
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                sortBy={sortBy}
                onYearChange={(year) => {
                    setSelectedYear(year)
                    setCurrentPage(1)
                }}
                onMonthChange={(month) => {
                    setSelectedMonth(month)
                    setCurrentPage(1)
                }}
                onSortChange={(sort) => {
                    setSortBy(sort)
                    setCurrentPage(1)
                }}
            />

            {/* Summary Cards */}
            <InstructorsSummaryCards
                totalRevenue={data?.summary.totalRevenue || 0}
                instructorCount={data?.summary.instructorCount || 0}
                totalCoursesSold={data?.summary.totalCoursesSold || 0}
                formatPrice={formatPrice}
            />

            {/* Table */}
            <InstructorsRevenueTable
                data={data?.instructors || []}
                loading={loading}
                currentPage={data?.pagination.page || 1}
                totalPages={data?.pagination.totalPages || 0}
                totalItems={data?.pagination.total || 0}
                searchInput={searchQuery}
                onPageChange={(page) => {
                    setCurrentPage(page)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                }}
                onSort={() => {
                    setSortBy(sortBy === 'revenue' ? 'courseCount' : 'revenue')
                    setCurrentPage(1)
                }}
                onSearchChange={setSearchQuery}
                onSearch={handleSearch}
                onClearSearch={() => {
                    setSearchQuery('')
                    setCurrentPage(1)
                    fetchData()
                }}
                formatPrice={formatPrice}
            />

            {/* Pie Chart */}
            <InstructorsRevenuePieChart
                data={data?.chartData || []}
                formatPrice={formatPrice}
            />
        </div>
    )
}
