import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Clock, FileQuestion, Trophy, AlertCircle, Play } from 'lucide-react'
import type { Quiz, QuizAttempt } from '@/lib/api/types'

interface QuizOverviewProps {
    quiz: Quiz
    attempt?: QuizAttempt | null
    onStart: () => void
    loading?: boolean
}

export const QuizOverview: React.FC<QuizOverviewProps> = ({
    quiz,
    attempt,
    onStart,
    loading = false
}) => {
    const canTakeQuiz = !attempt || attempt.canRetake

    return (
        <div className="space-y-6">
            {/* Quiz Header */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <CardTitle className="text-2xl text-white">
                                {quiz.title}
                            </CardTitle>
                            {quiz.description && (
                                <CardDescription className="text-gray-400">
                                    {quiz.description}
                                </CardDescription>
                            )}
                        </div>
                        {quiz.isPublished ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30">
                                Đã xuất bản
                            </Badge>
                        ) : (
                            <Badge className="bg-yellow-600/20 text-yellow-400 border-yellow-500/30">
                                Bản nháp
                            </Badge>
                        )}
                    </div>
                </CardHeader>
            </Card>

            {/* Quiz Info */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Thông tin bài kiểm tra</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                                <FileQuestion className="h-5 w-5 text-blue-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Số câu hỏi</p>
                                <p className="text-lg font-semibold text-white">
                                    {quiz.questionCount || quiz.questions?.length || 0} câu
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg bg-green-600/20 flex items-center justify-center">
                                <Trophy className="h-5 w-5 text-green-400" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-400">Điểm đạt</p>
                                <p className="text-lg font-semibold text-white">
                                    {quiz.passingScore}%
                                </p>
                            </div>
                        </div>

                        {quiz.timeLimit && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-600/20 flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Thời gian</p>
                                    <p className="text-lg font-semibold text-white">
                                        {quiz.timeLimit} phút
                                    </p>
                                </div>
                            </div>
                        )}

                        {quiz.attemptsAllowed && (
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                                    <AlertCircle className="h-5 w-5 text-purple-400" />
                                </div>
                                <div>
                                    <p className="text-sm text-gray-400">Số lần làm bài</p>
                                    <p className="text-lg font-semibold text-white">
                                        {attempt ? `${attempt.attemptCount}/${quiz.attemptsAllowed}` : `0/${quiz.attemptsAllowed}`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Latest Result */}
            {attempt?.latestResult && (
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader>
                        <CardTitle className="text-lg text-white">Kết quả lần trước</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-2xl font-bold text-white">
                                    {attempt.latestResult.score}%
                                </p>
                                <p className="text-sm text-gray-400 mt-1">
                                    {attempt.latestResult.correctAnswers}/{attempt.latestResult.totalQuestions} câu đúng
                                </p>
                            </div>
                            {attempt.latestResult.passed ? (
                                <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-lg px-4 py-2">
                                    Đạt
                                </Badge>
                            ) : (
                                <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-lg px-4 py-2">
                                    Chưa đạt
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Instructions */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Hướng dẫn</CardTitle>
                </CardHeader>
                <CardContent>
                    <ul className="space-y-2 text-gray-300">
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Đọc kỹ câu hỏi trước khi trả lời</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Bạn có thể di chuyển giữa các câu hỏi bằng các nút điều hướng</span>
                        </li>
                        {quiz.timeLimit && (
                            <li className="flex items-start gap-2">
                                <span className="text-orange-400 mt-1">•</span>
                                <span>Bài kiểm tra có giới hạn thời gian {quiz.timeLimit} phút</span>
                            </li>
                        )}
                        <li className="flex items-start gap-2">
                            <span className="text-blue-400 mt-1">•</span>
                            <span>Nhấn "Nộp bài" khi hoàn thành tất cả câu hỏi</span>
                        </li>
                        <li className="flex items-start gap-2">
                            <span className="text-green-400 mt-1">•</span>
                            <span>Điểm đạt yêu cầu: {quiz.passingScore}%</span>
                        </li>
                    </ul>
                </CardContent>
            </Card>

            {/* Start Button */}
            <div className="flex justify-center">
                {canTakeQuiz ? (
                    <Button
                        size="lg"
                        onClick={onStart}
                        disabled={loading || !quiz.isPublished}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-8"
                    >
                        <Play className="h-5 w-5 mr-2" />
                        {attempt?.attemptCount ? 'Làm lại' : 'Bắt đầu'}
                    </Button>
                ) : (
                    <div className="text-center space-y-2">
                        <Badge variant="destructive" className="text-base px-4 py-2">
                            Đã hết lượt làm bài
                        </Badge>
                        <p className="text-sm text-gray-400">
                            Bạn đã sử dụng hết {quiz.attemptsAllowed} lần làm bài cho phép
                        </p>
                    </div>
                )}
            </div>
        </div>
    )
}
