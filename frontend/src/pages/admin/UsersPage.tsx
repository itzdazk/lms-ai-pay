import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { DarkOutlineInput } from '../../components/ui/dark-outline-input';
import {
  Select,
  SelectValue,
} from '../../components/ui/select';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../../components/ui/dark-outline-select-trigger';
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
import { Users, Search, Filter, Loader2, UserCheck, UserX, Shield, X } from 'lucide-react';
import { usersApi } from '../../lib/api';
import { dashboardApi } from '../../lib/api/dashboard';
import { toast } from 'sonner';
import type { User } from '../../lib/api/types';
import type { GetUsersParams, UpdateUserRequest } from '../../lib/api/users';

interface UsersPageProps {
  defaultRole?: 'STUDENT' | 'INSTRUCTOR';
}

export function UsersPage({ defaultRole }: UsersPageProps = {}) {
  const { user: currentUser, loading: authLoading } = useAuth();
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
    role: defaultRole,
    status: undefined,
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRoleDialogOpen, setIsRoleDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newRole, setNewRole] = useState<'INSTRUCTOR' | 'STUDENT'>('STUDENT');
  const [newStatus, setNewStatus] = useState<'ACTIVE' | 'INACTIVE' | 'BANNED'>('ACTIVE');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const scrollPositionRef = useRef<number>(0);
  const isPageChangingRef = useRef<boolean>(false);
  const [userStats, setUserStats] = useState({
    total: 0,
    students: 0,
    instructors: 0,
    admins: 0,
  });

  // Update filter role when defaultRole prop changes
  useEffect(() => {
    if (defaultRole !== undefined && defaultRole !== filters.role) {
      setFilters((prevFilters) => ({ ...prevFilters, role: defaultRole, page: 1 }));
    }
  }, [defaultRole]);

  // Check if user is admin
  useEffect(() => {
    // Wait for auth to finish loading
    if (authLoading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    
    if (currentUser.role !== 'ADMIN') {
      // RoleRoute component already handles permission check and shows toast
      navigate('/dashboard');
      return;
    }
  }, [currentUser, authLoading, navigate]);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      // Save current scroll position before changing filter
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
      } else {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
      }
      isPageChangingRef.current = true;
      setFilters((prevFilters) => ({ ...prevFilters, search: searchInput, page: 1 }));
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Load users
  useEffect(() => {
    loadUsers();
  }, [filters]);

  // Restore scroll position after page change
  useEffect(() => {
    if (isPageChangingRef.current && scrollPositionRef.current > 0) {
      // Use multiple attempts to ensure scroll position is restored
      const restoreScroll = () => {
        const scrollContainer = document.querySelector('main') || window;
        if (scrollContainer === window) {
          window.scrollTo({
            top: scrollPositionRef.current,
            behavior: 'auto',
          });
        } else {
          (scrollContainer as HTMLElement).scrollTop = scrollPositionRef.current;
        }
      };
      
      // Try immediately
      restoreScroll();
      
      // Try after a short delay
      setTimeout(restoreScroll, 0);
      
      // Try after render
      requestAnimationFrame(() => {
        restoreScroll();
        isPageChangingRef.current = false;
      });
    }
  }, [users, pagination]);

  // Load user stats
  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      // Clean up filters: remove empty strings and undefined values
      const cleanFilters: GetUsersParams = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && filters.search.trim() ? { search: filters.search.trim() } : {}),
        ...(filters.role ? { role: filters.role } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        sortBy: filters.sortBy || 'createdAt',
        sortOrder: filters.sortOrder || 'desc',
      };
      const response = await usersApi.getUsers(cleanFilters);
      setUsers(response.data || []);
      setPagination(response.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } catch (error: any) {
      console.error('Error loading users:', error);
      // Error toast is already shown by API client interceptor, no need to show again
    } finally {
      setLoading(false);
    }
  };

  const loadUserStats = async () => {
    try {
      const dashboard = await dashboardApi.getAdminDashboard();
      const summary = dashboard?.summary || {};
      const total = summary.users?.total || 0;
      const students = summary.users?.students || 0;
      const instructors = summary.users?.instructors || 0;
      // Calculate admins: total - students - instructors
      const admins = Math.max(0, total - students - instructors);
      setUserStats({
        total,
        students,
        instructors,
        admins,
      });
    } catch (error: any) {
      console.error('Error loading user stats:', error);
      // Fallback: use pagination total if available
      setUserStats({
        total: pagination.total || 0,
        students: 0,
        instructors: 0,
        admins: 0,
      });
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterChange = (key: keyof GetUsersParams, value: any) => {
    // Save current scroll position before changing filter
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters({ ...filters, [key]: value, page: 1 });
  };

  const handlePageChange = (page: number) => {
    // Save current scroll position from both window and main container
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
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
      // Error toast is already shown by API client interceptor, no need to show again
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
      // Error toast is already shown by API client interceptor, no need to show again
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    if (user.role === 'STUDENT' || user.role === 'INSTRUCTOR') {
      setNewRole(user.role);
    } else {
      setNewRole('STUDENT'); // Default to STUDENT if role is ADMIN or GUEST
    }
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
      // Error toast is already shown by API client interceptor, no need to show again
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = (user: User) => {
    setSelectedUser(user);
    const nextStatus =
      user.status === 'ACTIVE' ? 'BANNED' : user.status === 'BANNED' ? 'INACTIVE' : 'ACTIVE';
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
      // Error toast is already shown by API client interceptor, no need to show again
    } finally {
      setActionLoading(false);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="w-full px-4 py-4 bg-background text-foreground min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="w-full px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
            <Users className="h-8 w-8" />
            {defaultRole === 'STUDENT' 
              ? 'Quản lý học viên' 
              : defaultRole === 'INSTRUCTOR' 
              ? 'Quản lý giảng viên' 
              : 'Quản lý người dùng'}
          </h1>
          <p className="text-muted-foreground">
            {defaultRole === 'STUDENT' 
              ? 'Quản lý tất cả học viên trong hệ thống' 
              : defaultRole === 'INSTRUCTOR' 
              ? 'Quản lý tất cả giảng viên trong hệ thống' 
              : 'Quản lý tất cả người dùng trong hệ thống'}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Tổng người dùng</p>
                  <p className="text-2xl font-bold text-white">{userStats.total}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Học viên</p>
                  <p className="text-2xl font-bold text-white">{userStats.students}</p>
                </div>
                <UserCheck className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Giảng viên</p>
                  <p className="text-2xl font-bold text-white">{userStats.instructors}</p>
                </div>
                <UserX className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">Quản trị viên</p>
                  <p className="text-2xl font-bold text-white">{userStats.admins}</p>
                </div>
                <Shield className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
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
            <div className="space-y-4">
              {/* Filter Buttons Row */}
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Vai trò
                  </label>
                  <Select
                    value={filters.role || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('role', value === 'all' ? undefined : value)
                    }
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue placeholder="Tất cả vai trò" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="all">Tất cả vai trò</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="ADMIN">Quản trị viên</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="INSTRUCTOR">Giảng viên</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="STUDENT">Học viên</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Trạng thái
                  </label>
                  <Select
                    value={filters.status || 'all'}
                    onValueChange={(value) =>
                      handleFilterChange('status', value === 'all' ? undefined : value)
                    }
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue placeholder="Tất cả trạng thái" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="all">Tất cả trạng thái</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="ACTIVE">Hoạt động</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="INACTIVE">Không hoạt động</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="BANNED">Đã khóa</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Sắp xếp
                  </label>
                  <Select
                    value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                    onValueChange={(value) => {
                      // Save current scroll position before changing sort
                      const mainContainer = document.querySelector('main');
                      if (mainContainer) {
                        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                      } else {
                        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                      }
                      isPageChangingRef.current = true;
                      const [sortBy, sortOrder] = value.split('-');
                      setFilters({ ...filters, sortBy: sortBy as any, sortOrder: sortOrder as any, page: 1 });
                    }}
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue placeholder="Mới nhất" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="createdAt-desc">Mới nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="createdAt-asc">Cũ nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="updatedAt-desc">Cập nhật: mới nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="updatedAt-asc">Cập nhật: cũ nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="fullName-asc">Tên A-Z</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="fullName-desc">Tên Z-A</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="email-asc">Email A-Z</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="email-desc">Email Z-A</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Số lượng / trang
                  </label>
                  <Select
                    value={filters.limit?.toString() || '10'}
                    onValueChange={(value) =>
                      handleFilterChange('limit', parseInt(value))
                    }
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue placeholder="10 / trang" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="5">5 / trang</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="10">10 / trang</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="20">20 / trang</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="50">50 / trang</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="100">100 / trang</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                    Thao tác
                  </label>
                  <Button
                    onClick={() => {
                      setSearchInput('');
                      setFilters({
                        page: 1,
                        limit: 10,
                        search: '',
                        role: undefined,
                        status: undefined,
                        sortBy: 'createdAt',
                        sortOrder: 'desc',
                      });
                    }}
                    variant="blue"
                    className="w-full"
                  >
                    Xóa bộ lọc
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card id="users-table-card" className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader>
            <CardTitle className="text-white">
              Danh sách người dùng ({pagination.total})
            </CardTitle>
            <CardDescription className="text-gray-400">
              Trang {pagination.page} / {pagination.totalPages}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400" />
              <DarkOutlineInput
                placeholder="Tìm kiếm theo tên, email..."
                value={searchInput}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => handleSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <UserTable
              users={users}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onChangeRole={handleChangeRole}
              onChangeStatus={handleChangeStatus}
              loading={loading}
              selectedRowId={selectedRowId}
              onRowSelect={setSelectedRowId}
            />

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 mt-6">
                <DarkOutlineButton
                  onClick={() => handlePageChange(1)}
                  disabled={pagination.page === 1}
                  size="sm"
                  className="min-w-[40px] h-9"
                >
                  &lt;&lt;
                </DarkOutlineButton>
                <DarkOutlineButton
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  size="sm"
                  className="min-w-[40px] h-9"
                >
                  &lt;
                </DarkOutlineButton>

                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {(() => {
                    const currentPage = pagination.page;
                    const totalPages = pagination.totalPages;
                    const pages: (number | string)[] = [];
                    
                    // Calculate range: show 5 pages around current page (2 before, current, 2 after)
                    let startPage = Math.max(1, currentPage - 2);
                    let endPage = Math.min(totalPages, currentPage + 2);
                    
                    // Adjust if we're near the start
                    if (currentPage <= 3) {
                      startPage = 1;
                      endPage = Math.min(5, totalPages);
                    }
                    
                    // Adjust if we're near the end
                    if (currentPage >= totalPages - 2) {
                      startPage = Math.max(1, totalPages - 4);
                      endPage = totalPages;
                    }
                    
                    // Always show first page if not in range
                    if (startPage > 1) {
                      pages.push(1);
                      if (startPage > 2) {
                        pages.push('...');
                      }
                    }
                    
                    // Add pages in range
                    for (let i = startPage; i <= endPage; i++) {
                      pages.push(i);
                    }
                    
                    // Always show last page if not in range
                    if (endPage < totalPages) {
                      if (endPage < totalPages - 1) {
                        pages.push('...');
                      }
                      pages.push(totalPages);
                    }
                    
                    return pages.map((page, index) => {
                      if (page === '...') {
                        return (
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-400">
                            ...
                          </span>
                        );
                      }
                      
                      const pageNum = page as number;
                      const isActive = pageNum === currentPage;
                      
                      if (isActive) {
                        return (
                          <DarkOutlineButton
                            key={pageNum}
                            onClick={() => handlePageChange(pageNum)}
                            className="!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700 min-w-[40px] h-9"
                            size="sm"
                          >
                            {pageNum}
                          </DarkOutlineButton>
                        );
                      }
                      
                      return (
                        <DarkOutlineButton
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          className="hover:bg-[#2D2D2D] min-w-[40px] h-9"
                          size="sm"
                        >
                          {pageNum}
                        </DarkOutlineButton>
                      );
                    });
                  })()}
                </div>

                <DarkOutlineButton
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  size="sm"
                  className="min-w-[40px] h-9"
                >
                  &gt;
                </DarkOutlineButton>
                <DarkOutlineButton
                  onClick={() => handlePageChange(pagination.totalPages)}
                  disabled={pagination.page === pagination.totalPages}
                  size="sm"
                  className="min-w-[40px] h-9"
                >
                  &gt;&gt;
                </DarkOutlineButton>
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
                    {/* Note: ADMIN role cannot be assigned via role change - only STUDENT and INSTRUCTOR are allowed */}
                    <RoleSelectItem value="INSTRUCTOR">Giảng viên</RoleSelectItem>
                    <RoleSelectItem value="STUDENT">Học viên</RoleSelectItem>
                  </RoleSelectContent>
                </RoleSelect>
              </div>
            </div>
            <DialogFooter>
              <DarkOutlineButton
                onClick={() => setIsRoleDialogOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </DarkOutlineButton>
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
                    <RoleSelectItem value="ACTIVE">Hoạt động</RoleSelectItem>
                    <RoleSelectItem value="INACTIVE">Không hoạt động</RoleSelectItem>
                    <RoleSelectItem value="BANNED">Đã khóa</RoleSelectItem>
                  </RoleSelectContent>
                </RoleSelect>
              </div>
            </div>
            <DialogFooter>
              <DarkOutlineButton
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={actionLoading}
              >
                Hủy
              </DarkOutlineButton>
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
