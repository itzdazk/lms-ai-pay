import { useState, useEffect, useRef } from 'react'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Loader2, X, Video, FileText, Upload } from 'lucide-react'
import { toast } from 'sonner'
import type { Lesson, CreateLessonRequest, UpdateLessonRequest } from '../../lib/api/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'
import { Progress } from '../ui/progress'

interface LessonFormProps {
    lesson?: Lesson | null
    courseId: number
    chapterId?: number
    onSubmit: (
        data: CreateLessonRequest | UpdateLessonRequest,
        videoFile?: File,
        transcriptFile?: File
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
        isPreview: false,
        isPublished: false,
    })

    const [videoFile, setVideoFile] = useState<File | null>(null)
    const [transcriptFile, setTranscriptFile] = useState<File | null>(null)
    const [videoPreview, setVideoPreview] = useState<string | null>(null)
    const [videoUploadProgress, setVideoUploadProgress] = useState(0)
    const [transcriptUploadProgress, setTranscriptUploadProgress] = useState(0)
    const [isUploadingVideo, setIsUploadingVideo] = useState(false)
    const [isUploadingTranscript, setIsUploadingTranscript] = useState(false)

    const videoInputRef = useRef<HTMLInputElement>(null)
    const transcriptInputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (lesson) {
            setFormData({
                title: lesson.title || '',
                description: lesson.description || '',
                content: lesson.content || '',
                lessonOrder: lesson.lessonOrder || 0,
                isPreview: lesson.isPreview || false,
                isPublished: lesson.isPublished || false,
            })

            if (lesson.videoUrl) {
                setVideoPreview(lesson.videoUrl)
            }
        }
    }, [lesson])

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
            return
        }

        // Check file size (e.g., max 500MB)
        const maxSize = 500 * 1024 * 1024 // 500MB
        if (file.size > maxSize) {
            toast.error('Kích thước file video không được vượt quá 500MB')
            return
        }

        setVideoFile(file)
        const reader = new FileReader()
        reader.onloadend = () => {
            // For video, we can't preview easily, so just show file name
            setVideoPreview(URL.createObjectURL(file))
        }
        reader.readAsDataURL(file)
        toast.success(`Đã chọn video: ${file.name} (${formatFileSize(file.size)})`)
    }

    const handleTranscriptSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Accept text files and common transcript formats
        const allowedTypes = [
            'text/plain',
            'text/vtt',
            'application/x-subrip',
            'text/srt',
        ]
        const allowedExtensions = ['.txt', '.vtt', '.srt']

        const fileExtension = file.name
            .substring(file.name.lastIndexOf('.'))
            .toLowerCase()
        const isValidType =
            allowedTypes.includes(file.type) ||
            allowedExtensions.includes(fileExtension)

        if (!isValidType) {
            toast.error(
                'Vui lòng chọn file transcript hợp lệ (.txt, .vtt, .srt)'
            )
            return
        }

        setTranscriptFile(file)
        toast.success(`Đã chọn transcript: ${file.name} (${formatFileSize(file.size)})`)
    }

    const handleRemoveVideo = () => {
        setVideoFile(null)
        setVideoPreview(null)
        if (videoInputRef.current) {
            videoInputRef.current.value = ''
        }
    }

    const handleRemoveTranscript = () => {
        setTranscriptFile(null)
        if (transcriptInputRef.current) {
            transcriptInputRef.current.value = ''
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề bài học')
            return
        }

        try {
            const submitData: CreateLessonRequest | UpdateLessonRequest = {
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                content: formData.content.trim() || undefined,
                // Don't send lessonOrder - let backend calculate it
                isPreview: formData.isPreview,
                isPublished: formData.isPublished,
            }

            await onSubmit(submitData, videoFile || undefined, transcriptFile || undefined)
        } catch (error: any) {
            console.error('Error submitting lesson:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Information Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <h3 className="text-lg font-semibold text-white">Thông tin cơ bản</h3>
                </div>

                <div className="space-y-4">
                    <div>
                        <Label htmlFor="title" className="text-white mb-2 block">
                            Tiêu đề <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="title"
                            type="text"
                            value={formData.title}
                            onChange={(e) =>
                                setFormData({ ...formData, title: e.target.value })
                            }
                            placeholder="Nhập tiêu đề bài học"
                            className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500"
                            required
                        />
                    </div>

                    <div>
                        <Label htmlFor="description" className="text-white mb-2 block">
                            Mô tả
                        </Label>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) =>
                                setFormData({ ...formData, description: e.target.value })
                            }
                            placeholder="Nhập mô tả bài học (tùy chọn)"
                            className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[100px]"
                            rows={4}
                        />
                    </div>

                    <div>
                        <Label htmlFor="content" className="text-white mb-2 block">
                            Nội dung chi tiết
                        </Label>
                        <Textarea
                            id="content"
                            value={formData.content}
                            onChange={(e) =>
                                setFormData({ ...formData, content: e.target.value })
                            }
                            placeholder="Nhập nội dung bài học chi tiết (tùy chọn)"
                            className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[150px]"
                            rows={6}
                        />
                    </div>
                </div>
            </div>

            {/* Settings Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                    <Video className="h-5 w-5 text-green-500" />
                    <h3 className="text-lg font-semibold text-white">Cài đặt bài học</h3>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPreview"
                                checked={formData.isPreview}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isPreview: checked as boolean })
                                }
                                className="border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                            />
                            <Label htmlFor="isPreview" className="text-white text-sm cursor-pointer">
                                Bài học preview
                            </Label>
                        </div>

                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="isPublished"
                                checked={formData.isPublished}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, isPublished: checked as boolean })
                                }
                                className="border-[#2D2D2D] data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                            />
                            <Label htmlFor="isPublished" className="text-white text-sm cursor-pointer">
                                Xuất bản ngay
                            </Label>
                        </div>
                    </div>

                    <div className="bg-[#1F1F1F] p-4 rounded-lg border border-[#2D2D2D]">
                        <p className="text-sm text-gray-400">
                            <strong>Lưu ý:</strong> Thứ tự bài học sẽ được tự động sắp xếp. Bạn có thể kéo thả để thay đổi thứ tự sau khi tạo.
                        </p>
                    </div>
                </div>
            </div>

            {/* Media Section */}
            <div className="space-y-6">
                <div className="flex items-center gap-3 pb-2 border-b border-[#2D2D2D]">
                    <Upload className="h-5 w-5 text-purple-500" />
                    <h3 className="text-lg font-semibold text-white">Media & Tài liệu</h3>
                </div>

                {/* Video Upload */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <Video className="h-4 w-4 text-blue-500" />
                        <Label className="text-white font-medium">
                            Video bài học
                        </Label>
                    </div>
                    <div className="space-y-2">
                        {videoPreview || videoFile ? (
                            <div className="relative bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Video className="h-5 w-5 text-blue-500" />
                                        <div>
                                            <p className="text-white text-sm font-medium">
                                                {videoFile?.name || 'Video đã tải lên'}
                                            </p>
                                            {videoFile && (
                                                <p className="text-gray-400 text-xs">
                                                    {formatFileSize(videoFile.size)}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveVideo}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {isUploadingVideo && (
                                    <div className="mt-3">
                                        <Progress value={videoUploadProgress} className="h-2" />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Đang tải lên: {videoUploadProgress}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-[#2D2D2D] rounded-lg p-6 text-center hover:border-blue-500 transition-colors">
                                <input
                                    ref={videoInputRef}
                                    type="file"
                                    accept="video/*"
                                    onChange={handleVideoSelect}
                                    className="hidden"
                                    id="video-upload"
                                />
                                <label
                                    htmlFor="video-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <Upload className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-400">
                                        Click để chọn video hoặc kéo thả file vào đây
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Hỗ trợ: MP4, AVI, MOV (Tối đa 500MB)
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>

                {/* Transcript Upload */}
                <div>
                    <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-4 w-4 text-green-500" />
                        <Label className="text-white font-medium">
                            Transcript (Phụ đề)
                        </Label>
                    </div>
                    <div className="space-y-2">
                        {transcriptFile ? (
                            <div className="relative bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <FileText className="h-5 w-5 text-green-500" />
                                        <div>
                                            <p className="text-white text-sm font-medium">
                                                {transcriptFile.name}
                                            </p>
                                            <p className="text-gray-400 text-xs">
                                                {formatFileSize(transcriptFile.size)}
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleRemoveTranscript}
                                        className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                                    >
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                                {isUploadingTranscript && (
                                    <div className="mt-3">
                                        <Progress value={transcriptUploadProgress} className="h-2" />
                                        <p className="text-xs text-gray-400 mt-1">
                                            Đang tải lên: {transcriptUploadProgress}%
                                        </p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="border-2 border-dashed border-[#2D2D2D] rounded-lg p-6 text-center hover:border-green-500 transition-colors">
                                <input
                                    ref={transcriptInputRef}
                                    type="file"
                                    accept=".txt,.vtt,.srt,text/plain,text/vtt,application/x-subrip"
                                    onChange={handleTranscriptSelect}
                                    className="hidden"
                                    id="transcript-upload"
                                />
                                <label
                                    htmlFor="transcript-upload"
                                    className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                    <FileText className="h-8 w-8 text-gray-400" />
                                    <span className="text-sm text-gray-400">
                                        Click để chọn file transcript hoặc kéo thả file vào đây
                                    </span>
                                    <span className="text-xs text-gray-500">
                                        Hỗ trợ: .txt, .vtt, .srt
                                    </span>
                                </label>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <DialogFooter className="gap-2">
                <DarkOutlineButton
                    type="button"
                    onClick={onCancel}
                    disabled={loading || isUploadingVideo || isUploadingTranscript}
                >
                    Hủy
                </DarkOutlineButton>
                <Button
                    type="submit"
                    disabled={loading || isUploadingVideo || isUploadingTranscript}
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
            </DialogFooter>
        </form>
    )
}

