import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AlertCircle, BookOpen, ChevronRight, Loader2, PlayCircle } from 'lucide-react'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import { chaptersApi } from '../../lib/api/chapters'
import type { Chapter, Course, Lesson } from '../../lib/api/types'
import { Card, CardContent, CardHeader } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'

interface CourseStructureState {
    course: Course | null
    chapters: Chapter[]
    loading: boolean
    error: string | null
    filter: 'all' | 'published'
    search: string
}

export function CourseQuizzesPage() {
    const navigate = useNavigate()
    const { courseId: courseIdParam, id: fallbackId } = useParams<{ courseId?: string; id?: string }>()
    const courseId = courseIdParam || fallbackId

    const [state, setState] = useState<CourseStructureState>({
        course: null,
        chapters: [],
        loading: true,
        error: null,
        filter: 'all',
        search: '',
    })

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

    const handleOpenLessonQuizzes = (lesson: Lesson) => {
        if (!courseId) return
        navigate(`/instructor/courses/${courseId}/quizzes/lessons/${lesson.id}`)
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
                    <h1 className="text-white text-2xl mb-2">{state.course?.title || 'Quản lý Quiz'}</h1>
                    <p className="text-gray-400">Xem cấu trúc chương và bài học, chọn bài để quản lý câu hỏi.</p>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between mb-6">
                    <div className="flex gap-2">
                        <Button
                            variant={state.filter === 'all' ? 'default' : 'outline'}
                            onClick={() => setState((s) => ({ ...s, filter: 'all' }))}
                        >
                            Tất cả bài học
                        </Button>
                        <Button
                            variant={state.filter === 'published' ? 'default' : 'outline'}
                            onClick={() => setState((s) => ({ ...s, filter: 'published' }))}
                        >
                            Đã publish
                        </Button>
                    </div>
                    <input
                        value={state.search}
                        onChange={(e) => setState((s) => ({ ...s, search: e.target.value }))}
                        placeholder="Tìm theo chương hoặc bài học..."
                        className="w-full md:w-80 px-3 py-2 rounded-md bg-gray-700 text-white placeholder:text-gray-400 border border-gray-600 focus:border-blue-500 focus:outline-none"
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
                    {filteredChapters.map((chapter) => (
                        <Card key={chapter.id} className="border-gray-700 bg-gray-800">
                            <CardHeader className="flex flex-col gap-1">
                                <div className="flex items-center gap-2 text-gray-300 text-sm">
                                    <Badge variant="secondary" className="bg-gray-700 text-gray-200">
                                        Chương {chapter.chapterOrder}
                                    </Badge>
                                    <span>{chapter.title}</span>
                                </div>
                                {chapter.description && (
                                    <p className="text-gray-400 text-sm">{chapter.description}</p>
                                )}
                            </CardHeader>
                            <CardContent className="space-y-3">
                                {(chapter.lessons || []).map((lesson) => (
                                    <div
                                        key={lesson.id}
                                        className="flex items-center justify-between gap-3 rounded-md border border-gray-700 bg-gray-750 px-3 py-3"
                                    >
                                        <div className="flex items-center gap-3">
                                            <PlayCircle className="h-5 w-5 text-blue-400" />
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2 text-white font-semibold">
                                                    <span>{lesson.title}</span>
                                                    {!lesson.isPublished && (
                                                        <Badge className="bg-yellow-600 text-white">Nháp</Badge>
                                                    )}
                                                </div>
                                                <div className="text-xs text-gray-400">
                                                    Bài #{lesson.lessonOrder}
                                                </div>
                                            </div>
                                        </div>
                                        <Button
                                            variant="secondary"
                                            className="bg-blue-600 text-white hover:bg-blue-500"
                                            onClick={() => handleOpenLessonQuizzes(lesson)}
                                        >
                                            Quản lý câu hỏi <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}
