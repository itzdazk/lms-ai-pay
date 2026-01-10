import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { FileQuestion, Eye, EyeOff, CheckCircle2, AlertCircle, ChevronRight } from 'lucide-react'
import type { Quiz } from '../../lib/api/types'

interface QuizInfoBadgeProps {
    quizzes: Quiz[]
    className?: string
    isQuizManagementOpen?: boolean
    onToggleQuizManagement?: () => void
}

export function QuizInfoBadge({ quizzes, className, isQuizManagementOpen = false, onToggleQuizManagement }: QuizInfoBadgeProps) {
    const hasQuiz = quizzes && quizzes.length > 0
    
    // Nếu có nhiều quizzes, ưu tiên quiz published, sau đó lấy quiz đầu tiên
    const mainQuiz = hasQuiz ? (quizzes.find(q => q.isPublished) || quizzes[0]) : null
    
    // Parse questions nếu là JSON string hoặc object
    let questionsCount = 0
    if (mainQuiz?.questions) {
        if (Array.isArray(mainQuiz.questions)) {
            questionsCount = mainQuiz.questions.length
        } else if (typeof mainQuiz.questions === 'object') {
            // Nếu là object, đếm keys hoặc length property
            questionsCount = Object.keys(mainQuiz.questions).length
        } else if (typeof mainQuiz.questions === 'string') {
            try {
                const parsed = JSON.parse(mainQuiz.questions)
                questionsCount = Array.isArray(parsed) ? parsed.length : Object.keys(parsed).length
            } catch {
                questionsCount = 0
            }
        }
    }
    
    return (
        <div className={`flex items-center gap-2 flex-wrap ${className || ''}`}>
            {/* Quiz info badges */}
            {hasQuiz && mainQuiz ? (
                <>
                    {/* Quiz title & status */}
                    <Badge 
                        variant="outline" 
                        className={`text-xs ${mainQuiz.isPublished 
                            ? 'text-blue-400 border-blue-400/50' 
                            : 'text-gray-400 border-gray-400/50'
                        }`}
                        title={mainQuiz.description || mainQuiz.title}
                    >
                        <FileQuestion className="h-3 w-3 mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[120px]">{mainQuiz.title}</span>
                        {mainQuiz.isPublished ? (
                            <Eye className="h-3 w-3 ml-1 flex-shrink-0" />
                        ) : (
                            <EyeOff className="h-3 w-3 ml-1 flex-shrink-0" />
                        )}
                    </Badge>
                    
                    {/* Questions count */}
                    {questionsCount > 0 && (
                        <Badge variant="outline" className="text-purple-400 border-purple-400/50 text-xs">
                            {questionsCount} câu
                        </Badge>
                    )}
                    
                    {/* Passing score */}
                    {mainQuiz.passingScore !== undefined && mainQuiz.passingScore !== null && (
                        <Badge 
                            variant="outline" 
                            className={`text-xs ${mainQuiz.passingScore >= 50 
                                ? 'text-green-400 border-green-400/50' 
                                : 'text-yellow-400 border-yellow-400/50'
                            }`}
                            title={`Điểm đạt để pass: ${mainQuiz.passingScore}%`}
                        >
                            {mainQuiz.passingScore >= 50 ? (
                                <CheckCircle2 className="h-3 w-3 mr-1 flex-shrink-0" />
                            ) : (
                                <AlertCircle className="h-3 w-3 mr-1 flex-shrink-0" />
                            )}
                            Đạt: {mainQuiz.passingScore}%
                        </Badge>
                    )}
                    
                    {/* Show count if multiple quizzes */}
                    {quizzes.length > 1 && (
                        <Badge variant="outline" className="text-gray-400 border-gray-400/30 text-xs">
                            +{quizzes.length - 1} quiz khác
                        </Badge>
                    )}
                </>
            ) : (
                <Badge 
                    variant="outline" 
                    className="text-gray-400 border-gray-400/30 text-xs"
                >
                    <FileQuestion className="h-3 w-3 mr-1" />
                    Chưa có câu hỏi ôn tập
                </Badge>
            )}
            
            {/* Quiz management toggle button */}
            {onToggleQuizManagement && (
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onToggleQuizManagement}
                    className="text-xs h-7 bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                >
                    {isQuizManagementOpen ? 'Câu hỏi ôn tập' : 'Câu hỏi ôn tập'}
                    <ChevronRight className={`h-3 w-3 ml-1 transition-transform ${isQuizManagementOpen ? 'rotate-90' : ''}`} />
                </Button>
            )}
        </div>
    )
}

