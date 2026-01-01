import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DarkOutlineButton } from '@/components/ui/buttons';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import type { AdminCourse } from '@/lib/api/admin-courses';

interface CourseDialogsProps {
  isFeaturedDialogOpen: boolean;
  isStatusDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  selectedCourse: AdminCourse | null;
  actionLoading: boolean;
  onCloseFeaturedDialog: () => void;
  onCloseStatusDialog: () => void;
  onCloseDeleteDialog: () => void;
  onConfirmToggleFeatured: () => void;
  onConfirmChangeStatus: (newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => void;
  onConfirmDelete: () => void;
}

export function CourseDialogs({
  isFeaturedDialogOpen,
  isStatusDialogOpen,
  isDeleteDialogOpen,
  selectedCourse,
  actionLoading,
  onCloseFeaturedDialog,
  onCloseStatusDialog,
  onCloseDeleteDialog,
  onConfirmToggleFeatured,
  onConfirmChangeStatus,
  onConfirmDelete,
}: CourseDialogsProps) {
  const [selectedStatus, setSelectedStatus] = useState<'DRAFT' | 'PUBLISHED' | 'ARCHIVED'>('DRAFT');
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

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={onCloseStatusDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Đổi trạng thái khóa học</DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn trạng thái mới cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-2">
            <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#1F1F1F]">
              <input
                type="radio"
                name="status"
                value="DRAFT"
                checked={selectedStatus === 'DRAFT'}
                onChange={(e) => setSelectedStatus(e.target.value as 'DRAFT')}
                className="text-blue-600"
              />
              <span>Bản nháp</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#1F1F1F]">
              <input
                type="radio"
                name="status"
                value="PUBLISHED"
                checked={selectedStatus === 'PUBLISHED'}
                onChange={(e) => setSelectedStatus(e.target.value as 'PUBLISHED')}
                className="text-blue-600"
              />
              <span>Đã xuất bản</span>
            </label>
            <label className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-[#1F1F1F]">
              <input
                type="radio"
                name="status"
                value="ARCHIVED"
                checked={selectedStatus === 'ARCHIVED'}
                onChange={(e) => setSelectedStatus(e.target.value as 'ARCHIVED')}
                className="text-blue-600"
              />
              <span>Đã lưu trữ</span>
            </label>
          </div>
          <DialogFooter>
            <DarkOutlineButton
              onClick={onCloseStatusDialog}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={() => onConfirmChangeStatus(selectedStatus)}
              disabled={actionLoading}
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

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={onCloseDeleteDialog}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle className="text-red-400">Xóa khóa học</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có chắc muốn xóa khóa học <strong className="text-white">{selectedCourse?.title}</strong>?
              <div className="mt-2 p-2 bg-red-600/20 border border-red-600/50 rounded text-red-300 text-sm">
                ⚠️ Hành động này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DarkOutlineButton
              onClick={onCloseDeleteDialog}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={onConfirmDelete}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xóa...
                </>
              ) : (
                'Xóa khóa học'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
