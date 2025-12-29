import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useTheme } from '@/contexts/ThemeContext'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Input } from '@/components/ui/input'
import { CheckCircle2, XCircle } from 'lucide-react'
import type { Question, QuestionResult } from '@/lib/api/types'

interface QuestionCardProps {
    question: Question
    questionNumber: number
    value: string
    onChange: (value: string) => void
    showResult?: boolean
    result?: QuestionResult
    disabled?: boolean
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
    question,
    questionNumber,
    value,
    onChange,
    showResult = false,
    result,
    disabled = false
}) => {
    // Support both new and legacy question shapes
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const qId = (question as any).id?.toString() ?? `${questionNumber}`
    const qText = (question as any).questionText ?? (question as any).question ?? ''
    const qType: 'multiple_choice' | 'true_false' | 'short_answer' = (question as any).questionType ?? (question as any).type ?? 'multiple_choice'
    const qOptions: string[] | undefined = (question as any).options
    // Gather explanation from various possible backend shapes
    const qRaw: any = question as any
    const qExplanationDirect: string | undefined = qRaw.explanation ?? qRaw.explain ?? qRaw.explanationText ?? qRaw.reason ?? qRaw.detail
    const qExplanations: any = qRaw.explanations
    const pickExplanationFromVariants = (): string | undefined => {
        if (qExplanationDirect) return String(qExplanationDirect)
        if (Array.isArray(qExplanations)) {
            // Prefer correct answer index if available, else user selection
            const rawIdx = result?.correctAnswer ?? result?.userAnswer ?? value
            const idx = typeof rawIdx === 'number' ? rawIdx : parseInt(String(rawIdx ?? ''), 10)
            if (!Number.isNaN(idx) && qExplanations[idx]) return String(qExplanations[idx])
        } else if (qExplanations && typeof qExplanations === 'object') {
            // Map like { true: '...', false: '...' }
            const key = String(result?.correctAnswer ?? result?.userAnswer ?? value ?? '')
            if (qExplanations[key]) return String(qExplanations[key])
        }
        return undefined
    }
    const qExplanation: string | undefined = pickExplanationFromVariants()

    const renderQuestionContent = () => {
        switch (qType) {
            case 'multiple_choice':
                return (
                    <div className="space-y-3 ">
                        <RadioGroup
                            value={value}
                            onValueChange={onChange}
                            disabled={disabled}
                            className="space-y-2 "
                        >
                            {qOptions?.map((option, index) => {
                                const optionIndex = index.toString()
                                const isSelected = showResult && ((result && result.userAnswer === optionIndex) || value === optionIndex)
                                const isSelectedCorrect = isSelected && Boolean(result?.isCorrect)
                                const isSelectedWrong = isSelected && !isSelectedCorrect
                                const isCurrent = !showResult && value === optionIndex;
                                const base = isCurrent
                                    ? (isDark
                                        ? 'border-blue-500 bg-[#1A1A1A] text-blue-400'
                                        : 'border-blue-500 bg-blue-50 text-blue-600')
                                    : (isDark
                                        ? 'border-blue-500/40 hover:bg-[#252525] text-white'
                                        : 'border-blue-400/60 hover:bg-blue-100 text-black');
                                const correct = isDark
                                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                                    : 'bg-green-100 border-green-400 text-green-700';
                                const wrong = isDark
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-red-100 border-red-400 text-red-700';
                                return (
                                    <Label
                                        key={index}
                                        htmlFor={`q-${qId}-option-${index}`}
                                        tabIndex={0}
                                        className={`flex items-center space-x-3 p-3 border transition-colors rounded-none cursor-pointer select-none ${
                                            isSelectedCorrect
                                                ? correct
                                                : isSelectedWrong
                                                ? wrong
                                                : base
                                        } ${!isSelectedCorrect && !isSelectedWrong ? (isDark ? 'hover:bg-blue-900/10' : 'hover:bg-blue-100') : ''}`}
                                        onClick={() => !disabled && onChange(optionIndex)}
                                        onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onChange(optionIndex); }}
                                    >
                                        <RadioGroupItem value={optionIndex} id={`q-${qId}-option-${index}`} />
                                        <span className={`flex-1 ${isDark ? 'text-white' : 'text-black'}`}>{option}</span>
                                    </Label>
                                )
                            })}
                        </RadioGroup>

                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/30">
                                    <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                        <span className="font-medium">Giải thích:</span>
                                        <strong className={`ml-6 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{result?.explanation ?? qExplanation}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'true_false':
                return (
                    <div className="space-y-3">
                        <RadioGroup
                            value={value}
                            onValueChange={onChange}
                            disabled={disabled}
                            className="space-y-3"
                        >
                            {[
                                { value: '1', label: 'Đúng' },
                                { value: '0', label: 'Sai' },
                            ].map((opt) => {
                                const isSelected = showResult && ((result && result.userAnswer === opt.value) || value === opt.value)
                                const isSelectedCorrect = isSelected && Boolean(result?.isCorrect)
                                const isSelectedWrong = isSelected && !isSelectedCorrect
                                const isCurrent = !showResult && value === opt.value;
                                const base = isCurrent
                                    ? (isDark
                                        ? 'border-blue-500 bg-[#1A1A1A] text-blue-400'
                                        : 'border-blue-500 bg-blue-50 text-blue-600')
                                    : (isDark
                                        ? 'border-blue-500/40 hover:bg-[#252525] text-white'
                                        : 'border-blue-400/60 hover:bg-blue-100 text-black');
                                const correct = isDark
                                    ? 'bg-green-500/10 border-green-500/30 text-green-600'
                                    : 'bg-green-100 border-green-400 text-green-700';
                                const wrong = isDark
                                    ? 'bg-red-500/10 border-red-500/30 text-red-400'
                                    : 'bg-red-100 border-red-400 text-red-700';
                                return (
                                    <Label
                                        key={opt.value}
                                        htmlFor={`q-${qId}-tf-${opt.value}`}
                                        tabIndex={0}
                                        className={`flex items-center space-x-3 p-3 border transition-colors rounded-none cursor-pointer select-none ${
                                            isSelectedCorrect
                                                ? correct
                                                : isSelectedWrong
                                                ? wrong
                                                : base
                                        } ${!isSelectedCorrect && !isSelectedWrong ? (isDark ? 'hover:bg-blue-900/10' : 'hover:bg-blue-100') : ''}`}
                                        onClick={() => !disabled && onChange(opt.value)}
                                        onKeyDown={e => { if (!disabled && (e.key === 'Enter' || e.key === ' ')) onChange(opt.value); }}
                                    >
                                        <RadioGroupItem value={opt.value} id={`q-${qId}-tf-${opt.value}`} />
                                        <span className={`flex-1 ${isDark ? 'text-white' : 'text-black'}`}>{opt.label}</span>
                                    </Label>
                                )
                            })}
                        </RadioGroup>

                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/30">
                                    <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                        <span className="font-medium">Giải thích:</span>
                                        <strong className={`ml-6 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{result?.explanation ?? qExplanation}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )

            case 'short_answer':
                return (
                    <div className="space-y-3">
                        <Input
                            type="text"
                            value={value}
                            onChange={(e) => onChange(e.target.value)}
                            disabled={disabled}
                            placeholder="Nhập câu trả lời của bạn..."
                            className={`${isDark ? 'bg-[#1A1A1A] text-white border-blue-500/40' : 'bg-white text-black border-blue-400/60'} h-14 px-4 py-3 text-base rounded-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all ${
                                showResult && result
                                    ? result.isCorrect
                                        ? 'border-green-500/30'
                                        : 'border-red-500/30'
                                    : ''
                            }`}
                            style={{ minHeight: 48, borderRadius: 0 }}
                        />
                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 bg-blue-500/10 border border-blue-500/30">
                                    <div className={`flex items-center gap-2 mb-1 ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>
                                        <span className="font-medium">Giải thích: </span>
                                        <strong className={`ml-6 ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>{result?.explanation ?? qExplanation}</strong>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <Card className={`${isDark ? 'bg-[#1A1A1A] border-2 border-blue-900 text-white rounded-none' : 'bg-white border-2 border-blue-400 text-black rounded-none'}`}>
             
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className={`flex-shrink-0 w-8 h-8 bg-blue-600 flex items-center justify-center font-semibold ${isDark ? 'text-white' : 'text-white'}`}> {/* Giữ số thứ tự màu trắng */}
                        {questionNumber}
                    </div>
                    <div className="flex-1">
                        <CardTitle className={`text-lg ${isDark ? 'text-white' : 'text-black'}`}>{qText}</CardTitle>
                        {showResult && result && (
                            <div className="mt-2">
                                {result.isCorrect ? (
                                    <span className="inline-flex items-center gap-1 text-sm text-green-400">
                                        <CheckCircle2 className="h-4 w-4" />
                                        Chính xác
                                    </span>
                                ) : (
                                    <span className="inline-flex items-center gap-1 text-sm text-red-400">
                                        <XCircle className="h-4 w-4" />
                                        Sai
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="pt-0">
                {renderQuestionContent()}
            </CardContent>
        </Card>
    )
}
