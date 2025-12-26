import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, ChevronLeft, ChevronRight, Send, X } from 'lucide-react'
import { QuestionCard } from './QuestionCard'
import type { Quiz, QuizAnswer } from '@/lib/api/types'
import { useEffect, useState } from 'react'

interface QuizTakingProps {
    quiz: Quiz
    currentQuestionIndex: number
    answers: QuizAnswer[]
    timeRemaining: number | null
    onAnswerQuestion: (questionId: string, answer: string) => void
    onPrevious: () => void
    onNext: () => void
    onGoToQuestion: (index: number) => void
    onSubmit: () => void
    onExit: () => void
    submitting?: boolean
}

export const QuizTaking: React.FC<QuizTakingProps> = ({
    quiz,
    currentQuestionIndex,
    answers,
    timeRemaining,
    onAnswerQuestion,
    onPrevious,
    onNext,
    onGoToQuestion,
    onSubmit,
    onExit,
    submitting = false
}) => {
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
    
    const questions = quiz.questions || []
    const currentQuestion = questions[currentQuestionIndex]
    const totalQuestions = questions.length
    const answeredCount = answers.filter(a => a.answer && a.answer.trim() !== '').length
    const progress = (answeredCount / totalQuestions) * 100

    const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id)?.answer || ''

    // Format time remaining
    const formatTime = (seconds: number | null) => {
        if (seconds === null) return null
        const mins = Math.floor(seconds / 60)
        const secs = seconds % 60
        return `${mins}:${secs.toString().padStart(2, '0')}`
    }

    const handleSubmit = () => {
        if (answeredCount < totalQuestions) {
            setShowSubmitConfirm(true)
        } else {
            onSubmit()
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="space-y-2 flex-1">
                            <CardTitle className="text-xl text-white">{quiz.title}</CardTitle>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">
                                        Câu {currentQuestionIndex + 1}/{totalQuestions}
                                    </span>
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                        {answeredCount}/{totalQuestions} đã trả lời
                                    </Badge>
                                </div>
                                {timeRemaining !== null && (
                                    <div className="flex items-center gap-2">
                                        <Clock className={`h-4 w-4 ${timeRemaining < 60 ? 'text-red-400' : 'text-orange-400'}`} />
                                        <span className={`text-sm font-mono ${timeRemaining < 60 ? 'text-red-400' : 'text-orange-400'}`}>
                                            {formatTime(timeRemaining)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={onExit}
                            className="text-gray-400 hover:text-white"
                        >
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="mt-4">
                        <Progress value={progress} className="h-2" />
                    </div>
                </CardHeader>
            </Card>

            {/* Current Question */}
            {currentQuestion && (
                <QuestionCard
                    question={currentQuestion}
                    questionNumber={currentQuestionIndex + 1}
                    value={currentAnswer}
                    onChange={(value) => onAnswerQuestion(currentQuestion.id, value)}
                />
            )}

            {/* Question Navigation Grid */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Danh sách câu hỏi</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-10 gap-2">
                        {questions.map((q, index) => {
                            const isAnswered = answers.find(a => a.questionId === q.id)?.answer?.trim()
                            const isCurrent = index === currentQuestionIndex
                            
                            return (
                                <button
                                    key={q.id}
                                    onClick={() => onGoToQuestion(index)}
                                    className={`
                                        h-10 rounded-lg font-medium transition-colors
                                        ${isCurrent 
                                            ? 'bg-blue-600 text-white' 
                                            : isAnswered
                                            ? 'bg-green-600/20 text-green-400 border border-green-500/30 hover:bg-green-600/30'
                                            : 'bg-[#252525] text-gray-400 border border-[#2D2D2D] hover:bg-[#2D2D2D]'
                                        }
                                    `}
                                >
                                    {index + 1}
                                </button>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between gap-4">
                <Button
                    variant="outline"
                    onClick={onPrevious}
                    disabled={currentQuestionIndex === 0}
                    className="border-[#2D2D2D] hover:bg-[#252525]"
                >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Câu trước
                </Button>

                <div className="flex gap-2">
                    {currentQuestionIndex === totalQuestions - 1 ? (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                        </Button>
                    ) : (
                        <Button
                            onClick={onNext}
                            disabled={currentQuestionIndex === totalQuestions - 1}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            Câu tiếp theo
                            <ChevronRight className="h-4 w-4 ml-2" />
                        </Button>
                    )}
                </div>
            </div>

            {/* Submit Confirmation Dialog */}
            {showSubmitConfirm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <Card className="bg-[#1A1A1A] border-[#2D2D2D] max-w-md mx-4">
                        <CardHeader>
                            <CardTitle className="text-white">Xác nhận nộp bài</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-gray-300">
                                Bạn còn <span className="text-orange-400 font-semibold">{totalQuestions - answeredCount}</span> câu hỏi chưa trả lời.
                            </p>
                            <p className="text-gray-400 text-sm">
                                Bạn có chắc chắn muốn nộp bài không?
                            </p>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowSubmitConfirm(false)}
                                    className="flex-1 border-[#2D2D2D]"
                                >
                                    Hủy
                                </Button>
                                <Button
                                    onClick={() => {
                                        setShowSubmitConfirm(false)
                                        onSubmit()
                                    }}
                                    disabled={submitting}
                                    className="flex-1 bg-green-600 hover:bg-green-700"
                                >
                                    Nộp bài
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
