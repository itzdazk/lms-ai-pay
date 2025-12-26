import { useState, useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
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

interface QuizzesPageState {
    showCreateDialog: boolean
    selectedQuiz: Quiz | null
    deletingQuizzId: number | null
}

export function QuizzesPage() {
    const { user } = useAuth()
    const navigate = useNavigate()
    const { lessonId } = useParams<{ lessonId: string }>()
    const numLessonId = lessonId ? parseInt(lessonId) : null

    // State
    const [pageState, setPageState] = useState<QuizzesPageState>({
        showCreateDialog: false,
        selectedQuiz: null,
        deletingQuizzId: null,
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
    const handleCreateQuiz = () => {
        setPageState((prev) => ({
            ...prev,
            showCreateDialog: true,
            selectedQuiz: null,
        }))
    }

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

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-4 md:p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                            Quản lý Quiz
                        </h1>
                        <p className="text-gray-400">
                            Quản lý quiz cho bài học của bạn
                        </p>
                    </div>
                    <Button
                        onClick={handleCreateQuiz}
                        className="flex items-center gap-2"
                    >
                        <Plus className="h-5 w-5" />
                        Tạo Quiz Mới
                    </Button>
                </div>

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

                {/* Loading State */}
                {loading && (
                    <div className="flex items-center justify-center py-12 text-gray-400">
                        <Loader2 className="h-5 w-5 animate-spin mr-2" />
                        <span>Đang tải quiz...</span>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <Card className="border-red-500 bg-red-50">
                        <CardContent className="pt-6">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                                <div>
                                    <p className="font-semibold text-red-600">
                                        Lỗi tải dữ liệu
                                    </p>
                                    <p className="text-sm text-red-600">
                                        {error.message}
                                    </p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Empty State */}
                {!loading && filteredQuizzes.length === 0 && (
                    <Card className="border-gray-700 bg-gray-800">
                        <CardContent className="pt-12 pb-12 text-center">
                            <div className="mb-4">
                                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto opacity-50" />
                            </div>
                            <p className="text-gray-400 mb-4">
                                {searchQuery
                                    ? 'Không tìm thấy quiz phù hợp'
                                    : 'Chưa có quiz nào. Hãy tạo quiz đầu tiên!'}
                            </p>
                            {!searchQuery && (
                                <Button onClick={handleCreateQuiz} variant="outline">
                                    <Plus className="h-4 w-4 mr-2" />
                                    Tạo Quiz Mới
                                </Button>
                            )}
                        </CardContent>
                    </Card>
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
                            />
                        ))}
                    </div>
                )}

                {/* Stats */}
                {!loading && quizzes.length > 0 && (
                    <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                        <StatsCard
                            label="Tổng quiz"
                            value={quizzes.length.toString()}
                        />
                        <StatsCard
                            label="Quiz công khai"
                            value={quizzes.filter((q) => q.isPublished).length.toString()}
                        />
                        <StatsCard
                            label="Quiz nháp"
                            value={quizzes.filter((q) => !q.isPublished).length.toString()}
                        />
                        <StatsCard
                            label="Tổng câu hỏi"
                            value={quizzes
                                .reduce((sum, q) => sum + (q.questions?.length || 0), 0)
                                .toString()}
                        />
                    </div>
                )}
            </div>

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
        </div>
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
}

function QuizCard({
    quiz,
    onEdit,
    onDelete,
    onPublishToggle,
    onDuplicate,
    onViewAnalytics,
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
                                    {quiz.questions?.length || 0}
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
