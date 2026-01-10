import { Outlet, useNavigate, useParams, useLocation } from 'react-router-dom'
import { ProgressSteps } from '../../components/ui/progress-steps'
import { useMemo, useCallback, useState } from 'react'
import { toast } from 'sonner'
import {
    CourseFormProvider,
    useCourseForm,
} from '../../contexts/CourseFormContext'
import { ChevronLeft, LayoutDashboard, ChevronRight } from 'lucide-react'
import { Button } from '../../components/ui/button'
import { DarkOutlineButton } from '../../components/ui/buttons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../../components/ui/dialog'

function CourseLayoutContent() {
    const navigate = useNavigate()
    const { id } = useParams<{ id: string }>()
    const location = useLocation()
    const courseId = id ? parseInt(id) : null
    const { hasChanges, setShowCancelDialog, showCancelDialog } =
        useCourseForm()
    const [pendingStepNavigation, setPendingStepNavigation] = useState<
        number | null
    >(null)

    const courseSteps = useMemo(
        () => [
            {
                id: 'course',
                title: 'Khóa học',
                description: 'Thông tin cơ bản',
            },
            {
                id: 'lessons',
                title: 'Bài học',
                description: 'Nội dung học tập',
            },
            {
                id: 'quizzes',
                title: 'Câu hỏi ôn tập',
                description: 'Câu hỏi ôn tập theo bài học',
            },
        ],
        []
    )

    // Determine current step based on pathname
    const currentStep = useMemo(() => {
        if (location.pathname.includes('/chapters')) {
            return 1 // Lessons step
        }
        if (location.pathname.includes('/quizzes')) {
            return 2 // Quizzes step
        }
        return 0 // Course step
    }, [location.pathname])

    const handleStepClick = useCallback(
        (stepIndex: number) => {
            if (stepIndex === currentStep) {
                // Already on this step, do nothing
                return
            }

            // Check if there are unsaved changes
            if (hasChanges) {
                // Store the target step for navigation after confirmation
                setPendingStepNavigation(stepIndex)
                setShowCancelDialog(true)
                return
            }

            if (stepIndex === 0) {
                // Navigate to course step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/edit`)
                } else {
                    navigate('/instructor/courses/create')
                }
            } else if (stepIndex === 1) {
                // Navigate to lessons step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/chapters`)
                } else {
                    toast.info(
                        'Vui lòng tạo khóa học trước khi chuyển sang bước bài học'
                    )
                }
            } else if (stepIndex === 2) {
                // Navigate to quizzes step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/quizzes`)
                } else {
                    toast.info('Vui lòng tạo khóa học trước khi chuyển sang bước câu hỏi ôn tập')
                }
            }
        },
        [currentStep, courseId, navigate, hasChanges, setShowCancelDialog]
    )

    const handleDashboardClick = () => {
        if (hasChanges) {
            setShowCancelDialog(true)
        } else {
            const scrollPosition =
                document.querySelector('main')?.scrollTop ||
                window.scrollY ||
                document.documentElement.scrollTop ||
                document.body.scrollTop ||
                0
            sessionStorage.setItem(
                'instructorDashboardScroll',
                scrollPosition.toString()
            )
            navigate('/instructor/dashboard', {
                state: { preserveScroll: true },
            })
        }
    }

    const confirmCancel = () => {
        setShowCancelDialog(false)
        const scrollPosition =
            document.querySelector('main')?.scrollTop ||
            window.scrollY ||
            document.documentElement.scrollTop ||
            document.body.scrollTop ||
            0
        sessionStorage.setItem(
            'instructorDashboardScroll',
            scrollPosition.toString()
        )

        // Check if this was triggered by step navigation
        if (pendingStepNavigation !== null) {
            const stepIndex = pendingStepNavigation
            setPendingStepNavigation(null)
            if (stepIndex === 0) {
                // Navigate to course step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/edit`)
                } else {
                    navigate('/instructor/courses/create')
                }
            } else if (stepIndex === 1) {
                // Navigate to lessons step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/chapters`)
                }
            } else if (stepIndex === 2) {
                // Navigate to quizzes step
                if (courseId) {
                    navigate(`/instructor/courses/${courseId}/quizzes`)
                }
            }
        } else {
            // Navigate to dashboard
            navigate('/instructor/dashboard', {
                state: { preserveScroll: true },
            })
        }
    }

    const handleNavigateToCourse = () => {
        // Check if there are unsaved changes
        if (hasChanges) {
            setPendingStepNavigation(0)
            setShowCancelDialog(true)
            return
        }

        if (courseId) {
            navigate(`/instructor/courses/${courseId}/edit`)
        } else {
            navigate('/instructor/courses/create')
        }
    }

    const handleNavigateToLessons = () => {
        // Check if there are unsaved changes
        if (hasChanges) {
            setPendingStepNavigation(1)
            setShowCancelDialog(true)
            return
        }

        if (courseId) {
            navigate(`/instructor/courses/${courseId}/chapters`)
        } else {
            toast.info(
                'Vui lòng tạo khóa học trước khi chuyển sang bước bài học'
            )
        }
    }

    const handleNavigateToQuizzes = () => {
        // Check if there are unsaved changes
        if (hasChanges) {
            setPendingStepNavigation(2)
            setShowCancelDialog(true)
            return
        }

        if (courseId) {
            navigate(`/instructor/courses/${courseId}/quizzes`)
        } else {
            toast.info('Vui lòng tạo khóa học trước khi chuyển sang bước câu hỏi ôn tập')
        }
    }

    return (
        <div className='py-2 px-6 max-w-6xl mx-auto space-y-6'>
            {/* Dashboard Button - Sticky */}
            <div className='sticky top-16 z-40 mb-2'>
                <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-2'>
                    {/* Top row */}
                    <div className='flex items-center justify-between gap-4'>
                        <button
                            onClick={handleDashboardClick}
                            className='flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white transition-colors rounded-lg'
                        >
                            <ChevronLeft className='h-4 w-4' />
                            <LayoutDashboard className='h-4 w-4' />
                            <span>Dashboard</span>
                        </button>

                        {/* Navigation Buttons (always visible; use disabled for constraints) */}
                        <div className='flex items-center gap-2'>
                            <button
                                onClick={() => (currentStep === 0 ? null : currentStep === 1 ? handleNavigateToCourse() : handleNavigateToLessons())}
                                className='flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                disabled={currentStep === 0}
                                title={currentStep === 0 ? 'Không có bước trước' : 'Quay lại bước trước'}
                            >
                                <ChevronLeft className='h-4 w-4' />
                                <span>Trước</span>
                            </button>
                            <button
                                onClick={() => (currentStep === 2 ? null : currentStep === 0 ? handleNavigateToLessons() : handleNavigateToQuizzes())}
                                className='flex items-center gap-2 px-3 py-1.5 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed'
                                disabled={currentStep === 2 || !courseId}
                                title={currentStep === 2 ? 'Đã ở bước cuối' : (!courseId ? 'Vui lòng tạo khóa học trước' : 'Đi tới bước tiếp theo')}
                            >
                                <span>Tiếp</span>
                                <ChevronRight className='h-4 w-4' />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Progress Steps */}
            <div className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-6 mb-2'>
                <ProgressSteps
                    steps={courseSteps}
                    currentStep={currentStep}
                    onStepClick={handleStepClick}
                />
            </div>

            {/* Outlet renders child routes (CourseCreatePage, CourseEditPage, CourseChaptersPage, CourseQuizzesPage) */}
            <Outlet />

            {/* Cancel Confirmation Dialog */}
            <Dialog
                open={showCancelDialog}
                onOpenChange={(open) => {
                    setShowCancelDialog(open)
                    if (!open) {
                        setPendingStepNavigation(null)
                    }
                }}
            >
                <DialogContent className='bg-[#1F1F1F] border-[#2D2D2D] text-white'>
                    <DialogHeader>
                        <DialogTitle className='text-white'>
                            Xác nhận rời khỏi
                        </DialogTitle>
                        <DialogDescription className='text-gray-400'>
                            {pendingStepNavigation !== null
                                ? 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn chuyển sang bước khác không?'
                                : 'Bạn có thay đổi chưa được lưu. Bạn có chắc chắn muốn rời khỏi trang này không?'}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <DarkOutlineButton
                            type='button'
                            onClick={() => {
                                setShowCancelDialog(false)
                                setPendingStepNavigation(null)
                            }}
                        >
                            Ở lại
                        </DarkOutlineButton>
                        <Button
                            type='button'
                            onClick={confirmCancel}
                            className='bg-red-600 hover:bg-red-700 text-white'
                        >
                            Rời khỏi
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

export function CourseLayout() {
    return (
        <CourseFormProvider>
            <CourseLayoutContent />
        </CourseFormProvider>
    )
}
