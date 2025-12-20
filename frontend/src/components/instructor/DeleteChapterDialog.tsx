import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2 } from 'lucide-react'
import type { Chapter } from '../../lib/api/types'

interface DeleteChapterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    deletingChapter: Chapter | null
    onSubmit: () => Promise<void>
    onCancel: () => void
    submitting: boolean
}

export function DeleteChapterDialog({
    open,
    onOpenChange,
    deletingChapter,
    onSubmit,
    onCancel,
    submitting,
}: DeleteChapterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                <DialogHeader>
                    <DialogTitle className="text-white">Xóa Chương</DialogTitle>
                    <DialogDescription className="text-gray-400">
                        Bạn có chắc chắn muốn xóa chương <strong className="text-white">"{deletingChapter?.title}"?</strong> Tất cả bài học trong chương này cũng sẽ bị xóa.
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

