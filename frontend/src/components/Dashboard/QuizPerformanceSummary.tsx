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
