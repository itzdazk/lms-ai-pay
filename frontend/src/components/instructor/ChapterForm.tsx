import { useState, useEffect } from 'react'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import { Textarea } from '../ui/textarea'
import { Checkbox } from '../ui/checkbox'
import { Loader2, X, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import type { Chapter, CreateChapterRequest, UpdateChapterRequest } from '../../lib/api/types'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog'

interface ChapterFormProps {
    chapter?: Chapter | null
    courseId: number
    onSubmit: (data: CreateChapterRequest | UpdateChapterRequest) => Promise<void>
    onCancel: () => void
    loading?: boolean
}

export function ChapterForm({
    chapter,
    courseId,
    onSubmit,
    onCancel,
    loading = false,
}: ChapterFormProps) {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        chapterOrder: 0,
        isPublished: true,
    })

    useEffect(() => {
        if (chapter) {
            setFormData({
                title: chapter.title || '',
                description: chapter.description || '',
                chapterOrder: chapter.chapterOrder || 0,
                isPublished: chapter.isPublished ?? true,
            })
        } else {
            // Reset for create mode
            setFormData({
                title: '',
                description: '',
                chapterOrder: 0,
                isPublished: true,
            })
        }
    }, [chapter])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!formData.title.trim()) {
            toast.error('Vui lòng nhập tiêu đề chapter')
            return
        }

        try {
            const submitData: CreateChapterRequest | UpdateChapterRequest = {
                title: formData.title.trim(),
                description: formData.description.trim() || undefined,
                chapterOrder: formData.chapterOrder || undefined,
                isPublished: formData.isPublished,
            }

            await onSubmit(submitData)
        } catch (error: any) {
            console.error('Error submitting chapter:', error)
            // Error toast is already shown by API client interceptor
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        placeholder="Nhập tiêu đề chapter"
                        className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500"
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
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
                        placeholder="Nhập mô tả chapter (tùy chọn)"
                        className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500 min-h-[100px]"
                        rows={4}
                        spellCheck={false}
                        autoCorrect="off"
                        autoCapitalize="off"
                    />
                </div>

                <div>
                    <Label htmlFor="chapterOrder" className="text-white mb-2 block">
                        Thứ tự
                    </Label>
                    <Input
                        id="chapterOrder"
                        type="number"
                        value={formData.chapterOrder}
                        onChange={(e) =>
                            setFormData({
                                ...formData,
                                chapterOrder: parseInt(e.target.value) || 0,
                            })
                        }
                        placeholder="Thứ tự hiển thị"
                        className="bg-[#1A1A1A] border-[#2D2D2D] text-white placeholder:text-gray-500"
                        min={0}
                    />
                    <p className="text-sm text-gray-400 mt-1">
                        Thứ tự sẽ được tự động điều chỉnh khi sắp xếp lại
                    </p>
                </div>

                {/* Publish Toggle */}
                <div className="pt-4 border-t border-[#2D2D2D]">
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="isPublished"
                            checked={formData.isPublished}
                            onCheckedChange={(checked) =>
                                setFormData({ ...formData, isPublished: checked as boolean })
                            }
                            className="border-[#2D2D2D] data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                        />
                        <Label htmlFor="isPublished" className="text-white flex items-center gap-2 cursor-pointer">
                            {formData.isPublished ? (
                                <Eye className="h-4 w-4 text-green-400" />
                            ) : (
                                <EyeOff className="h-4 w-4 text-gray-400" />
                            )}
                            <span>Xuất bản chương</span>
                        </Label>
                    </div>
                    <p className="text-sm text-gray-400 mt-2">
                        {formData.isPublished
                            ? "Chương sẽ hiển thị cho học viên trong khóa học"
                            : "Chương sẽ bị ẩn và chỉ bạn mới thấy được"
                        }
                    </p>
                </div>
            </div>

            <DialogFooter className="gap-2">
                <DarkOutlineButton
                    type="button"
                    onClick={onCancel}
                    disabled={loading}
                >
                    Hủy
                </DarkOutlineButton>
                <Button
                    type="submit"
                    disabled={loading}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    {loading ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Đang lưu...
                        </>
                    ) : chapter ? (
                        'Cập nhật'
                    ) : (
                        'Tạo mới'
                    )}
                </Button>
            </DialogFooter>
        </form>
    )
}

