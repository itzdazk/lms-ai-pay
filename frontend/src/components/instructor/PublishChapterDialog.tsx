import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { Loader2 } from 'lucide-react'
import type { Chapter } from '../../lib/api/types'

interface PublishChapterDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    chapter: Chapter | null
    publishing: boolean
    toPublished: boolean // true: publish, false: unpublish
    onSubmit: () => void
    onCancel: () => void
}

export function PublishChapterDialog({
    open,
    onOpenChange,
    chapter,
    publishing,
    toPublished,
    onSubmit,
    onCancel,
}: PublishChapterDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                <DialogHeader>
                    <DialogTitle className="text-white">
                        {toPublished ? 'Xuất bản chương' : 'Ẩn chương'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                        {toPublished
                            ? <>
                                Bạn có chắc chắn muốn <span className="text-green-400">xuất bản</span> chương <strong className="text-white">"{chapter?.title}"</strong> không?
                              </>
                            : <>
                                Bạn có chắc chắn muốn <span className="text-gray-300">ẩn</span> chương <strong className="text-white">"{chapter?.title}"</strong> không?
                              </>
                        }
                        <div className="mt-3 p-3 rounded bg-yellow-900/60 text-yellow-300 border border-yellow-700 text-sm">
                            <strong>Lưu ý:</strong> Việc này có thể làm ảnh hưởng đến việc học tập của học viên. Học viên sẽ không thể truy cập các bài học trong chương này khi chương bị ẩn.
                        </div>
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <DarkOutlineButton
                        onClick={onCancel}
                        disabled={publishing}
                    >
                        Hủy
                    </DarkOutlineButton>
                    <Button
                        onClick={onSubmit}
                        disabled={publishing}
                        className={toPublished ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-gray-600 hover:bg-gray-700 text-white'}
                    >
                        {publishing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Đang xử lý...
                            </>
                        ) : (
                            toPublished ? 'Xuất bản' : 'Ẩn'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
