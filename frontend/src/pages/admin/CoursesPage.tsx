import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { adminCoursesApi, type AdminCourse, type AdminCourseFilters, type PlatformAnalytics } from '../../lib/api/admin-courses';
import { coursesApi } from '../../lib/api/courses';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import type { Category } from '../../lib/api/types';
import type { User } from '../../lib/api/types';
import { AnalyticsCards, CourseFilters, CourseTable, CourseDialogs } from '../../components/admin/courses';

export function CoursesPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [analytics, setAnalytics] = useState<PlatformAnalytics | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AdminCourseFilters>({
    page: 1,
    limit: 10,
    search: '',
    status: undefined,
    categoryId: undefined,
    level: undefined,
    instructorId: undefined,
    isFeatured: undefined,
    sort: 'newest',
    minPrice: undefined,
    maxPrice: undefined,
    minEnrollments: undefined,
    maxEnrollments: undefined,
    minRating: undefined,
  });

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.categoryId,
    filters.level,
    filters.instructorId,
    filters.isFeatured,
    filters.sort,
    filters.minPrice,
    filters.maxPrice,
    filters.minEnrollments,
    filters.maxEnrollments,
    filters.minRating,
  ]);
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [isFeaturedDialogOpen, setIsFeaturedDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [instructorSearch, setInstructorSearch] = useState<string>('');
  const filterDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollPositionRef = useRef<number>(0);
  const isPageChangingRef = useRef<boolean>(false);

  // Check if user is admin
  useEffect(() => {
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

  // Load categories, instructors, and analytics
  useEffect(() => {
    if (currentUser) {
      loadAnalytics();
      loadCategories();
      loadInstructors();
    }
  }, [currentUser]);

  const loadAnalytics = async () => {
    try {
      const data = await adminCoursesApi.getPlatformAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
    }
  };


  // Load courses when filters change
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [
    filters.page,
    filters.limit,
    filters.search,
    filters.status,
    filters.categoryId,
    filters.level,
    filters.instructorId,
    filters.isFeatured,
    filters.sort,
    filters.minPrice,
    filters.maxPrice,
    filters.minEnrollments,
    filters.maxEnrollments,
    filters.minRating,
    currentUser,
  ]);

  useEffect(() => {
    if (currentUser && (filters.status !== undefined || filters.categoryId !== undefined || filters.level !== undefined ||
                        filters.instructorId !== undefined || filters.isFeatured !== undefined || filters.sort !== 'newest' ||
                        filters.minPrice !== undefined || filters.maxPrice !== undefined ||
                        filters.minEnrollments !== undefined || filters.maxEnrollments !== undefined || filters.minRating !== undefined)) {
      // Trigger load when other filters change
      const timer = setTimeout(() => {
        loadCourses();
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [filters.status, filters.categoryId, filters.level, filters.instructorId, filters.isFeatured, filters.sort,
      filters.minPrice, filters.maxPrice, filters.minEnrollments, filters.maxEnrollments, filters.minRating, currentUser]);

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
  }, [pagination.page]);

  const loadCourses = async () => {
    try {
      setLoading(true);
      // Clean and validate filters before sending to avoid validation errors
      const cleanFilters: any = {};

      // Only include defined, non-null, non-empty values
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          // Convert string numbers to actual numbers for numeric fields
          if (['minPrice', 'maxPrice', 'minEnrollments', 'maxEnrollments', 'minRating', 'page', 'limit', 'categoryId', 'instructorId'].includes(key)) {
            const numValue = typeof value === 'string' ? parseFloat(value) : value;
            if (!isNaN(numValue)) {
              cleanFilters[key] = numValue;
            }
          } else {
            cleanFilters[key] = value;
          }
        }
      });

      const result = await adminCoursesApi.getAllCourses(cleanFilters);
      setCourses(result.data);
      setPagination(result.pagination);
    } catch (error: any) {
      console.error('Error loading courses:', error);
      // Error toast is already shown by API client interceptor
      setCourses([]);
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

  const loadInstructors = async () => {
    try {
      // Get all instructors for filtering using dedicated admin API
      const instructors = await adminCoursesApi.getInstructorsForCourses(1000);
      setInstructors(instructors);
    } catch (error: any) {
      console.error('Error loading instructors:', error);
      setInstructors([]);
    }
  };

  // Handle search input change (no auto-search)
  const handleSearchInputChange = (value: string) => {
    setSearchInput(value);
  };

  // Handle search execution (manual search)
  const handleSearch = () => {
    setFilters((prev) => ({ ...prev, search: searchInput.trim(), page: 1 }));
  };

  // Handle search on Enter key
  const handleSearchKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleFilterChange = useCallback((
    key: keyof AdminCourseFilters,
    value: any
  ) => {
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current =
        window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters(prev => ({
      ...prev,
      [key]: value === 'all' ? undefined : value,
      page: 1,
    }));
  }, []);

  const handlePriceTypeChange = useCallback((value: 'all' | 'free' | 'paid') => {
    setPriceType(value);

    // Debounce price type changes
    if (filterDebounceTimerRef.current) {
      clearTimeout(filterDebounceTimerRef.current);
    }

    filterDebounceTimerRef.current = setTimeout(() => {
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
      } else {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
      }
      isPageChangingRef.current = true;

      if (value === 'free') {
        // Miễn phí: maxPrice = 0
        setFilters(prev => ({ ...prev, minPrice: undefined, maxPrice: 0, page: 1 }));
      } else if (value === 'paid') {
        // Có phí: minPrice > 0
        setFilters(prev => ({ ...prev, minPrice: 1, maxPrice: undefined, page: 1 }));
      } else {
        // Tất cả: clear price filters
        setFilters(prev => ({ ...prev, minPrice: undefined, maxPrice: undefined, page: 1 }));
      }
    }, 300);
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearchInput('');
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setPriceType('all');
    setFilters({
      page: 1,
      limit: 10,
      search: '',
      status: undefined,
      categoryId: undefined,
      level: undefined,
      instructorId: undefined,
      isFeatured: undefined,
      sort: 'newest',
      minPrice: undefined,
      maxPrice: undefined,
      minEnrollments: undefined,
      maxEnrollments: undefined,
      minRating: undefined,
    });
  }, []);

  const handlePageChange = useCallback((newPage: number) => {
    // Use requestAnimationFrame to avoid blocking input
    requestAnimationFrame(() => {
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
      } else {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
      }
      isPageChangingRef.current = true;
    });

    setFilters(prev => ({ ...prev, page: newPage }));
  }, []);

  const renderPagination = () => {
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

    return (
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
                  pagination.page === pageNum
                  ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                  : ''
              }
            >
              {pageNum}
            </DarkOutlineButton>
          );
        })}
        </div>

        <DarkOutlineButton
          onClick={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === totalPages}
          size="sm"
          className="min-w-[40px] h-9"
        >
          &gt;
        </DarkOutlineButton>
        <DarkOutlineButton
          onClick={() => handlePageChange(totalPages)}
          disabled={pagination.page === totalPages}
          size="sm"
          className="min-w-[40px] h-9"
        >
          &gt;&gt;
        </DarkOutlineButton>
      </div>
    );
  };

  const confirmToggleFeatured = async () => {
    if (!selectedCourse) return;

    try {
      setActionLoading(true);
      const newFeaturedStatus = !selectedCourse.isFeatured;

      // Check if trying to feature a non-published course
      if (newFeaturedStatus && selectedCourse.status !== 'PUBLISHED') {
        toast.error('Chỉ có thể đánh dấu nổi bật cho khóa học đã xuất bản');
        setIsFeaturedDialogOpen(false);
        setSelectedCourse(null);
        return;
      }

      await adminCoursesApi.toggleCourseFeatured(selectedCourse.id, newFeaturedStatus);
      toast.success(newFeaturedStatus ? 'Đã đánh dấu nổi bật khóa học' : 'Đã bỏ đánh dấu nổi bật khóa học');
      setIsFeaturedDialogOpen(false);
      setSelectedCourse(null);
      // Update local state instead of reloading
      setCourses((prev) =>
        prev.map((course) =>
          course.id === selectedCourse.id ? { ...course, isFeatured: newFeaturedStatus } : course
        )
      );
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      // Error toast is already shown by API client interceptor
      setIsFeaturedDialogOpen(false);
      setSelectedCourse(null);
    } finally {
      setActionLoading(false);
    }
  };

  // Loading state
  if (authLoading || loading) {
    return (
      <div className="w-full px-4 py-4 bg-background text-foreground min-h-screen">
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-400">Đang tải...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="w-full">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            Quản lý khóa học
          </h1>
          <p className="text-muted-foreground">Quản lý và theo dõi tất cả khóa học trên nền tảng</p>
        </div>
        <div className="space-y-4">
          <AnalyticsCards
            analytics={analytics}
            courses={courses}
            pagination={pagination}
          />

          <CourseFilters
            filters={memoizedFilters}
            priceType={priceType}
            categorySearch={categorySearch}
            instructorSearch={instructorSearch}
            categories={categories}
            instructors={instructors}
            onFilterChange={handleFilterChange}
            onPriceTypeChange={handlePriceTypeChange}
            onCategorySearchChange={setCategorySearch}
            onInstructorSearchChange={setInstructorSearch}
            onClearFilters={handleClearFilters}
          />

          <CourseTable
            courses={courses}
            loading={loading}
            pagination={pagination}
            searchInput={searchInput}
            selectedRowId={selectedRowId}
            onSearchChange={handleSearchInputChange}
            onSearchExecute={handleSearch}
            onSearchKeyPress={handleSearchKeyPress}
            onToggleFeatured={(course) => {
              setSelectedCourse(course);
              setIsFeaturedDialogOpen(true);
            }}
            onRowSelect={setSelectedRowId}
            onPageChange={handlePageChange}
            renderPagination={renderPagination}
          />

          <CourseDialogs
            isFeaturedDialogOpen={isFeaturedDialogOpen}
            selectedCourse={selectedCourse}
            actionLoading={actionLoading}
            onCloseFeaturedDialog={() => {
                setIsFeaturedDialogOpen(false);
                setSelectedCourse(null);
              }}
            onConfirmToggleFeatured={confirmToggleFeatured}
          />
        </div>
      </div>
    </div>
  );
}
