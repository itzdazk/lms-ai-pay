import { useState, useEffect, useRef, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { DarkOutlineInput } from '../components/ui/dark-outline-input';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../components/ui/dark-outline-select-trigger';
import {
  DarkOutlineTable,
  DarkOutlineTableHeader,
  DarkOutlineTableBody,
  DarkOutlineTableRow,
  DarkOutlineTableHead,
  DarkOutlineTableCell,
} from '../components/ui/dark-outline-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../components/ui/dropdown-menu';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Plus,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
  Star,
  BarChart3,
  Loader2,
  Search
} from 'lucide-react';
import { coursesApi } from '../lib/api/courses';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import type { Course, Category } from '../lib/api/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

function formatDuration(minutes: number): string {
  if (!minutes) return '0 phút';
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}p` : `${hours}h`;
  }
  return `${mins}p`;
}

function formatDate(dateString: string): string {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

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

export function InstructorDashboard() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
  const [stats, setStats] = useState({
    totalCourses: 0,
    publishedCourses: 0,
    draftCourses: 0,
    totalStudents: 0,
    totalRevenue: 0,
    avgRating: 0,
  });
  const [categories, setCategories] = useState<Category[]>([]);
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
    status: undefined as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | undefined,
    categoryId: undefined as string | undefined,
    level: undefined as 'beginner' | 'intermediate' | 'advanced' | undefined,
    sort: 'newest' as string,
  });
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const scrollPositionRef = useRef<number>(0);
  const isPageChangingRef = useRef<boolean>(false);
  const shouldRestoreScrollRef = useRef<boolean>(false);

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

  // Check if we need to restore scroll position on mount
  useEffect(() => {
    const savedScrollPosition = sessionStorage.getItem('instructorDashboardScroll');
    if (savedScrollPosition) {
      shouldRestoreScrollRef.current = true;
      scrollPositionRef.current = parseInt(savedScrollPosition, 10);
    }
  }, []);

  // Restore scroll position when courses are loaded and not loading
  useEffect(() => {
    if (shouldRestoreScrollRef.current && !loading && courses.length > 0) {
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
      
      // Try multiple times to ensure it works
      restoreScroll();
      setTimeout(restoreScroll, 50);
      setTimeout(restoreScroll, 150);
      setTimeout(() => {
        restoreScroll();
        shouldRestoreScrollRef.current = false;
        sessionStorage.removeItem('instructorDashboardScroll');
      }, 300);
    }
  }, [loading, courses.length]);

  // Load data
  useEffect(() => {
    if (currentUser) {
      loadCategories();
    }
  }, [currentUser]);


  // Load courses when filters change
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [filters.page, filters.limit, filters.search, filters.status, filters.categoryId, filters.level, filters.sort, currentUser]);

  // Restore scroll position (only when page changes, not when courses update)
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
  }, [pagination.page]); // Only trigger on page change, not on courses update

  // Memoize courses to preserve order and prevent re-sorting
  const memoizedCourses = useMemo(() => {
    // Return a new array reference to preserve order
    return [...courses];
  }, [courses]);

  // Transform backend course data to frontend format
  const transformCourse = (course: any): Course => {
    return {
      id: String(course.id),
      title: course.title || '',
      slug: course.slug || '',
      description: course.description || course.shortDescription || '',
      thumbnail: course.thumbnailUrl || '',
      previewVideoUrl: course.videoPreviewUrl || '',
      instructorId: String(course.instructorId || ''),
      categoryId: String(course.categoryId || course.category?.id || ''),
      category: course.category ? {
        id: String(course.category.id),
        name: course.category.name,
        slug: course.category.slug,
      } : undefined,
      level: course.level || 'beginner',
      originalPrice: parseFloat(String(course.price || 0)) || 0,
      discountPrice: course.discountPrice ? parseFloat(String(course.discountPrice)) : undefined,
      isFree: parseFloat(String(course.price || 0)) === 0,
      status: course.status ? (course.status.toLowerCase() as 'draft' | 'published' | 'archived') : 'draft',
      featured: course.isFeatured || false,
      viewsCount: course.viewsCount || 0,
      enrolledCount: course.enrolledCount || 0,
      ratingAvg: course.ratingAvg ? parseFloat(String(course.ratingAvg)) : 0,
      ratingCount: course.ratingCount || 0,
      lessonsCount: course.lessonsCount || course.totalLessons || 0,
      durationMinutes: (course.durationHours || 0) * 60,
      createdAt: course.createdAt || new Date().toISOString(),
      updatedAt: course.updatedAt || new Date().toISOString(),
    };
  };

  const loadCourses = async () => {
    try {
      setLoading(true);
      const requestParams: any = {
        page: filters.page,
        limit: filters.limit,
        ...(filters.search && filters.search.trim() ? { search: filters.search.trim() } : {}),
        ...(filters.status ? { status: filters.status } : {}),
        ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
        ...(filters.level ? { level: filters.level } : {}),
        sort: filters.sort,
      };
      const coursesData = await coursesApi.getInstructorCourses(requestParams);
      
      // Transform courses data - preserve order from backend
      const coursesArray: any[] = coursesData?.data || [];
      const transformedCourses = coursesArray.map(transformCourse);
      
      // Create a deep copy to ensure new reference and prevent any mutation
      const coursesToSet = JSON.parse(JSON.stringify(transformedCourses)) as Course[];
      setCourses(coursesToSet);
      
      const paginationData = coursesData.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
      setPagination(paginationData);

      // Load stats separately (don't block courses display)
      setTimeout(() => {
        loadStats();
      }, 100);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      toast.error('Không thể tải danh sách khóa học');
      setCourses([]);
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const categoriesData = await coursesApi.getCategories();
      // Backend returns id as number, but we need to keep it as string for Select component
      // Transform to ensure consistency
      const transformedCategories = categoriesData.map(cat => ({
        ...cat,
        id: typeof cat.id === 'number' ? String(cat.id) : cat.id,
      }));
      setCategories(transformedCategories);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadStats = async () => {
    try {
      // Get stats from API
      const statsData = await coursesApi.getInstructorCourseStatistics();
      
      // Get all courses with pagination (max limit is 100)
      let allCourses: Course[] = [];
      let page = 1;
      let hasMore = true;
      
      while (hasMore) {
        const coursesData = await coursesApi.getInstructorCourses({ 
          page, 
          limit: 100,
          sort: 'newest' // Always use newest for stats calculation
        });
        const transformed = (coursesData.data || []).map(transformCourse);
        allCourses = [...allCourses, ...transformed];
        
        // Check if there are more pages
        hasMore = page < (coursesData.pagination?.totalPages || 0);
        page++;
        
        // Safety limit: stop after 10 pages (1000 courses max)
        if (page > 10) break;
      }
      
      const totalCourses = allCourses.length;
      const publishedCourses = allCourses.filter((c: Course) => c.status === 'published').length;
      const draftCourses = allCourses.filter((c: Course) => c.status === 'draft').length;
      const totalStudents = allCourses.reduce((sum: number, c: Course) => sum + (c.enrolledCount || 0), 0);
      const totalRevenue = statsData?.totalRevenue || 0;
      const avgRating = statsData?.averageRating || 
        (allCourses.length > 0 
          ? allCourses.reduce((sum: number, c: Course) => sum + (c.ratingAvg || 0), 0) / allCourses.length 
          : 0);
      
      setStats({
        totalCourses,
        publishedCourses,
        draftCourses,
        totalStudents,
        totalRevenue,
        avgRating: avgRating || 0,
      });
    } catch (error: any) {
      // If stats API fails, try to calculate from current courses
      if (courses.length > 0) {
        const totalCourses = courses.length;
        const publishedCourses = courses.filter((c: Course) => c.status === 'published').length;
        const draftCourses = courses.filter((c: Course) => c.status === 'draft').length;
        const totalStudents = courses.reduce((sum: number, c: Course) => sum + (c.enrolledCount || 0), 0);
        const avgRating = courses.length > 0 
          ? courses.reduce((sum: number, c: Course) => sum + (c.ratingAvg || 0), 0) / courses.length 
          : 0;
        
        setStats({
          totalCourses,
          publishedCourses,
          draftCourses,
          totalStudents,
          totalRevenue: 0,
          avgRating: avgRating || 0,
        });
      }
    }
  };


  const handleEditCourse = (course: Course) => {
    // Save scroll position before navigating
    const scrollContainer = document.querySelector('main') || window;
    const scrollPosition = scrollContainer === window 
      ? window.scrollY 
      : (scrollContainer as HTMLElement).scrollTop;
    sessionStorage.setItem('instructorDashboardScroll', scrollPosition.toString());
    
    // Navigate to edit page
    navigate(`/instructor/courses/${course.id}/edit`);
  };


  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setActionLoading(true);
      await coursesApi.deleteInstructorCourse(selectedCourse.id);
      toast.success('Xóa khóa học thành công');
      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
      loadStats();
    } catch (error: any) {
      console.error('Error deleting course:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Không thể xóa khóa học';
      const translatedMessage = translateErrorMessage(errorMessage);
      toast.error(translatedMessage);
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedCourse) return;
    
    try {
      setActionLoading(true);
      await coursesApi.changeCourseStatus(selectedCourse.id, newStatus);
      toast.success('Thay đổi trạng thái thành công');
      setIsStatusDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
      loadStats();
    } catch (error: any) {
      console.error('Error changing status:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error?.message || error.message || 'Không thể thay đổi trạng thái';
      const translatedMessage = translateErrorMessage(errorMessage);
      toast.error(translatedMessage);
    } finally {
      setActionLoading(false);
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

  return (
    <div className="container mx-auto px-4 py-4 bg-background min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl mb-2 text-black dark:text-white">Dashboard Giảng viên</h1>
          <p className="text-black-400 dark:text-gray-400">Xin chào, {currentUser?.fullName || 'Giảng viên'}! 👋</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng khóa học</CardTitle>
            <BookOpen className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{stats.totalCourses}</div>
            <p className="text-xs text-gray-500 mt-1">
              {stats.publishedCourses} đã xuất bản • {stats.draftCourses} bản nháp
            </p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng học viên</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{stats.totalStudents.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Đã đăng ký các khóa học</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Tổng doanh thu</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl text-white">{formatPrice(stats.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">Tổng thu nhập</p>
          </CardContent>
        </Card>

        <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-gray-400">Đánh giá TB</CardTitle>
            <Star className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl flex items-center gap-2 text-white">
              {stats.avgRating}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Từ học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <TabsList className="w-full justify-start bg-[#1A1A1A] border border-[#2D2D2D] rounded-xl p-1">
          <TabsTrigger
            value="courses"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <BookOpen className="h-4 w-4 mr-2" />
            Khóa học
          </TabsTrigger>
          <TabsTrigger
            value="analytics"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích
          </TabsTrigger>
          <TabsTrigger
            value="revenue"
            className="!text-white data-[state=active]:!text-white data-[state=active]:bg-[#2D2D2D] dark:data-[state=active]:!bg-white dark:data-[state=active]:!text-black rounded-lg px-4 py-2"
          >
            <DollarSign className="h-4 w-4 mr-2" />
            Doanh thu
          </TabsTrigger>
        </TabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          {/* Filters */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
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
                      <DarkOutlineSelectItem value="DRAFT">Bản nháp</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="PUBLISHED">Đã xuất bản</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="ARCHIVED">Đã lưu trữ</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Danh mục</Label>
                  <Select
                    value={filters.categoryId ? String(filters.categoryId) : 'all'}
                    onValueChange={(value) => {
                      console.log('Category selected:', value);
                      handleFilterChange('categoryId', value === 'all' ? undefined : value);
                    }}
                  >
                    <DarkOutlineSelectTrigger className="w-full !data-[placeholder]:text-gray-500 dark:!data-[placeholder]:text-gray-400 [&_*[data-slot=select-value]]:!text-black [&_*[data-slot=select-value]]:opacity-100 [&_*[data-slot=select-value][data-placeholder]]:!text-gray-500 dark:[&_*[data-slot=select-value]]:!text-white dark:[&_*[data-slot=select-value]]:opacity-100 dark:[&_*[data-slot=select-value][data-placeholder]]:!text-gray-400">
                      <SelectValue placeholder="Tất cả danh mục" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="all">Tất cả danh mục</DarkOutlineSelectItem>
                      {categories.map((category) => {
                        const categoryIdStr = String(category.id);
                        return (
                          <DarkOutlineSelectItem key={category.id} value={categoryIdStr}>
                            {category.name}
                          </DarkOutlineSelectItem>
                        );
                      })}
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
                    value={filters.sort || 'newest'}
                    onValueChange={(value) => {
                      const mainContainer = document.querySelector('main');
                      if (mainContainer) {
                        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                      } else {
                        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                      }
                      isPageChangingRef.current = true;
                      handleFilterChange('sort', value);
                    }}
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue placeholder="Mới nhất" />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="newest">Mới nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="oldest">Cũ nhất</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="popular">Phổ biến</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="rating">Đánh giá</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Số lượng/trang</Label>
                  <Select
                    value={filters.limit?.toString() || '10'}
                    onValueChange={(value) => handleFilterChange('limit', parseInt(value))}
                  >
                    <DarkOutlineSelectTrigger>
                      <SelectValue />
                    </DarkOutlineSelectTrigger>
                    <DarkOutlineSelectContent>
                      <DarkOutlineSelectItem value="5">5</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="10">10</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="20">20</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="50">50</DarkOutlineSelectItem>
                      <DarkOutlineSelectItem value="100">100</DarkOutlineSelectItem>
                    </DarkOutlineSelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-400 text-sm">Thao tác</Label>
                  <DarkOutlineButton
                    onClick={() => {
                      const mainContainer = document.querySelector('main');
                      if (mainContainer) {
                        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                      } else {
                        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                      }
                      isPageChangingRef.current = true;
                      setFilters({
                        page: 1,
                        limit: 10,
                        search: '',
                        status: undefined,
                        categoryId: undefined,
                        level: undefined,
                        sort: 'newest',
                      });
                    }}
                    className="w-full"
                  >
                    Xóa bộ lọc
                  </DarkOutlineButton>
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
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-white">Quản lý khóa học</CardTitle>
                  <CardDescription className="text-gray-400">
                    Danh sách tất cả khóa học của bạn
                  </CardDescription>
                </div>
                <DarkOutlineButton 
                  size="lg"
                  onClick={() => {
                    // Save scroll position before navigating
                    const scrollContainer = document.querySelector('main') || window;
                    const scrollPosition = scrollContainer === window 
                      ? window.scrollY 
                      : (scrollContainer as HTMLElement).scrollTop;
                    sessionStorage.setItem('instructorDashboardScroll', scrollPosition.toString());
                    navigate('/instructor/courses/create');
                  }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Tạo khóa học mới
                </DarkOutlineButton>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
                  <span className="ml-2 text-gray-400">Đang tải...</span>
                </div>
              ) : courses.length === 0 ? (
                <div className="text-center py-12">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-400">Chưa có khóa học nào</p>
                  <p className="text-xs text-gray-500 mt-2">Tạo khóa học mới để bắt đầu</p>
                </div>
              ) : (
                <>
                  <DarkOutlineTable>
                    <DarkOutlineTableHeader>
                      <DarkOutlineTableRow>
                        <DarkOutlineTableHead>Khóa học</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Học viên</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Đánh giá</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Doanh thu</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Hoàn thành</DarkOutlineTableHead>
                        <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                        <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
                      </DarkOutlineTableRow>
                    </DarkOutlineTableHeader>
                    <DarkOutlineTableBody>
                      {memoizedCourses.map(course => {
                        const price = course.discountPrice || course.originalPrice || 0;
                        const revenue = price * (course.enrolledCount || 0);
                        const durationMinutes = (course.durationMinutes || 0);
                        const lessonsCount = course.lessonsCount || 0;
                        return (
                          <DarkOutlineTableRow key={course.id}>
                            <DarkOutlineTableCell>
                              <div className="flex items-center gap-3">
                                {course.thumbnail ? (
                                  <img
                                    src={course.thumbnail}
                                    alt={course.title}
                                    className="w-16 h-10 object-cover rounded"
                                  />
                                ) : (
                                  <div className="w-16 h-10 bg-gray-200 dark:bg-[#2D2D2D] rounded flex items-center justify-center">
                                    <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                                  </div>
                                )}
                                <div>
                                  <p className="font-medium line-clamp-1 text-gray-900 dark:text-white">{course.title}</p>
                                  <p className="text-sm text-gray-500 dark:text-gray-400">{lessonsCount} bài • {formatDuration(durationMinutes)}</p>
                                </div>
                              </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              {course.status === 'published' ? (
                                <Badge className="bg-green-600">Đã xuất bản</Badge>
                              ) : course.status === 'draft' ? (
                                <Badge variant="outline" className="border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300">Bản nháp</Badge>
                              ) : (
                                <Badge variant="secondary" className="bg-gray-600 text-white">Đã lưu trữ</Badge>
                              )}
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              <div className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                <span className="text-gray-900 dark:text-gray-300">{(course.enrolledCount || 0).toLocaleString()}</span>
                              </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                <span className="text-gray-900 dark:text-gray-300">{course.ratingAvg ? course.ratingAvg.toFixed(1) : '0.0'} ({(course.ratingCount || 0)})</span>
                              </div>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              <span className="text-gray-900 dark:text-gray-300">{formatPrice(revenue)}</span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              <span className="text-gray-900 dark:text-gray-300">0%</span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>
                              <span className="text-gray-900 dark:text-gray-300">{formatDate(course.createdAt)}</span>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1F1F1F]">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="bg-[#1A1A1A] border-[#2D2D2D]">
                                  <DropdownMenuItem asChild className="text-white hover:bg-[#1F1F1F]">
                                    <Link to={`/courses/${course.id}`}>
                                      <Eye className="h-4 w-4 mr-2" />
                                      Xem
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-white hover:bg-[#1F1F1F]"
                                    onClick={() => handleEditCourse(course)}
                                  >
                                    <Edit className="h-4 w-4 mr-2" />
                                    Chỉnh sửa
                                  </DropdownMenuItem>
                                  <DropdownMenuItem 
                                    className="text-white hover:bg-[#1F1F1F]"
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      // Convert status to lowercase for state (backend returns uppercase)
                                      const statusLower = (course.status || 'draft').toLowerCase() as 'draft' | 'published' | 'archived';
                                      setNewStatus(statusLower);
                                      setIsStatusDialogOpen(true);
                                    }}
                                  >
                                    <BarChart3 className="h-4 w-4 mr-2" />
                                    Đổi trạng thái
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-400 hover:bg-[#1F1F1F]"
                                    onClick={() => {
                                      setSelectedCourse(course);
                                      setIsDeleteDialogOpen(true);
                                    }}
                                  >
                                    <Trash2 className="h-4 w-4 mr-2" />
                                    Xóa
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </DarkOutlineTableCell>
                          </DarkOutlineTableRow>
                        );
                      })}
                    </DarkOutlineTableBody>
                  </DarkOutlineTable>

                  {/* Pagination */}
                  {pagination.totalPages > 1 && (
                    <div className="flex justify-center mt-6 pt-4 border-t border-gray-300 dark:border-[#2D2D2D]">
                      {renderPagination()}
                    </div>
                  )}
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
            <>
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Top khóa học</CardTitle>
                <CardDescription className="text-gray-400">Theo số học viên đăng ký</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                        .sort((a, b) => (b.enrolledCount || 0) - (a.enrolledCount || 0))
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600/20 text-blue-500">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 text-gray-900 dark:text-white">{course.title}</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">{(course.enrolledCount || 0)} học viên</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
              <CardHeader>
                <CardTitle className="text-white">Đánh giá cao nhất</CardTitle>
                <CardDescription className="text-gray-400">Theo rating trung bình</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses
                        .sort((a, b) => (b.ratingAvg || 0) - (a.ratingAvg || 0))
                    .slice(0, 5)
                    .map((course, index) => (
                      <div key={course.id} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-600/20 text-yellow-500">
                            {index + 1}
                          </div>
                          <div>
                            <p className="font-medium line-clamp-1 text-gray-900 dark:text-white">{course.title}</p>
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                  <span className="text-gray-600 dark:text-gray-300">{course.ratingAvg ? course.ratingAvg.toFixed(1) : '0.0'}</span>
                                  <span className="text-gray-500">({course.ratingCount || 0})</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Thống kê tổng quan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tổng lượt xem</span>
                  <span className="text-2xl text-white">
                        {courses.reduce((sum, c) => sum + (c.viewsCount || 0), 0).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tỷ lệ hoàn thành trung bình</span>
                  <span className="text-2xl text-white">
                        {courses.length > 0
                          ? Math.round(courses.reduce((sum, c) => sum + ((c as any).completionRate || 0), 0) / courses.length)
                          : 0}%
                  </span>
                </div>
                <div className="flex justify-between items-center p-4 bg-[#1F1F1F] rounded-lg">
                  <span className="text-gray-400">Tổng số bài học</span>
                  <span className="text-2xl text-white">
                        {courses.reduce((sum, c) => sum + (c.lessonsCount || 0), 0)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
            </>
          )}
        </TabsContent>

        {/* Revenue Tab */}
        <TabsContent value="revenue" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : (
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
            <CardHeader>
              <CardTitle className="text-white">Doanh thu theo khóa học</CardTitle>
              <CardDescription className="text-gray-400">Chi tiết doanh thu từng khóa học</CardDescription>
            </CardHeader>
            <CardContent>
                {courses.filter(c => !c.isFree).length === 0 ? (
                  <div className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-400">Chưa có khóa học có phí</p>
                  </div>
                ) : (
                <DarkOutlineTable>
                  <DarkOutlineTableHeader>
                    <DarkOutlineTableRow>
                      <DarkOutlineTableHead>Khóa học</DarkOutlineTableHead>
                      <DarkOutlineTableHead>Giá bán</DarkOutlineTableHead>
                      <DarkOutlineTableHead>Đã bán</DarkOutlineTableHead>
                      <DarkOutlineTableHead className="text-right">Doanh thu</DarkOutlineTableHead>
                    </DarkOutlineTableRow>
                  </DarkOutlineTableHeader>
                  <DarkOutlineTableBody>
                    {courses
                      .filter(c => !c.isFree)
                      .sort((a, b) => {
                        const priceA = a.discountPrice || a.originalPrice || 0;
                        const priceB = b.discountPrice || b.originalPrice || 0;
                        const revA = priceA * (a.enrolledCount || 0);
                        const revB = priceB * (b.enrolledCount || 0);
                        return revB - revA;
                      })
                      .map(course => {
                        const price = course.discountPrice || course.originalPrice || 0;
                        const revenue = price * (course.enrolledCount || 0);
                        return (
                          <DarkOutlineTableRow key={course.id}>
                            <DarkOutlineTableCell>
                              <p className="font-medium text-gray-900 dark:text-white">{course.title}</p>
                            </DarkOutlineTableCell>
                            <DarkOutlineTableCell>{formatPrice(price)}</DarkOutlineTableCell>
                            <DarkOutlineTableCell>{course.enrolledCount || 0} khóa</DarkOutlineTableCell>
                            <DarkOutlineTableCell className="text-right font-semibold text-green-500">
                              {formatPrice(revenue)}
                            </DarkOutlineTableCell>
                          </DarkOutlineTableRow>
                        );
                      })}
                  </DarkOutlineTableBody>
                </DarkOutlineTable>
                )}
            </CardContent>
          </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete Course Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>Xác nhận xóa</DialogTitle>
            <DialogDescription className="text-gray-400">
              Bạn có chắc muốn xóa khóa học "{selectedCourse?.title}"? Hành động này không thể hoàn tác.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DarkOutlineButton
              onClick={() => {
                setIsDeleteDialogOpen(false);
                setSelectedCourse(null);
              }}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={handleDeleteCourse}
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
            <DarkOutlineButton
              onClick={() => {
                setIsStatusDialogOpen(false);
                setSelectedCourse(null);
              }}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={handleChangeStatus}
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