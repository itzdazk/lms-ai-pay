import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Badge } from '../../components/ui/badge'
import { DarkOutlineInput } from '../../components/ui/dark-outline-input'
import {
    Plus,
    Loader2,
    MoreVertical,
    Edit,
    Trash2,
    Eye,
    AlertCircle,
    ChevronUp,
    ChevronDown,
    EyeOff,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu'
import { useAuth } from '../../contexts/AuthContext'
import { useQuizzes } from '../../hooks/useQuizzes'
import { instructorQuizzesApi } from '../../lib/api/instructor-quizzes'
import type { Quiz } from '../../lib/api/types'
import { QuizDialog } from '../../components/instructor/QuizDialog'
import { QuestionDialog } from '../../components/instructor/QuestionDialog'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../../components/ui/dialog'

interface QuizzesPageState {
    showCreateDialog: boolean
    selectedQuiz: Quiz | null
    deletingQuizzId: number | null
    showQuestionDialog: boolean
    targetQuizId: number | null
    selectedQuestion: any | null
    showDeleteQuestionDialog: boolean
    questionToDelete: { quiz: Quiz, question: any } | null
};


export function QuizzesPage({ lessonId: propLessonId, lessonTitle }: { lessonId?: number, lessonTitle?: string }) {
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
        showDeleteQuestionDialog: false,
        questionToDelete: null,
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
                quiz.isPublished ? 'Câu hỏi ôn tập đã được ẩn' : 'Câu hỏi ôn tập đã được xuất bản'
            )
        } catch (error) {
            toast.error('Lỗi cập nhật trạng thái câu hỏi ôn tập')
            console.error('Error publishing quiz:', error)
        }
    }

    const handleDeleteQuiz = async (quizId: number) => {
        try {
            await instructorQuizzesApi.deleteQuiz(quizId)
            await refetch()
            toast.success('Câu hỏi ôn tập đã được xóa')
        } catch (error) {
            toast.error('Lỗi xóa câu hỏi ôn tập')
            console.error('Error deleting quiz:', error)
        }
    }

    const handleDeleteClick = async (quizId: number) => {
        const ok = window.confirm('Bạn có chắc muốn xóa quiz này?')
        if (!ok) return
        await handleDeleteQuiz(quizId)
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

    const handleDeleteQuestion = (quiz: Quiz, question: any) => {
        setPageState((prev) => ({
            ...prev,
            showDeleteQuestionDialog: true,
            questionToDelete: { quiz, question },
        }))
    }

    const confirmDeleteQuestion = async () => {
        const { quiz, question } = pageState.questionToDelete || {};
        const questionId = question?.id ?? question?.questionId;
        if (!quiz || !questionId) {
            toast.error('Không xác định được ID câu hỏi — cần lưu câu hỏi trước khi xóa');
            setPageState((prev) => ({ ...prev, showDeleteQuestionDialog: false, questionToDelete: null }));
            return;
        }
        try {
            await instructorQuizzesApi.deleteQuestion(quiz.id, Number(questionId));
            await refetch();
            toast.success('Đã xóa câu hỏi');
        } catch (e: any) {
            const message = e?.response?.data?.message || 'Xóa câu hỏi thất bại';
            toast.error(message);
            console.error('Delete question failed', e);
        } finally {
            setPageState((prev) => ({ ...prev, showDeleteQuestionDialog: false, questionToDelete: null }));
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
                        <p className="text-gray-400">Quản lý câu hỏi cho bài học: <span className="font-semibold text-blue-400">{lessonTitle || '...'}</span></p>
                    </div>
                </CardHeader>
                <CardContent>
                    {/* Search */}
                    <div className="mb-6">
                        <DarkOutlineInput
                            type="text"
                            placeholder="Tìm kiếm câu hỏi..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full px-4 py-2 rounded-lg"
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
                                {searchQuery ? 'Không tìm thấy phù hợp' : 'Bài học này chưa có câu hỏi ôn tập'}
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
            <Dialog open={pageState.showDeleteQuestionDialog} onOpenChange={(open) => !open && setPageState((prev) => ({ ...prev, showDeleteQuestionDialog: false, questionToDelete: null }))}>
                <DialogContent className="bg-[#1A1A1A]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Xác nhận xóa câu hỏi</DialogTitle>
                    </DialogHeader>
                    <div className="py-2 text-gray-300">Bạn có chắc chắn muốn xóa câu hỏi này? Thao tác này không thể hoàn tác.</div>
                    <div className="flex gap-3 mt-4">
                        <button
                            className="flex-1 py-2 rounded bg-gray-700 text-white hover:bg-gray-600"
                            onClick={() => setPageState((prev) => ({ ...prev, showDeleteQuestionDialog: false, questionToDelete: null }))}
                        >
                            Hủy
                        </button>
                        <button
                            className="flex-1 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            onClick={confirmDeleteQuestion}
                        >
                            Xóa câu hỏi
                        </button>
                    </div>
                </DialogContent>
            </Dialog>
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
    onAddQuestion,
    onEditQuestion,
    onDeleteQuestion,
    onMoveQuestionUp,
    onMoveQuestionDown,
}: QuizCardProps) {
    return (
        <Card className="border-gray-700 bg-[#1A1A1A] transition-colors">
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
                                    <Eye className="h-3 w-3 mr-1 text-white" />
                                    Xuất bản
                                </Badge>
                            ) : (
                                <Badge className="bg-gray-500 text-white">
                                    <EyeOff className="h-3 w-3 mr-1 text-white" />
                                    Ẩn
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
                                    <Button variant="blue" onClick={onAddQuestion}>
                                        <Plus className="h-4 w-4 mr-2" />
                                        Thêm câu hỏi
                                        </Button>
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
                                            <div className="mt-2">
                                                {q.explanation ? (
                                                    <div className="text-base text-blue-300 font-semibold bg-[#232b3b] rounded px-3 py-2 mb-2">Giải thích: {q.explanation}</div>
                                                ) : null}
                                                <div className="flex items-center gap-2 justify-end">
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
                                                    <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white" onClick={() => onEditQuestion(q)}>
                                                        <Edit className="h-4 w-4 mr-1" /> Chỉnh sửa
                                                    </Button>
                                                    <Button size="sm" variant="destructive" onClick={() => onDeleteQuestion(q)}>
                                                        <Trash2 className="h-4 w-4 mr-1" /> Xóa
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        {(!Array.isArray(quiz.questions) || quiz.questions.length === 0) && (
                            <div className="mt-4 flex justify-center">
                                <Button variant="blue" onClick={onAddQuestion}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Thêm câu hỏi
                                </Button>
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
                        <DropdownMenuContent className="bg-[#181818] text-white border-[#222]">
                            <DropdownMenuSeparator className="bg-[#222]" />
                            <DropdownMenuItem
                                onClick={onEdit}
                                className="hover:bg-[#222]"
                            >
                                <Edit className="h-4 w-4 mr-2 text-blue-500" />
                                Chỉnh sửa
                            </DropdownMenuItem>
                            
                            <DropdownMenuItem
                                onClick={onPublishToggle}
                                className="hover:bg-[#222]"
                            >
                                {quiz.isPublished ? (
                                    <>
                                        <Eye className="h-4 w-4 mr-2 text-green-400" />Ẩn
                                    </>
                                ) : (
                                    <>
                                        <EyeOff className="h-4 w-4 mr-2 text-gray-400" />Xuất bản
                                    </>
                                )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={onDelete}
                                className="text-red-500 hover:bg-[#222] focus:bg-[#222] focus:text-red-500"
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
