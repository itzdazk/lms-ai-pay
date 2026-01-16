import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { format } from 'date-fns'
import { vi } from 'date-fns/locale'

interface RevenueMonthlyChartProps {
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
    selectedYear: number | null
    selectedMonth: number | null
    formatPrice: (price: number) => string
}

const MONTH_NAMES = [
    'Tháng 1',
    'Tháng 2',
    'Tháng 3',
    'Tháng 4',
    'Tháng 5',
    'Tháng 6',
    'Tháng 7',
    'Tháng 8',
    'Tháng 9',
    'Tháng 10',
    'Tháng 11',
    'Tháng 12',
]

export function RevenueMonthlyChart({
    monthlyData,
    yearlyData = [],
    dailyData = [],
    selectedYear,
    selectedMonth,
    formatPrice,
}: RevenueMonthlyChartProps) {
    // Determine chart type and data
    let chartData: Array<{ label: string; revenue: number; orders: number }> = []
    let chartTitle = 'Biểu đồ doanh thu'

    if (!selectedYear) {
        // Show by year
        chartTitle = 'Biểu đồ doanh thu theo năm'
        chartData = yearlyData.map((item) => ({
            label: item.year.toString(),
            revenue: item.revenue,
            orders: item.orders,
        }))
    } else if (!selectedMonth) {
        // Show by month (12 months of selected year)
        chartTitle = `Biểu đồ doanh thu theo tháng (Năm ${selectedYear})`
        chartData = monthlyData.map((item) => ({
            label: MONTH_NAMES[item.month - 1],
            revenue: item.revenue,
            orders: item.orders,
        }))
    } else {
        // Show by day (all days in selected month)
        chartTitle = `Biểu đồ doanh thu (Tháng ${selectedMonth}/${selectedYear})`
        chartData = dailyData.map((item) => {
            const date = new Date(item.date)
            return {
                label: format(date, 'dd/MM', { locale: vi }),
                revenue: item.revenue,
                orders: item.orders,
            }
        })
    }

    // If no data, show empty state
    if (chartData.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>{chartTitle}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='h-64 flex items-center justify-center text-gray-400'>
                        Chưa có dữ liệu
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Always use BarChart for consistency
    const useLineChart = false

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-white'>{chartTitle}</CardTitle>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width='100%' height={350}>
                    {useLineChart ? (
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray='3 3' stroke='#2D2D2D' />
                            <XAxis
                                dataKey='label'
                                stroke='#9CA3AF'
                                style={{ fontSize: '10px' }}
                                angle={-45}
                                textAnchor='end'
                                height={100}
                                interval='preserveStartEnd'
                            />
                            <YAxis
                                stroke='#9CA3AF'
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
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '6px',
                                }}
                                formatter={(value: number) => {
                                    return [formatPrice(value), 'Doanh thu']
                                }}
                            />
                            <Legend />
                            <Line
                                type='monotone'
                                dataKey='revenue'
                                stroke='#10b981'
                                strokeWidth={2}
                                name='Doanh thu'
                                dot={false}
                                activeDot={{ r: 4 }}
                            />
                        </LineChart>
                    ) : (
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray='3 3' stroke='#2D2D2D' />
                            <XAxis
                                dataKey='label'
                                stroke='#9CA3AF'
                                style={{ fontSize: selectedYear && selectedMonth ? '10px' : '12px' }}
                                interval={0}
                                angle={selectedYear && selectedMonth ? -45 : 0}
                                textAnchor={selectedYear && selectedMonth ? 'end' : 'middle'}
                                height={selectedYear && selectedMonth ? 100 : undefined}
                                tick={{ fill: '#9CA3AF' }}
                            />
                            <YAxis
                                stroke='#9CA3AF'
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
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '6px',
                                }}
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length > 0) {
                                        const data = payload[0].payload
                                        return (
                                            <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-3 shadow-lg'>
                                                <p className='text-sm text-gray-400 mb-2'>
                                                    {data.label}
                                                </p>
                                                <div className='space-y-1'>
                                                    <p className='text-sm text-white'>
                                                        <span className='text-gray-400'>Doanh thu: </span>
                                                        <span className='font-semibold text-green-400'>
                                                            {formatPrice(data.revenue)}
                                                        </span>
                                                    </p>
                                                    <p className='text-sm text-white'>
                                                        <span className='text-gray-400'>Số đơn hàng: </span>
                                                        <span className='font-semibold text-blue-400'>
                                                            {data.orders.toLocaleString('vi-VN')}
                                                        </span>
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    }
                                    return null
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey='revenue'
                                fill='#10b981'
                                name='Doanh thu'
                                radius={[4, 4, 0, 0]}
                            />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </CardContent>
        </Card>
    )
}
