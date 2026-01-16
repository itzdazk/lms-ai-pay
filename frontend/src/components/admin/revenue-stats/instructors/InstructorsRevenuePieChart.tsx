import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { Users } from 'lucide-react'

interface InstructorRevenue {
    instructorId: number
    instructorName: string
    email: string
    courseCount: number
    orderCount: number
    totalRevenue: number
    rank: number
}

interface InstructorsRevenuePieChartProps {
    data: InstructorRevenue[]
    formatPrice: (price: number) => string
}

// Color palette for pie chart segments
const COLORS = [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
    '#84CC16', // Lime
    '#6366F1', // Indigo
]

export function InstructorsRevenuePieChart({
    data,
    formatPrice,
}: InstructorsRevenuePieChartProps) {
    if (!data || data.length === 0) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-foreground flex items-center gap-2'>
                        <Users className='h-5 w-5 text-blue-400' />
                        Phân bố doanh thu theo giảng viên
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='text-center py-12 text-gray-400'>
                        Chưa có dữ liệu
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Get top 10 instructors
    const top10 = data.slice(0, 10)
    
    // Calculate revenue for "Khác" (remaining instructors)
    const others = data.slice(10)
    const othersRevenue = others.reduce((sum, inst) => sum + inst.totalRevenue, 0)
    const othersCount = others.length
    
    // Prepare chart data: top 10 + "Khác" if there are more than 10
    const chartData = top10.map((instructor) => ({
        name: instructor.instructorName,
        value: instructor.totalRevenue,
        instructorId: instructor.instructorId,
        isOther: false,
        othersCount: 0,
    }))

    // Add "Khác" if there are more than 10 instructors
    if (data.length > 10 && othersRevenue > 0) {
        chartData.push({
            name: 'Khác',
            value: othersRevenue,
            instructorId: -1, // Special ID for "Khác"
            isOther: true,
            othersCount: othersCount,
        })
    }

    // Calculate total revenue for percentage calculation
    const totalRevenue = data.reduce((sum, item) => sum + item.totalRevenue, 0)

    // Custom tooltip
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0]
            const percentage = totalRevenue > 0 
                ? ((data.value / totalRevenue) * 100).toFixed(1) 
                : 0
            
            return (
                <div className='bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg p-3 shadow-lg'>
                    <p className='text-sm font-semibold text-foreground mb-1'>
                        {data.name}
                    </p>
                    <p className='text-sm text-gray-300'>
                        Doanh thu: <span className='font-semibold text-green-400'>{formatPrice(data.value)}</span>
                    </p>
                    <p className='text-xs text-gray-400 mt-1'>
                        Tỷ lệ: {percentage}%
                    </p>
                    {data.payload?.isOther && data.payload?.othersCount > 0 && (
                        <p className='text-xs text-gray-500 mt-1 italic'>
                            ({data.payload.othersCount} giảng viên khác)
                        </p>
                    )}
                </div>
            )
        }
        return null
    }

    // Custom label function
    const renderLabel = (entry: any) => {
        const percentage = totalRevenue > 0 
            ? ((entry.value / totalRevenue) * 100).toFixed(1) 
            : 0
        // Only show label if percentage >= 3% to avoid clutter
        if (parseFloat(percentage) >= 3) {
            return `${percentage}%`
        }
        return ''
    }

    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] dark:bg-[#1A1A1A] dark:border-[#2D2D2D]'>
            <CardHeader>
                <CardTitle className='text-foreground flex items-center gap-2'>
                    <Users className='h-5 w-5 text-blue-400' />
                    Phân bố doanh thu theo giảng viên
                </CardTitle>
                <p className='text-sm text-gray-400 mt-1'>
                    {data.length > 10 
                        ? `Top 10 giảng viên + ${data.length - 10} giảng viên khác`
                        : `${data.length} giảng viên có doanh thu`
                    }
                </p>
            </CardHeader>
            <CardContent>
                <ResponsiveContainer width='100%' height={400}>
                    <PieChart>
                        <Pie
                            data={chartData}
                            cx='50%'
                            cy='50%'
                            labelLine={false}
                            label={renderLabel}
                            outerRadius={120}
                            fill='#8884d8'
                            dataKey='value'
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${entry.instructorId || `other-${index}`}`}
                                    fill={entry.isOther 
                                        ? '#6B7280' // Gray color for "Khác"
                                        : COLORS[index % COLORS.length]
                                    }
                                />
                            ))}
                        </Pie>
                        <Tooltip content={<CustomTooltip />} />
                        <Legend
                            verticalAlign='bottom'
                            height={36}
                            formatter={(value, entry: any) => {
                                const percentage = totalRevenue > 0 
                                    ? ((entry.payload.value / totalRevenue) * 100).toFixed(1) 
                                    : 0
                                return `${value} (${percentage}%)`
                            }}
                            wrapperStyle={{
                                color: '#9CA3AF',
                                fontSize: '12px',
                            }}
                        />
                    </PieChart>
                </ResponsiveContainer>

                {/* Legend with revenue values */}
                <div className='mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2'>
                    {chartData.map((item, index) => {
                        const percentage = totalRevenue > 0 
                            ? ((item.value / totalRevenue) * 100).toFixed(1) 
                            : 0
                        const color = item.isOther 
                            ? '#6B7280' 
                            : COLORS[index % COLORS.length]
                        
                        return (
                            <div
                                key={item.instructorId || `other-${index}`}
                                className='flex items-center gap-2 p-2 rounded bg-[#1F1F1F] hover:bg-[#2A2A2A] transition-colors'
                            >
                                <div
                                    className='w-3 h-3 rounded'
                                    style={{
                                        backgroundColor: color,
                                    }}
                                />
                                <div className='flex-1 min-w-0'>
                                    <p className='text-xs text-gray-300 truncate'>
                                        {item.name}
                                        {item.isOther && item.othersCount > 0 && (
                                            <span className='text-gray-500 ml-1'>
                                                ({item.othersCount} giảng viên)
                                            </span>
                                        )}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {formatPrice(item.value)} ({percentage}%)
                                    </p>
                                </div>
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
