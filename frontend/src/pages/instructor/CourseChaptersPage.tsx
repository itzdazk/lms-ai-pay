import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { DarkOutlineButton } from '../../components/ui/buttons'
import { Loader2, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../../contexts/AuthContext'
import { useCourseForm } from '../../contexts/CourseFormContext'
import { ChapterDialog } from '../../components/instructor/ChapterDialog'
import { LessonDialog } from '../../components/instructor/LessonDialog'
import { DeleteChapterDialog } from '../../components/instructor/DeleteChapterDialog'
import { DeleteLessonDialog } from '../../components/instructor/DeleteLessonDialog'
import { CourseStatistics } from '../../components/instructor/CourseStatistics'
import { ChapterItem } from '../../components/instructor/ChapterItem'
import { SaveChangesBar } from '../../components/instructor/SaveChangesBar'
import { chaptersApi } from '../../lib/api/chapters'
import { instructorLessonsApi } from '../../lib/api/instructor-lessons'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import { instructorQuizzesApi } from '../../lib/api/instructor-quizzes'
import type { Chapter, Lesson, Course, Quiz, CreateChapterRequest, UpdateChapterRequest, CreateLessonRequest, UpdateLessonRequest } from '../../lib/api/types'

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
    const [dragOverChapterId, setDragOverChapterId] = useState<number | null>(null)
    const [dragOverLessonId, setDragOverLessonId] = useState<number | null>(null)
    const [dragOverLessonChapterId, setDragOverLessonChapterId] = useState<number | null>(null)
    const [lessonScrollHint, setLessonScrollHint] = useState<{ chapterId: number | null; top: boolean; bottom: boolean }>({ chapterId: null, top: false, bottom: false })
    const lessonContainerRefs = useRef<Record<number, HTMLDivElement | null>>({})

    const clearDragStates = () => {
        setDraggedChapterId(null)
        setDragOverChapterId(null)
        setDraggedLessonId(null)
        setDraggedLessonChapterId(null)
        setDragOverLessonId(null)
        setDragOverLessonChapterId(null)
        setLessonScrollHint({ chapterId: null, top: false, bottom: false })
    }

    // Local state for drag and drop changes
    const [localChapters, setLocalChapters] = useState<Chapter[]>([])
    const { hasChanges: hasUnsavedChanges, setHasChanges: setHasUnsavedChanges } = useCourseForm()
    const localChaptersRef = useRef<Chapter[]>([])
    
    // Quizzes data - Map of lessonId to quizzes array
    const [lessonsQuizzes, setLessonsQuizzes] = useState<Map<number, Quiz[]>>(new Map())
    
    // Track which lesson's quiz management is open
    const [openLessonQuiz, setOpenLessonQuiz] = useState<number | null>(null)

    // Dialogs
    const [showChapterDialog, setShowChapterDialog] = useState(false)
    const [showLessonDialog, setShowLessonDialog] = useState(false)
    const [showDeleteChapterDialog, setShowDeleteChapterDialog] = useState(false)
    const [showDeleteLessonDialog, setShowDeleteLessonDialog] = useState(false)
    const [editingChapter, setEditingChapter] = useState<Chapter | null>(null)
    const [editingLesson, setEditingLesson] = useState<Lesson | null>(null)
    const [deletingChapter, setDeletingChapter] = useState<Chapter | null>(null)
    const [deletingLesson, setDeletingLesson] = useState<{ lesson: Lesson; chapterId: number } | null>(null)
    const [lessonProgressInfo, setLessonProgressInfo] = useState<{
        totalProgressRecords: number
        completedProgressRecords: number
        uniqueUsersCount: number
    } | null>(null)
    const [loadingProgressInfo, setLoadingProgressInfo] = useState(false)
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

    // Update ref whenever localChapters changes
    useEffect(() => {
        localChaptersRef.current = localChapters
    }, [localChapters])

    // Save expanded chapters state to localStorage whenever it changes
    useEffect(() => {
        if (courseId && !loading && expandedChapters.size >= 0) {
            saveExpandedChaptersToStorage(courseId, expandedChapters)
        }
    }, [expandedChapters, courseId, loading])

    // Fetch quizzes for all lessons after chapters are loaded
    useEffect(() => {
        if (!localChapters.length || loading) return

        let isMounted = true

        const fetchQuizzes = async () => {
            // Collect all lesson IDs from all chapters
            const lessonIds = localChapters.flatMap(ch => 
                ch.lessons?.map(l => l.id) || []
            )

            if (lessonIds.length === 0) return

            try {
                // Fetch all quizzes in parallel using Promise.allSettled
                // This won't fail if one lesson's quiz fetch fails
                const quizResults = await Promise.allSettled(
                    lessonIds.map(lessonId =>
                        instructorQuizzesApi.getQuizzes(lessonId)
                            .then(quizzes => ({ lessonId, quizzes }))
                            .catch(error => {
                                console.error(`Error fetching quizzes for lesson ${lessonId}:`, error)
                                return { lessonId, quizzes: [] }
                            })
                    )
                )

                if (!isMounted) return

                const newQuizzesMap = new Map<number, Quiz[]>()
                quizResults.forEach(result => {
                    if (result.status === 'fulfilled') {
                        newQuizzesMap.set(result.value.lessonId, result.value.quizzes)
                    }
                })

                setLessonsQuizzes(newQuizzesMap)
            } catch (error) {
                console.error('Error fetching quizzes:', error)
                // Fail silently, don't block UI
            }
        }

        fetchQuizzes()

        return () => {
            isMounted = false
        }
    }, [localChapters, loading])

    // Poll transcript status when there are processing transcripts
    useEffect(() => {
        if (!courseId || loading) return

        // Poll every 5 seconds to check transcript status
        const pollInterval = setInterval(async () => {
            try {
                // Check if there are any lessons with processing transcript status
                const currentChapters = localChaptersRef.current
                const hasProcessingTranscripts = currentChapters.some(
                    chapter => chapter.lessons?.some(
                        lesson => lesson.transcriptStatus === 'processing'
                    )
                )

                // Stop polling if no processing transcripts
                if (!hasProcessingTranscripts) {
                    return
                }

                const chaptersData = await chaptersApi.getChaptersByCourse(courseId, true)
                
                // Update only transcript status without affecting local drag-and-drop changes
                setLocalChapters(prevChapters => {
                    return prevChapters.map(prevChapter => {
                        const newChapter = chaptersData.find(ch => ch.id === prevChapter.id)
                        if (!newChapter) return prevChapter

                        // Update lessons with new transcript status while preserving order changes
                        const updatedLessons = prevChapter.lessons?.map(prevLesson => {
                            const newLesson = newChapter.lessons?.find(l => l.id === prevLesson.id)
                            if (!newLesson) return prevLesson

                            // Only update transcript-related fields, keep local order changes
                            return {
                                ...prevLesson,
                                transcriptUrl: newLesson.transcriptUrl,
                                transcriptJsonUrl: newLesson.transcriptJsonUrl,
                                transcriptStatus: newLesson.transcriptStatus,
                            }
                        })

                        return {
                            ...prevChapter,
                            lessons: updatedLessons,
                        }
                    })
                })

                // Also update chapters state for reference
                setChapters(chaptersData)
            } catch (error: any) {
                console.error('Error polling transcript status:', error)
                // Don't show error toast for polling failures
            }
        }, 5000) // Poll every 5 seconds

        return () => {
            clearInterval(pollInterval)
        }
    }, [courseId, loading])

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
            localChaptersRef.current = chaptersData
            setHasUnsavedChanges(false)
            // Reset quizzes map when chapters reload
            setLessonsQuizzes(new Map())
            
            // Load expanded chapters from localStorage, or expand all by default if not saved
            const savedExpanded = loadExpandedChaptersFromStorage(courseId)
            if (savedExpanded.size > 0) {
                // Only include chapter IDs that actually exist
                const validExpanded = new Set(
                    Array.from(savedExpanded).filter(id => 
                        chaptersData.some(ch => ch.id === id)
                    )
                )
                setExpandedChapters(validExpanded)
            } else {
                // Default: collapse all chapters for a cleaner initial view
                setExpandedChapters(new Set())
            }
        } catch (error: any) {
            console.error('Error loading data:', error)
            toast.error('Không thể tải dữ liệu')
            navigate('/instructor/dashboard')
        } finally {
            setLoading(false)
        }
    }

    // Helper function to update local chapters state
    const updateLocalChapters = (updater: (chapters: Chapter[]) => Chapter[]) => {
        setLocalChapters(prev => {
            const updated = updater(prev)
            localChaptersRef.current = updated
            return updated
        })
    }

    // Helper function to refresh a single chapter from API
    const refreshChapter = async (chapterId: number) => {
        try {
            const updatedChapter = await chaptersApi.getChapterById(chapterId, true) // Include lessons
            updateLocalChapters(chapters => 
                chapters.map(ch => ch.id === chapterId ? updatedChapter : ch)
            )
            setChapters(prev => 
                prev.map(ch => ch.id === chapterId ? updatedChapter : ch)
            )
            
            // Refresh quizzes for lessons in this chapter
            if (updatedChapter.lessons && updatedChapter.lessons.length > 0) {
                const lessonIds = updatedChapter.lessons.map(l => l.id)
                const quizResults = await Promise.allSettled(
                    lessonIds.map(lessonId =>
                        instructorQuizzesApi.getQuizzes(lessonId)
                            .then(quizzes => ({ lessonId, quizzes }))
                            .catch(() => ({ lessonId, quizzes: [] }))
                    )
                )
                
                setLessonsQuizzes(prev => {
                    const newMap = new Map(prev)
                    quizResults.forEach(result => {
                        if (result.status === 'fulfilled') {
                            newMap.set(result.value.lessonId, result.value.quizzes)
                        }
                    })
                    return newMap
                })
            }
            
            return updatedChapter
        } catch (error) {
            console.error('Error refreshing chapter:', error)
            throw error
        }
    }

    // Helper functions to save/load expanded chapters state
    const getExpandedChaptersKey = (courseId: number) => `course_${courseId}_expanded_chapters`

    const loadExpandedChaptersFromStorage = (courseId: number): Set<number> => {
        try {
            const key = getExpandedChaptersKey(courseId)
            const saved = localStorage.getItem(key)
            if (saved) {
                const chapterIds = JSON.parse(saved) as number[]
                return new Set(chapterIds)
            }
        } catch (error) {
            console.error('Error loading expanded chapters from storage:', error)
        }
        return new Set<number>()
    }

    const saveExpandedChaptersToStorage = (courseId: number, expandedChapters: Set<number>) => {
        try {
            const key = getExpandedChaptersKey(courseId)
            const chapterIds = Array.from(expandedChapters)
            localStorage.setItem(key, JSON.stringify(chapterIds))
        } catch (error) {
            console.error('Error saving expanded chapters to storage:', error)
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
                // Update existing chapter
                await chaptersApi.updateChapter(editingChapter.id, data as UpdateChapterRequest)
                // Refresh the chapter to get latest data including lessons
                await refreshChapter(editingChapter.id)
                toast.success('Cập nhật chapter thành công!')
            } else {
                // Create new chapter
                const newChapter = await chaptersApi.createChapter(courseId, data as CreateChapterRequest)
                // Get full chapter data with lessons
                const fullChapter = await chaptersApi.getChapterById(newChapter.id, true)
                // Add to local chapters at the end
                updateLocalChapters(chapters => [...chapters, fullChapter])
                setChapters(prev => [...prev, fullChapter])
                toast.success('Tạo chapter thành công!')
            }
            setShowChapterDialog(false)
            setEditingChapter(null)
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
            const chapterIdToDelete = deletingChapter.id
            
            await chaptersApi.deleteChapter(chapterIdToDelete)
            
            // Remove from local state
            updateLocalChapters(chapters => chapters.filter(ch => ch.id !== chapterIdToDelete))
            setChapters(prev => prev.filter(ch => ch.id !== chapterIdToDelete))
            
            // Remove from expanded chapters if it was expanded
            setExpandedChapters(prev => {
                const newSet = new Set(prev)
                newSet.delete(chapterIdToDelete)
                return newSet
            })
            
            toast.success('Xóa chapter thành công!')
            setShowDeleteChapterDialog(false)
            setDeletingChapter(null)
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

    const handleDeleteLesson = async (lesson: Lesson, chapterId: number) => {
        if (!courseId) return

        setDeletingLesson({ lesson, chapterId })
        setLoadingProgressInfo(true)
        setLessonProgressInfo(null)
        setShowDeleteLessonDialog(true)

        try {
            // Fetch progress info for warning
            const progressInfo = await instructorLessonsApi.getLessonProgressInfo(
                courseId,
                lesson.id
            )
            setLessonProgressInfo(progressInfo)
        } catch (error: any) {
            console.error('Error fetching lesson progress info:', error)
            // If error, just show dialog without progress info
            setLessonProgressInfo(null)
        } finally {
            setLoadingProgressInfo(false)
        }
    }

    // Toggle quiz management for a lesson
    const handleToggleLessonQuiz = (lesson: Lesson) => {
        const willOpen = openLessonQuiz !== lesson.id
        const currentOpenId = openLessonQuiz
        
        // Set new state
        setOpenLessonQuiz(willOpen ? lesson.id : null)
        
        // Refresh quizzes when opening or closing
        const lessonIdToRefresh = willOpen ? lesson.id : (currentOpenId === lesson.id ? lesson.id : null)
        
        if (lessonIdToRefresh) {
            // Refresh quizzes asynchronously
            instructorQuizzesApi.getQuizzes(lessonIdToRefresh)
                .then(updatedQuizzes => {
                    setLessonsQuizzes(prev => {
                        const newMap = new Map(prev)
                        newMap.set(lessonIdToRefresh, updatedQuizzes)
                        return newMap
                    })
                })
                .catch(error => {
                    console.error('Error refreshing quizzes:', error)
                })
        }
    }
    
    // Refresh quizzes for a specific lesson (can be called from QuizzesPage via callback)
    const refreshLessonQuizzes = useCallback(async (lessonId: number) => {
        try {
            const updatedQuizzes = await instructorQuizzesApi.getQuizzes(lessonId)
            setLessonsQuizzes(prev => {
                const newMap = new Map(prev)
                newMap.set(lessonId, updatedQuizzes)
                return newMap
            })
        } catch (error) {
            console.error('Error refreshing quizzes:', error)
        }
    }, [])

    const handleLessonSubmit = async (
        data: CreateLessonRequest | UpdateLessonRequest,
        videoFile?: File,
        autoCreateTranscript: boolean = false
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
                    await instructorLessonsApi.uploadVideo(
                        courseId, 
                        editingLesson.id, 
                        videoFile,
                        undefined, // onUploadProgress
                        autoCreateTranscript
                    )
                }

                // Refresh the chapter to get updated lesson data
                await refreshChapter(selectedChapterId)
                toast.success('Cập nhật bài học thành công!')
            } else {
                // Create lesson
                const createData = { ...data, courseId, chapterId: selectedChapterId } as CreateLessonRequest
                console.log('Creating lesson with data:', createData)
                const newLesson = await instructorLessonsApi.createLesson(courseId, createData)

                // Upload video if provided
                if (videoFile) {
                    await instructorLessonsApi.uploadVideo(
                        courseId, 
                        newLesson.id, 
                        videoFile,
                        undefined, // onUploadProgress
                        autoCreateTranscript
                    )
                }

                // Refresh the chapter to get the new lesson with all data
                await refreshChapter(selectedChapterId)
                // Ensure chapter is expanded to show new lesson
                setExpandedChapters(prev => {
                    const newSet = new Set(prev)
                    newSet.add(selectedChapterId)
                    return newSet
                })
                toast.success('Tạo bài học thành công!')
            }

            setShowLessonDialog(false)
            setEditingLesson(null)
            setSelectedChapterId(null)
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
            const { lesson, chapterId } = deletingLesson
            
            await instructorLessonsApi.deleteLesson(courseId, lesson.id)
            
            // Remove lesson from local state
            updateLocalChapters(chapters =>
                chapters.map(ch =>
                    ch.id === chapterId
                        ? {
                              ...ch,
                              lessons: ch.lessons?.filter(l => l.id !== lesson.id) || [],
                          }
                        : ch
                )
            )
            setChapters(prev =>
                prev.map(ch =>
                    ch.id === chapterId
                        ? {
                              ...ch,
                              lessons: ch.lessons?.filter(l => l.id !== lesson.id) || [],
                          }
                        : ch
                )
            )
            
            // Remove quizzes for deleted lesson
            setLessonsQuizzes(prev => {
                const newMap = new Map(prev)
                newMap.delete(lesson.id)
                return newMap
            })
            
            toast.success('Xóa bài học thành công!')
            setShowDeleteLessonDialog(false)
            setDeletingLesson(null)
            setLessonProgressInfo(null)
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
            const updatedLesson = await instructorLessonsApi.publishLesson(courseId, lesson.id, isPublished)
            
            // Find chapter containing this lesson and update it
            updateLocalChapters(chapters =>
                chapters.map(ch =>
                    ch.lessons?.some(l => l.id === lesson.id)
                        ? {
                              ...ch,
                              lessons: ch.lessons?.map(l =>
                                  l.id === lesson.id ? updatedLesson : l
                              ),
                          }
                        : ch
                )
            )
            setChapters(prev =>
                prev.map(ch =>
                    ch.lessons?.some(l => l.id === lesson.id)
                        ? {
                              ...ch,
                              lessons: ch.lessons?.map(l =>
                                  l.id === lesson.id ? updatedLesson : l
                              ),
                          }
                        : ch
                )
            )
            
            toast.success(isPublished ? 'Đã xuất bản bài học' : 'Đã ẩn bài học')
        } catch (error: any) {
            console.error('Error publishing lesson:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    const handlePublishChapter = async (chapter: Chapter, isPublished: boolean) => {
        try {
            const updatedChapter = await chaptersApi.updateChapter(chapter.id, { isPublished })
            
            // Update local state
            updateLocalChapters(chapters =>
                chapters.map(ch =>
                    ch.id === chapter.id ? { ...ch, isPublished: updatedChapter.isPublished } : ch
                )
            )
            setChapters(prev =>
                prev.map(ch =>
                    ch.id === chapter.id ? { ...ch, isPublished: updatedChapter.isPublished } : ch
                )
            )
            
            toast.success(isPublished ? 'Đã xuất bản chương' : 'Đã ẩn chương')
        } catch (error: any) {
            console.error('Error publishing chapter:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    const handleRequestTranscript = async (lesson: Lesson) => {
        if (!courseId || !lesson.videoUrl) {
            toast.error('Bài học phải có video để tạo transcript')
            return
        }

        if (lesson.transcriptStatus === 'processing') {
            toast.info('Transcript đang được tạo, vui lòng đợi...')
            return
        }

        if (lesson.transcriptStatus === 'completed' || (lesson.transcriptUrl && !lesson.transcriptStatus)) {
            toast.info('Transcript đã có sẵn')
            return
        }

        try {
            const updatedLesson = await instructorLessonsApi.requestTranscript(courseId, lesson.id)
            
            // Find chapter containing this lesson and update transcript status
            updateLocalChapters(chapters =>
                chapters.map(ch =>
                    ch.lessons?.some(l => l.id === lesson.id)
                        ? {
                              ...ch,
                              lessons: ch.lessons?.map(l =>
                                  l.id === lesson.id
                                      ? {
                                            ...l,
                                            transcriptStatus: updatedLesson.transcriptStatus,
                                            transcriptUrl: updatedLesson.transcriptUrl,
                                            transcriptJsonUrl: updatedLesson.transcriptJsonUrl,
                                        }
                                      : l
                              ),
                          }
                        : ch
                )
            )
            setChapters(prev =>
                prev.map(ch =>
                    ch.lessons?.some(l => l.id === lesson.id)
                        ? {
                              ...ch,
                              lessons: ch.lessons?.map(l =>
                                  l.id === lesson.id
                                      ? {
                                            ...l,
                                            transcriptStatus: updatedLesson.transcriptStatus,
                                            transcriptUrl: updatedLesson.transcriptUrl,
                                            transcriptJsonUrl: updatedLesson.transcriptJsonUrl,
                                        }
                                      : l
                              ),
                          }
                        : ch
                )
            )
            
            toast.success('Đã yêu cầu tạo transcript. Quá trình xử lý sẽ bắt đầu trong giây lát.')
        } catch (error: any) {
            console.error('Error requesting transcript:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    // Drag and drop handlers
    const handleChapterDragStart = (e: React.DragEvent, chapterId: number) => {
        setDraggedChapterId(chapterId)
        setDragOverChapterId(null)
        e.dataTransfer.effectAllowed = 'move'
    }

    const handleChapterDragOver = (e: React.DragEvent, targetChapterId: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        if (dragOverChapterId !== targetChapterId) {
            setDragOverChapterId(targetChapterId)
        }
    }

    const handleChapterDragLeave = () => {
        setDragOverChapterId(null)
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
        setDragOverChapterId(null)
    }

    const handleChapterDragEnd = () => {
        clearDragStates()
    }

    // Allow scrolling the page with mouse wheel while dragging a chapter
    useEffect(() => {
        if (!draggedChapterId) return

        const handler = (we: WheelEvent) => {
            window.scrollBy({ top: we.deltaY, behavior: 'auto' })
            we.preventDefault()
        }

        window.addEventListener('wheel', handler, { passive: false, capture: true })
        document.addEventListener('wheel', handler, { passive: false, capture: true })

        return () => {
            window.removeEventListener('wheel', handler, true)
            document.removeEventListener('wheel', handler, true)
        }
    }, [draggedChapterId])

    const handleLessonDragStart = (e: React.DragEvent, lessonId: number, chapterId: number) => {
        setDraggedLessonId(lessonId)
        setDraggedLessonChapterId(chapterId)
        setDragOverLessonId(null)
        setDragOverLessonChapterId(null)
        e.dataTransfer.effectAllowed = 'move'
    }

    const maybeAutoScrollChapter = (targetChapterId: number, clientY: number) => {
        const container = lessonContainerRefs.current[targetChapterId]
        if (!container) return

        const rect = container.getBoundingClientRect()
        const threshold = 60
        const scrollSpeed = 18

        const distTop = clientY - rect.top
        const distBottom = rect.bottom - clientY

        if (distTop < threshold) {
            container.scrollTop = Math.max(0, container.scrollTop - scrollSpeed)
        } else if (distBottom < threshold) {
            container.scrollTop = Math.min(container.scrollHeight, container.scrollTop + scrollSpeed)
        }

        setLessonScrollHint({
            chapterId: targetChapterId,
            top: distTop < threshold,
            bottom: distBottom < threshold,
        })
    }

    const handleLessonDragOver = (e: React.DragEvent, targetLessonId: number, targetChapterId: number) => {
        e.preventDefault()
        e.dataTransfer.dropEffect = 'move'
        maybeAutoScrollChapter(targetChapterId, e.clientY)
        if (dragOverLessonId !== targetLessonId || dragOverLessonChapterId !== targetChapterId) {
            setDragOverLessonId(targetLessonId)
            setDragOverLessonChapterId(targetChapterId)
        }
    }

    const handleLessonDragLeave = () => {
        setDragOverLessonId(null)
        setDragOverLessonChapterId(null)
    }

    const handleLessonDragEnd = () => {
        clearDragStates()
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
            setDragOverLessonId(null)
            setDragOverLessonChapterId(null)
        } else {
            // Moving lesson between chapters - not implemented yet
            toast.info('Chức năng di chuyển bài học giữa các chapter chưa được hỗ trợ')
        }

        setDraggedLessonId(null)
        setDraggedLessonChapterId(null)
        setDragOverLessonId(null)
        setDragOverLessonChapterId(null)
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

                    <CourseStatistics
                        chapters={localChapters}
                        onCreateChapter={handleCreateChapter}
                        formatDuration={formatDuration}
                    />
                </CardHeader>
                <CardContent>
                    <div
                        className="space-y-4 divide-y divide-[#2D2D2D]/60"
                        onPointerUp={clearDragStates}
                    >
                        {/* Display empty state if no chapters */}
                        {chapters.length === 0 && (
                            <div className="text-center py-8">
                                <p className="text-gray-400 mb-4">Chưa có chapter nào</p>
                            </div>
                        )}

                        {/* Display chapters */}
                        {localChapters.map((chapter) => {
                            const swappedLessonIds = getSwappedLessonIds(chapter.id)
                            return (
                                <ChapterItem
                                    key={chapter.id}
                                    chapter={chapter}
                                    isExpanded={expandedChapters.has(chapter.id)}
                                    isDragged={draggedChapterId === chapter.id}
                                    isDragOver={dragOverChapterId === chapter.id}
                                    hasOrderChanged={hasChapterOrderChanged(chapter.id)}
                                    lessonsQuizzes={lessonsQuizzes}
                                    draggedLessonId={draggedLessonId}
                                    draggedLessonChapterId={draggedLessonChapterId}
                                    dragOverLessonId={dragOverLessonId}
                                    dragOverLessonChapterId={dragOverLessonChapterId}
                                    lessonScrollHint={lessonScrollHint}
                                    swappedLessonIds={swappedLessonIds}
                                    formatDuration={formatDuration}
                                    containerRef={(el) => {
                                        lessonContainerRefs.current[chapter.id] = el
                                    }}
                                    onToggle={() => toggleChapter(chapter.id)}
                                    onDragStart={(e) => handleChapterDragStart(e, chapter.id)}
                                    onDragOver={(e) => handleChapterDragOver(e, chapter.id)}
                                    onDragLeave={handleChapterDragLeave}
                                    onDrop={(e) => handleChapterDrop(e, chapter.id)}
                                    onDragEnd={handleChapterDragEnd}
                                    onPublish={(isPublished) => handlePublishChapter(chapter, isPublished)}
                                    onEdit={() => handleEditChapter(chapter)}
                                    onDelete={() => handleDeleteChapter(chapter)}
                                    onCreateLesson={() => handleCreateLesson(chapter.id)}
                                    onLessonDragStart={handleLessonDragStart}
                                    onLessonDragOver={handleLessonDragOver}
                                    onLessonDragLeave={handleLessonDragLeave}
                                    onLessonDrop={handleLessonDrop}
                                    onLessonDragEnd={handleLessonDragEnd}
                                    onPublishLesson={handlePublishLesson}
                                    onEditLesson={handleEditLesson}
                                    onDeleteLesson={handleDeleteLesson}
                                    onRequestTranscript={handleRequestTranscript}
                                    onClearDragStates={clearDragStates}
                                    openLessonQuiz={openLessonQuiz}
                                    onToggleLessonQuiz={handleToggleLessonQuiz}
                                />
                            )
                        })}

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
                        <SaveChangesBar
                            hasUnsavedChanges={hasUnsavedChanges}
                            submitting={submitting}
                            onSave={handleSaveChanges}
                            onReset={handleResetChanges}
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Chapter Dialog */}
            <ChapterDialog
                open={showChapterDialog}
                onOpenChange={setShowChapterDialog}
                editingChapter={editingChapter}
                courseId={courseId}
                onSubmit={handleChapterSubmit}
                onCancel={() => {
                    setShowChapterDialog(false)
                    setEditingChapter(null)
                }}
                loading={submitting}
            />

            {/* Lesson Dialog */}
            <LessonDialog
                open={showLessonDialog}
                onOpenChange={setShowLessonDialog}
                editingLesson={editingLesson}
                courseId={courseId}
                chapterId={selectedChapterId}
                onSubmit={handleLessonSubmit}
                onCancel={() => {
                    setShowLessonDialog(false)
                    setEditingLesson(null)
                    setSelectedChapterId(null)
                }}
                loading={submitting}
            />

            {/* Delete Chapter Dialog */}
            <DeleteChapterDialog
                open={showDeleteChapterDialog}
                onOpenChange={setShowDeleteChapterDialog}
                deletingChapter={deletingChapter}
                onSubmit={handleChapterDelete}
                onCancel={() => {
                    setShowDeleteChapterDialog(false)
                    setDeletingChapter(null)
                }}
                submitting={submitting}
            />

            {/* Delete Lesson Dialog */}
            <DeleteLessonDialog
                open={showDeleteLessonDialog}
                onOpenChange={setShowDeleteLessonDialog}
                deletingLesson={deletingLesson?.lesson || null}
                onSubmit={handleLessonDelete}
                progressInfo={lessonProgressInfo}
                loadingProgressInfo={loadingProgressInfo}
                onCancel={() => {
                    setShowDeleteLessonDialog(false)
                    setDeletingLesson(null)
                    setLessonProgressInfo(null)
                }}
                submitting={submitting}
            />
        </>
    )
}