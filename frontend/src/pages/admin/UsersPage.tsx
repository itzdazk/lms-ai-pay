import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Search, X } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { DarkOutlineInput } from '../../components/ui/dark-outline-input';
import { UserForm } from '../../components/admin/UserForm';
import { useAuth } from '../../contexts/AuthContext';
import { usersApi } from '../../lib/api/users';
import { dashboardApi } from '../../lib/api/dashboard';
import { toast } from 'sonner';
import { UserStatsCards, UserFilters, UserTable, UserDialogs } from '../../components/admin/users';
import type { User } from '../../lib/api/types';
import type { GetUsersParams, UpdateUserRequest } from '../../lib/api/users';

interface UsersPageProps {
  defaultRole?: 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';
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
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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

  // Cleanup search timeout on unmount
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  // Memoize users data to prevent unnecessary re-processing
  const memoizedUsers = useMemo(() => {
    return [...users];
  }, [users]);

  // Check if user is admin
  useEffect(() => {
    if (authLoading) return;

    if (!currentUser) {
      navigate('/login');
      return;
    }

    if (currentUser.role !== 'ADMIN') {
      navigate('/dashboard');
      return;
    }
  }, [currentUser, authLoading, navigate]);

  // Load users and stats
  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersResponse, statsResponse] = await Promise.all([
        usersApi.getUsers(filters),
        dashboardApi.getAdminStats(),
      ]);

      setUsers(usersResponse.data);
      setPagination(usersResponse.pagination);
      setUserStats({
        total: statsResponse.totalUsers || 0,
        students: statsResponse.totalStudents || 0,
        instructors: statsResponse.totalInstructors || 0,
        admins: statsResponse.totalAdmins || 0,
      });
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Không thể tải danh sách người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount and when filters change
  // Load users when specific filter fields change (not entire filters object)
  useEffect(() => {
    if (currentUser?.role === 'ADMIN') {
      loadUsers();
    }
  }, [filters.page, filters.limit, filters.search, filters.role, filters.status, filters.sortBy, filters.sortOrder, currentUser?.role]);

  // Handle filter changes
  const handleFilterChange = (key: keyof GetUsersParams, value: any) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
      page: key === 'page' ? value : 1, // Reset to page 1 when filter changes
    }));
  };

  // Handle search with debounce
  const handleSearch = (query: string) => {
    setSearchInput(query);

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Debounce search
    searchTimeoutRef.current = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: query, page: 1 }));
    }, 500);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    if (page < 1 || page > pagination.totalPages) return;

    // Save current scroll position before changing page
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;

    setFilters((prev) => ({ ...prev, page }));
  };

  // Handle user actions
  const handleEdit = (user: User) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setIsDeleteDialogOpen(true);
  };

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    const roleLower = (user.role || 'student').toLowerCase() as 'instructor' | 'student';
    setNewRole(roleLower.toUpperCase() as 'INSTRUCTOR' | 'STUDENT');
    setIsRoleDialogOpen(true);
  };

  const handleChangeStatus = (user: User) => {
    setSelectedUser(user);
    const statusLower = (user.status || 'active').toLowerCase() as 'active' | 'inactive' | 'banned';
    setNewStatus(statusLower.toUpperCase() as 'ACTIVE' | 'INACTIVE' | 'BANNED');
    setIsStatusDialogOpen(true);
  };

  // Confirm actions
  const confirmDelete = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await usersApi.deleteUser(selectedUser.id);
      toast.success('Xóa người dùng thành công');
      setIsDeleteDialogOpen(false);
      setSelectedUser(null);
      // Update local state instead of reloading
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setPagination((prev) => ({
        ...prev,
        total: prev.total - 1,
        totalPages: Math.ceil((prev.total - 1) / prev.limit),
      }));

      // Update user stats
      setUserStats((prev) => {
        const newStats = { ...prev };
        newStats.total--;

        // Decrease count for deleted user's role
        if (selectedUser.role === 'STUDENT') newStats.students--;
        else if (selectedUser.role === 'INSTRUCTOR') newStats.instructors--;
        else if (selectedUser.role === 'ADMIN') newStats.admins--;

        return newStats;
      });
      // If current page becomes empty, go to previous page
      if (users.length === 1 && pagination.page > 1) {
        handlePageChange(pagination.page - 1);
      }
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast.error(error?.response?.data?.message || 'Không thể xóa người dùng');
    } finally {
      setActionLoading(false);
    }
  };

  const confirmChangeRole = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const newRoleValue = newRole;

      await usersApi.changeUserRole(selectedUser.id, newRoleValue);
      toast.success('Cập nhật vai trò thành công');

      setIsRoleDialogOpen(false);
      setSelectedUser(null);

      // Update local state after dialog is closed (same pattern as CoursesPage)
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, role: newRoleValue } : user
        )
      );

      // Update user stats based on role change
      setUserStats((prev) => {
        const newStats = { ...prev };
        // Decrease count for old role
        if (selectedUser.role === 'STUDENT') newStats.students--;
        else if (selectedUser.role === 'INSTRUCTOR') newStats.instructors--;
        else if (selectedUser.role === 'ADMIN') newStats.admins--;

        // Increase count for new role
        if (newRoleValue === 'STUDENT') newStats.students++;
        else if (newRoleValue === 'INSTRUCTOR') newStats.instructors++;
        else if (newRoleValue === 'ADMIN') newStats.admins++;

        return newStats;
      });

    } catch (error: any) {
      console.error('Error updating user role:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật vai trò');
      setIsRoleDialogOpen(false);
      setSelectedUser(null);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmChangeStatus = async () => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      const newStatusValue = newStatus;

      await usersApi.changeUserStatus(selectedUser.id, newStatusValue);
      toast.success('Cập nhật trạng thái thành công');

      setIsStatusDialogOpen(false);
      setSelectedUser(null);

      // Update local state after dialog is closed (same pattern as CoursesPage)
      setUsers((prev) =>
        prev.map((user) =>
          user.id === selectedUser.id ? { ...user, status: newStatusValue } : user
        )
      );

    } catch (error: any) {
      console.error('Error updating user status:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật trạng thái');
      setIsStatusDialogOpen(false);
      setSelectedUser(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle user form update
  const handleUpdateUser = async (id: string, userData: UpdateUserRequest) => {
    if (!selectedUser) return;

    try {
      setActionLoading(true);
      await usersApi.updateUser(id, userData);
      toast.success('Cập nhật thông tin người dùng thành công');

      // Update local state instead of reloading
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, ...userData } : u
        )
      );

      setIsEditDialogOpen(false);
      setSelectedUser(null);
    } catch (error: any) {
      console.error('Error updating user:', error);
      toast.error(error?.response?.data?.message || 'Không thể cập nhật thông tin người dùng');
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Đang tải...</p>
        </div>
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

        <UserStatsCards userStats={userStats} />

        <UserFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          onClearFilters={() => {
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
        />

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
          <CardContent className="overflow-x-auto">
            {/* Search Bar */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DarkOutlineInput
                type="text"
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
              users={memoizedUsers}
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
                          <span key={`ellipsis-${index}`} className="px-2 text-gray-500">
                            ...
                          </span>
                        );
                      }
                      const pageNum = page as number;
                      return (
                        <DarkOutlineButton
                          key={pageNum}
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                          size="sm"
                          className={
                            pagination.page === pageNum
                              ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                              : ''
                          }
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
        {selectedUser && (
          <UserForm
            user={selectedUser}
            open={isEditDialogOpen}
            onOpenChange={setIsEditDialogOpen}
            onSubmit={handleUpdateUser}
            loading={actionLoading}
          />
        )}

        <UserDialogs
          // Delete Dialog
          isDeleteDialogOpen={isDeleteDialogOpen}
          setIsDeleteDialogOpen={setIsDeleteDialogOpen}
          selectedUser={selectedUser}
          onDeleteUser={confirmDelete}

          // Role Dialog
          isRoleDialogOpen={isRoleDialogOpen}
          setIsRoleDialogOpen={setIsRoleDialogOpen}
          newRole={newRole}
          setNewRole={setNewRole}
          onChangeRole={confirmChangeRole}

          // Status Dialog
          isStatusDialogOpen={isStatusDialogOpen}
          setIsStatusDialogOpen={setIsStatusDialogOpen}
          newStatus={newStatus}
          setNewStatus={setNewStatus}
          onChangeStatus={confirmChangeStatus}

          // Common
          actionLoading={actionLoading}
        />
      </div>
    </div>
  );
}