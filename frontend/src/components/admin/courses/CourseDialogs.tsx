import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DarkOutlineButton } from '@/components/ui/buttons';
import { Loader2 } from 'lucide-react';
import type { AdminCourse } from '@/lib/api/admin-courses';

interface CourseDialogsProps {
  isFeaturedDialogOpen: boolean;
  selectedCourse: AdminCourse | null;
  actionLoading: boolean;
  onCloseFeaturedDialog: () => void;
  onConfirmToggleFeatured: () => void;
}

export function CourseDialogs({
  isFeaturedDialogOpen,
  selectedCourse,
  actionLoading,
  onCloseFeaturedDialog,
  onConfirmToggleFeatured,
}: CourseDialogsProps) {
  return (
    <>
      {/* Featured Toggle Dialog */}
      <Dialog open={isFeaturedDialogOpen} onOpenChange={onCloseFeaturedDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse?.isFeatured ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCourse?.isFeatured ? (
                <>Bạn có chắc muốn bỏ đánh dấu nổi bật cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>?</>
              ) : (
                <>
                  Bạn có chắc muốn đánh dấu nổi bật cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>?
                  {selectedCourse?.status !== 'PUBLISHED' && (
                    <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-600/50 rounded text-yellow-300 text-sm">
                      ⚠️ Chỉ có thể đánh dấu nổi bật cho khóa học đã xuất bản.
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DarkOutlineButton
              onClick={onCloseFeaturedDialog}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={onConfirmToggleFeatured}
              disabled={actionLoading || (selectedCourse ? ((selectedCourse.isFeatured !== true) && selectedCourse.status !== 'PUBLISHED') : false)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading ? (
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
  );
}
