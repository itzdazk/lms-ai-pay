import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { DarkOutlineButton } from '@/components/ui/buttons';
import {
  Select as RoleSelect,
  SelectContent as RoleSelectContent,
  SelectItem as RoleSelectItem,
  SelectTrigger as RoleSelectTrigger,
  SelectValue as RoleSelectValue,
} from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, Shield, UserCheck, UserX, BookOpen } from 'lucide-react';
import type { User } from '../../../lib/api/types';

interface UserDialogsProps {
  // Delete Dialog
  isDeleteDialogOpen: boolean;
  setIsDeleteDialogOpen: (open: boolean) => void;
  selectedUser: User | null;
  onDeleteUser: () => void;

  // Role Dialog
  isRoleDialogOpen: boolean;
  setIsRoleDialogOpen: (open: boolean) => void;
  newRole: 'INSTRUCTOR' | 'STUDENT';
  setNewRole: (role: 'INSTRUCTOR' | 'STUDENT') => void;
  onChangeRole: () => void;

  // Status Dialog
  isStatusDialogOpen: boolean;
  setIsStatusDialogOpen: (open: boolean) => void;
  newStatus: 'ACTIVE' | 'INACTIVE' | 'BANNED';
  setNewStatus: (status: 'ACTIVE' | 'INACTIVE' | 'BANNED') => void;
  onChangeStatus: () => void;

  // Common
  actionLoading: boolean;
}

export function UserDialogs({
  // Delete Dialog
  isDeleteDialogOpen,
  setIsDeleteDialogOpen,
  selectedUser,
  onDeleteUser,

  // Role Dialog
  isRoleDialogOpen,
  setIsRoleDialogOpen,
  newRole,
  setNewRole,
  onChangeRole,

  // Status Dialog
  isStatusDialogOpen,
  setIsStatusDialogOpen,
  newStatus,
  setNewStatus,
  onChangeStatus,

  // Common
  actionLoading,
}: UserDialogsProps) {
  return (
    <>
      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có chắc chắn muốn xóa người dùng{' '}
              <strong className="text-white">{selectedUser?.fullName}</strong>?
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            <div className="p-3 bg-yellow-600/20 border border-yellow-600/50 rounded-lg">
              <p className="text-sm text-yellow-300">
                <strong className="text-yellow-400">Lưu ý:</strong> Không thể xóa người dùng nếu:
              </p>
              <ul className="list-disc list-inside text-yellow-300/90 mt-2 space-y-1 text-sm">
                <li>Người dùng đã tạo khóa học (instructor)</li>
                <li>Người dùng đã đăng ký khóa học (student)</li>
                <li>Người dùng có đơn hàng</li>
              </ul>
              <p className="text-xs text-yellow-300/80 mt-2">
                Vui lòng xóa hoặc xử lý các dữ liệu liên quan trước khi xóa người dùng.
              </p>
            </div>
            <p className="text-sm text-red-400">
              Hành động này không thể hoàn tác.
            </p>
          </div>
          <DialogFooter>
            <DarkOutlineButton
              onClick={() => setIsDeleteDialogOpen(false)}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={onDeleteUser}
              disabled={actionLoading}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {actionLoading ? (
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

      {/* Change Role Dialog */}
      <Dialog open={isRoleDialogOpen} onOpenChange={setIsRoleDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-full">
                <Shield className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <DialogTitle className="text-xl">Đổi vai trò</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Thay đổi quyền hạn của người dùng này
                </DialogDescription>
              </div>
            </div>
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedUser.fullName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  <Badge
                    className={`mt-1 text-xs ${
                      selectedUser.role === 'ADMIN'
                        ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                        : selectedUser.role === 'INSTRUCTOR'
                        ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                        : 'bg-green-500/20 text-green-400 border-green-500/30'
                    }`}
                  >
                    {selectedUser.role === 'ADMIN' ? 'Quản trị viên' :
                     selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}
                  </Badge>
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Chọn vai trò mới
              </label>
              <RoleSelect value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                <RoleSelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white h-12">
                  <RoleSelectValue placeholder="Chọn vai trò..." />
                </RoleSelectTrigger>
                <RoleSelectContent className="bg-[#1A1A1A] border-[#2D2D2D] z-[9999]">
                  <RoleSelectItem value="INSTRUCTOR" className="flex items-center gap-3 p-3 hover:bg-gray-700 focus:bg-gray-700">
                    <div className="p-1.5 bg-blue-500/20 rounded">
                      <Shield className="h-4 w-4 text-blue-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Giảng viên</div>
                      <div className="text-xs text-gray-400">Có thể tạo và quản lý khóa học</div>
                    </div>
                  </RoleSelectItem>
                  <RoleSelectItem value="STUDENT" className="flex items-center gap-3 p-3 hover:bg-gray-700 focus:bg-gray-700">
                    <div className="p-1.5 bg-green-500/20 rounded">
                      <BookOpen className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Học viên</div>
                      <div className="text-xs text-gray-400">Có thể đăng ký và học các khóa học</div>
                    </div>
                  </RoleSelectItem>
                </RoleSelectContent>
              </RoleSelect>
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DarkOutlineButton
              onClick={() => setIsRoleDialogOpen(false)}
              disabled={actionLoading}
              className="flex-1"
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={onChangeRole}
              disabled={actionLoading || !newRole}
              className="bg-blue-600 hover:bg-blue-700 text-white flex-1"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  <UserCheck className="h-4 w-4 mr-2" />
                  Xác nhận
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white max-w-md">
          <DialogHeader className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-full ${
                newStatus === 'BANNED'
                  ? 'bg-red-500/20'
                  : newStatus === 'INACTIVE'
                  ? 'bg-yellow-500/20'
                  : 'bg-green-500/20'
              }`}>
                {newStatus === 'BANNED' ? (
                  <UserX className="h-5 w-5 text-red-400" />
                ) : newStatus === 'INACTIVE' ? (
                  <UserCheck className="h-5 w-5 text-yellow-400" />
                ) : (
                  <UserCheck className="h-5 w-5 text-green-400" />
                )}
              </div>
              <div>
                <DialogTitle className="text-xl">Đổi trạng thái tài khoản</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Thay đổi quyền truy cập của người dùng này
                </DialogDescription>
              </div>
            </div>
            {selectedUser && (
              <div className="flex items-center gap-3 p-3 bg-[#1F1F1F] rounded-lg border border-[#2D2D2D]">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={selectedUser.avatarUrl} />
                  <AvatarFallback className="bg-blue-600 text-white">
                    {selectedUser.fullName?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white truncate">{selectedUser.fullName}</p>
                  <p className="text-sm text-gray-400">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge
                      className={`text-xs ${
                        selectedUser.status === 'ACTIVE'
                          ? 'bg-green-500/20 text-green-400 border-green-500/30'
                          : selectedUser.status === 'INACTIVE'
                          ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30'
                          : 'bg-red-500/20 text-red-400 border-red-500/30'
                      }`}
                    >
                      {selectedUser.status === 'ACTIVE' ? 'Hoạt động' :
                       selectedUser.status === 'INACTIVE' ? 'Không hoạt động' : 'Đã khóa'}
                    </Badge>
                    <Badge
                      className={`text-xs ${
                        selectedUser.role === 'ADMIN'
                          ? 'bg-purple-500/20 text-purple-400 border-purple-500/30'
                          : selectedUser.role === 'INSTRUCTOR'
                          ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                          : 'bg-green-500/20 text-green-400 border-green-500/30'
                      }`}
                    >
                      {selectedUser.role === 'ADMIN' ? 'Quản trị viên' :
                       selectedUser.role === 'INSTRUCTOR' ? 'Giảng viên' : 'Học viên'}
                    </Badge>
                  </div>
                </div>
              </div>
            )}
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white flex items-center gap-2">
                <UserCheck className="h-4 w-4 text-blue-400" />
                Chọn trạng thái mới
              </label>
              <RoleSelect
                value={newStatus}
                onValueChange={(value: any) => setNewStatus(value)}
              >
                <RoleSelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white h-12">
                  <RoleSelectValue placeholder="Chọn trạng thái..." />
                </RoleSelectTrigger>
                <RoleSelectContent className="bg-[#1A1A1A] border-[#2D2D2D] z-[9999]">
                  <RoleSelectItem value="ACTIVE" className="flex items-center gap-3 p-3 hover:bg-gray-700 focus:bg-gray-700">
                    <div className="p-1.5 bg-green-500/20 rounded">
                      <UserCheck className="h-4 w-4 text-green-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Hoạt động</div>
                      <div className="text-xs text-gray-400">Người dùng có thể truy cập đầy đủ</div>
                    </div>
                  </RoleSelectItem>
                  <RoleSelectItem value="INACTIVE" className="flex items-center gap-3 p-3 hover:bg-gray-700 focus:bg-gray-700">
                    <div className="p-1.5 bg-yellow-500/20 rounded">
                      <UserX className="h-4 w-4 text-yellow-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Không hoạt động</div>
                      <div className="text-xs text-gray-400">Tạm thời vô hiệu hóa tài khoản</div>
                    </div>
                  </RoleSelectItem>
                  <RoleSelectItem value="BANNED" className="flex items-center gap-3 p-3 hover:bg-gray-700 focus:bg-gray-700">
                    <div className="p-1.5 bg-red-500/20 rounded">
                      <UserX className="h-4 w-4 text-red-400" />
                    </div>
                    <div>
                      <div className="font-medium text-white">Đã khóa</div>
                      <div className="text-xs text-gray-400">Cấm vĩnh viễn, không thể truy cập</div>
                    </div>
                  </RoleSelectItem>
                </RoleSelectContent>
              </RoleSelect>

              {newStatus === 'BANNED' && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <UserX className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-red-400 mb-1">Cảnh báo: Khóa tài khoản vĩnh viễn</p>
                      <p className="text-red-300/80 text-xs">
                        Người dùng sẽ không thể truy cập hệ thống. Hành động này không thể hoàn tác.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {newStatus === 'INACTIVE' && (
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <UserCheck className="h-4 w-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-400 mb-1">Tạm thời vô hiệu hóa</p>
                      <p className="text-yellow-300/80 text-xs">
                        Người dùng không thể truy cập nhưng có thể kích hoạt lại bất kỳ lúc nào.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="gap-3">
            <DarkOutlineButton
              onClick={() => setIsStatusDialogOpen(false)}
              disabled={actionLoading}
              className="flex-1"
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={onChangeStatus}
              disabled={actionLoading || !newStatus}
              className={`flex-1 ${
                newStatus === 'BANNED'
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang cập nhật...
                </>
              ) : (
                <>
                  {newStatus === 'BANNED' ? (
                    <UserX className="h-4 w-4 mr-2" />
                  ) : (
                    <UserCheck className="h-4 w-4 mr-2" />
                  )}
                  {newStatus === 'BANNED' ? 'Khóa tài khoản' : 'Xác nhận'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
