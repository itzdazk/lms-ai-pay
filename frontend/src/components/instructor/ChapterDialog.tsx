import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog'
import { ChapterForm } from './ChapterForm'
import type { Chapter, CreateChapterRequest, UpdateChapterRequest } from '../../lib/api/types'

interface ChapterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    editingChapter: Chapter | null
    courseId: number
    onSubmit: (data: CreateChapterRequest | UpdateChapterRequest) => Promise<void>
    onCancel: () => void
    loading: boolean
}

export function ChapterDialog({
    open,
    onOpenChange,
    editingChapter,
    courseId,
    onSubmit,
    onCancel,
    loading,
}: ChapterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] max-w-2xl">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {editingChapter ? 'Chỉnh sửa Chương' : 'Tạo Chương mới'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {editingChapter
                            ? 'Cập nhật thông tin chương'
                            : 'Nhập thông tin để tạo chương mới'}
                    </DialogDescription>
                </DialogHeader>
                <ChapterForm
                    chapter={editingChapter}
                    courseId={courseId}
                    onSubmit={onSubmit}
                    onCancel={onCancel}
                    loading={loading}
                />
            </DialogContent>
        </Dialog>
    )
}

