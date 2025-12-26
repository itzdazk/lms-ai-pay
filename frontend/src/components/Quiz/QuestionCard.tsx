import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
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
                    <div className="space-y-3">
                        <RadioGroup
                            value={value}
                            onValueChange={onChange}
                            disabled={disabled}
                            className="space-y-3"
                        >
                            {qOptions?.map((option, index) => {
                                const optionIndex = index.toString()
                                const isSelected = showResult && ((result && result.userAnswer === optionIndex) || value === optionIndex)
                                const isSelectedCorrect = isSelected && Boolean(result?.isCorrect)
                                const isSelectedWrong = isSelected && !isSelectedCorrect

                                return (
                                    <div
                                        key={index}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                            isSelectedCorrect
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : isSelectedWrong
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : 'border-[#2D2D2D] hover:bg-[#252525]'
                                        }`}
                                    >
                                        <RadioGroupItem value={optionIndex} id={`q-${qId}-option-${index}`} />
                                        <Label
                                            htmlFor={`q-${qId}-option-${index}`}
                                            className="flex-1 cursor-pointer text-white"
                                        >
                                            {option}
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>

                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                                        <span className="font-medium">Giải thích:</span> 
                                         <strong className="text-gray-300 ml-6">{result?.explanation ?? qExplanation}</strong>
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

                                return (
                                    <div
                                        key={opt.value}
                                        className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                            isSelectedCorrect
                                                ? 'bg-green-500/10 border-green-500/30'
                                                : isSelectedWrong
                                                ? 'bg-red-500/10 border-red-500/30'
                                                : 'border-[#2D2D2D] hover:bg-[#252525]'
                                        }`}
                                    >
                                        <RadioGroupItem value={opt.value} id={`q-${qId}-tf-${opt.value}`} />
                                        <Label
                                            htmlFor={`q-${qId}-tf-${opt.value}`}
                                            className="flex-1 cursor-pointer text-white"
                                        >
                                            {opt.label}
                                        </Label>
                                    </div>
                                )
                            })}
                        </RadioGroup>

                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                                        <span className="font-medium">Giải thích:</span> <strong className="text-gray-300 ml-6">{result?.explanation ?? qExplanation}</strong>
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
                            className={`bg-[#1A1A1A] border-[#2D2D2D] text-white ${
                                showResult && result
                                    ? result.isCorrect
                                        ? 'border-green-500/30'
                                        : 'border-red-500/30'
                                    : ''
                            }`}
                        />
                        {showResult && (result?.explanation || qExplanation) && (
                            <div className="space-y-2 text-sm">
                                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                                    <div className="flex items-center gap-2 text-blue-400 mb-1">
                                        <span className="font-medium">Giải thích: </span> <strong className="text-gray-300 ml-6">{result?.explanation ?? qExplanation}</strong>
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
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
                <div className="flex items-start gap-3">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {questionNumber}
                    </div>
                    <div className="flex-1">
                        <CardTitle className="text-lg text-white">
                            {qText}
                        </CardTitle>
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
