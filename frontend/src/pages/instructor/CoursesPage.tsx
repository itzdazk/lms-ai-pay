import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { DarkOutlineInput } from '../../components/ui/dark-outline-input';
import {
  Select,
  SelectValue,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from '../../components/ui/select';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../../components/ui/dark-outline-select-trigger';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import {
  DarkOutlineTable,
  DarkOutlineTableHeader,
  DarkOutlineTableBody,
  DarkOutlineTableRow,
  DarkOutlineTableHead,
  DarkOutlineTableCell,
} from '../../components/ui/dark-outline-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../../components/ui/dropdown-menu';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { 
  BookOpen, 
  Search, 
  Loader2, 
  Plus, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Eye,
  BarChart3,
  Image as ImageIcon,
} from 'lucide-react';
import { coursesApi } from '../../lib/api/courses';
import apiClient from '../../lib/api/client';
import { toast } from 'sonner';
import type { Course, Category, PaginatedResponse } from '../../lib/api/types';

function translateErrorMessage(message: string): string {
  if (!message) return 'Đã xảy ra lỗi';
  
  const lowerMessage = message.toLowerCase();
  
  // Course deletion errors
  if (lowerMessage.includes('course not found') || lowerMessage.includes('không tìm thấy khóa học')) {
    return 'Không tìm thấy khóa học';
  }
  if (lowerMessage.includes('permission') || lowerMessage.includes('quyền')) {
    return 'Bạn không có quyền thực hiện thao tác này';
  }
  if (lowerMessage.includes('enrollments') || lowerMessage.includes('học viên đã đăng ký')) {
    return 'Không thể xóa khóa học đã có học viên đăng ký. Vui lòng lưu trữ thay vì xóa';
  }
  if (lowerMessage.includes('active enrollments')) {
    return 'Không thể xóa khóa học đã có học viên đăng ký. Vui lòng lưu trữ thay vì xóa';
  }
  
  // Generic errors
  if (lowerMessage.includes('not found')) {
    return 'Không tìm thấy dữ liệu';
  }
  if (lowerMessage.includes('unauthorized') || lowerMessage.includes('chưa đăng nhập')) {
    return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại';
  }
  if (lowerMessage.includes('forbidden') || lowerMessage.includes('không có quyền')) {
    return 'Bạn không có quyền truy cập';
  }
  if (lowerMessage.includes('validation') || lowerMessage.includes('dữ liệu không hợp lệ')) {
    return 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại';
  }
  if (lowerMessage.includes('server error') || lowerMessage.includes('lỗi server')) {
    return 'Lỗi server. Vui lòng thử lại sau';
  }
  
  // Return original message if no translation found (might already be in Vietnamese)
  return message;
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

function getStatusBadgeVariant(status: string) {
  switch (status) {
    case 'published':
      return 'default';
    case 'draft':
      return 'secondary';
    case 'archived':
      return 'destructive';
    default:
      return 'secondary';
  }
}

function getStatusLabel(status: string) {
  switch (status) {
    case 'published':
      return 'Đã xuất bản';
    case 'draft':
      return 'Bản nháp';
    case 'archived':
      return 'Đã lưu trữ';
    default:
      return status;
  }
}

export function CoursesPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: '',
    status: undefined as 'draft' | 'published' | 'archived' | undefined,
    categoryId: undefined as string | undefined,
    level: undefined as 'beginner' | 'intermediate' | 'advanced' | undefined,
    sort: 'newest',
  });
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [categories, setCategories] = useState<Category[]>([]);
  const scrollPositionRef = useRef<number>(0);
  const isPageChangingRef = useRef<boolean>(false);

  // Check if user is instructor
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
      toast.error('Bạn không có quyền truy cập trang này');
      navigate('/dashboard');
      return;
    }
  }, [currentUser, authLoading, navigate]);

  // Load courses
  useEffect(() => {
    loadCourses();
  }, [filters]);

  // Load categories
  useEffect(() => {
    loadCategories();
  }, []);

  // Restore scroll position
  useEffect(() => {
    if (isPageChangingRef.current && scrollPositionRef.current > 0) {
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
      
      restoreScroll();
      setTimeout(restoreScroll, 0);
      requestAnimationFrame(() => {
        restoreScroll();
        isPageChangingRef.current = false;
      });
    }
  }, [courses, pagination]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', filters.page.toString());
      params.append('limit', filters.limit.toString());
      if (filters.search && filters.search.trim()) {
        params.append('search', filters.search.trim());
      }
      if (filters.status) {
        params.append('status', filters.status);
      }
      if (filters.categoryId) {
        params.append('categoryId', filters.categoryId);
      }
      if (filters.level) {
        params.append('level', filters.level);
      }
      if (filters.sort) {
        params.append('sortBy', filters.sort);
      }

      const response = await apiClient.get<{ success: boolean; data: PaginatedResponse<Course> }>(
        `/instructor/courses?${params.toString()}`
      );
      setCourses(response.data.data.data || []);
      setPagination(response.data.data.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      });
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Không thể tải danh sách khóa học');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await coursesApi.getCategories();
      setCategories(categoriesData);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const handleSearch = (value: string) => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters({ ...filters, search: value, page: 1 });
  };

  const handleFilterChange = (key: string, value: any) => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters({ ...filters, [key]: value === 'all' ? undefined : value, page: 1 });
  };

  const handlePageChange = (newPage: number) => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters({ ...filters, page: newPage });
  };

  const handleDelete = async () => {
    if (!selectedCourse) return;

    try {
      setActionLoading(true);
      await apiClient.delete(`/instructor/courses/${selectedCourse.id}`);
      toast.success('Xóa khóa học thành công');
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Không thể xóa khóa học';
      const translatedMessage = translateErrorMessage(errorMessage);
      toast.error(translatedMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async () => {
    if (!selectedCourse) return;

    try {
      setActionLoading(true);
      await apiClient.patch(`/instructor/courses/${selectedCourse.id}/status`, {
        status: newStatus.toUpperCase(),
      });
      toast.success('Thay đổi trạng thái thành công');
      setIsStatusDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error: any) {
      console.error('Error changing status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Không thể thay đổi trạng thái';
      const translatedMessage = translateErrorMessage(errorMessage);
      toast.error(translatedMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const renderPagination = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    const currentPage = pagination.page;

    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1);
      if (currentPage > 3) {
        pages.push('...');
      }
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
        pages.push(i);
      }
      if (currentPage < totalPages - 2) {
        pages.push('...');
      }
      pages.push(totalPages);
    }

    return (
      <div className="flex items-center gap-2 flex-wrap">
        <DarkOutlineButton
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          size="sm"
        >
          &lt;&lt;
        </DarkOutlineButton>
        <DarkOutlineButton
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          size="sm"
        >
          &lt;
        </DarkOutlineButton>
        {pages.map((page, index) => {
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
                currentPage === pageNum
                  ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                  : ''
              }
            >
              {pageNum}
            </DarkOutlineButton>
          );
        })}
        <DarkOutlineButton
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          size="sm"
        >
          &gt;
        </DarkOutlineButton>
        <DarkOutlineButton
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          size="sm"
        >
          &gt;&gt;
        </DarkOutlineButton>
      </div>
    );
  };

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white">Quản lý khóa học</h1>
          <p className="text-gray-400 mt-1">Quản lý tất cả khóa học của bạn</p>
        </div>
        <Link to="/instructor/courses/create">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white">
            <Plus className="h-4 w-4 mr-2" />
            Tạo khóa học mới
          </Button>
        </Link>
      </div>

      {/* Filters */}
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Trạng thái</Label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) => handleFilterChange('status', value)}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả trạng thái</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="draft">Bản nháp</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="published">Đã xuất bản</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="archived">Đã lưu trữ</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Danh mục</Label>
              <Select
                value={filters.categoryId || 'all'}
                onValueChange={(value) => handleFilterChange('categoryId', value)}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả danh mục</DarkOutlineSelectItem>
                  {categories.map((category) => (
                    <DarkOutlineSelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </DarkOutlineSelectItem>
                  ))}
                </DarkOutlineSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Cấp độ</Label>
              <Select
                value={filters.level || 'all'}
                onValueChange={(value) => handleFilterChange('level', value)}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả cấp độ" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả cấp độ</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="beginner">Cơ bản</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="intermediate">Trung bình</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="advanced">Nâng cao</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Sắp xếp</Label>
              <Select
                value={filters.sort}
                onValueChange={(value) => handleFilterChange('sort', value)}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="newest">Mới nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="oldest">Cũ nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="title">Theo tên</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="enrollments">Số lượt đăng ký</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>
          </div>

          {/* Search */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Tìm kiếm</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <DarkOutlineInput
                type="text"
                placeholder="Tìm kiếm theo tên khóa học..."
                value={filters.search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400">Không có khóa học nào</p>
            </div>
          ) : (
            <DarkOutlineTable>
              <DarkOutlineTableHeader>
                <DarkOutlineTableRow>
                  <DarkOutlineTableHead className="w-16">Ảnh</DarkOutlineTableHead>
                  <DarkOutlineTableHead>Tên khóa học</DarkOutlineTableHead>
                  <DarkOutlineTableHead>Danh mục</DarkOutlineTableHead>
                  <DarkOutlineTableHead>Giá</DarkOutlineTableHead>
                  <DarkOutlineTableHead>Đăng ký</DarkOutlineTableHead>
                  <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                  <DarkOutlineTableHead className="w-32">Thao tác</DarkOutlineTableHead>
                </DarkOutlineTableRow>
              </DarkOutlineTableHeader>
              <DarkOutlineTableBody>
                {courses.map((course) => (
                  <DarkOutlineTableRow key={course.id}>
                    <DarkOutlineTableCell>
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-16 h-16 object-cover rounded"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-[#2D2D2D] rounded flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-500" />
                        </div>
                      )}
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <div>
                        <p className="font-medium text-white">{course.title}</p>
                        <p className="text-sm text-gray-400 line-clamp-1">
                          {course.description}
                        </p>
                      </div>
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <span className="text-gray-300">{course.category?.name || '-'}</span>
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <span className="text-gray-300">
                        {course.isFree ? 'Miễn phí' : formatPrice(typeof course.originalPrice === 'string' ? parseFloat(course.originalPrice) : course.originalPrice)}
                      </span>
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <span className="text-gray-300">{course.enrolledCount || 0}</span>
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <Badge variant={getStatusBadgeVariant(course.status)}>
                        {getStatusLabel(course.status)}
                      </Badge>
                    </DarkOutlineTableCell>
                    <DarkOutlineTableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                          <DropdownMenuItem
                            asChild
                            className="text-white focus:bg-[#2D2D2D]"
                          >
                            <Link to={`/instructor/courses/${course.id}/edit`}>
                              <Edit className="h-4 w-4 mr-2" />
                              Chỉnh sửa
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            asChild
                            className="text-white focus:bg-[#2D2D2D]"
                          >
                            <Link to={`/instructor/courses/${course.id}/analytics`}>
                              <BarChart3 className="h-4 w-4 mr-2" />
                              Phân tích
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setNewStatus(course.status as 'draft' | 'published' | 'archived');
                              setIsStatusDialogOpen(true);
                            }}
                            className="text-white focus:bg-[#2D2D2D]"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Đổi trạng thái
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCourse(course);
                              setIsDeleteDialogOpen(true);
                            }}
                            className="text-red-400 focus:bg-[#2D2D2D]"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </DarkOutlineTableCell>
                  </DarkOutlineTableRow>
                ))}
              </DarkOutlineTableBody>
            </DarkOutlineTable>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center">
          {renderPagination()}
        </div>
      )}

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có chắc muốn xóa khóa học "{selectedCourse?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleDelete}
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

      {/* Status Change Dialog */}
      <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Thay đổi trạng thái</DialogTitle>
            <DialogDescription className="text-gray-400">
              Chọn trạng thái mới cho khóa học "{selectedCourse?.title}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                <SelectItem value="draft" className="text-white focus:bg-[#2D2D2D]">
                  Bản nháp
                </SelectItem>
                <SelectItem value="published" className="text-white focus:bg-[#2D2D2D]">
                  Đã xuất bản
                </SelectItem>
                <SelectItem value="archived" className="text-white focus:bg-[#2D2D2D]">
                  Đã lưu trữ
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusDialogOpen(false)}
              className="bg-[#1F1F1F] border-[#2D2D2D] text-white hover:bg-[#2D2D2D]"
            >
              Hủy
            </Button>
            <Button
              onClick={handleStatusChange}
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
    </div>
  );
}

