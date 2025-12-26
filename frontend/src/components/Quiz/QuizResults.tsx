import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Trophy, RefreshCw, X, CheckCircle2, XCircle } from 'lucide-react'
import { QuestionCard } from './QuestionCard'
import type { Quiz, QuizResult } from '@/lib/api/types'

interface QuizResultsProps {
    quiz: Quiz
    result: QuizResult
    onRetry?: () => void
    onExit: () => void
    canRetry?: boolean
}

export const QuizResults: React.FC<QuizResultsProps> = ({
    quiz,
    result,
    onRetry,
    onExit,
    canRetry = true
}) => {
    const { score, passed, correctAnswers, totalQuestions, answers } = result

    return (
        <div className="space-y-6">
            {/* Results Header */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <CardTitle className="text-xl text-white">{quiz.title}</CardTitle>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExit}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 space-y-4">
                        <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                            <Trophy className="h-10 w-10 text-white" />
                        </div>
                        
                        <div>
                            <h2 className="text-4xl font-bold text-white mb-2">
                                {score}%
                            </h2>
                            <p className="text-gray-400">
                                {correctAnswers}/{totalQuestions} câu đúng
                            </p>
                        </div>

                        {passed ? (
                            <Badge className="bg-green-600/20 text-green-400 border-green-500/30 text-lg px-6 py-2">
                                🎉 Đạt yêu cầu
                            </Badge>
                        ) : (
                            <Badge className="bg-red-600/20 text-red-400 border-red-500/30 text-lg px-6 py-2">
                                Chưa đạt yêu cầu ({quiz.passingScore}%)
                            </Badge>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Thống kê</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="text-center p-4 rounded-lg bg-blue-600/10 border border-blue-500/30">
                            <p className="text-2xl font-bold text-blue-400">{totalQuestions}</p>
                            <p className="text-sm text-gray-400 mt-1">Tổng số câu</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-green-600/10 border border-green-500/30">
                            <p className="text-2xl font-bold text-green-400">{correctAnswers}</p>
                            <p className="text-sm text-gray-400 mt-1">Câu đúng</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-red-600/10 border border-red-500/30">
                            <p className="text-2xl font-bold text-red-400">{totalQuestions - correctAnswers}</p>
                            <p className="text-sm text-gray-400 mt-1">Câu sai</p>
                        </div>
                        <div className="text-center p-4 rounded-lg bg-purple-600/10 border border-purple-500/30">
                            <p className="text-2xl font-bold text-purple-400">{score}%</p>
                            <p className="text-sm text-gray-400 mt-1">Điểm số</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Review Answers */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-lg text-white">Chi tiết bài làm</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {answers.map((answerResult, index) => {
                        const question = quiz.questions?.find(q => q.id === answerResult.questionId)
                        if (!question) return null

                        return (
                            <div key={answerResult.questionId} className="space-y-2">
                                <QuestionCard
                                    question={question}
                                    questionNumber={index + 1}
                                    value={answerResult.userAnswer}
                                    onChange={() => {}} // Read-only
                                    showResult={true}
                                    result={answerResult}
                                    disabled={true}
                                />
                            </div>
                        )
                    })}
                </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-4">
                <Button
                    variant="outline"
                    onClick={onExit}
                    className="border-[#2D2D2D] hover:bg-[#252525]"
                >
                    Đóng
                </Button>
                {canRetry && onRetry && (
                    <Button
                        onClick={onRetry}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Làm lại
                    </Button>
                )}
            </div>
        </div>
    )
}
