import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DarkOutlineButton } from '../components/ui/buttons';
import { Tabs, TabsContent } from '../components/ui/tabs';
import { DarkTabsList, DarkTabsTrigger } from '../components/ui/dark-tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import {
  DarkOutlineTable,
  DarkOutlineTableHeader,
  DarkOutlineTableBody,
  DarkOutlineTableRow,
  DarkOutlineTableHead,
  DarkOutlineTableCell,
} from '../components/ui/dark-outline-table';
import {
  BookOpen,
  Users,
  DollarSign,
  TrendingUp,
  Star,
  BarChart3,
  Loader2,
} from 'lucide-react';
import { coursesApi } from '../lib/api/courses';
import { useAuth } from '../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { toast } from 'sonner';
import type { Course } from '../lib/api/types';
import { CoursesPage } from './instructor/CoursesPage';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
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

  // Check if user is instructor - early return to prevent API calls
  useEffect(() => {
    if (authLoading) return;
    
    if (!currentUser) {
      navigate('/login');
      return;
    }
    
    if (currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
      // RoleRoute component already handles permission check and redirect
      // Don't navigate here to avoid duplicate redirects
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

  // Load courses when filters change
  useEffect(() => {
    // Only load if user is instructor/admin
    if (currentUser && (currentUser.role === 'INSTRUCTOR' || currentUser.role === 'ADMIN')) {
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
      // Error toast is already shown by API client interceptor
      setCourses([]);
    } finally {
      setLoading(false);
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
      const coursesWithRatings = allCourses.filter((c: Course) => (c.ratingCount || 0) > 0);
      const avgRating = statsData?.averageRating || 
        (coursesWithRatings.length > 0 
          ? coursesWithRatings.reduce((sum: number, c: Course) => sum + (c.ratingAvg || 0), 0) / coursesWithRatings.length 
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
        const coursesWithRatings = courses.filter((c: Course) => (c.ratingCount || 0) > 0);
        const avgRating = coursesWithRatings.length > 0 
          ? coursesWithRatings.reduce((sum: number, c: Course) => sum + (c.ratingAvg || 0), 0) / coursesWithRatings.length 
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
      // Error toast is already shown by API client interceptor
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
      // Error toast is already shown by API client interceptor
    } finally {
      setActionLoading(false);
    }
  };

  // Early return if user doesn't have permission (RoleRoute will handle redirect)
  if (currentUser && currentUser.role !== 'INSTRUCTOR' && currentUser.role !== 'ADMIN') {
    return null;
  }

  // Early return if not authenticated (ProtectedRoute will handle redirect)
  if (!currentUser) {
    return null;
  }

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
              {stats.avgRating > 0 ? stats.avgRating.toFixed(1) : '-'}
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            </div>
            <p className="text-xs text-gray-500 mt-1">Từ học viên</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="courses" className="space-y-6">
        <DarkTabsList>
          <DarkTabsTrigger value="courses" variant="blue">
            <BookOpen className="h-4 w-4 mr-2" />
            Khóa học
          </DarkTabsTrigger>
          <DarkTabsTrigger value="analytics" variant="blue">
            <BarChart3 className="h-4 w-4 mr-2" />
            Phân tích
          </DarkTabsTrigger>
          <DarkTabsTrigger value="revenue" variant="blue">
            <DollarSign className="h-4 w-4 mr-2" />
            Doanh thu
          </DarkTabsTrigger>
        </DarkTabsList>

        {/* Courses Tab */}
        <TabsContent value="courses" className="space-y-4">
          <CoursesPage />
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
                                  <span className="text-gray-600 dark:text-gray-300">
                                    {course.ratingCount > 0 && course.ratingAvg ? course.ratingAvg.toFixed(1) : '-'}
                                  </span>
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