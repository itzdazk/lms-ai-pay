import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    AreaChart,
} from 'recharts'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card'
import { Loader2, Users } from 'lucide-react'
import { useInstructorAnalytics } from '../../hooks/useInstructorAnalytics'

interface EnrollmentTrendChartProps {
    className?: string
}

export function EnrollmentTrendChart({ className }: EnrollmentTrendChartProps) {
    const { analytics, isLoading, isError } = useInstructorAnalytics()

    const enrollmentTrend = analytics?.enrollmentTrend || []

    // Format date for display
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return `${date.getDate()}/${date.getMonth() + 1}`
    }

    if (isError) {
        return (
            <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
                <CardContent className="flex items-center justify-center py-12">
                    <p className="text-gray-400">Không thể tải dữ liệu xu hướng đăng ký</p>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <CardTitle className="text-white">Xu hướng đăng ký (30 ngày gần nhất)</CardTitle>
                <CardDescription className="text-gray-400">
                    Số lượng học viên đăng ký theo ngày
                </CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                    </div>
                ) : enrollmentTrend.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <p className="text-gray-400">Chưa có dữ liệu đăng ký</p>
                    </div>
                ) : (
                    <ResponsiveContainer width="100%" height={300}>
                        <AreaChart data={enrollmentTrend}>
                            <defs>
                                <linearGradient id="enrollmentGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2D2D" />
                            <XAxis
                                dataKey="date"
                                stroke="#9CA3AF"
                                tickFormatter={formatDate}
                                style={{ fontSize: '12px' }}
                            />
                            <YAxis
                                stroke="#9CA3AF"
                                style={{ fontSize: '12px' }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: '#1F1F1F',
                                    border: '1px solid #2D2D2D',
                                    borderRadius: '8px',
                                    color: '#FFFFFF',
                                }}
                                formatter={(value: number) => [value, 'Số đăng ký']}
                                labelFormatter={(label) => `Ngày: ${formatDate(label)}`}
                            />
                            <Area
                                type="monotone"
                                dataKey="count"
                                stroke="#10B981"
                                strokeWidth={2}
                                fill="url(#enrollmentGradient)"
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                )}
            </CardContent>
        </Card>
    )
}

