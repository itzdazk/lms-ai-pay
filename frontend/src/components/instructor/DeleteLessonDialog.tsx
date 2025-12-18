import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2 } from 'lucide-react'
import type { Lesson } from '../../lib/api/types'

interface DeleteLessonDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deletingLesson: Lesson | null
    onSubmit: () => Promise<void>
    onCancel: () => void
    submitting: boolean
}

export function DeleteLessonDialog({
    open,
    onOpenChange,
    deletingLesson,
    onSubmit,
    onCancel,
    submitting,
}: DeleteLessonDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                <DialogHeader>
                    <DialogTitle className="text-white">Xóa Bài học</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Bạn có chắc chắn muốn xóa bài học <strong className="text-white">"{deletingLesson?.title}"</strong>?
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DarkOutlineButton
                        onClick={onCancel}
                        disabled={submitting}
                    >
                        Hủy
                    </DarkOutlineButton>
                    <Button
                        onClick={onSubmit}
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
    )
}

