import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DarkOutlineButton } from '@/components/ui/buttons';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { CourseAnalytics } from '../../../components/instructor/CourseAnalytics';
import type { AdminCourse } from '@/lib/api/admin-courses';

interface CourseDialogsProps {
  isFeaturedDialogOpen: boolean;
  isStatusDialogOpen: boolean;
  isDeleteDialogOpen: boolean;
  isAnalyticsDialogOpen: boolean;
  selectedCourse: AdminCourse | null;
  actionLoading: boolean;
  onCloseFeaturedDialog: () => void;
  onCloseStatusDialog: () => void;
  onCloseDeleteDialog: () => void;
  onCloseAnalyticsDialog: () => void;
  onConfirmToggleFeatured: () => void;
  onConfirmChangeStatus: (newStatus: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') => void;
  onConfirmDelete: () => void;
}

export function CourseDialogs({
  isFeaturedDialogOpen,
  isStatusDialogOpen,
  isDeleteDialogOpen,
  isAnalyticsDialogOpen,
  selectedCourse,
  actionLoading,
  onCloseFeaturedDialog,
  onCloseStatusDialog,
  onCloseDeleteDialog,
  onCloseAnalyticsDialog,
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
            <DialogTitle>Thay đổi trạng thái</DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn trạng thái mới cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select
              value={selectedStatus}
              onValueChange={(value: any) => setSelectedStatus(value)}
            >
              <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D] z-[9999]">
                <SelectItem
                  value="DRAFT"
                  className="text-white focus:bg-[#2D2D2D]"
                >
                  <div className="flex flex-col">
                    <span>Bản nháp</span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      Khóa học chưa được công khai, chỉ bạn có thể xem
                    </span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="PUBLISHED"
                  className="text-white focus:bg-[#2D2D2D]"
                >
                  <div className="flex flex-col">
                    <span>Xuất bản</span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      Khóa học đã được công khai, học viên có thể đăng ký
                    </span>
                  </div>
                </SelectItem>
                <SelectItem
                  value="ARCHIVED"
                  className="text-white focus:bg-[#2D2D2D]"
                >
                  <div className="flex flex-col">
                    <span>Lưu trữ</span>
                    <span className="text-xs text-gray-400 mt-0.5">
                      Khóa học đã được lưu trữ, không còn hiển thị công khai
                    </span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <DarkOutlineButton
              onClick={onCloseStatusDialog}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={() => onConfirmChangeStatus(selectedStatus as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED')}
              disabled={actionLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                'Cập nhật'
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

      {/* Analytics Dialog */}
      <Dialog
        open={isAnalyticsDialogOpen}
        onOpenChange={onCloseAnalyticsDialog}
      >
        <DialogContent className='bg-[#1A1A1A] border-[#2D2D2D] text-white w-[96vw] sm:max-w-[96vw] md:max-w-[1400px] lg:max-w-[1600px] max-h-[90vh] overflow-y-auto custom-scrollbar'>
          <DialogHeader>
            <DialogTitle className='text-white'>
              Phân tích khóa học
            </DialogTitle>
            <DialogDescription className='text-gray-400'>
              {selectedCourse?.title}
            </DialogDescription>
          </DialogHeader>
          <div className='mt-4'>
            {selectedCourse && (
              <CourseAnalytics
                courseId={String(selectedCourse.id)}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
