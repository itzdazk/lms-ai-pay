import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import {
    Plus,
    Loader2,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    Copy,
    AlertCircle,
    CheckCircle,
    ChevronUp,
    ChevronDown,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAuth } from '../../contexts/AuthContext'
import { useQuizzes } from '../../hooks/useQuizzes'
import { instructorQuizzesApi } from '../../lib/api/instructor-quizzes'
import type { Quiz } from '../../lib/api/types'
import { QuizDialog } from '../../components/instructor/QuizDialog'
import { QuestionDialog } from '../../components/instructor/QuestionDialog'

interface QuizzesPageState {
    showCreateDialog: boolean
    selectedQuiz: Quiz | null
    deletingQuizzId: number | null
    showQuestionDialog: boolean
    targetQuizId: number | null
    selectedQuestion: any | null
}


export function QuizzesPage({ lessonId: propLessonId }: { lessonId?: number }) {
    const { user } = useAuth()
    const navigate = useNavigate()
    const params = useParams<{ lessonId: string }>()
    // Use prop if provided, else fallback to URL param
    const numLessonId = typeof propLessonId === 'number' ? propLessonId : (params.lessonId ? parseInt(params.lessonId) : null)

    // State
    const [pageState, setPageState] = useState<QuizzesPageState>({
        showCreateDialog: false,
        selectedQuiz: null,
        deletingQuizzId: null,
        showQuestionDialog: false,
        targetQuizId: null,
        selectedQuestion: null,
    })
    const [searchQuery, setSearchQuery] = useState('')
    // no local deleting state needed

    // Data fetching
    const { quizzes, loading, error, refetch } = useQuizzes(numLessonId ?? undefined)

    // Filter quizzes by search
    const filteredQuizzes = useMemo(() => {
        if (!searchQuery.trim()) return quizzes

        const query = searchQuery.toLowerCase()
        return quizzes.filter(
            (quiz) =>
                quiz.title.toLowerCase().includes(query) ||
                quiz.description?.toLowerCase().includes(query)
        )
    }, [quizzes, searchQuery])

    // Handlers
    const handleEditQuiz = (quiz: Quiz) => {
        setPageState((prev) => ({
            ...prev,
            showCreateDialog: true,
            selectedQuiz: quiz,
        }))
    }

    const handlePublishToggle = async (quiz: Quiz) => {
        try {
            await instructorQuizzesApi.publishQuiz(quiz.id, !quiz.isPublished)
            await refetch()
            toast.success(
                quiz.isPublished ? 'Quiz đã được ẩn' : 'Quiz đã được công khai'
            )
        } catch (error) {
            toast.error('Lỗi cập nhật trạng thái quiz')
            console.error('Error publishing quiz:', error)
        }
    }

    const handleDeleteQuiz = async (quizId: number) => {
        try {
            await instructorQuizzesApi.deleteQuiz(quizId)
            await refetch()
            toast.success('Quiz đã được xóa')
        } catch (error) {
            toast.error('Lỗi xóa quiz')
            console.error('Error deleting quiz:', error)
        }
    }

    const handleDeleteClick = async (quizId: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa quiz này?')
        if (!ok) return
        await handleDeleteQuiz(quizId)
    }

    const handleDuplicateQuiz = async () => {
        try {
            // TODO: Implement duplicate logic if backend supports it
            toast.info('Tính năng này sẽ được cập nhật')
        } catch (error) {
            toast.error('Lỗi nhân bản quiz')
        }
    }

    const handleViewAnalytics = (quiz: Quiz) => {
        // TODO: Navigate to analytics page or open modal
        navigate(`/instructor/lessons/${lessonId}/quizzes/${quiz.id}/analytics`)
    }

    const handleAddQuestion = (quiz: Quiz) => {
        setPageState((prev) => ({
            ...prev,
            showQuestionDialog: true,
            targetQuizId: quiz.id,
            selectedQuestion: null,
        }))
    }

    const handleEditQuestion = (quiz: Quiz, question: any) => {
        setPageState((prev) => ({
            ...prev,
            showQuestionDialog: true,
            targetQuizId: quiz.id,
            selectedQuestion: question,
        }))
    }

    const handleDeleteQuestion = async (quiz: Quiz, question: any) => {
        const ok = window.confirm('Bạn có chắc muốn xóa câu hỏi này?')
        if (!ok) return
        const questionId = question?.id ?? question?.questionId
        if (!questionId) {
            toast.error('Không xác định được ID câu hỏi — cần lưu câu hỏi trước khi xóa')
            return
        }
        try {
            await instructorQuizzesApi.deleteQuestion(quiz.id, Number(questionId))
            await refetch()
            toast.success('Đã xóa câu hỏi')
        } catch (e: any) {
            const message = e?.response?.data?.message || 'Xóa câu hỏi thất bại'
            toast.error(message)
            console.error('Delete question failed', e)
        }
    }

    const handleMoveQuestion = async (
        quiz: Quiz,
        question: any,
        direction: 'up' | 'down'
    ) => {
        if (!Array.isArray(quiz.questions) || quiz.questions.length === 0) {
            toast.error('Không có danh sách câu hỏi để sắp xếp')
            return
        }
        const questions = [...quiz.questions]
        const getId = (q: any) => q?.id ?? q?.questionId
        const currentId = getId(question)
        if (!currentId) {
            toast.error('Không xác định được ID câu hỏi để sắp xếp')
            return
        }
        const idx = questions.findIndex((q: any) => getId(q) === currentId)
        if (idx === -1) {
            toast.error('Không tìm thấy câu hỏi trong danh sách')
            return
        }
        const newIdx = direction === 'up' ? idx - 1 : idx + 1
        if (newIdx < 0 || newIdx >= questions.length) {
            // out of bounds, nothing to do
            return
        }
        // swap positions
        const temp = questions[newIdx]
        questions[newIdx] = questions[idx]
        questions[idx] = temp

        const orders = questions
            .map((q: any, index: number) => ({
                questionId: Number(getId(q)),
                order: index + 1,
            }))
            .filter((o) => !Number.isNaN(o.questionId))
        try {
            await instructorQuizzesApi.reorderQuestions(quiz.id, orders)
            await refetch()
            toast.success('Đã cập nhật thứ tự câu hỏi')
        } catch (e: any) {
            const message = e?.response?.data?.message || 'Sắp xếp câu hỏi thất bại'
            toast.error(message)
            console.error('Reorder questions failed', e)
        }
    }

    if (!user) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                    <p>Bạn không có quyền truy cập trang này</p>
                </div>
            </div>
        )
    }

    if (!numLessonId) {
        return (
            <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                    <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                    <p>Không tìm thấy bài học</p>
                </div>
            </div>
        )
    }

    // Full-screen loading state (consistent with CourseChaptersPage)
    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    return (
        <>
            <Card className="bg-[#1A1A1A] border-[#2D2D2D] py-4">
                <CardHeader>
                    <div>
                        <CardTitle className="text-white text-2xl mb-2">Quản lý câu hỏi</CardTitle>
                        <p className="text-gray-400">Quản lý câu hỏi cho bài học của bạn</p>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-6">
                        <input
                            type="text"
                            placeholder="Tìm kiếm quiz..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg bg-gray-700 text-white placeholder-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none"
                        />
                    </div>

                    {/* Loading handled by top-level return */}

                    {/* Error State */}
                    {error && (
                        <Card className="bg-red-50 border-red-500">
                            <CardContent className="pt-6">
                                <div className="flex items-center gap-3">
                                    <AlertCircle className="h-6 w-6 text-red-600" />
                                    <div>
                                        <p className="font-semibold text-red-600">Lỗi tải dữ liệu</p>
                                        <p className="text-sm text-red-600">{error.message}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Empty State */}
                    {!loading && filteredQuizzes.length === 0 && (
                        <div className="pt-12 pb-12 text-center">
                            <div className="mb-4">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto opacity-50" />
                            </div>
                            <p className="text-gray-400 mb-4">
                                {searchQuery ? 'Không tìm thấy quiz phù hợp' : 'Chưa có quiz nào cho bài học này'}
                            </p>
                            {!searchQuery && quizzes.length === 0 && (
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                    onClick={() =>
                                        setPageState((prev) => ({
                                            ...prev,
                                            showCreateDialog: true,
                                            selectedQuiz: null,
                                        }))
                                    }
                                >
                                    <Plus className="h-4 w-4 mr-2" /> Tạo câu hỏi cho bài học
                                </Button>
                            )}
                        </div>
                    )}

                    {/* Quiz List */}
                    {!loading && filteredQuizzes.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                            {filteredQuizzes.map((quiz) => (
                                <QuizCard
                                    key={quiz.id}
                                    quiz={quiz}
                                    onEdit={() => handleEditQuiz(quiz)}
                                    onDelete={() => handleDeleteClick(quiz.id)}
                                    onPublishToggle={() => handlePublishToggle(quiz)}
                                    onDuplicate={() => handleDuplicateQuiz()}
                                    onViewAnalytics={() => handleViewAnalytics(quiz)}
                                    onAddQuestion={() => handleAddQuestion(quiz)}
                                    onEditQuestion={(q) => handleEditQuestion(quiz, q)}
                                    onDeleteQuestion={(q) => handleDeleteQuestion(quiz, q)}
                                    onMoveQuestionUp={(q) => handleMoveQuestion(quiz, q, 'up')}
                                    onMoveQuestionDown={(q) => handleMoveQuestion(quiz, q, 'down')}
                                />
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <QuizDialog
                open={pageState.showCreateDialog}
                quiz={pageState.selectedQuiz}
                lessonId={numLessonId!}
                onClose={() => setPageState((p) => ({ ...p, showCreateDialog: false, selectedQuiz: null }))}
                onSaved={async () => {
                    await refetch()
                    setPageState((p) => ({ ...p, showCreateDialog: false, selectedQuiz: null }))
                }}
            />
            <QuestionDialog
                open={pageState.showQuestionDialog}
                quizId={pageState.targetQuizId || 0}
                question={pageState.selectedQuestion}
                onClose={() => setPageState((p) => ({ ...p, showQuestionDialog: false, targetQuizId: null, selectedQuestion: null }))}
                onSaved={async () => {
                    await refetch()
                    setPageState((p) => ({ ...p, showQuestionDialog: false, targetQuizId: null, selectedQuestion: null }))
                }}
            />
        </>
    )
}

/**
 * Quiz Card Component
 */
interface QuizCardProps {
    quiz: Quiz
    onEdit: () => void
    onDelete: () => void
    onPublishToggle: () => void
    onDuplicate: () => void
    onViewAnalytics: () => void
    onAddQuestion: () => void
    onEditQuestion: (question: any) => void
    onDeleteQuestion: (question: any) => void
    onMoveQuestionUp: (question: any) => void
    onMoveQuestionDown: (question: any) => void
}

function QuizCard({
    quiz,
    onEdit,
    onDelete,
    onPublishToggle,
    onDuplicate,
    onViewAnalytics,
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
    onMoveQuestionUp,
    onMoveQuestionDown,
}: QuizCardProps) {
    return (
        <Card className="border-gray-700 bg-gray-800 hover:bg-gray-750 transition-colors">
            <CardContent className="pt-6">
                <div className="flex items-start justify-between gap-4">
                    {/* Quiz Info */}
                    <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">
                                {quiz.title}
                            </h3>
                            {quiz.isPublished ? (
                                <Badge className="bg-green-600 text-white">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Công khai
                                </Badge>
                            ) : (
                                <Badge className="bg-yellow-600 text-white">
                                    Nháp
                                </Badge>
                            )}
                        </div>

                        {quiz.description && (
                            <p className="text-sm text-gray-400 mb-3 line-clamp-2">
                                {quiz.description}
                            </p>
                        )}

                        {/* Quiz Meta */}
                        <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                            <span>
                                <span className="font-semibold text-white">
                                    {Array.isArray(quiz.questions) ? quiz.questions.length : 0}
                                </span>{' '}
                                câu hỏi
                            </span>
                            <span>
                                Điểm đạt:{' '}
                                <span className="font-semibold text-white">
                                    {quiz.passingScore}%
                                </span>
                            </span>
                        </div>

                        {/* Questions & Answers */}
                        {Array.isArray(quiz.questions) && quiz.questions.length > 0 && (
                            <div className="mt-4 space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-gray-300 font-semibold">Câu hỏi & đáp án</p>
                                    <Button size="sm" variant="secondary" onClick={onAddQuestion}>Thêm câu hỏi</Button>
                                </div>
                                <div className="space-y-2">
                                    {quiz.questions.map((q: any, idx: number) => (
                                        <div key={q.id ?? idx} className="rounded-md border border-gray-700 bg-gray-750 p-3">
                                            <div className="text-white font-medium mb-2">
                                                {idx + 1}. {q.question}
                                            </div>
                                            {q.type === 'true_false' ? (
                                                <ul className="space-y-1">
                                                    {[
                                                        { label: 'Đúng', value: 1 },
                                                        { label: 'Sai', value: 0 },
                                                    ].map((item, optIdx) => {
                                                        const isCorrect = Number(q.correctAnswer) === item.value
                                                        return (
                                                            <li key={item.label} className="flex items-center gap-2 text-sm">
                                                                <span className={`${isCorrect ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'} px-2 py-1 rounded-md`}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span className="text-gray-200 flex-1">{item.label}</span>
                                                                {isCorrect && (
                                                                    <Badge className="ml-2 bg-green-600 text-white">Đáp án đúng</Badge>
                                                                )}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            ) : null}
                                            {q.type !== 'true_false' && Array.isArray(q.options) && q.options.length > 0 && (
                                                <ul className="space-y-1">
                                                    {q.options.map((opt: string, optIdx: number) => {
                                                        const isCorrect = q.correctAnswer === optIdx;
                                                        return (
                                                            <li key={optIdx} className="flex items-center gap-2 text-sm">
                                                                <span className={`${isCorrect ? 'bg-green-700 text-white' : 'bg-gray-700 text-gray-200'} px-2 py-1 rounded-md`}>
                                                                    {String.fromCharCode(65 + optIdx)}
                                                                </span>
                                                                <span className="text-gray-200 flex-1">{opt}</span>
                                                                {isCorrect && (
                                                                    <Badge className="ml-2 bg-green-600 text-white">Đáp án đúng</Badge>
                                                                )}
                                                            </li>
                                                        )
                                                    })}
                                                </ul>
                                            )}
                                            {(!q.options || q.options.length === 0) && q.type === 'short_answer' && q.correctAnswer && (
                                                <div className="text-sm text-gray-200 bg-gray-750 rounded-md p-2 inline-block">
                                                    Đáp án: <span className="font-semibold text-white">{q.correctAnswer}</span>
                                                </div>
                                            )}
                                            <div className="mt-2 flex items-center justify-between">
                                                {q.explanation ? (
                                                    <div className="text-xs text-gray-400">Giải thích: {q.explanation}</div>
                                                ) : <div />}
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onMoveQuestionUp(q)}
                                                        disabled={idx === 0}
                                                    >
                                                        <ChevronUp className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => onMoveQuestionDown(q)}
                                                        disabled={idx === (Array.isArray(quiz.questions) ? quiz.questions.length - 1 : 0)}
                                                    >
                                                        <ChevronDown className="h-4 w-4" />
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => onDeleteQuestion(q)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Xóa
                                                    </Button>
                                                    <Button size="sm" variant="outline" onClick={() => onEditQuestion(q)}>
                                                        <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(!Array.isArray(quiz.questions) || quiz.questions.length === 0) && (
                            <div className="mt-4">
                                <Button size="sm" variant="secondary" onClick={onAddQuestion}>Thêm câu hỏi</Button>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-gray-400 hover:text-white hover:bg-gray-700"
                            >
                                <MoreVertical className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="bg-gray-700 border-gray-600">
                            <DropdownMenuLabel className="text-gray-400">
                                Hành động
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-gray-600" />
                            <DropdownMenuItem
                                onClick={onEdit}
                                className="text-gray-100 cursor-pointer hover:bg-gray-600"
                            >
                                <Edit className="h-4 w-4 mr-2" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onViewAnalytics}
                                className="text-gray-100 cursor-pointer hover:bg-gray-600"
                            >
                                <Eye className="h-4 w-4 mr-2" />
                                Xem analytics
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onPublishToggle}
                                className="text-gray-100 cursor-pointer hover:bg-gray-600"
                            >
                                {quiz.isPublished ? 'Ẩn' : 'Công khai'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDuplicate}
                                className="text-gray-100 cursor-pointer hover:bg-gray-600"
                            >
                                <Copy className="h-4 w-4 mr-2" />
                                Nhân bản
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-gray-600" />
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-red-400 cursor-pointer hover:bg-gray-600 focus:bg-gray-600 focus:text-red-400"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Xóa
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </CardContent>
        </Card>
    )
}

/**
 * Stats Card Component
 */
interface StatsCardProps {
    label: string
    value: string
}

function StatsCard({ label, value }: StatsCardProps) {
    return (
        <Card className="border-gray-700 bg-gray-800">
            <CardContent className="pt-6">
                <p className="text-gray-400 text-sm mb-2">{label}</p>
                <p className="text-3xl font-bold text-white">{value}</p>
            </CardContent>
        </Card>
    )
}
