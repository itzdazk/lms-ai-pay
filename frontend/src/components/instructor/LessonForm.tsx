import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Select, SelectValue } from '../ui/select'
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../ui/dark-outline-select-trigger'
import { Loader2, X, Video, FileText, Upload, CheckCircle2, AlertCircle, HelpCircle, Sparkles, Circle } from 'lucide-react'
import { toast } from 'sonner'
import type { Lesson, CreateLessonRequest, UpdateLessonRequest } from '../../lib/api/types'
import { instructorLessonsApi } from '../../lib/api/instructor-lessons'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import { Progress } from '../ui/progress'

interface LessonFormData {
    title: string
    description: string
    content: string
    lessonOrder: number
    completionThreshold: number
    isPreview: boolean
    isPublished: boolean
}

interface LessonFormProps {
    lesson?: Lesson | null
    courseId: number
    chapterId?: number
    onSubmit: (
        data: CreateLessonRequest | UpdateLessonRequest,
        videoFile?: File,
        autoCreateTranscript?: boolean
    ) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

export function LessonForm({
    lesson,
    courseId,
    chapterId,
    onSubmit,
    onCancel,
    loading = false,
}: LessonFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        content: '',
        lessonOrder: 0,
        completionThreshold: 0.7, // Default 70%
        isPreview: false,
        isPublished: false,
    })

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [videoUploadProgress, setVideoUploadProgress] = useState(0)
    const [isUploadingVideo, setIsUploadingVideo] = useState(false)
    const [isDraggingVideo, setIsDraggingVideo] = useState(false)
    const [videoRemoved, setVideoRemoved] = useState(false)
    const [isRequestingTranscript, setIsRequestingTranscript] = useState(false)
    const [showUpdateWarningDialog, setShowUpdateWarningDialog] = useState(false)
    const [pendingSubmit, setPendingSubmit] = useState<(() => Promise<void>) | null>(null)
    const [autoCreateTranscript, setAutoCreateTranscript] = useState(false)

    // Store initial form data for change tracking
    const [initialFormData, setInitialFormData] = useState<LessonFormData | null>(null)

    const videoInputRef = useRef<HTMLInputElement>(null)
    const processedLessonIdRef = useRef<number | null>(null)

    useEffect(() => {
        const currentLessonId = lesson?.id ?? null
        
        // Only process if lesson id changed
        if (processedLessonIdRef.current === currentLessonId) {
            return
        }
        
        processedLessonIdRef.current = currentLessonId
        // Reset warning dialog when lesson changes
        setShowUpdateWarningDialog(false)
        setPendingSubmit(null)

        if (lesson) {
            // Parse completionThreshold - handle Decimal from Prisma and edge cases
            let completionThreshold = 0.7 // default
            if (lesson.completionThreshold !== undefined && lesson.completionThreshold !== null) {
                try {
                    // Handle both number and Decimal types from Prisma
                    const rawValue = typeof lesson.completionThreshold === 'number' 
                        ? lesson.completionThreshold 
                        : parseFloat(String(lesson.completionThreshold))
                    
                    if (!isNaN(rawValue) && isFinite(rawValue) && rawValue >= 0 && rawValue <= 1) {
                        completionThreshold = rawValue
                    }
                } catch (error) {
                    console.warn('Error parsing completionThreshold:', error, lesson.completionThreshold)
                }
            }
            
            console.log('Lesson data loaded:', {
                lessonId: lesson.id,
                completionThreshold: lesson.completionThreshold,
                type: typeof lesson.completionThreshold,
                parsedThreshold: completionThreshold,
            })
            
            const lessonData: LessonFormData = {
                title: lesson.title || '',
                description: lesson.description || '',
                content: lesson.content || '',
                lessonOrder: lesson.lessonOrder || 0,
                completionThreshold: completionThreshold,
                isPreview: lesson.isPreview || false,
                isPublished: lesson.isPublished || false,
            }
            setFormData(lessonData)
            setInitialFormData(lessonData)

            if (lesson.videoUrl) {
                setVideoPreview(lesson.videoUrl)
                setVideoRemoved(false)
            } else {
                setVideoPreview(null)
                setVideoRemoved(false)
            }
            setVideoFile(null) // Clear any uploaded file when editing existing lesson
        } else {
            // Reset form when no lesson (create mode)
            const createData: LessonFormData = {
                title: '',
                description: '',
                content: '',
                lessonOrder: 0,
                completionThreshold: 0.7, // Default 70%
                isPreview: false,
                isPublished: false,
            }
            setFormData(createData)
            setInitialFormData(null) // No initial data for create mode
            setVideoPreview(null)
            setVideoFile(null)
            setVideoRemoved(false)
            setAutoCreateTranscript(false) // Default to false for new lessons
        }
    }, [lesson?.id]) // Only depend on lesson id to avoid infinite loops

    // Check if a field has been changed
    const isFieldChanged = (fieldName: keyof LessonFormData): boolean => {
        if (!initialFormData || !lesson) return false
        const currentValue = formData[fieldName]
        const initialValue = initialFormData[fieldName]

        // Special handling for arrays if any (none in this case)
        return String(currentValue) !== String(initialValue)
    }

    // Check if form has any changes (works for both create and edit)
    const hasChanges = (): boolean => {
        // For create mode: check if any field has data
        if (!lesson) {
            return (
                formData.title.trim() !== '' ||
                formData.description.trim() !== '' ||
                formData.content.trim() !== '' ||
                formData.isPreview ||
                formData.isPublished ||
                videoFile !== null
            )
        }

        // For edit mode: check if any field has changed from initial
        if (!initialFormData) return false

        // Check form data changes
        const titleChanged = formData.title.trim() !== (lesson.title || '')
        const descriptionChanged = formData.description.trim() !== (lesson.description || '')
        const contentChanged = formData.content.trim() !== (lesson.content || '')
        const completionThresholdChanged = formData.completionThreshold !== (lesson.completionThreshold ?? 0.7)
        const isPreviewChanged = formData.isPreview !== (lesson.isPreview ?? false)
        const isPublishedChanged = formData.isPublished !== (lesson.isPublished ?? false)

        // Check video changes
        const hasNewVideo = !!videoFile
        const videoWasRemoved = !!(videoRemoved && !videoFile && !videoPreview && lesson.videoUrl)

        return titleChanged || descriptionChanged || contentChanged || completionThresholdChanged || isPreviewChanged || isPublishedChanged || hasNewVideo || videoWasRemoved
    }

    const formatFileSize = (bytes: number): string => {
        if (bytes === 0) return '0 Bytes'
        const k = 1024
        const sizes = ['Bytes', 'KB', 'MB', 'GB']
        const i = Math.floor(Math.log(bytes) / Math.log(k))
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
    }

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        if (!file.type.startsWith('video/')) {
            toast.error('Vui lòng chọn file video')
            // Reset input value to allow re-selection of the same file
            if (videoInputRef.current) {
                videoInputRef.current.value = ''
            }
            return
        }

        // Check file size (e.g., max 500MB)
        const maxSize = 500 * 1024 * 1024 // 500MB
        if (file.size > maxSize) {
            toast.error('Kích thước file video không được vượt quá 500MB')
            // Reset input value to allow re-selection of the same file
            if (videoInputRef.current) {
                videoInputRef.current.value = ''
            }
            return
        }

        setVideoFile(file)
        setVideoPreview(URL.createObjectURL(file))
        setVideoRemoved(false)
        toast.success(`Đã chọn video: ${file.name} (${formatFileSize(file.size)})`)

        // Reset input value to allow re-selection of the same file
        if (videoInputRef.current) {
            videoInputRef.current.value = ''
        }
    }


    const handleRemoveVideo = () => {
        setVideoFile(null)
        if (videoPreview && videoPreview.startsWith('blob:')) {
            URL.revokeObjectURL(videoPreview)
        }
        setVideoPreview(null)
        setVideoRemoved(true)
        if (videoInputRef.current) {
            videoInputRef.current.value = ''
        }
    }

    const triggerVideoInput = () => {
        // Use setTimeout to ensure ref is available after render
        setTimeout(() => {
            if (videoInputRef.current) {
                videoInputRef.current.click()
            } else {
                console.warn('Video input ref not available')
                // Fallback: create a new input element
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'video/*'
                input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0]
                    if (file) {
                        handleVideoSelect(e as any)
                    }
                }
                input.click()
            }
        }, 0)
    }

    const handleVideoChangeClick = (e: React.MouseEvent<HTMLDivElement>) => {
        // Only trigger if clicking directly on the drag & drop container
        // Check if the click target is the container itself or a direct child
        const target = e.target as HTMLElement
        const currentTarget = e.currentTarget as HTMLElement
        
        // If clicking on a button or input, don't trigger
        if (target.tagName === 'BUTTON' || target.tagName === 'INPUT' || target.closest('button') || target.closest('input')) {
            return
        }
        
        // Only trigger if clicking within the drag & drop area
        if (!currentTarget.contains(target)) {
            return
        }
        
        // Prevent event from bubbling to parent elements (form, etc.)
        e.stopPropagation()
        e.preventDefault()
        triggerVideoInput()
    }

    const handleVideoDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDraggingVideo(false)
        const file = e.dataTransfer.files[0]
        if (file && file.type.startsWith('video/')) {
            const maxSize = 500 * 1024 * 1024 // 500MB
            if (file.size > maxSize) {
                toast.error('Kích thước file video không được vượt quá 500MB')
                return
            }
            setVideoFile(file)
            setVideoPreview(URL.createObjectURL(file))
            setVideoRemoved(false)
            toast.success(`Đã chọn video: ${file.name} (${formatFileSize(file.size)})`)

            // Reset input value to allow re-selection of the same file
            if (videoInputRef.current) {
                videoInputRef.current.value = ''
            }
        } else {
            toast.error('Vui lòng chọn file video')
        }
    }

    const handleVideoDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDraggingVideo(true)
    }

    const handleVideoDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        setIsDraggingVideo(false)
    }



    const performSubmit = async () => {
        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài học')
            return
        }

        // Video is required
        if (!videoFile && !videoPreview) {
            toast.error('Vui lòng tải lên video bài học')
            return
        }

        try {
            const submitData: CreateLessonRequest | UpdateLessonRequest = {
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                content: formData.content.trim() || undefined,
                completionThreshold: formData.completionThreshold,
                isPreview: formData.isPreview,
                isPublished: formData.isPublished,
            }

            // Pass autoCreateTranscript flag to parent component
            await onSubmit(submitData, videoFile || undefined, autoCreateTranscript)
        } catch (error: any) {
            console.error('Error submitting lesson:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    const handleSubmitClick = () => {
        // Only show confirmation dialog when editing (lesson exists)
        // For new lessons, submit directly without dialog
        if (lesson) {
            // Editing mode: show confirmation dialog
            if (showUpdateWarningDialog) return
            setPendingSubmit(() => performSubmit)
            setShowUpdateWarningDialog(true)
        } else {
            // Create mode: submit directly
            performSubmit()
        }
    }


    const handleConfirmUpdate = async () => {
        if (!pendingSubmit) return
        
        // Close dialog first
        setShowUpdateWarningDialog(false)
        
        const submitFn = pendingSubmit
        setPendingSubmit(null)
        
        // Execute submit after closing dialog
        await submitFn()
    }

    const handleCancelUpdate = () => {
        setShowUpdateWarningDialog(false)
        setPendingSubmit(null)
    }

    const handleRequestTranscript = async () => {
        if (!lesson?.id || !lesson?.videoUrl) {
            toast.error('Bài học phải có video để tạo transcript')
            return
        }

        // Check if there's a new video that hasn't been saved yet
        if (videoFile) {
            if (lesson.transcriptStatus === 'processing') {
                toast.warning('Transcript đang được tạo từ video cũ. Vui lòng lưu video mới để hủy transcript cũ và tạo transcript mới.')
            } else {
                toast.warning('Vui lòng lưu video mới trước khi tạo transcript. Transcript sẽ được tạo từ video đã lưu.')
            }
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

        setIsRequestingTranscript(true)
        try {
            await instructorLessonsApi.requestTranscript(courseId, lesson.id)
            toast.success('Đã yêu cầu tạo transcript. Quá trình xử lý sẽ bắt đầu trong giây lát.')
            // Reload lesson data by calling onCancel and reopening (parent component should handle refresh)
            // Or we could add a callback prop to refresh lesson data
        } catch (error: any) {
            console.error('Error requesting transcript:', error)
            // Error toast is already shown by API client interceptor
        } finally {
            setIsRequestingTranscript(false)
        }
    }

    return (
        <>
        <form 
            onSubmit={(e) => {
                e.preventDefault()
                // Prevent default form submission
            }} 
            className="flex flex-col h-full overflow-x-hidden"
        >
            <div className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar">
                {/* Three-column layout for Basic Info, Media, and Settings */}
                <div className="grid grid-cols-1 lg:grid-cols-[3fr_3fr_2fr] gap-6 mb-8 min-w-0">
                    {/* Left Column: Basic Info */}
                    <div className="space-y-6 min-w-0">
                        {/* Basic Information Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                                <FileText className="h-5 w-5 text-blue-500" />
                                <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="title" className="text-white flex items-center gap-2 mb-2">
                                        Tiêu đề <span className="text-red-500">*</span>
                                        {lesson && isFieldChanged('title') && (
                                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                        )}
                                    </Label>
                                    <Input
                                        id="title"
                                        type="text"
                                        value={formData.title}
                                        onChange={(e) =>
                                            setFormData({ ...formData, title: e.target.value })
                                        }
                                        placeholder="Nhập tiêu đề bài học"
                                        className={`bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 py-3 w-full max-w-full ${
                                            lesson && isFieldChanged('title') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                                        }`}
                                        spellCheck={false}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                        required
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="description" className="text-white flex items-center gap-2 mb-2">
                                        Mô tả
                                        {lesson && isFieldChanged('description') && (
                                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                        )}
                                    </Label>
                                    <Textarea
                                        id="description"
                                        value={formData.description}
                                        onChange={(e) =>
                                            setFormData({ ...formData, description: e.target.value })
                                        }
                                        placeholder="Nhập mô tả bài học (tùy chọn)"
                                        className={`bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[140px] w-full max-w-full break-words ${
                                            lesson && isFieldChanged('description') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                                        }`}
                                        rows={6}
                                        spellCheck={false}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>

                                <div>
                                    <Label htmlFor="content" className="text-white flex items-center gap-2 mb-2">
                                        Nội dung chi tiết
                                        {lesson && isFieldChanged('content') && (
                                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                        )}
                                    </Label>
                                    <Textarea
                                        id="content"
                                        value={formData.content}
                                        onChange={(e) =>
                                            setFormData({ ...formData, content: e.target.value })
                                        }
                                        placeholder="Nhập nội dung bài học chi tiết (tùy chọn)"
                                        className={`bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[250px] max-h-[250px] w-full max-w-full break-words ${
                                            lesson && isFieldChanged('content') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                                        }`}
                                        rows={8}
                                        spellCheck={false}
                                        autoCorrect="off"
                                        autoCapitalize="off"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Media & Documents */}
                    <div className="space-y-6">
                        {/* Media Section */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                                <Upload className="h-5 w-5 text-purple-500" />
                                <h3 className="text-lg font-semibold text-white">Media & Tài liệu</h3>
                            </div>

                            {/* Video Upload */}
                            <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Label className="text-white flex items-center gap-2">
                            <Video className="h-4 w-4 text-gray-400" />
                            <span>Video bài học</span>
                            <span className="text-red-500">*</span>
                            {videoFile !== null && (
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                            )}
                            {lesson && videoRemoved && !videoFile && !videoPreview && (
                                <div className="flex items-center gap-1.5 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded-md">
                                    <AlertCircle className="h-3.5 w-3.5 text-green-400" />
                                    <span className="text-xs text-green-400 font-medium">Đã xóa video</span>
                                </div>
                            )}
                        </Label>
                        <div className="group relative">
                            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                            <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                Video bài học là bắt buộc và sẽ được phát trong trình phát video. Kích thước tối đa 500MB, định dạng: MP4, WebM, MOV, AVI.
                            </div>
                        </div>
                    </div>

                    {videoPreview ? (
                        <div className="space-y-3">
                            {/* Preview Video */}
                            <div className={`relative w-full aspect-video rounded-lg overflow-hidden border-2 transition-all group ${
                                videoFile !== null
                                    ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                                    : lesson && videoRemoved
                                    ? 'border-green-500 ring-2 ring-green-500/30 shadow-lg shadow-green-500/20'
                                    : 'border-[#2D2D2D]'
                            }`}>
                                <video
                                    src={videoPreview}
                                    controls
                                    className="w-full h-full object-contain bg-black"
                                >
                                    Trình duyệt của bạn không hỗ trợ video.
                                </video>
                                {/* Overlay with actions */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-3 pointer-events-none group/overlay">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            triggerVideoInput()
                                        }}
                                        className="!bg-white/90 hover:!bg-white !text-gray-900 !border-0 pointer-events-auto cursor-pointer"
                                        size="sm"
                                    >
                                        <Video className="h-4 w-4 mr-2" />
                                        Thay đổi
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            handleRemoveVideo()
                                        }}
                                        className="!bg-red-600/90 hover:!bg-red-700 !text-white !border-0 pointer-events-auto cursor-pointer"
                                        size="sm"
                                    >
                                        <X className="h-4 w-4 mr-2" />
                                        Xóa
                                    </Button>
                                </div>
                                {/* Status badge */}
                                {videoFile !== null && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                        <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">Mới tải lên</span>
                                    </div>
                                )}
                                {lesson && videoRemoved && !videoFile && (
                                    <div className="absolute top-3 right-3 px-2 py-1 bg-green-500/90 backdrop-blur-sm rounded-md flex items-center gap-1.5">
                                        <AlertCircle className="h-3.5 w-3.5 text-white" />
                                        <span className="text-xs font-medium text-white">Đã xóa</span>
                                    </div>
                                )}
                            </div>

                            {/* File Info */}
                            {videoFile && (
                                <div className="flex items-center justify-between p-3 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 rounded-lg">
                                            <Video className="h-4 w-4 text-blue-400" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-medium text-white">{videoFile.name}</p>
                                            <p className="text-xs text-gray-400">{formatFileSize(videoFile.size)}</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={handleRemoveVideo}
                                        className="p-1.5 hover:bg-red-500/10 rounded-lg transition-colors"
                                        title="Xóa video"
                                    >
                                        <X className="h-4 w-4 text-gray-400 hover:text-red-400" />
                                    </button>
                                </div>
                            )}

                            {/* Upload Progress */}
                            {isUploadingVideo && (
                                <div className="p-3 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg">
                                    <Progress value={videoUploadProgress} className="h-2 mb-2" />
                                    <p className="text-xs text-gray-400">
                                        Đang tải lên: {videoUploadProgress}%
                                    </p>
                                </div>
                            )}

                            {/* Always visible action buttons below preview */}
                            <div className="flex justify-center gap-3 mt-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={(e) => {
                                        e.stopPropagation()
                                        triggerVideoInput()
                                    }}
                                    className="flex-1 !bg-white/95 hover:!bg-white !text-gray-900 !border-0 backdrop-blur-sm cursor-pointer"
                                    size="sm"
                                >
                                    <Video className="h-4 w-4 mr-2" />
                                    Thay đổi
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleRemoveVideo}
                                    className="!bg-red-600/95 hover:!bg-red-700 !text-white !border-0 backdrop-blur-sm cursor-pointer"
                                    size="sm"
                                >
                                    <X className="h-4 w-4 mr-2" />
                                    Xóa
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* Drag & Drop Area */
                        <div
                            onDrop={handleVideoDrop}
                            onDragOver={handleVideoDragOver}
                            onDragLeave={handleVideoDragLeave}
                            onClick={handleVideoChangeClick}
                            className={`relative w-full aspect-video rounded-lg border-2 border-dashed transition-all cursor-pointer group ${
                                isDraggingVideo
                                    ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
                                    : 'border-[#2D2D2D] bg-[#1F1F1F] hover:border-gray-600 hover:bg-[#2A2A2A]'
                            }`}
                        >
                            <input
                                ref={videoInputRef}
                                type="file"
                                accept="video/*"
                                onChange={handleVideoSelect}
                                className="hidden"
                            />
                            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 pointer-events-none">
                                <div className={`p-4 rounded-full transition-colors pointer-events-none ${
                                    isDraggingVideo ? 'bg-blue-500/20' : 'bg-gray-700/50 group-hover:bg-gray-600/50'
                                }`}>
                                    <Video className={`h-8 w-8 transition-colors ${
                                        isDraggingVideo ? 'text-blue-400' : 'text-gray-400 group-hover:text-gray-300'
                                    }`} />
                                </div>
                                <div className="text-center pointer-events-none">
                                    <p className="text-sm font-medium text-white mb-1">
                                        {isDraggingVideo ? 'Thả video vào đây' : 'Kéo thả video hoặc click để chọn'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        MP4, WebM, MOV, AVI (tối đa 500MB)
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                            {/* Auto-create Transcript Checkbox - moved below video */}
                            <div className={`group relative p-4 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg transition-colors ${
                                lesson?.transcriptUrl ? 'opacity-60' : 'hover:border-purple-500/50'
                            }`}>
                                <div className="flex items-start gap-3">
                                    <Checkbox
                                        id="autoCreateTranscript"
                                        checked={autoCreateTranscript}
                                        onCheckedChange={(checked) =>
                                            setAutoCreateTranscript(checked as boolean)
                                        }
                                        disabled={!!lesson?.transcriptUrl}
                                        className="border-[#2D2D2D] data-[state=checked]:bg-purple-600 data-[state=checked]:border-purple-600 h-5 w-5 mt-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Label 
                                                htmlFor="autoCreateTranscript" 
                                                className={`font-medium flex items-center gap-2 ${
                                                    lesson?.transcriptUrl 
                                                        ? 'text-gray-500 cursor-not-allowed' 
                                                        : 'text-white cursor-pointer'
                                                }`}
                                            >
                                                Tự động tạo transcript
                                            </Label>
                                            <div className="group/help relative">
                                                <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                                <div className="absolute left-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                    {lesson?.transcriptUrl 
                                                        ? 'Bài học đã có transcript, không thể tự động tạo lại.'
                                                        : 'Nếu bật, hệ thống sẽ tự động tạo transcript (phụ đề) từ video bằng AI Whisper sau khi bài học được lưu. Transcript sẽ được tạo trong vài phút.'}
                                                </div>
                                            </div>
                                        </div>
                                        <p className={`text-xs ${
                                            lesson?.transcriptUrl ? 'text-gray-500' : 'text-gray-400'
                                        }`}>
                                            {lesson?.transcriptUrl 
                                                ? 'Bài học đã có transcript, không thể tự động tạo lại'
                                                : 'Tự động tạo phụ đề từ video sau khi lưu bài học'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                </div>

                            {/* Transcript Info */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <Label className="text-white flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-gray-400" />
                                        <span>Transcript (Phụ đề)</span>
                                        {lesson?.transcriptUrl && (
                                            <>
                                                <span className="text-xs text-green-400 font-medium">• Đã có</span>
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            </>
                                        )}
                                    </Label>
                                    <div className="group relative">
                                        <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                        <div className="absolute right-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                            Transcript sẽ được tự động tạo từ video bằng AI Whisper. Bạn có thể chỉnh sửa transcript sau khi tạo.
                                        </div>
                                    </div>
                                </div>

                                {/* Transcript status */}
                                {lesson?.transcriptStatus === 'completed' || (lesson?.transcriptUrl && !lesson?.transcriptStatus) ? (
                                    <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5 flex-shrink-0" />
                                            <div className="flex-1">
                                                <p className="text-xs font-medium text-green-400 mb-1">
                                                    Transcript đã có sẵn
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Video này đã có transcript được tạo tự động. Bạn có thể xem và chỉnh sửa transcript nếu cần.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : lesson?.transcriptStatus === 'processing' ? (
                                    <div className="space-y-2">
                                        {videoFile ? (
                                            <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-orange-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-orange-400 mb-1">
                                                            Transcript đang được tạo từ video cũ
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Bạn đã upload video mới nhưng chưa lưu. Khi lưu video mới, transcript đang tạo sẽ bị hủy và hệ thống sẽ tự động tạo transcript mới từ video mới.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <Loader2 className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0 animate-spin" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-yellow-400 mb-1">
                                                            Đang tạo transcript
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Hệ thống đang tạo transcript từ video. Quá trình này có thể mất vài phút.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : lesson?.transcriptStatus === 'failed' ? (
                                    <div className="space-y-2">
                                        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                                            <div className="flex items-start gap-2">
                                                <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                                                <div className="flex-1">
                                                    <p className="text-xs font-medium text-red-400 mb-1">
                                                        Tạo transcript thất bại
                                                    </p>
                                                    <p className="text-xs text-gray-400">
                                                        Quá trình tạo transcript đã thất bại. Vui lòng thử lại.
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                        {lesson?.videoUrl && (
                                            <div className="relative group">
                                                <Button
                                                    type="button"
                                                    onClick={handleRequestTranscript}
                                                    disabled={isRequestingTranscript || !!videoFile}
                                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isRequestingTranscript ? (
                                                        <>
                                                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                            Đang yêu cầu...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Sparkles className="h-4 w-4 mr-2" />
                                                            Yêu cầu tạo transcript
                                                        </>
                                                    )}
                                                </Button>
                                                {videoFile && (
                                                    <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                        Vui lòng lưu video mới trước khi tạo transcript. Transcript sẽ được tạo từ video đã lưu trong hệ thống.
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ) : lesson?.videoUrl ? (
                                    <div className="space-y-2">
                                        {videoFile ? (
                                            <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-yellow-400 mb-1">
                                                            Video mới chưa được lưu
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Vui lòng lưu video mới trước khi tạo transcript. Transcript sẽ được tạo từ video đã lưu trong hệ thống.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                                                <div className="flex items-start gap-2">
                                                    <AlertCircle className="h-4 w-4 text-blue-400 mt-0.5 flex-shrink-0" />
                                                    <div className="flex-1">
                                                        <p className="text-xs font-medium text-blue-400 mb-1">
                                                            Chưa có transcript
                                                        </p>
                                                        <p className="text-xs text-gray-400">
                                                            Bạn có thể yêu cầu hệ thống tạo transcript tự động từ video bằng AI Whisper.
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <div className="relative group">
                                            <Button
                                                type="button"
                                                onClick={handleRequestTranscript}
                                                disabled={isRequestingTranscript || !!videoFile}
                                                className="w-full bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {isRequestingTranscript ? (
                                                    <>
                                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                                        Đang yêu cầu...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Sparkles className="h-4 w-4 mr-2" />
                                                        Yêu cầu tạo transcript
                                                    </>
                                                )}
                                            </Button>
                                            {videoFile && (
                                                <div className="absolute bottom-full left-0 mb-2 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                    Vui lòng lưu video mới trước khi tạo transcript. Transcript sẽ được tạo từ video đã lưu trong hệ thống.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-3 bg-gray-500/10 border border-gray-500/30 rounded-lg">
                                        <div className="flex items-start gap-2">
                                            <AlertCircle className="h-4 w-4 text-gray-400 mt-0.5 flex-shrink-0" />
                                            <div>
                                                <p className="text-xs font-medium text-gray-400 mb-1">
                                                    Chưa có video
                                                </p>
                                                <p className="text-xs text-gray-400">
                                                    Vui lòng tải lên video để có thể tạo transcript.
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Third Column: Settings */}
                    <div className="space-y-6">
                        {/* Settings Section */}
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                                <Video className="h-5 w-5 text-green-500" />
                                <h3 className="text-lg font-semibold text-white">Cài đặt bài học</h3>
                            </div>

                            <div className="space-y-4">
                                {/* Completion Threshold Dropdown */}
                                <div>
                                    <Label htmlFor="completionThreshold" className="text-white flex items-center gap-2 mb-2">
                                        Ngưỡng hoàn thành video <span className="text-red-500">*</span>
                                        {lesson && isFieldChanged('completionThreshold') && (
                                            <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                        )}
                                        <div className="group/help relative">
                                            <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                            <div className="absolute left-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                Phần trăm video học viên cần xem để được tính là hoàn thành bài học. Ví dụ: 70% nghĩa là học viên phải xem ít nhất 70% tổng thời lượng video.
                                            </div>
                                        </div>
                                    </Label>
                                    <Select
                                        value={isNaN(formData.completionThreshold) ? "0.7" : formData.completionThreshold.toFixed(1)}
                                        onValueChange={(value) => {
                                            const parsed = parseFloat(value)
                                            if (!isNaN(parsed) && parsed >= 0 && parsed <= 1) {
                                                setFormData({ ...formData, completionThreshold: parsed })
                                            }
                                        }}
                                    >
                                        <DarkOutlineSelectTrigger className={`bg-[#1A1A1A] border-[#2D2D2D] text-white ${
                                            lesson && isFieldChanged('completionThreshold') ? 'border-green-500 ring-1 ring-green-500/50' : ''
                                        }`}>
                                            <SelectValue placeholder="Chọn ngưỡng hoàn thành" />
                                        </DarkOutlineSelectTrigger>
                                        <DarkOutlineSelectContent>
                                            <DarkOutlineSelectItem value="0.1">10%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.2">20%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.3">30%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.4">40%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.5">50%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.6">60%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.7">70%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.8">80%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="0.9">90%</DarkOutlineSelectItem>
                                            <DarkOutlineSelectItem value="1.0">100%</DarkOutlineSelectItem>
                                        </DarkOutlineSelectContent>
                                    </Select>
                                    <p className="text-xs text-gray-400 mt-1.5">
                                        Học viên cần xem {isNaN(formData.completionThreshold) ? 70 : Math.round(formData.completionThreshold * 100)}% video để hoàn thành bài học
                                    </p>
                                </div>

                                {/* Publish Checkbox */}
                                <div className="group relative p-4 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg hover:border-green-500/50 transition-colors">
                                    <div className="flex items-start gap-3">
                                        <Checkbox
                                            id="isPublished"
                                            checked={formData.isPublished}
                                            onCheckedChange={(checked) =>
                                                setFormData({ ...formData, isPublished: checked as boolean })
                                            }
                                            className="border-[#2D2D2D] data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600 h-5 w-5 mt-0.5"
                                        />
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Label htmlFor="isPublished" className="text-white font-medium cursor-pointer flex items-center gap-2">
                                                    Xuất bản ngay
                                                    {lesson && isFieldChanged('isPublished') && (
                                                        <Circle className="h-2 w-2 fill-green-500 text-green-500" />
                                                    )}
                                                </Label>
                                                <div className="group/help relative">
                                                    <HelpCircle className="h-4 w-4 text-gray-400 cursor-help" />
                                                    <div className="absolute left-0 top-6 w-64 p-2 bg-[#1F1F1F] border border-[#2D2D2D] rounded-lg text-xs text-gray-300 opacity-0 group-hover/help:opacity-100 transition-opacity pointer-events-none z-10 shadow-lg">
                                                        Nếu bật, bài học sẽ được xuất bản ngay sau khi tạo và học viên có thể xem. Nếu tắt, bài học sẽ ở trạng thái draft và chỉ bạn mới thấy được.
                                                    </div>
                                                </div>
                                            </div>
                                            <p className="text-xs text-gray-400">
                                                Bài học sẽ hiển thị cho học viên ngay sau khi tạo
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Note */}
                                <div className="bg-[#1F1F1F] p-4 rounded-lg border border-[#2D2D2D]">
                                    <p className="text-sm text-gray-400">
                                        <strong>Lưu ý:</strong> Thứ tự bài học sẽ được tự động sắp xếp. Bạn có thể kéo thả để thay đổi thứ tự sau khi tạo.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <DialogFooter className="sticky bottom-0 bg-[#1A1A1A] border-t border-[#2D2D2D] py-4 -mx-8 px-8 gap-2 flex-shrink-0 mt-auto">
                <div className="flex items-center justify-between w-full gap-4">
                    {/* Change indicator - Left side */}
                    {lesson && hasChanges() && (
                        <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/30 rounded-lg">
                            <AlertCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-sm text-green-500 font-medium whitespace-nowrap">Có thay đổi chưa lưu</span>
                        </div>
                    )}

                    {/* Action buttons - Right side */}
                    <div className="flex items-center gap-2 ml-auto">
                        <DarkOutlineButton
                            type="button"
                            onClick={onCancel}
                            disabled={loading || isUploadingVideo}
                        >
                            Hủy
                        </DarkOutlineButton>
                        <Button
                            type="button"
                            onClick={handleSubmitClick}
                            disabled={loading || isUploadingVideo || showUpdateWarningDialog || Boolean(lesson && !hasChanges())}
                            className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : lesson ? (
                                'Cập nhật'
                            ) : (
                                'Tạo mới'
                            )}
                        </Button>
                    </div>
                </div>
            </DialogFooter>
        </form>

        {/* Update Warning Dialog */}
        <Dialog 
            open={showUpdateWarningDialog} 
            onOpenChange={(open) => {
                if (!open) {
                    handleCancelUpdate()
                }
            }}
        >
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] max-w-lg">
                <DialogHeader>
                    <DialogTitle className="text-white flex items-center gap-2">
                        <AlertCircle className="h-5 w-5 text-orange-500" />
                        Xác nhận cập nhật bài học
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Có một số thay đổi quan trọng sẽ xảy ra khi bạn cập nhật bài học này.
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                        <div className="flex items-start gap-3">
                            <AlertCircle className="h-5 w-5 text-orange-400 mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                                <h4 className="text-sm font-semibold text-orange-400 mb-3">
                                    Xác nhận cập nhật bài học
                                </h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-gray-300 mb-1.5">Các thay đổi sẽ được áp dụng:</p>
                                        <ul className="text-xs text-gray-400 space-y-1.5 list-disc list-inside ml-2">
                                            {formData.title.trim() !== (lesson?.title || '') && (
                                                <li>Tiêu đề bài học sẽ được cập nhật</li>
                                            )}
                                            {formData.description.trim() !== (lesson?.description || '') && (
                                                <li>Mô tả bài học sẽ được cập nhật</li>
                                            )}
                                            {formData.content.trim() !== (lesson?.content || '') && (
                                                <li>Nội dung bài học sẽ được cập nhật</li>
                                            )}
                                            {formData.completionThreshold !== (lesson?.completionThreshold ?? 0.7) && (
                                                <li>Ngưỡng hoàn thành sẽ thay đổi từ {Math.round((lesson?.completionThreshold ?? 0.7) * 100)}% sang {Math.round(formData.completionThreshold * 100)}%</li>
                                            )}
                                            {formData.isPublished !== (lesson?.isPublished || false) && (
                                                <li>Trạng thái "Xuất bản" sẽ được thay đổi</li>
                                            )}
                                            {videoFile && (
                                                <>
                                                    <li>Video cũ sẽ bị thay thế bằng video mới</li>
                                                    {lesson?.transcriptUrl && (
                                                        <li>Transcript hiện tại sẽ bị xóa và hệ thống sẽ tự động tạo transcript mới từ video mới</li>
                                                    )}
                                                    {lesson?.transcriptStatus === 'processing' && (
                                                        <li>Quá trình tạo transcript từ video cũ đang diễn ra sẽ bị hủy</li>
                                                    )}
                                                    {(!lesson?.transcriptUrl && lesson?.transcriptStatus !== 'processing') && (
                                                        <li>Hệ thống sẽ tự động tạo transcript mới từ video mới sau khi lưu</li>
                                                    )}
                                                    <li>Quá trình upload và xử lý video mới có thể mất vài phút</li>
                                                </>
                                            )}
                                            {videoRemoved && !videoFile && !videoPreview && lesson?.videoUrl && (
                                                <li>Video sẽ bị xóa khỏi bài học</li>
                                            )}
                                        </ul>
                                    </div>
                                    {videoFile && lesson?.transcriptStatus === 'processing' && (
                                        <div className="pt-2 border-t border-orange-500/20">
                                            <p className="text-xs text-orange-300">
                                                <strong>Lưu ý:</strong> Transcript đang được tạo từ video cũ sẽ bị hủy ngay lập tức.
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                        <p className="text-xs text-gray-300">
                            <strong className="text-blue-400">Xác nhận:</strong> Bạn có chắc chắn muốn tiếp tục cập nhật bài học với các thay đổi trên không?
                        </p>
                    </div>
                </div>
                <DialogFooter>
                    <DarkOutlineButton
                        onClick={handleCancelUpdate}
                        disabled={loading || isUploadingVideo}
                    >
                        Hủy
                    </DarkOutlineButton>
                    <Button
                        onClick={handleConfirmUpdate}
                        disabled={loading || isUploadingVideo}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                        {loading || isUploadingVideo ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            'Xác nhận'
                        )}
                    </Button>
            </DialogFooter>
        </DialogContent>
        </Dialog>
        </>
    )
}

