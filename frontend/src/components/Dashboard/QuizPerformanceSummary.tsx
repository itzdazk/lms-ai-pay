import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
    CardDescription,
} from '../ui/card'
import { Badge } from '../ui/badge'
import { Loader2, TrendingUp, TrendingDown, Award, Target } from 'lucide-react'
import { useQuizPerformance } from '../../hooks/useQuizPerformance'
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts'

export function QuizPerformanceSummary() {
    const { performance, loading, error } = useQuizPerformance()

    if (loading) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Hiệu suất Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='flex items-center justify-center py-8'>
                        <Loader2 className='h-6 w-6 animate-spin text-blue-500' />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error || !performance) {
        return (
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Hiệu suất Quiz</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className='text-red-400 text-sm'>
                        {error || 'Không có dữ liệu'}
                    </p>
                </CardContent>
            </Card>
        )
    }

    // Format date for trend chart
    const formatDate = (dateString: string): string => {
        const date = new Date(dateString)
        return `${date.getDate()}/${date.getMonth() + 1}`
    }

    return (
        <div className='space-y-4'>
            {/* Overall Stats */}
            <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                <CardHeader>
                    <CardTitle className='text-white'>Tổng quan</CardTitle>
                    <CardDescription className='text-gray-400'>
                        Thống kê tổng thể về quiz
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                        <StatCard
                            label='Tổng số quiz'
                            value={performance.overall.totalQuizzes}
                            icon={<Target className='h-4 w-4' />}
                        />
                        <StatCard
                            label='Điểm trung bình'
                            value={`${performance.overall.averageScore.toFixed(
                                1
                            )}%`}
                            icon={<TrendingUp className='h-4 w-4' />}
                            color='text-green-400'
                        />
                        <StatCard
                            label='Tỷ lệ đạt'
                            value={`${performance.overall.passRate.toFixed(
                                1
                            )}%`}
                            icon={<Award className='h-4 w-4' />}
                            color='text-blue-400'
                        />
                        <StatCard
                            label='Điểm tuyệt đối'
                            value={performance.overall.perfectScores}
                            icon={<Award className='h-4 w-4' />}
                            color='text-purple-400'
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Performance Trend Chart */}
            {performance.performanceTrend &&
                performance.performanceTrend.length > 0 && (
                    <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                        <CardHeader>
                            <CardTitle className='text-white'>
                                Xu hướng điểm số
                            </CardTitle>
                            <CardDescription className='text-gray-400'>
                                Điểm trung bình theo thời gian
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width='100%' height={300}>
                                <LineChart
                                    data={performance.performanceTrend}
                                    margin={{
                                        top: 5,
                                        right: 10,
                                        left: 0,
                                        bottom: 0,
                                    }}
                                >
                                    <defs>
                                        <linearGradient
                                            id='scoreGradient'
                                            x1='0'
                                            y1='0'
                                            x2='0'
                                            y2='1'
                                        >
                                            <stop
                                                offset='5%'
                                                stopColor='#3B82F6'
                                                stopOpacity={0.3}
                                            />
                                            <stop
                                                offset='95%'
                                                stopColor='#3B82F6'
                                                stopOpacity={0}
                                            />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid
                                        strokeDasharray='3 3'
                                        stroke='#2D2D2D'
                                    />
                                    <XAxis
                                        dataKey='date'
                                        stroke='#9CA3AF'
                                        tickFormatter={formatDate}
                                        style={{ fontSize: '12px' }}
                                    />
                                    <YAxis
                                        stroke='#9CA3AF'
                                        domain={[0, 100]}
                                        style={{ fontSize: '12px' }}
                                        tickFormatter={(value) => `${value}%`}
                                    />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: '#1F1F1F',
                                            border: '1px solid #2D2D2D',
                                            borderRadius: '8px',
                                            color: '#FFFFFF',
                                        }}
                                        formatter={(
                                            value: number | undefined
                                        ) => [
                                            value !== undefined
                                                ? `${value.toFixed(1)}%`
                                                : '0%',
                                            'Điểm trung bình',
                                        ]}
                                        labelFormatter={(label) =>
                                            `Ngày: ${formatDate(label)}`
                                        }
                                    />
                                    <Line
                                        type='monotone'
                                        dataKey='averageScore'
                                        stroke='#3B82F6'
                                        strokeWidth={2}
                                        dot={{
                                            fill: '#3B82F6',
                                            r: 4,
                                        }}
                                        activeDot={{ r: 6 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>
                )}

            {/* Recent Quizzes */}
            {performance.recentQuizzes.length > 0 && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Quiz gần đây
                        </CardTitle>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        {performance.recentQuizzes.slice(0, 5).map((quiz) => (
                            <div
                                key={quiz.id}
                                className='flex items-center justify-between p-3 rounded-lg border border-[#2D2D2D] bg-black/40'
                            >
                                <div className='flex-1 min-w-0'>
                                    <p className='text-sm text-white font-medium truncate'>
                                        {quiz.quizTitle}
                                    </p>
                                    <p className='text-xs text-gray-400 truncate'>
                                        {quiz.courseTitle}
                                    </p>
                                </div>
                                <div className='flex items-center gap-2 ml-3'>
                                    <Badge
                                        className={
                                            quiz.isPassed
                                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                                : 'bg-red-500/20 text-red-400 border-red-500/30'
                                        }
                                    >
                                        {quiz.score}%
                                    </Badge>
                                    {quiz.isPassed ? (
                                        <TrendingUp className='h-4 w-4 text-green-400' />
                                    ) : (
                                        <TrendingDown className='h-4 w-4 text-red-400' />
                                    )}
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}

            {/* Weak Topics */}
            {performance.weakTopics.length > 0 && (
                <Card className='bg-[#1A1A1A] border-[#2D2D2D]'>
                    <CardHeader>
                        <CardTitle className='text-white'>
                            Chủ đề cần cải thiện
                        </CardTitle>
                        <CardDescription className='text-gray-400'>
                            Các chủ đề có điểm trung bình dưới 70%
                        </CardDescription>
                    </CardHeader>
                    <CardContent className='space-y-2'>
                        {performance.weakTopics.map((topic, index) => (
                            <div
                                key={index}
                                className='flex items-center justify-between p-3 rounded-lg border border-[#2D2D2D] bg-black/40'
                            >
                                <div className='flex-1'>
                                    <p className='text-sm text-white'>
                                        {topic.topic}
                                    </p>
                                    <p className='text-xs text-gray-400'>
                                        {topic.quizCount} bài quiz
                                    </p>
                                </div>
                                <Badge className='bg-orange-500/20 text-orange-400 border-orange-500/30'>
                                    {topic.averageScore.toFixed(1)}%
                                </Badge>
                            </div>
                        ))}
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function StatCard({
    label,
    value,
    icon,
    color = 'text-blue-400',
}: {
    label: string
    value: string | number
    icon: React.ReactNode
    color?: string
}) {
    return (
        <div className='rounded-lg border border-[#2D2D2D] bg-black/40 p-4'>
            <div
                className={`flex items-center gap-2 text-gray-400 text-xs mb-2`}
            >
                <div className={color}>{icon}</div>
                {label}
            </div>
            <div className={`text-2xl font-bold text-white`}>{value}</div>
        </div>
    )
}
