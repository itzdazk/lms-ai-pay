import { useState } from 'react'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    BarChart,
    Bar,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Button } from '../ui/button'
import { Loader2, DollarSign, TrendingUp } from 'lucide-react'
import { useInstructorRevenue } from '../../hooks/useInstructorRevenue'
import type { RevenueChartData } from '../../lib/api/instructor-dashboard'

function formatPrice(price: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(price)
}

function formatPeriodLabel(period: string, periodType: string): string {
    if (periodType === 'day') {
        // Format: "15/01"
        const date = new Date(period)
        return `${date.getDate()}/${date.getMonth() + 1}`
    } else if (periodType === 'week') {
        // Format: "15/01"
        const date = new Date(period)
        return `${date.getDate()}/${date.getMonth() + 1}`
    } else if (periodType === 'month') {
        // Format: "01/2024"
        const [year, month] = period.split('-')
        return `${month}/${year}`
    } else if (periodType === 'year') {
        // Format: "2024"
        return period
    }
    return period
}

interface RevenueChartProps {
    className?: string
}

export function RevenueChart({ className }: RevenueChartProps) {
    const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'year'>('month')
    const { revenue, isLoading, isError } = useInstructorRevenue(period)

    // Calculate summary stats
    const totalRevenue = revenue?.totalRevenue || 0
    const totalOrders = revenue?.revenueChart.reduce((sum, item) => sum + item.orders, 0) || 0
    const avgPerOrder = totalOrders > 0 ? totalRevenue / totalOrders : 0
    
    // Calculate growth percentage (compare first and last period)
    const chartData = revenue?.revenueChart || []
    const growthPercentage = chartData.length >= 2
        ? ((chartData[chartData.length - 1].revenue - chartData[0].revenue) / chartData[0].revenue) * 100
        : 0

    if (isError) {
        return (
            <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-gray-400">Không thể tải dữ liệu doanh thu</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-white">Doanh thu theo thời gian</CardTitle>
                        <CardDescription className="text-gray-400">
                            Phân tích doanh thu theo {period === 'day' ? 'ngày' : period === 'week' ? 'tuần' : period === 'month' ? 'tháng' : 'năm'}
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {(['day', 'week', 'month', 'year'] as const).map((p) => (
                            <Button
                                key={p}
                                variant={period === p ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => setPeriod(p)}
                                className={
                                    period === p
                                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                        : 'bg-[#1F1F1F] border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D]'
                                }
                            >
                                {p === 'day' ? 'Ngày' : p === 'week' ? 'Tuần' : p === 'month' ? 'Tháng' : 'Năm'}
                            </Button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {/* Summary Cards */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                    <div className="bg-[#1F1F1F] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign className="h-4 w-4 text-green-500" />
                            <span className="text-sm text-gray-400">Tổng doanh thu</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatPrice(totalRevenue)}</p>
                    </div>
                    <div className="bg-[#1F1F1F] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-blue-500" />
                            <span className="text-sm text-gray-400">TB/Đơn hàng</span>
                        </div>
                        <p className="text-2xl font-bold text-white">{formatPrice(avgPerOrder)}</p>
                    </div>
                    <div className="bg-[#1F1F1F] rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="h-4 w-4 text-yellow-500" />
                            <span className="text-sm text-gray-400">Tăng trưởng</span>
                        </div>
                        <p className={`text-2xl font-bold ${growthPercentage >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {growthPercentage >= 0 ? '+' : ''}{growthPercentage.toFixed(1)}%
                        </p>
                    </div>
                </div>

                {/* Chart */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : chartData.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <DollarSign className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-400">Chưa có dữ liệu doanh thu</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={400}>
                        <LineChart data={chartData}>
                            <defs>
                                <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                            <XAxis
                                dataKey="period"
                                stroke="#9CA3AF"
                                tickFormatter={(value) => formatPeriodLabel(value, period)}
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                tickFormatter={(value) => {
                                    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`
                                    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`
                                    return value.toString()
                                }}
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                }}
                                formatter={(value: number, name: string) => {
                                    if (name === 'revenue') {
                                        return [formatPrice(value), 'Doanh thu']
                                    }
                                    if (name === 'orders') {
                                        return [value, 'Số đơn']
                                    }
                                    return [value, name]
                                }}
                                labelFormatter={(label) => {
                                    return `Thời gian: ${formatPeriodLabel(label, period)}`
                                }}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                stroke="#3B82F6"
                                strokeWidth={2}
                                dot={{ fill: '#3B82F6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

