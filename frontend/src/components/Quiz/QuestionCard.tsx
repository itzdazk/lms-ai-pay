import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    const renderQuestionContent = () => {
        switch (question.questionType) {
            case 'multiple_choice':
                return (
                    <RadioGroup
                        value={value}
                        onValueChange={onChange}
                        disabled={disabled}
                        className="space-y-3"
                    >
                        {question.options?.map((option, index) => {
                            const optionIndex = index.toString()
                            const isUserAnswer = showResult && result && result.userAnswer === optionIndex
                            const isCorrectAnswer = showResult && result && result.correctAnswer === optionIndex
                            const isWrongAnswer = isUserAnswer && !result.isCorrect
                            
                            return (
                                <div
                                    key={index}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                        isCorrectAnswer
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : isWrongAnswer
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : 'border-[#2D2D2D] hover:bg-[#252525]'
                                    }`}
                                >
                                    <RadioGroupItem value={optionIndex} id={`option-${index}`} />
                                    <Label
                                        htmlFor={`option-${index}`}
                                        className="flex-1 cursor-pointer text-white"
                                    >
                                        {option}
                                    </Label>
                                    {showResult && isCorrectAnswer && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {showResult && isWrongAnswer && (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            )
                        })}
                    </RadioGroup>
                )

            case 'true_false':
                return (
                    <RadioGroup
                        value={value}
                        onValueChange={onChange}
                        disabled={disabled}
                        className="space-y-3"
                    >
                        {['true', 'false'].map((option) => {
                            const isUserAnswer = showResult && result && result.userAnswer === option
                            const isCorrectAnswer = showResult && result && result.correctAnswer === option
                            const isWrongAnswer = isUserAnswer && !result.isCorrect
                            
                            return (
                                <div
                                    key={option}
                                    className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${
                                        isCorrectAnswer
                                            ? 'bg-green-500/10 border-green-500/30'
                                            : isWrongAnswer
                                            ? 'bg-red-500/10 border-red-500/30'
                                            : 'border-[#2D2D2D] hover:bg-[#252525]'
                                    }`}
                                >
                                    <RadioGroupItem value={option} id={`tf-${option}`} />
                                    <Label
                                        htmlFor={`tf-${option}`}
                                        className="flex-1 cursor-pointer text-white"
                                    >
                                        {option === 'true' ? 'Đúng' : 'Sai'}
                                    </Label>
                                    {showResult && isCorrectAnswer && (
                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    )}
                                    {showResult && isWrongAnswer && (
                                        <XCircle className="h-5 w-5 text-red-500" />
                                    )}
                                </div>
                            )
                        })}
                    </RadioGroup>
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
                        {showResult && result && (
                            <div className="space-y-2 text-sm">
                                {!result.isCorrect && (
                                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                                        <div className="flex items-center gap-2 text-red-400 mb-1">
                                            <XCircle className="h-4 w-4" />
                                            <span className="font-medium">Câu trả lời của bạn:</span>
                                        </div>
                                        <p className="text-white ml-6">{result.userAnswer}</p>
                                    </div>
                                )}
                                <div className="p-3 rounded-lg bg-green-500/10 border border-green-500/30">
                                    <div className="flex items-center gap-2 text-green-400 mb-1">
                                        <CheckCircle2 className="h-4 w-4" />
                                        <span className="font-medium">Đáp án đúng:</span>
                                    </div>
                                    <p className="text-white ml-6">{result.correctAnswer}</p>
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
                            {question.questionText}
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
