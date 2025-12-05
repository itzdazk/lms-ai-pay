import { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select';
import { UserTable } from '../../components/admin/UserTable';
import { UserForm } from '../../components/admin/UserForm';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  Select as RoleSelect,
  SelectContent as RoleSelectContent,
  SelectItem as RoleSelectItem,
  SelectTrigger as RoleSelectTrigger,
  SelectValue as RoleSelectValue,
} from '../../components/ui/select';
import { Users, Search, Filter, Loader2 } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { toast } from 'sonner';
import type { User, GetUsersParams, UpdateUserRequest } from '../../lib/api/types';

export function UsersPage() {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<GetUsersParams>({
    page: 1,
    limit: 10,
    search: '',
    role: undefined,
    status: undefined,
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newRole, setNewRole] = useState<'admin' | 'instructor' | 'student'>('student');
  const [newStatus, setNewStatus] = useState<'active' | 'inactive' | 'suspended'>('active');

  // Check if user is admin
  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    if (currentUser.role !== 'admin') {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/dashboard');
      return;
    }
  }, [currentUser, navigate]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await usersApi.getUsers(filters);
      setUsers(response.data);
      setPagination(response.pagination);
    } catch (error: any) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key: keyof GetUsersParams, value: any) => {
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    setFilters({ ...filters, page });
  };

  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = async (id: string, data: UpdateUserRequest) => {
    try {
      setActionLoading(true);
      await usersApi.updateUser(id, data);
      toast.success('Cập nhật người dùng thành công!');
      await loadUsers();
      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi cập nhật người dùng');
      throw error;
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await usersApi.deleteUser(selectedUser.id);
      toast.success('Xóa người dùng thành công!');
      await loadUsers();
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi xóa người dùng');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setIsRoleDialogOpen(true);
  };

  const confirmChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await usersApi.changeUserRole(selectedUser.id, newRole);
      toast.success('Đổi vai trò thành công!');
      await loadUsers();
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error changing role:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi vai trò');
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = (user: User) => {
    setSelectedUser(user);
    const nextStatus =
      user.status === 'active' ? 'suspended' : user.status === 'suspended' ? 'inactive' : 'active';
    setNewStatus(nextStatus);
    setIsStatusDialogOpen(true);
  };

  const confirmChangeStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await usersApi.changeUserStatus(selectedUser.id, newStatus);
      toast.success('Đổi trạng thái thành công!');
      await loadUsers();
      setIsStatusDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error changing status:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra khi đổi trạng thái');
    } finally {
      setActionLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== 'admin') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
            <Users className="h-8 w-8" />
            Quản lý người dùng
          </h1>
          <p className="text-muted-foreground">
            Quản lý tất cả người dùng trong hệ thống
          </p>
        </div>

        {/* Filters */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D] mb-6">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Bộ lọc
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Tìm kiếm theo tên, email..."
                  value={filters.search || ''}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10 bg-[#1F1F1F] border-[#2D2D2D] text-white"
                />
              </div>
              <Select
                value={filters.role || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('role', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="all">Tất cả vai trò</SelectItem>
                  <SelectItem value="admin">Quản trị viên</SelectItem>
                  <SelectItem value="instructor">Giảng viên</SelectItem>
                  <SelectItem value="student">Học viên</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  handleFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="active">Hoạt động</SelectItem>
                  <SelectItem value="inactive">Không hoạt động</SelectItem>
                  <SelectItem value="suspended">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() =>
                  setFilters({
                    page: 1,
                    limit: 10,
                    search: '',
                    role: undefined,
                    status: undefined,
                  })
                }
                variant="outline"
                className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">
              Danh sách người dùng ({pagination.total})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Trang {pagination.page} / {pagination.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onChangeRole={handleChangeRole}
              onChangeStatus={handleChangeStatus}
              loading={loading}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-4">
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
                >
                  Trước
                </Button>
                <span className="text-gray-400">
                  Trang {pagination.page} / {pagination.totalPages}
                </span>
                <Button
                  variant="outline"
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
                >
                  Sau
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Edit User Dialog */}
        <UserForm
          user={selectedUser}
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={handleUpdateUser}
          loading={actionLoading}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
            <DialogHeader>
              <DialogTitle>Xác nhận xóa người dùng</DialogTitle>
              <DialogDescription className="text-gray-400">
                Bạn có chắc chắn muốn xóa người dùng{' '}
                <strong className="text-white">{selectedUser?.fullName}</strong>? Hành động này
                không thể hoàn tác.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={actionLoading}
                className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmDelete}
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
          <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
            <DialogHeader>
              <DialogTitle>Đổi vai trò</DialogTitle>
              <DialogDescription className="text-gray-400">
                Đổi vai trò của <strong className="text-white">{selectedUser?.fullName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Vai trò mới</label>
                <RoleSelect value={newRole} onValueChange={(value: any) => setNewRole(value)}>
                  <RoleSelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                    <RoleSelectValue />
                  </RoleSelectTrigger>
                  <RoleSelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <RoleSelectItem value="admin">Quản trị viên</RoleSelectItem>
                    <RoleSelectItem value="instructor">Giảng viên</RoleSelectItem>
                    <RoleSelectItem value="student">Học viên</RoleSelectItem>
                  </RoleSelectContent>
                </RoleSelect>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={actionLoading}
                className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmChangeRole}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Change Status Dialog */}
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
            <DialogHeader>
              <DialogTitle>Đổi trạng thái</DialogTitle>
              <DialogDescription className="text-gray-400">
                Đổi trạng thái của <strong className="text-white">{selectedUser?.fullName}</strong>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-white">Trạng thái mới</label>
                <RoleSelect
                  value={newStatus}
                  onValueChange={(value: any) => setNewStatus(value)}
                >
                  <RoleSelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                    <RoleSelectValue />
                  </RoleSelectTrigger>
                  <RoleSelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                    <RoleSelectItem value="active">Hoạt động</RoleSelectItem>
                    <RoleSelectItem value="inactive">Không hoạt động</RoleSelectItem>
                    <RoleSelectItem value="suspended">Đã khóa</RoleSelectItem>
                  </RoleSelectContent>
                </RoleSelect>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={actionLoading}
                className="border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
              >
                Hủy
              </Button>
              <Button
                onClick={confirmChangeStatus}
                disabled={actionLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {actionLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Đang cập nhật...
                  </>
                ) : (
                  'Xác nhận'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

