import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Loader2, TrendingUp, Calendar, DollarSign } from 'lucide-react'
import apiClient from '../../lib/api/client'
import { toast } from 'sonner'
import { RevenueStatsFilters } from '../../components/admin/revenue-stats/RevenueStatsFilters'
import { RevenueSummaryCards } from '../../components/admin/revenue-stats/RevenueSummaryCards'
import { RevenueMonthlyChart } from '../../components/admin/revenue-stats/RevenueMonthlyChart'
import { TopInstructorsTable } from '../../components/admin/revenue-stats/TopInstructorsTable'
import { TopCoursesTable } from '../../components/admin/revenue-stats/TopCoursesTable'

interface RevenueStats {
    totalRevenue: number
    totalOrders: number
    monthlyData: Array<{
        month: number
        year: number
        revenue: number
        orders: number
    }>
    yearlyData?: Array<{
        year: number
        revenue: number
        orders: number
    }>
    dailyData?: Array<{
        date: string
        revenue: number
        orders: number
    }>
    topInstructors: Array<{
        instructorId: number
        instructorName: string
        courseCount: number
        revenue: number
    }>
    topCourses: Array<{
        courseId: number
        courseTitle: string
        instructorName: string
        revenue: number
    }>
}

export function RevenueStatsPage() {
    const [selectedYear, setSelectedYear] = useState<number | null>(new Date().getFullYear())
    const [selectedMonth, setSelectedMonth] = useState<number | null>(new Date().getMonth() + 1)
    const [stats, setStats] = useState<RevenueStats | null>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                setLoading(true)
                const params = new URLSearchParams()
                if (selectedYear) {
                    params.append('year', selectedYear.toString())
                }
                if (selectedMonth) {
                    params.append('month', selectedMonth.toString())
                }

                const response = await apiClient.get(`/admin/revenue/stats?${params}`)
                setStats(response.data?.data || null)
            } catch (error: any) {
                console.error('Failed to fetch revenue stats:', error)
                if (error?.response?.status === 404) {
                    toast.info('API endpoint chưa được triển khai. Đang sử dụng dữ liệu mẫu.')
                    // Fallback data for development
                    setStats({
                        totalRevenue: 0,
                        totalOrders: 0,
                        monthlyData: [],
                        topInstructors: [],
                        topCourses: [],
                    })
                } else {
                    toast.error('Không thể tải dữ liệu thống kê doanh thu')
                }
            } finally {
                setLoading(false)
            }
        }

        fetchStats()
    }, [selectedYear, selectedMonth])

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('vi-VN', {
            style: 'currency',
            currency: 'VND',
        }).format(price)
    }

    if (loading) {
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
                    <h1 className='text-2xl font-bold text-white flex items-center gap-2'>
                        <DollarSign className='h-6 w-6 text-green-400' />
                        Thống kê doanh thu
                    </h1>
                    <p className='text-sm text-gray-400 mt-1'>
                        Phân tích doanh thu theo thời gian, giảng viên và khóa học
                    </p>
                </div>
            </div>

            {/* Filters */}
            <RevenueStatsFilters
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                onYearChange={setSelectedYear}
                onMonthChange={setSelectedMonth}
            />

            {/* Summary Cards */}
            <RevenueSummaryCards
                totalRevenue={stats?.totalRevenue || 0}
                totalOrders={stats?.totalOrders || 0}
                formatPrice={formatPrice}
            />

            {/* Chart - Dynamic based on filters */}
            <RevenueMonthlyChart
                monthlyData={stats?.monthlyData || []}
                yearlyData={stats?.yearlyData || []}
                dailyData={stats?.dailyData || []}
                selectedYear={selectedYear}
                selectedMonth={selectedMonth}
                formatPrice={formatPrice}
            />

            {/* Top Tables */}
            <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
                <TopInstructorsTable
                    data={stats?.topInstructors || []}
                    formatPrice={formatPrice}
                />
                <TopCoursesTable
                    data={stats?.topCourses || []}
                    formatPrice={formatPrice}
                />
            </div>
        </div>
    )
}
