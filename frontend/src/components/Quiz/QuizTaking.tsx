import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Clock, XCircle, ChevronLeft, ChevronRight, Send, X, RotateCcw, CheckCircle2 } from 'lucide-react'
import { QuestionCard } from './QuestionCard'
import type { Quiz, QuizAnswer, QuizResult } from '@/lib/api/types'
import { useEffect, useState } from 'react'
import { useTheme } from '@/contexts/ThemeContext'

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
    
    // Removed debug log reset helper
    
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

    // Đủ đáp án cho tất cả câu hỏi?
    const allAnswered = answeredCount === totalQuestions && totalQuestions > 0;

    const { theme } = useTheme();
    const isDark = theme === 'dark';

    return (
        <div className="">
            {/* Sticky Header Wrapper */}
            <div className="sticky top-0 z-40" style={{background: isDark ? '#1A1A1Aee' : '#ffffffcc', boxShadow: '0 2px 8px 0 rgba(0,0,0,0.03)'}}>
                <Card
                    className={
                        `${isDark ? 'bg-[#1A1A1A] text-white' : 'bg-white text-black'} rounded-none !border-0 !border-b-0 shadow-none`
                    }
                >
                    <CardHeader className="!bg-transparent !backdrop-blur-md px-4 pt-2 pb-1">
                        <div className="flex items-center justify-between gap-4">
                            {/* Title */}
                            <div className="flex flex-col flex-1 min-w-0">
                                <div className="flex items-center gap-4 min-w-0">
                                    <CardTitle className={`text-xl truncate ${isDark ? 'text-white' : 'text-black'}`}>{quiz.title}</CardTitle>
                                    {/* Result summary inline */}
                                    {showResult && quizResult && (() => {
                                        const rawAnswers = (quizResult as any)?.answers || (quizResult as any)?.submission?.answers || [];
                                        const isArray = Array.isArray(rawAnswers);
                                        const correctCount = isArray ? rawAnswers.filter((a: any) => Boolean(a.isCorrect)).length : (quizResult as any)?.correctAnswers ?? 0;
                                        const totalCount = isArray ? rawAnswers.length : (quizResult as any)?.totalQuestions ?? (quiz.questions?.length || 0);
                                        const score = (quizResult as any)?.score ?? (totalCount > 0 ? Math.round((correctCount / totalCount) * 100) : 0);
                                        const passed = (quizResult as any)?.passed ?? (score >= (quiz.passingScore ?? 0));
                                        return (
                                            <div
                                                className={`flex items-center gap-1 px-1.5 py-0.5 rounded border text-xs ${
                                                    isDark
                                                        ? 'bg-[#1F1F1F]/70 border-blue-500/30'
                                                        : 'bg-blue-50 border-blue-400/60'
                                                }`}
                                                style={{ minWidth: 0, minHeight: 0 }}
                                            >
                                                {passed ? (
                                                    <>
                                                        <span className="text-lg">🎉</span>
                                                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                                                    </>
                                                ) : (
                                                    <XCircle className="h-4 w-4 text-red-500" />
                                                )}
                                                <span className={`font-semibold ${passed ? 'text-green-500' : 'text-red-500'}`}>{score}%</span>
                                                <span className={`${isDark ? 'text-gray-400' : 'text-gray-600'}`}>({correctCount}/{totalCount} đúng)</span>
                                            </div>
                                        );
                                    })()}
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-sm text-gray-400">
                                        Tổng số câu: {totalQuestions}
                                    </span>
                                    <Badge variant="outline" className="border-blue-500/30 text-blue-400">
                                        {answeredCount}/{totalQuestions} đã trả lời
                                    </Badge>
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
                            {/* Nộp bài & Làm lại button */}
                            <div className="flex-shrink-0 flex items-center gap-2">
                                {!showResult && (
                                    <Button
                                        onClick={handleSubmit}
                                        disabled={submitting || !allAnswered}
                                        className="blue"
                                        title={!allAnswered ? 'Vui lòng trả lời tất cả câu hỏi trước khi nộp bài' : undefined}
                                    >
                                        <Send className="h-4 w-4 mr-2" />
                                        {submitting ? 'Đang nộp bài...' : 'Nộp bài'}
                                    </Button>
                                )}
                                {showResult && onRetry && (
                                    <Button
                                        onClick={() => { if (onRetry) onRetry() }}
                                        className="blue"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" />
                                        Làm lại
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="my-2">
                            <Progress value={progress} className="h-2" />
                        </div>
                    </CardHeader>
                </Card>
            </div>

            {/* Questions - Vertical Stack */}
            <Card
                className={
                    `${isDark ? 'bg-[#1A1A1A] border-[#2D2D2D] text-white' : 'bg-white border-gray-200 text-black'} rounded-none`
                }
            >
                <CardHeader>
                    <CardTitle className={`text-sm ${isDark ? 'text-gray-400' : 'text-black'}`}>Danh sách câu hỏi</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {questions.map((q, index) => {
                        const qIdRaw = (q as any).id ?? (q as any).questionId
                        if (qIdRaw === undefined || qIdRaw === null) {
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

                        // Remove debug result-check logging

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

            {/* Result summary now shown inline in header */}

            {/* Bottom Buttons (removed 'Thoát' after submit) */}

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
