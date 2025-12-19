import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
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
  const [loadingAnalytics, setLoadingAnalytics] = useState(true);
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
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [isFeaturedDialogOpen, setIsFeaturedDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [categorySearch, setCategorySearch] = useState<string>('');
  const [instructorSearch, setInstructorSearch] = useState<string>('');
  const [tempMinPrice, setTempMinPrice] = useState<number | undefined>(undefined);
  const [tempMaxPrice, setTempMaxPrice] = useState<number | undefined>(undefined);
  const [tempMinEnrollments, setTempMinEnrollments] = useState<number | undefined>(undefined);
  const [tempMaxEnrollments, setTempMaxEnrollments] = useState<number | undefined>(undefined);
  const priceDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enrollmentsDebounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
      setLoadingAnalytics(true);
      const data = await adminCoursesApi.getPlatformAnalytics();
      setAnalytics(data);
    } catch (error: any) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      const mainContainer = document.querySelector('main');
      if (mainContainer) {
        scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
      } else {
        scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
      }
      isPageChangingRef.current = true;
      setFilters((prevFilters) => ({ ...prevFilters, search: searchInput, page: 1 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  // Debounce price filter changes
  useEffect(() => {
    if (priceDebounceTimerRef.current) {
      clearTimeout(priceDebounceTimerRef.current);
    }

    if (tempMinPrice !== undefined || tempMaxPrice !== undefined) {
      priceDebounceTimerRef.current = setTimeout(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
          scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
        } else {
          scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        }
        isPageChangingRef.current = true;
        setFilters(prevFilters => ({
          ...prevFilters,
          minPrice: tempMinPrice,
          maxPrice: tempMaxPrice,
          page: 1,
        }));
        setTempMinPrice(undefined);
        setTempMaxPrice(undefined);
      }, 1000); // 500ms debounce
    }

    return () => {
      if (priceDebounceTimerRef.current) {
        clearTimeout(priceDebounceTimerRef.current);
      }
    };
  }, [tempMinPrice, tempMaxPrice]);

  // Debounce enrollment filter changes
  useEffect(() => {
    if (enrollmentsDebounceTimerRef.current) {
      clearTimeout(enrollmentsDebounceTimerRef.current);
    }

    if (tempMinEnrollments !== undefined || tempMaxEnrollments !== undefined) {
      enrollmentsDebounceTimerRef.current = setTimeout(() => {
        const mainContainer = document.querySelector('main');
        if (mainContainer) {
          scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
        } else {
          scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
        }
        isPageChangingRef.current = true;
        setFilters(prevFilters => ({
          ...prevFilters,
          minEnrollments: tempMinEnrollments,
          maxEnrollments: tempMaxEnrollments,
          page: 1,
        }));
        setTempMinEnrollments(undefined);
        setTempMaxEnrollments(undefined);
      }, 1000); // 500ms debounce
    }

    return () => {
      if (enrollmentsDebounceTimerRef.current) {
        clearTimeout(enrollmentsDebounceTimerRef.current);
      }
    };
  }, [tempMinEnrollments, tempMaxEnrollments]);

  // Separate effect for initial load and pagination
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [filters.page, filters.limit, currentUser]);

  // Separate effect for filter changes (debounced)
  useEffect(() => {
    if (currentUser && filters.search !== undefined) {
      // Trigger load when search changes
      const timer = setTimeout(() => {
        loadCourses();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [filters.search, currentUser]);

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

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterChange = (key: keyof AdminCourseFilters, value: any) => {
    // Update filters immediately for instant UI feedback, but only reset page if not pagination-related
    const shouldResetPage = key !== 'page' && key !== 'limit';
    const newFilters = { ...filters, [key]: value === 'all' ? undefined : value };

    if (shouldResetPage) {
      newFilters.page = 1; // Reset to page 1 only for filter changes, not pagination
    }

    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = shouldResetPage;
    setFilters(newFilters);
    // API call will be triggered by useEffect with proper debouncing
  };

  const handlePriceTypeChange = (value: 'all' | 'free' | 'paid') => {
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
        setFilters({ ...filters, minPrice: undefined, maxPrice: 0, page: 1 });
      } else if (value === 'paid') {
        // Có phí: minPrice > 0
        setFilters({ ...filters, minPrice: 1, maxPrice: undefined, page: 1 });
      } else {
        // Tất cả: clear price filters
        setFilters({ ...filters, minPrice: undefined, maxPrice: undefined, page: 1 });
      }
    }, 300);
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
        <button
          onClick={() => handlePageChange(1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-2 text-sm bg-[#2D2D2D] border border-[#404040] rounded hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;&lt;
        </button>
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1 || loading}
          className="px-3 py-2 text-sm bg-[#2D2D2D] border border-[#404040] rounded hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &lt;
        </button>
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
            <button
              key={pageNum}
              onClick={() => handlePageChange(pageNum)}
              disabled={loading}
              className={`px-3 py-2 text-sm border rounded ${
                currentPage === pageNum
                  ? '!bg-blue-600 !text-white !border-blue-600 hover:!bg-blue-700'
                  : 'bg-[#2D2D2D] border-[#404040] hover:bg-[#3D3D3D]'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {pageNum}
            </button>
          );
        })}
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-2 text-sm bg-[#2D2D2D] border border-[#404040] rounded hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;
        </button>
        <button
          onClick={() => handlePageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          className="px-3 py-2 text-sm bg-[#2D2D2D] border border-[#404040] rounded hover:bg-[#3D3D3D] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          &gt;&gt;
        </button>
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
            filters={filters}
            priceType={priceType}
            categorySearch={categorySearch}
            instructorSearch={instructorSearch}
            tempMinPrice={tempMinPrice}
            tempMaxPrice={tempMaxPrice}
            tempMinEnrollments={tempMinEnrollments}
            tempMaxEnrollments={tempMaxEnrollments}
            categories={categories}
            instructors={instructors}
            onFilterChange={handleFilterChange}
            onPriceTypeChange={handlePriceTypeChange}
            onCategorySearchChange={setCategorySearch}
            onInstructorSearchChange={setInstructorSearch}
            onTempMinPriceChange={setTempMinPrice}
            onTempMaxPriceChange={setTempMaxPrice}
            onTempMinEnrollmentsChange={setTempMinEnrollments}
            onTempMaxEnrollmentsChange={setTempMaxEnrollments}
            onClearFilters={() => {
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
                }}
          />

          <CourseTable
            courses={courses}
            loading={loading}
            pagination={pagination}
            searchInput={searchInput}
            selectedRowId={selectedRowId}
            onSearchChange={handleSearch}
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