import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { AlertCircle, BookOpen, ChevronRight, Loader2, Video, FileText , ListOrdered, Eye, EyeOff, Clock } from 'lucide-react'
// Format seconds to H:mm:ss or m:ss
function formatDuration(seconds: number) {
    if (!seconds || isNaN(seconds)) return '0:00'
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    if (h > 0) return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    return `${m}:${s.toString().padStart(2, '0')}`
}
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import { chaptersApi } from '../../lib/api/chapters'
import type { Chapter, Course, Lesson } from '../../lib/api/types'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { QuizzesPage } from './QuizzesPage'
import { DarkOutlineInput } from '../../components/ui/dark-outline-input'


export function CourseQuizzesPage() {
    interface CourseStructureState {
        course: Course | null
        chapters: Chapter[]
        loading: boolean
        error: string | null
        filter: 'all' | 'published'
        search: string
    }

    const { courseId: courseIdParam, id: fallbackId } = useParams<{ courseId?: string; id?: string }>()
    const courseId = courseIdParam || fallbackId

    // Track which lesson's quiz management is open
    const [openLessonQuiz, setOpenLessonQuiz] = useState<number | null>(null)

    const [state, setState] = useState<CourseStructureState>({
        course: null,
        chapters: [],
        loading: true,
        error: null,
        filter: 'all',
        search: '',
    })
    // Track expanded chapters by id, persist in localStorage by courseId
    const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => {
        if (!courseId) return new Set()
        try {
            const key = `course_${courseId}_expanded_quiz_chapters`
            const saved = localStorage.getItem(key)
            if (saved) {
                const ids = JSON.parse(saved)
                return new Set(ids)
            }
        } catch {}
        return new Set()
    })

    // Save expandedChapters to localStorage when it changes
    useEffect(() => {
        if (!courseId) return
        try {
            const key = `course_${courseId}_expanded_quiz_chapters`
            localStorage.setItem(key, JSON.stringify(Array.from(expandedChapters)))
        } catch {}
    }, [expandedChapters, courseId])

    // Toggle expand/collapse for a chapter
    const handleToggleChapter = (chapterId: number) => {
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

    useEffect(() => {
        if (!courseId) return

        const fetchData = async () => {
            try {
                setState((s) => ({ ...s, loading: true, error: null }))
                const [course, chapters] = await Promise.all([
                    instructorCoursesApi.getInstructorCourseById(courseId),
                    chaptersApi.getChaptersByCourse(Number(courseId), true),
                ])
                setState((s) => ({
                    ...s,
                    course,
                    chapters: chapters.sort((a, b) => a.chapterOrder - b.chapterOrder),
                    loading: false,
                }))
            } catch (err) {
                const message = err instanceof Error ? err.message : 'Không thể tải dữ liệu khóa học'
                setState((s) => ({ ...s, error: message, loading: false }))
            }
        }

        fetchData()
    }, [courseId])

    const filteredChapters = useMemo(() => {
        const search = state.search.trim().toLowerCase()
        return state.chapters.map((chapter) => {
            const lessons = (chapter.lessons || []).filter((lesson) => {
                if (state.filter === 'published' && !lesson.isPublished) return false
                if (!search) return true
                return (
                    lesson.title.toLowerCase().includes(search) ||
                    (chapter.title?.toLowerCase().includes(search))
                )
            })
            return { ...chapter, lessons }
        }).filter((chapter) => chapter.lessons && chapter.lessons.length > 0)
    }, [state.chapters, state.filter, state.search])

    const handleToggleLessonQuizzes = (lesson: Lesson) => {
        setOpenLessonQuiz((prev) => (prev === lesson.id ? null : lesson.id))
    }

    if (!courseId) {
        return (
            <div className="flex h-full items-center justify-center p-8 text-center text-red-500">
                Không tìm thấy khóa học
            </div>
        )
    }

    if (state.loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (state.error) {
        return (
            <div className="flex h-full items-center justify-center p-8">
                <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6 text-red-700 flex items-center gap-3">
                        <AlertCircle className="h-5 w-5" />
                        <span>{state.error}</span>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <Card className="bg-[#1A1A1A] border-[#2D2D2D] py-4">
            <CardHeader>
                <div>
                    <h1 className="text-white text-2xl mb-2">Quản lý câu hỏi ôn tập cho từng bài học</h1>
                    <p className="text-gray-400">{state.course?.title || 'Quản lý câu hỏi ôn tập'}</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-6">
                    <DarkOutlineInput
                        value={state.search}
                        onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
                        placeholder="Tìm theo chương hoặc bài học..."
                        className="w-full"
                    />
                </div>

                {filteredChapters.length === 0 && (
                    <Card className="border-gray-700 bg-gray-800">
                        <CardContent className="pt-8 pb-8 text-center text-gray-300">
                            <BookOpen className="h-8 w-8 mx-auto mb-2 text-gray-500" />
                            Không có bài học phù hợp.
                        </CardContent>
                    </Card>
                )}

                <div className="space-y-4">
                    {filteredChapters.map((chapter) => {
                        const isExpanded = expandedChapters.has(chapter.id)
                        const lessons = chapter.lessons || []
                        const publishedCount = lessons.filter(l => l.isPublished).length
                        const hiddenCount = lessons.length - publishedCount
                        const duration = lessons.reduce((acc, l) => acc + (l.videoDuration || 0), 0)
                        return (
                            <div
                                key={chapter.id}
                                className={`bg-[#121212] border rounded-lg overflow-hidden transition-all duration-150 shadow-sm ${
                                    isExpanded ? 'border-blue-500 bg-blue-500/10 shadow-lg scale-[1.01]' : 'border-[#2D2D2D] hover:border-blue-500/40'
                                }`}
                            >
                                <div className="flex items-center p-6 bg-[#333333] hover:bg-[#333333] transition-colors cursor-pointer select-none">
                                    <div className="flex items-center gap-3 flex-1 min-w-0" onClick={() => handleToggleChapter(chapter.id)}>
                                        <span title="Mở rộng/Thu gọn chương">
                                            {isExpanded ? (
                                                <ChevronRight className="h-4 w-4 text-gray-400 rotate-90 transition-transform" />
                                            ) : (
                                                <ChevronRight className="h-4 w-4 text-gray-400 transition-transform" />
                                            )}
                                        </span>
                                        <span className="text-blue-500 font-semibold text-sm mr-2">#{chapter.chapterOrder}</span>
                                        <span className="text-white font-medium truncate">{chapter.title}</span>
                                                                                <div className="flex items-center gap-2 ml-2 flex-shrink-0">
                                                                                        <Badge variant="outline" className="text-blue-400 border-blue-400/50">
                                                                                                <ListOrdered className="h-4 w-4 mr-1" />{lessons.length} bài
                                                                                        </Badge>
                                                                                        <Badge variant="outline" className="text-green-400 border-green-400/50">
                                                                                                <Eye className="h-4 w-4 mr-1" />{publishedCount} hiện
                                                                                        </Badge>
                                                                                        <Badge variant="outline" className="text-gray-400">
                                                                                                <EyeOff className="h-4 w-4 mr-1" />{hiddenCount} ẩn
                                                                                        </Badge>
                                                                                </div>
                                    </div>
                                                                        <div className="flex items-center flex-shrink-0 ml-4 gap-2">
                                                                                <Badge variant="outline" className="text-blue-300 border-blue-300/50 flex items-center gap-1">
                                                                                        <Clock className="h-3 w-3" />{formatDuration(duration)}
                                                                                </Badge>
                                                                                {/* Status badge for chapter publish state */}
                                                                                {chapter.isPublished ? (
                                                                                    <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs ml-2" title="Chương đã xuất bản">
                                                                                        <Eye className="h-3 w-3" /> Xuất bản
                                                                                    </Badge>
                                                                                ) : (
                                                                                    <Badge className="bg-gray-500 text-white flex items-center gap-1 text-xs ml-2" title="Chương đang ẩn">
                                                                                        <EyeOff className="h-3 w-3" /> Ẩn
                                                                                    </Badge>
                                                                                )}
                                                                        </div>
                                </div>
                                {isExpanded && (
                                    <div className="p-6 pt-3 space-y-4 bg-[#181818]">
                                        {lessons.map((lesson) => (
                                            <div
                                                key={lesson.id}
                                                className="flex flex-col gap-2 p-5 bg-[#232323] border border-[#2D2D2D] rounded-xl transition-all duration-150 shadow-sm"
                                                style={{ minHeight: 72 }}
                                            >
                                                <div className="flex items-center gap-4">
                                                    {/* Icon video/file (đồng bộ với LessonItem) */}
                                                    {lesson.videoUrl ? (
                                                        <Video className="h-5 w-5 text-blue-500 flex-shrink-0" />
                                                    ) : (
                                                        <FileText className="h-5 w-5 text-gray-500 flex-shrink-0" />
                                                    )}
                                                    {/* Số thứ tự và tiêu đề */}
                                                    <span className="text-blue-500 font-semibold text-sm mr-2 flex-shrink-0">#{lesson.lessonOrder}</span>
                                                    <span className="text-white text-sm truncate flex-1">{lesson.title}</span>
                                                    {/* Badge preview */}
                                                    {lesson.isPreview && (
                                                        <Badge variant="outline" className="text-xs text-yellow-500 border-yellow-500 flex-shrink-0">Preview</Badge>
                                                    )}
                                                    {/* Tổng thời lượng video */}
                                                    <div className="flex items-center gap-3">
                                                        <div className="flex items-center gap-1 text-gray-400 text-xs whitespace-nowrap min-w-[3rem] justify-end">
                                                            {lesson.videoDuration && lesson.videoDuration > 0 ? (
                                                                <>
                                                                    <Clock className="h-3 w-3 flex-shrink-0" />
                                                                    <span>{formatDuration(lesson.videoDuration)}</span>
                                                                </>
                                                            ) : null}
                                                        </div>
                                                        {/* Trạng thái xuất bản/ẩn */}
                                                        {lesson.isPublished ? (
                                                            <Badge className="bg-green-600 text-white flex items-center gap-1 text-xs" title="Bài học đã xuất bản">
                                                                <Eye className="h-3 w-3" /> Xuất bản
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-gray-500 text-white flex items-center gap-1 text-xs" title="Bài học đang ẩn">
                                                                <EyeOff className="h-3 w-3" /> Ẩn
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                                {/* Thanh phụ chứa nút quản lý câu hỏi */}
                                                <div className="flex flex-col items-center mt-2 border border-[#2D2D2D] rounded-lg bg-[#181818] py-3">
                                                    <Button
                                                        variant="secondary"
                                                        className="bg-blue-600 text-white hover:bg-blue-500"
                                                        onClick={() => handleToggleLessonQuizzes(lesson)}
                                                    >
                                                        {openLessonQuiz === lesson.id ? 'Đóng quản lý câu hỏi' : 'Quản lý câu hỏi'} <ChevronRight className={`h-4 w-4 ml-1 transition-transform ${openLessonQuiz === lesson.id ? 'rotate-90' : ''}`} />
                                                    </Button>
                                                    {openLessonQuiz === lesson.id && (
                                                        <div className="w-full mt-4">
                                                            {/* Inline quiz management UI for this lesson */}
                                                            <QuizzesPage key={lesson.id} lessonId={lesson.id} lessonTitle={lesson.title} />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </CardContent>
        </Card>
    )
}
