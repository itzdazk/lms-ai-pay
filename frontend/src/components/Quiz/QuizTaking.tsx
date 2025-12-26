import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, XCircle, ChevronLeft, ChevronRight, Send, X, RotateCcw, CheckCircle2 } from 'lucide-react'
import { QuestionCard } from './QuestionCard'
import type { Quiz, QuizAnswer, QuizResult } from '@/lib/api/types'
import { useEffect, useState } from 'react'

interface QuizTakingProps {
    quiz: Quiz
    currentQuestionIndex: number
    answers: QuizAnswer[]
    timeRemaining: number | null
    onAnswerChange: (questionId: string, answer: string) => void
    onPrevious: () => void
    onNext: () => void
    onGoToQuestion: (index: number) => void
    onSubmit: () => void
    onExit: () => void
    onRetry?: () => void
    submitting?: boolean
    showResult?: boolean
    quizResult?: QuizResult | null
}

export const QuizTaking: React.FC<QuizTakingProps> = ({
    quiz,
    currentQuestionIndex,
    answers,
    timeRemaining,
    onAnswerChange,
    onPrevious,
    onNext,
    onGoToQuestion,
    onSubmit,
    onExit,
    onRetry,
    submitting = false,
    showResult = false,
    quizResult = null
}) => {
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false)
    
    const resetDebugLog = () => {
        if (typeof window === 'undefined') return
        const anyWindow = window as any
        const key = '__QUIZ_RESULT_DEBUG_IDS__'
        if (anyWindow[key]) {
            anyWindow[key] = new Set<string>()
        }
    }
    
    const questions = quiz.questions || []
    const totalQuestions = questions.length
    const answeredCount = answers.filter(a => a.answer && a.answer.trim() !== '').length
    const progress = (answeredCount / totalQuestions) * 100

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
                            <div className="flex items-center gap-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-400">
                                        Tổng số câu: {totalQuestions}
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

            {/* Questions - Vertical Stack */}
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardHeader>
                    <CardTitle className="text-sm text-gray-400">Danh sách câu hỏi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions.map((q, index) => {
                        const qIdRaw = (q as any).id ?? (q as any).questionId
                        if (qIdRaw === undefined || qIdRaw === null) {
                            // Warn once per render for invalid question
                            if (typeof window !== 'undefined') {
                                // eslint-disable-next-line no-console
                                console.warn('Quiz question thiếu ID, bỏ qua hiển thị:', q)
                            }
                            return null
                        }
                        const normalizedId = String(qIdRaw)
                        const rawAnswerValue = answers.find(a => a.questionId === normalizedId)?.answer || ''

                        // Normalize backend answer payload to QuestionCard expectation
                        const rawAnswers = (quizResult as any)?.answers || (quizResult as any)?.submission?.answers || []
                        let rawResult: any = undefined
                        if (Array.isArray(rawAnswers)) {
                            rawResult = rawAnswers.find((a: any) => String(a.questionId) === normalizedId)
                        }

                        const qType: 'multiple_choice' | 'true_false' | 'short_answer' = (q as any).questionType ?? (q as any).type ?? 'multiple_choice'
                        const qOptions: string[] = (q as any).options || []

                        const normalizeUserInput = (val: any): string => {
                            if (qType !== 'true_false') return String(val ?? '')
                            const lower = String(val ?? '').toLowerCase()
                            if (lower === '1' || lower === '0') return lower
                            if (lower === 'true') return '1'
                            if (lower === 'false') return '0'
                            return ''
                        }

                        const answerValue = normalizeUserInput(rawAnswerValue)

                        const normalizeAnswerValue = (val: any): string => {
                            if (val === null || val === undefined) return ''
                            if (qType === 'true_false') {
                                // Normalize to '1' (Đúng) or '0' (Sai)
                                if (typeof val === 'number') return val === 1 ? '1' : '0'
                                const lower = String(val).toLowerCase()
                                if (lower === '1' || lower === '0') return lower
                                if (lower === 'true') return '1'
                                if (lower === 'false') return '0'
                                return lower
                            }
                            return String(val)
                        }

                        // Resolve explanation from multiple possible shapes
                        const resolveExplanation = (): string | undefined => {
                            const rr = rawResult as any
                            const qq = q as any
                            const cand = rr?.explanation
                                ?? rr?.explain
                                ?? rr?.explanationText
                                ?? rr?.reason
                                ?? rr?.detail
                                ?? qq?.explanation
                                ?? qq?.explain
                                ?? qq?.explanationText
                                ?? qq?.reason
                                ?? qq?.detail
                            if (cand) return String(cand)
                            const exps = qq?.explanations
                            if (Array.isArray(exps)) {
                                // Try to pick explanation by correct answer index or user answer index
                                const rawIdx = rr?.correctAnswer ?? rr?.answer ?? rr?.userAnswer
                                const idx = typeof rawIdx === 'number' ? rawIdx : parseInt(String(rawIdx ?? ''), 10)
                                if (!Number.isNaN(idx) && exps[idx]) return String(exps[idx])
                            } else if (exps && typeof exps === 'object') {
                                // Object map: e.g., { true: '...', false: '...' }
                                const key = String(rr?.correctAnswer ?? rr?.answer ?? rr?.userAnswer ?? '')
                                if (exps[key]) return String(exps[key])
                            }
                            return undefined
                        }

                        const normalizedResult = rawResult
                            ? (() => {
                                  const rr: any = rawResult
                                  const rawUser = rr.userAnswer ?? rr.providedAnswer ?? rr.answer
                                  const hadBackendUserAnswer = !(rawUser === undefined || rawUser === null || String(rawUser) === '')
                                  const normUser = normalizeAnswerValue(hadBackendUserAnswer ? rawUser : answerValue)
                                  const normCorrect = normalizeAnswerValue(rr.correctAnswer)
                                  let isCorrectVal: boolean | undefined
                                  if (qType === 'short_answer') {
                                      // If backend didn't return user answer, compute from local selection vs correct answer (case-insensitive)
                                      if (!hadBackendUserAnswer) {
                                          const localAns = String(answerValue ?? '').trim().toLowerCase()
                                          const correctAns = String(rr.correctAnswer ?? '').trim().toLowerCase()
                                          isCorrectVal = !!(localAns && correctAns && localAns === correctAns)
                                      } else {
                                          // Prefer backend isCorrect if user answer was provided
                                          isCorrectVal = typeof rr.isCorrect === 'boolean' ? rr.isCorrect : false
                                      }
                                  } else {
                                      // For objective types, if backend didn't include user answer, compute based on local selection
                                      if (!hadBackendUserAnswer) {
                                          isCorrectVal = !!(normUser && normCorrect && normUser === normCorrect)
                                      } else {
                                          // Prefer backend isCorrect if present, else compute
                                          isCorrectVal = typeof rr.isCorrect === 'boolean'
                                              ? rr.isCorrect
                                              : !!(normUser && normCorrect && normUser === normCorrect)
                                      }
                                  }
                                  return {
                                      questionId: normalizedId,
                                      questionText: (q as any).questionText ?? (q as any).question ?? '',
                                      questionType: qType,
                                      userAnswer: normUser,
                                      correctAnswer: normCorrect,
                                      isCorrect: Boolean(isCorrectVal),
                                      options: qOptions,
                                      explanation: resolveExplanation(),
                                  }
                              })()
                            : undefined

                        // Result-check log: show how frontend determined correctness
                        if (showResult && typeof window !== 'undefined') {
                            const globalKey = '__QUIZ_RESULT_DEBUG_IDS__'
                            const anyWindow = window as any
                            if (!anyWindow[globalKey]) anyWindow[globalKey] = new Set<string>()
                            const loggedSet: Set<string> = anyWindow[globalKey]
                            if (!loggedSet.has(normalizedId)) {
                                const rr: any = rawResult
                                const rawUser = rr?.userAnswer ?? rr?.providedAnswer ?? rr?.answer
                                const usedSource = (rawUser === undefined || rawUser === null || String(rawUser) === '') ? 'local' : 'backend'
                                // eslint-disable-next-line no-console
                                console.log('Frontend result check', {
                                    questionId: normalizedId,
                                    backendQuestionId: rr?.questionId ?? null,
                                    type: qType,
                                    source: usedSource,
                                    backendUserAnswer: rawUser ?? null,
                                    localUserInput: answerValue,
                                    userAnswerNormalized: (normalizedResult as any)?.userAnswer,
                                    correctAnswerNormalized: (normalizedResult as any)?.correctAnswer,
                                    finalIsCorrect: (normalizedResult as any)?.isCorrect,
                                })
                                loggedSet.add(normalizedId)
                            }
                        }

                        return (
                            <QuestionCard
                                key={normalizedId}
                                question={q}
                                questionNumber={index + 1}
                                value={answerValue}
                                onChange={(value) => onAnswerChange(normalizedId, value)}
                                showResult={showResult}
                                result={normalizedResult as any}
                                disabled={showResult}
                            />
                        )
                    })}
                </CardContent>
            </Card>

            {/* Result Summary when showing results */}
            {showResult && quizResult && (
                <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <CardHeader className="text-center">
                        {(() => {
                            const rawAnswers = (quizResult as any)?.answers || (quizResult as any)?.submission?.answers || []
                            const isArray = Array.isArray(rawAnswers)
                            const correctCount = isArray ? rawAnswers.filter((a: any) => Boolean(a.isCorrect)).length : (quizResult as any)?.correctAnswers ?? 0
                            const totalCount = isArray ? rawAnswers.length : (quizResult as any)?.totalQuestions ?? (quiz.questions?.length || 0)
                            const score = (quizResult as any)?.score ?? (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0)
                            const passed = (quizResult as any)?.passed ?? (score >= (quiz.passingScore ?? 0))
                            return (
                                <div>
                                    <div className={`mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full ${passed ? 'bg-green-600/20' : 'bg-red-600/20'}`}>
                                        {passed ? (
                                            <CheckCircle2 className="h-10 w-10 text-green-500" />
                                        ) : (
                                            <XCircle className="h-10 w-10 text-red-500" />
                                        )}
                                    </div>
                                    <CardTitle className="text-3xl mb-2 text-white">
                                        {passed ? 'Chúc mừng! 🎉' : 'Chưa đạt'}
                                    </CardTitle>
                                    <p className="text-lg text-gray-400">
                                        {passed ? 'Bạn đã vượt qua bài quiz thành công!' : `Bạn cần ${quiz.passingScore}% để đạt. Hãy thử lại!`}
                                    </p>
                                    <div className="mt-6 text-center p-8 bg-[#1F1F1F] rounded-lg">
                                        <p className="text-gray-400 mb-2">Điểm của bạn</p>
                                        <p className={`text-6xl mb-2 ${passed ? 'text-green-500' : 'text-red-500'}`}>{score}%</p>
                                        <p className="text-gray-400">{correctCount}/{totalCount} câu đúng</p>
                                    </div>
                                </div>
                            )
                        })()}
                    </CardHeader>
                </Card>
            )}

            {/* Bottom Buttons */}
            <div className="flex items-center justify-between gap-4">
                <div>
                    {showResult && (
                        <Button
                            onClick={onExit}
                            variant="outline"
                            className="border-[#2D2D2D] hover:bg-[#252525]"
                        >
                            <X className="h-4 w-4 mr-2" />
                            Thoát
                        </Button>
                    )}
                </div>
                <div className="flex gap-2">
                    {!showResult && (
                        <Button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="bg-green-600 hover:bg-green-700 text-white"
                        >
                            <Send className="h-4 w-4 mr-2" />
                            {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                        </Button>
                    )}
                    {showResult && onRetry && (
                        <Button
                            onClick={() => { resetDebugLog(); onRetry() }}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Làm lại
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
