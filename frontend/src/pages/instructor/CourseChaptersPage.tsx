import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { DarkOutlineButton } from '../../components/ui/buttons'
import { Badge } from '../../components/ui/badge'
import { Loader2, Plus, Edit, Trash2, GripVertical, ChevronDown, ChevronRight, Eye, EyeOff, Video, FileText, AlertCircle, RotateCcw, CheckCircle2, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useCourseForm } from '../../contexts/CourseFormContext'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog'
import { ChapterForm } from '../../components/instructor/ChapterForm'
import { LessonForm } from '../../components/instructor/LessonForm'
import { chaptersApi } from '../../lib/api/chapters'
import { instructorLessonsApi } from '../../lib/api/instructor-lessons'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import type { Chapter, Lesson, Course, CreateChapterRequest, UpdateChapterRequest, CreateLessonRequest, UpdateLessonRequest } from '../../lib/api/types'

// Helper function to format video duration (seconds to MM:SS or HH:MM:SS)
const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds === 0) return '--:--'
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    if (hours > 0) {
        return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`
}

export function CourseChaptersPage() {
    const { user: currentUser, loading: authLoading } = useAuth()
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const courseId = id ? parseInt(id) : 0

    const [course, setCourse] = useState<Course | null>(null)
    const [chapters, setChapters] = useState<Chapter[]>([])
    const [loading, setLoading] = useState(true)
    const [expandedChapters, setExpandedChapters] = useState<Set<number>>(new Set())
    const [draggedChapterId, setDraggedChapterId] = useState<number | null>(null)
    const [draggedLessonId, setDraggedLessonId] = useState<number | null>(null)
    const [draggedLessonChapterId, setDraggedLessonChapterId] = useState<number | null>(null)

    // Local state for drag and drop changes
    const [localChapters, setLocalChapters] = useState<Chapter[]>([])
    const { hasChanges: hasUnsavedChanges, setHasChanges: setHasUnsavedChanges } = useCourseForm()


    // Dialogs
    const [showChapterDialog, setShowChapterDialog] = useState(false)
    const [showLessonDialog, setShowLessonDialog] = useState(false)
    const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false)
    const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false)
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null)
    const [deletingLesson, setDeletingLesson] = useState<{ lesson: Lesson; chapterId: number } | null>(null)
    const [selectedChapterId, setSelectedChapterId] = useState<number | null>(null)
    const [submitting, setSubmitting] = useState(false)

    useEffect(() => {
        if (authLoading) return

        if (!currentUser) {
            navigate('/login')
            return
        }

        if (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
            navigate('/dashboard')
            return
        }
    }, [currentUser, authLoading, navigate])

    useEffect(() => {
        if (courseId) {
            loadData()
        }
        // Reset state when courseId changes
        return () => {
            setHasUnsavedChanges(false)
        }
    }, [courseId])

    const loadData = async () => {
        if (!courseId) return

        try {
            setLoading(true)
            const [courseData, chaptersData] = await Promise.all([
                instructorCoursesApi.getInstructorCourseById(String(courseId)),
                chaptersApi.getChaptersByCourse(courseId, true), // Include lessons
            ])

            setCourse(courseData)
            setChapters(chaptersData)
            setLocalChapters(chaptersData)
            setHasUnsavedChanges(false)
            // Expand all chapters by default
            setExpandedChapters(new Set(chaptersData.map((ch) => ch.id)))
        } catch (error: any) {
            console.error('Error loading data:', error)
            toast.error('Không thể tải dữ liệu')
            navigate('/instructor/dashboard')
        } finally {
            setLoading(false)
        }
    }

    const toggleChapter = (chapterId: number) => {
        setExpandedChapters((prev) => {
            const newSet = new Set(prev)
            if (newSet.has(chapterId)) {
                newSet.delete(chapterId)
            } else {
                newSet.add(chapterId)
            }
            return newSet
        })
    }

    // Chapter handlers
    const handleCreateChapter = () => {
        setEditingChapter(null)
        setSelectedChapterId(null)
        setShowChapterDialog(true)
    }

    const handleEditChapter = (chapter: Chapter) => {
        setEditingChapter(chapter)
        setSelectedChapterId(null)
        setShowChapterDialog(true)
    }

    const handleDeleteChapter = (chapter: Chapter) => {
        setDeletingChapter(chapter)
        setShowDeleteChapterDialog(true)
    }

    const handleChapterSubmit = async (data: CreateChapterRequest | UpdateChapterRequest) => {
        if (!courseId) return

        try {
            setSubmitting(true)
            if (editingChapter) {
                await chaptersApi.updateChapter(editingChapter.id, data as UpdateChapterRequest)
                toast.success('Cập nhật chapter thành công!')
            } else {
                await chaptersApi.createChapter(courseId, data as CreateChapterRequest)
                toast.success('Tạo chapter thành công!')
            }
            setShowChapterDialog(false)
            setEditingChapter(null)
            await loadData()
        } catch (error: any) {
            console.error('Error submitting chapter:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setSubmitting(false)
        }
    }

    const handleChapterDelete = async () => {
        if (!deletingChapter || !courseId) return

        try {
            setSubmitting(true)
            await chaptersApi.deleteChapter(deletingChapter.id)
            toast.success('Xóa chapter thành công!')
            setShowDeleteChapterDialog(false)
            setDeletingChapter(null)
            await loadData()
        } catch (error: any) {
            console.error('Error deleting chapter:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setSubmitting(false)
        }
    }

    // Lesson handlers
    const handleCreateLesson = (chapterId: number) => {
        setEditingLesson(null)
        setSelectedChapterId(chapterId)
        setShowLessonDialog(true)
    }

    const handleEditLesson = (lesson: Lesson, chapterId: number) => {
        setEditingLesson(lesson)
        setSelectedChapterId(chapterId)
        setShowLessonDialog(true)
    }

    const handleDeleteLesson = (lesson: Lesson, chapterId: number) => {
        setDeletingLesson({ lesson, chapterId })
        setShowDeleteLessonDialog(true)
    }

    const handleLessonSubmit = async (
        data: CreateLessonRequest | UpdateLessonRequest,
        videoFile?: File,
        transcriptFile?: File
    ) => {
        if (!courseId || !selectedChapterId) return

        try {
            setSubmitting(true)

            if (editingLesson) {
                // Update lesson
                const updateData = { ...data, chapterId: selectedChapterId } as UpdateLessonRequest
                await instructorLessonsApi.updateLesson(courseId, editingLesson.id, updateData)

                // Upload video if provided
                if (videoFile) {
                    await instructorLessonsApi.uploadVideo(courseId, editingLesson.id, videoFile)
                }

                // Upload transcript if provided
                if (transcriptFile) {
                    await instructorLessonsApi.uploadTranscript(courseId, editingLesson.id, transcriptFile)
                }

                toast.success('Cập nhật bài học thành công!')
            } else {
                // Create lesson
                const createData = { ...data, courseId, chapterId: selectedChapterId } as CreateLessonRequest
                console.log('Creating lesson with data:', createData)
                const newLesson = await instructorLessonsApi.createLesson(courseId, createData)

                // Upload video if provided
                if (videoFile) {
                    await instructorLessonsApi.uploadVideo(courseId, newLesson.id, videoFile)
                }

                // Upload transcript if provided
                if (transcriptFile) {
                    await instructorLessonsApi.uploadTranscript(courseId, newLesson.id, transcriptFile)
                }

                toast.success('Tạo bài học thành công!')
            }

            setShowLessonDialog(false)
            setEditingLesson(null)
            setSelectedChapterId(null)
            await loadData()
        } catch (error: any) {
            console.error('Error submitting lesson:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setSubmitting(false)
        }
    }

    const handleLessonDelete = async () => {
        if (!deletingLesson || !courseId) return

        try {
            setSubmitting(true)
            await instructorLessonsApi.deleteLesson(courseId, deletingLesson.lesson.id)
            toast.success('Xóa bài học thành công!')
            setShowDeleteLessonDialog(false)
            setDeletingLesson(null)
            await loadData()
        } catch (error: any) {
            console.error('Error deleting lesson:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setSubmitting(false)
        }
    }

    const handlePublishLesson = async (lesson: Lesson, isPublished: boolean) => {
        if (!courseId) return

        try {
            await instructorLessonsApi.publishLesson(courseId, lesson.id, isPublished)
            toast.success(isPublished ? 'Đã xuất bản bài học' : 'Đã ẩn bài học')
            await loadData()
        } catch (error: any) {
            console.error('Error publishing lesson:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    // Drag and drop handlers
    const handleChapterDragStart = (e: React.DragEvent, chapterId: number) => {
        setDraggedChapterId(chapterId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleChapterDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    const handleChapterDrop = (e: React.DragEvent, targetChapterId: number) => {
        e.preventDefault()
        if (!draggedChapterId || draggedChapterId === targetChapterId) return

        const draggedIndex = localChapters.findIndex((ch) => ch.id === draggedChapterId)
        const targetIndex = localChapters.findIndex((ch) => ch.id === targetChapterId)

        if (draggedIndex === -1 || targetIndex === -1) return

        // Reorder chapters locally
        const newChapters = [...localChapters]
        const [removed] = newChapters.splice(draggedIndex, 1)
        newChapters.splice(targetIndex, 0, removed)

        // Update chapterOrder values
        const updatedChapters = newChapters.map((chapter, index) => ({
            ...chapter,
            chapterOrder: index + 1
        }))

        setLocalChapters(updatedChapters)
        setHasUnsavedChanges(true)
        setDraggedChapterId(null)
    }

    const handleLessonDragStart = (e: React.DragEvent, lessonId: number, chapterId: number) => {
        setDraggedLessonId(lessonId)
        setDraggedLessonChapterId(chapterId)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleLessonDragOver = (e: React.DragEvent) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
    }

    // Save drag and drop changes to backend
    const handleSaveChanges = async () => {
        if (!courseId || !hasUnsavedChanges) return

        try {
            setSubmitting(true)

            // Check if chapters order has changed
            const chaptersChanged = localChapters.some((localChapter) => {
                const originalChapter = chapters.find(ch => ch.id === localChapter.id)
                return originalChapter && originalChapter.chapterOrder !== localChapter.chapterOrder
            })

            if (chaptersChanged) {
                // Reorder chapters
                const chapterIds = localChapters.map(ch => ch.id)
                await chaptersApi.reorderChapters(courseId, chapterIds)
            }

            // For each chapter, reorder lessons if they have changed
            for (const chapter of localChapters) {
                const originalChapter = chapters.find(ch => ch.id === chapter.id)
                if (!originalChapter || !chapter.lessons) continue

                // Check if lessons in this chapter have changed order
                const lessonsChanged = chapter.lessons.some(localLesson => {
                    const originalLesson = originalChapter.lessons?.find(l => l.id === localLesson.id)
                    return originalLesson && originalLesson.lessonOrder !== localLesson.lessonOrder
                })

                if (lessonsChanged && chapter.lessons.length > 0) {
                    // Get lesson IDs in new order
                    const lessonIds = chapter.lessons
                        .sort((a, b) => a.lessonOrder - b.lessonOrder)
                        .map(lesson => lesson.id)

                    // Call reorder API for this chapter
                    await instructorLessonsApi.reorderLessons(courseId, chapter.id, lessonIds)
                }
            }

            toast.success('Đã lưu tất cả thay đổi')
            setHasUnsavedChanges(false)
            await loadData()
        } catch (error: any) {
            console.error('Error saving changes:', error)
            toast.error('Không thể lưu thay đổi')
        } finally {
            setSubmitting(false)
        }
    }

    // Reset drag and drop changes
    const handleResetChanges = () => {
        setLocalChapters(chapters)
        setHasUnsavedChanges(false)
        toast.info('Đã hủy bỏ thay đổi')
    }

    // Get all lesson IDs that have changed order in a chapter (for highlighting swapped lessons)
    const getSwappedLessonIds = (chapterId: number): Set<number> => {
        const swappedIds = new Set<number>()

        if (!hasUnsavedChanges) return swappedIds

        const originalChapter = chapters.find(ch => ch.id === chapterId)
        const localChapter = localChapters.find(ch => ch.id === chapterId)

        if (!originalChapter || !localChapter || !originalChapter.lessons || !localChapter.lessons) {
            return swappedIds
        }

        // Find all lessons that have changed order compared to original data
        // Use a Map to track original orders
        const originalOrderMap = new Map<number, number>()
        originalChapter.lessons.forEach(lesson => {
            originalOrderMap.set(lesson.id, lesson.lessonOrder)
        })

        // Check current local orders against original
        localChapter.lessons.forEach(localLesson => {
            const originalOrder = originalOrderMap.get(localLesson.id)
            if (originalOrder !== undefined && originalOrder !== localLesson.lessonOrder) {
                swappedIds.add(localLesson.id)
            }
        })

        return swappedIds
    }

    // Check if chapter order has changed
    const hasChapterOrderChanged = (chapterId: number): boolean => {
        if (!hasUnsavedChanges) return false

        const originalChapter = chapters.find(ch => ch.id === chapterId)
        const localChapter = localChapters.find(ch => ch.id === chapterId)

        if (!originalChapter || !localChapter) return false

        return originalChapter.chapterOrder !== localChapter.chapterOrder
    }

    const handleLessonDrop = (e: React.DragEvent, targetLessonId: number, targetChapterId: number) => {
        e.preventDefault()
        if (!draggedLessonId || !draggedLessonChapterId || draggedLessonId === targetLessonId) return

        const sourceChapter = localChapters.find((ch) => ch.id === draggedLessonChapterId)
        const targetChapter = localChapters.find((ch) => ch.id === targetChapterId)

        if (!sourceChapter || !sourceChapter.lessons || !targetChapter || !targetChapter.lessons) return

        const draggedLesson = sourceChapter.lessons.find((l) => l.id === draggedLessonId)
        const targetLesson = targetChapter.lessons.find((l) => l.id === targetLessonId)

        if (!draggedLesson || !targetLesson) return

        // Reorder within same chapter only for now
        if (draggedLessonChapterId === targetChapterId) {
            // Sort lessons by order to get correct sequence
            const sortedLessons = [...targetChapter.lessons].sort((a, b) => a.lessonOrder - b.lessonOrder)
            const draggedIndex = sortedLessons.findIndex((l) => l.id === draggedLessonId)
            const targetIndex = sortedLessons.findIndex((l) => l.id === targetLessonId)

            if (draggedIndex === -1 || targetIndex === -1) return

            // Create new lesson order locally
            console.log('Before reorder:', sortedLessons.map(l => ({ id: l.id, order: l.lessonOrder })))

            const newLessons = [...sortedLessons]
            const [removed] = newLessons.splice(draggedIndex, 1)

            // Insert at new position - always insert at targetIndex (replace)
            newLessons.splice(targetIndex, 0, removed)

            // Update lessonOrder values for all lessons in this chapter
            const updatedLessons = newLessons.map((lesson, index) => ({
                ...lesson,
                lessonOrder: index + 1
            }))

            console.log('After reorder:', updatedLessons.map(l => ({ id: l.id, order: l.lessonOrder })))

            // Verify no duplicate orders
            const orders = updatedLessons.map(l => l.lessonOrder)
            const uniqueOrders = new Set(orders)
            if (orders.length !== uniqueOrders.size) {
                console.error('Duplicate lesson orders detected!', orders)
            }

            // Update local chapters state
            const updatedChapters = localChapters.map(chapter =>
                chapter.id === targetChapterId
                    ? { ...chapter, lessons: updatedLessons }
                    : chapter
            )

            setLocalChapters(updatedChapters)
            setHasUnsavedChanges(true)
        } else {
            // Moving lesson between chapters - not implemented yet
            toast.info('Chức năng di chuyển bài học giữa các chapter chưa được hỗ trợ')
        }

        setDraggedLessonId(null)
        setDraggedLessonChapterId(null)
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!course) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <p className="text-gray-400 mb-4">Khóa học không tồn tại</p>
                    <DarkOutlineButton onClick={() => navigate('/instructor/dashboard')}>
                        Dashboard
                    </DarkOutlineButton>
                </div>
            </div>
        )
    }

    return (
        <>
        <Card className="bg-[#1A1A1A] border-[#2D2D2D] py-4">
                <CardHeader>
                    <div>
                        <CardTitle className="text-white text-2xl mb-2">
                            Quản lý chương và bài học
                        </CardTitle>
                        <p className="text-gray-400">{course.title}</p>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Display empty state if no chapters */}
                        {chapters.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">Chưa có chapter nào</p>
                            </div>
                        )}

                        {/* Display chapters */}
                        {localChapters.map((chapter) => (
                                <div
                                    key={chapter.id}
                                    className={`bg-[#1F1F1F] border rounded-lg overflow-hidden transition-colors ${
                                        hasChapterOrderChanged(chapter.id)
                                            ? 'border-green-500 bg-green-500/5'
                                            : 'border-[#2D2D2D]'
                                    }`}
                                    draggable
                                    onDragStart={(e) => handleChapterDragStart(e, chapter.id)}
                                    onDragOver={handleChapterDragOver}
                                    onDrop={(e) => handleChapterDrop(e, chapter.id)}
                                >
                                    <div className="flex items-center gap-3 p-4 hover:bg-[#252525] transition-colors">
                                        <span title="Kéo để sắp xếp chapter">
                                            <GripVertical className="h-5 w-5 text-gray-500 cursor-move" />
                                        </span>
                                        <button
                                            onClick={() => toggleChapter(chapter.id)}
                                            className="flex items-center gap-2 flex-1 text-left"
                                        >
                                            {expandedChapters.has(chapter.id) ? (
                                                <ChevronDown className="h-4 w-4 text-gray-400" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400" />
                                            )}
                                            <span className="text-blue-500 font-semibold text-sm mr-2">#{chapter.chapterOrder}</span>
                                            <span className="text-white font-medium">{chapter.title}</span>
                                            <Badge variant="outline" className="text-gray-400">
                                                {chapter.lessonsCount || chapter.lessons?.length || 0} bài học
                                            </Badge>
                                        </button>
                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleEditChapter(chapter)}
                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                title="Chỉnh sửa chapter"
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleDeleteChapter(chapter)}
                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                title="Xóa chapter"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => handleCreateLesson(chapter.id)}
                                                className="text-green-500 hover:text-green-600 hover:bg-green-500/10"
                                                title="Tạo bài học mới"
                                            >
                                                <Plus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {expandedChapters.has(chapter.id) && chapter.lessons && (
                                        <div className="border-t border-[#2D2D2D] p-4 space-y-2">
                                            {chapter.lessons.length === 0 ? (
                                                <div className="text-center py-4">
                                                    <p className="text-gray-500 text-sm">Chưa có bài học nào</p>
                                                </div>
                                            ) : (
                                                (() => {
                                                    const swappedLessonIds = getSwappedLessonIds(chapter.id)
                                                    return chapter.lessons.map((lesson) => (
                                                        <div
                                                            key={lesson.id}
                                                            className={`flex items-center gap-3 p-3 bg-[#1A1A1A] border rounded-lg transition-colors ${
                                                                draggedLessonId === lesson.id
                                                                    ? 'border-blue-500 bg-blue-500/10 shadow-lg'
                                                                    : swappedLessonIds.has(lesson.id)
                                                                    ? 'border-green-500 bg-green-500/10'
                                                                    : 'border-[#2D2D2D] hover:bg-[#252525]'
                                                            }`}
                                                            draggable
                                                            onDragStart={(e) => handleLessonDragStart(e, lesson.id, chapter.id)}
                                                            onDragOver={handleLessonDragOver}
                                                            onDrop={(e) => handleLessonDrop(e, lesson.id, chapter.id)}
                                                        >
                                                        <span title="Kéo để sắp xếp bài học">
                                                            <GripVertical className="h-4 w-4 text-gray-500 cursor-move" />
                                                        </span>
                                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                                            {lesson.videoUrl ? (
                                                                <Video className="h-4 w-4 text-blue-500 flex-shrink-0" />
                                                            ) : (
                                                                <FileText className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                                            )}
                                                            <span className="text-blue-500 font-semibold text-sm mr-2 flex-shrink-0">#{lesson.lessonOrder}</span>
                                                            <span className="text-white text-sm truncate">{lesson.title}</span>
                                                            {lesson.isPreview && (
                                                                <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500 flex-shrink-0">
                                                                    Preview
                                                                </Badge>
                                                            )}
                                                            {!lesson.isPublished && (
                                                                <Badge variant="outline" className="text-xs text-gray-500 border-gray-500 flex-shrink-0">
                                                                    Draft
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        {/* Video info - Right side */}
                                                        <div className="flex items-center gap-4 flex-shrink-0 mr-2">
                                                            {/* Video duration */}
                                                            <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap min-w-[3rem] justify-end">
                                                                {lesson.videoDuration && lesson.videoDuration > 0 ? (
                                                                    <>
                                                                        <Clock className="h-3 w-3 flex-shrink-0" />
                                                                        <span>{formatDuration(lesson.videoDuration)}</span>
                                                                    </>
                                                                ) : null}
                                                            </div>
                                                            {/* Transcript status */}
                                                            <div className="flex items-center gap-1 text-xs whitespace-nowrap min-w-[4rem] sm:min-w-[5rem] justify-end">
                                                                {lesson.transcriptJsonUrl ? (
                                                                    <div className="flex items-center gap-1 text-green-400" title="Đã có transcript">
                                                                        <CheckCircle2 className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="hidden sm:inline">Transcript</span>
                                                                    </div>
                                                                ) : lesson.videoUrl ? (
                                                                    <div className="flex items-center gap-1 text-gray-500" title="Chưa có transcript">
                                                                        <FileText className="h-3 w-3 flex-shrink-0" />
                                                                        <span className="hidden sm:inline">Chưa có</span>
                                                                    </div>
                                                                ) : null}
                                                            </div>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handlePublishLesson(lesson, !lesson.isPublished)}
                                                                className={lesson.isPublished ? "text-green-500 hover:text-green-600 hover:bg-green-500/10" : "text-gray-500 hover:text-gray-400 hover:bg-gray-500/10"}
                                                                title={lesson.isPublished ? "Ẩn bài học" : "Xuất bản bài học"}
                                                            >
                                                                {lesson.isPublished ? (
                                                                    <Eye className="h-4 w-4" />
                                                                ) : (
                                                                    <EyeOff className="h-4 w-4" />
                                                                )}
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleEditLesson(lesson, chapter.id)}
                                                                className="text-blue-500 hover:text-blue-600 hover:bg-blue-500/10"
                                                                title="Chỉnh sửa bài học"
                                                            >
                                                                <Edit className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() => handleDeleteLesson(lesson, chapter.id)}
                                                                className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                                                title="Xóa bài học"
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                    ))
                                                })()
                                            )}

                                            {/* Add lesson button at the end */}
                                            <div className="flex justify-center pt-2 pb-1">
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleCreateLesson(chapter.id)}
                                                    className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                                    title="Tạo bài học mới"
                                                >
                                                    <Plus className="h-4 w-4 mr-2" />
                                                    Tạo Bài học
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}

                        {/* Create Chapter Button - Always visible */}
                        <div className="flex justify-center pt-4 pb-2">
                            <Button
                                onClick={handleCreateChapter}
                                className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                                title="Tạo chapter mới"
                            >
                                <Plus className="h-4 w-4 mr-2" />
                                Tạo Chương
                            </Button>
                        </div>

                        {/* Save/Cancel Buttons - Always visible */}
                        <div className="sticky bottom-0 bg-[#1A1A1A]/95 backdrop-blur-sm border-t border-[#2D2D2D] mt-6 -mb-6 -mx-6 px-6 py-4">
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 sm:gap-4">
                                {/* Change indicator - Left aligned (only when has changes) */}
                                {hasUnsavedChanges && (
                                    <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg mr-auto">
                                        <AlertCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                                        <span className="text-sm text-green-500 font-medium whitespace-nowrap">Có thay đổi chưa lưu</span>
                                    </div>
                                )}
                                
                                {/* Action Buttons - Right aligned */}
                                <div className="flex items-center justify-end gap-2 sm:gap-3 flex-wrap sm:flex-nowrap">
                                    <DarkOutlineButton
                                        onClick={handleResetChanges}
                                        disabled={submitting || !hasUnsavedChanges}
                                        className="flex items-center gap-2 flex-shrink-0"
                                    >
                                        <RotateCcw className="h-4 w-4" />
                                        Hủy bỏ
                                    </DarkOutlineButton>
                                    <Button
                                        onClick={handleSaveChanges}
                                        disabled={submitting || !hasUnsavedChanges}
                                        className="bg-blue-600 hover:bg-blue-700 text-white flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        {submitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                Đang lưu...
                                            </>
                                        ) : (
                                            <>
                                                Lưu thay đổi
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Chapter Dialog */}
            <Dialog open={showChapterDialog} onOpenChange={setShowChapterDialog}>
                <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            {editingChapter ? 'Chỉnh sửa Chapter' : 'Tạo Chapter mới'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {editingChapter
                                ? 'Cập nhật thông tin chapter'
                                : 'Nhập thông tin để tạo chapter mới'}
                        </DialogDescription>
                    </DialogHeader>
                    <ChapterForm
                        chapter={editingChapter}
                        courseId={courseId}
                        onSubmit={handleChapterSubmit}
                        onCancel={() => {
                            setShowChapterDialog(false)
                            setEditingChapter(null)
                        }}
                        loading={submitting}
                    />
                </DialogContent>
            </Dialog>

            {/* Lesson Dialog */}
            <Dialog open={showLessonDialog} onOpenChange={setShowLessonDialog}>
                <DialogContent 
                    className="bg-[#1A1A1A] border-[#2D2D2D] max-h-[95vh] flex flex-col p-0 sm:max-w-4xl w-[95vw]"
                >
                    <DialogHeader className="px-8 pt-6 pb-4 flex-shrink-0">
                        <DialogTitle className="text-white">
                            {editingLesson ? 'Chỉnh sửa Bài học' : 'Tạo Bài học mới'}
                        </DialogTitle>
                        <DialogDescription className="text-gray-400">
                            {editingLesson
                                ? 'Cập nhật thông tin bài học'
                                : 'Nhập thông tin để tạo bài học mới'}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto px-8 custom-scrollbar">
                        {selectedChapterId && (
                            <LessonForm
                                lesson={editingLesson}
                                courseId={courseId}
                                chapterId={selectedChapterId ?? undefined}
                                onSubmit={handleLessonSubmit}
                                onCancel={() => {
                                    setShowLessonDialog(false)
                                    setEditingLesson(null)
                                    setSelectedChapterId(null)
                                }}
                                loading={submitting}
                            />
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Delete Chapter Dialog */}
            <Dialog open={showDeleteChapterDialog} onOpenChange={setShowDeleteChapterDialog}>
                <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Xóa Chapter</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Bạn có chắc chắn muốn xóa chapter "{deletingChapter?.title}"? Tất cả bài học trong chapter này cũng sẽ bị xóa.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setShowDeleteChapterDialog(false)
                                setDeletingChapter(null)
                            }}
                            disabled={submitting}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={handleChapterDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Lesson Dialog */}
            <Dialog open={showDeleteLessonDialog} onOpenChange={setShowDeleteLessonDialog}>
                <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <DialogHeader>
                        <DialogTitle className="text-white">Xóa Bài học</DialogTitle>
                        <DialogDescription className="text-gray-400">
                            Bạn có chắc chắn muốn xóa bài học "{deletingLesson?.lesson.title}"?
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DarkOutlineButton
                            onClick={() => {
                                setShowDeleteLessonDialog(false)
                                setDeletingLesson(null)
                            }}
                            disabled={submitting}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            onClick={handleLessonDelete}
                            disabled={submitting}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang xóa...
                                </>
                            ) : (
                                'Xóa'
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    )
}

