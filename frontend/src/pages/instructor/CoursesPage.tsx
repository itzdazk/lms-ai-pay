import { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { coursesApi } from '../../lib/api/courses'
import { instructorCoursesApi } from '../../lib/api/instructor-courses'
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { CourseFilters, CourseTable, CourseDialogs } from '../../components/instructor/courses';
import type { Course, Category } from '../../lib/api/types';



export function CoursesPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[]>([]);
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
  const [priceType, setPriceType] = useState<'all' | 'free' | 'paid'>('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
  const [localSearchInput, setLocalSearchInput] = useState<string>(filters.search || '');
  const [categorySearch, setCategorySearch] = useState<string>('');
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
      // RoleRoute component already handles permission check and shows toast
      navigate('/dashboard');
      return;
    }
  }, [currentUser, authLoading, navigate]);

  // Load data
  useEffect(() => {
    if (currentUser) {
      loadCategories();
    }
  }, [currentUser]);

  // Handle manual search execution
  const handleSearchExecute = () => {
    setSearchInput(localSearchInput.trim());
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters((prevFilters) => ({ ...prevFilters, search: localSearchInput.trim(), page: 1 }));
  };

  // Update local search input when filters.search changes
  useEffect(() => {
    setLocalSearchInput(filters.search || '');
  }, [filters.search]);

  // Load courses when filters change
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [filters.page, filters.limit, filters.search, filters.status, filters.categoryId, filters.level, filters.sort, priceType, currentUser]);

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
      id: typeof course.id === 'number' ? course.id : parseInt(String(course.id), 10),
      title: course.title || '',
      slug: course.slug || '',
      description: course.description || course.shortDescription || '',
      shortDescription: course.shortDescription,
      thumbnailUrl: course.thumbnailUrl || '',
      videoPreviewUrl: course.videoPreviewUrl || '',
      price: parseFloat(String(course.price || 0)) || 0,
      discountPrice: course.discountPrice ? parseFloat(String(course.discountPrice)) : undefined,
      instructorId: typeof course.instructorId === 'number' ? course.instructorId : parseInt(String(course.instructorId || 0), 10),
      instructor: course.instructor ? {
        id: typeof course.instructor.id === 'number' ? course.instructor.id : parseInt(String(course.instructor.id), 10),
        fullName: course.instructor.fullName || '',
        avatarUrl: course.instructor.avatarUrl,
      } : undefined,
      categoryId: typeof course.categoryId === 'number' ? course.categoryId : (course.category?.id ? parseInt(String(course.category.id), 10) : parseInt(String(course.categoryId || 0), 10)),
      category: course.category ? {
        id: typeof course.category.id === 'number' ? course.category.id : parseInt(String(course.category.id), 10),
        name: course.category.name || '',
        slug: course.category.slug || '',
        sortOrder: course.category.sortOrder || 0,
        isActive: course.category.isActive !== undefined ? course.category.isActive : true,
        createdAt: course.category.createdAt || '',
        updatedAt: course.category.updatedAt || '',
      } : undefined,
      level: course.level ? (course.level.toUpperCase() as 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED') : 'BEGINNER',
      durationHours: parseFloat(String(course.durationHours || 0)) || 0,
      totalLessons: course.totalLessons || 0,
      language: course.language || 'vi',
      status: course.status ? (course.status.toUpperCase() as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED') : 'DRAFT',
      isFeatured: course.isFeatured || false,
      enrolledCount: course.enrolledCount || 0,
      ratingAvg: course.ratingAvg ? parseFloat(String(course.ratingAvg)) : 0,
      ratingCount: course.ratingCount || 0,
      viewsCount: course.viewsCount || 0,
      completionRate: course.completionRate ? parseFloat(String(course.completionRate)) : 0,
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
      const coursesData = await instructorCoursesApi.getInstructorCourses(requestParams);
      
      // Transform courses data - preserve order from backend
      const coursesArray: any[] = coursesData?.data || [];
      const transformedCourses = coursesArray.map(transformCourse);
      
      // Filter by price type (client-side filtering)
      let filteredCourses = transformedCourses;
      if (priceType === 'free') {
        filteredCourses = transformedCourses.filter((course) => {
          const finalPrice = course.discountPrice ?? course.price;
          return finalPrice === 0 || finalPrice === null || finalPrice === undefined;
        });
      } else if (priceType === 'paid') {
        filteredCourses = transformedCourses.filter((course) => {
          const finalPrice = course.discountPrice ?? course.price;
          return finalPrice !== 0 && finalPrice !== null && finalPrice !== undefined;
        });
      }
      
      // Create a deep copy to ensure new reference and prevent any mutation
      const coursesToSet = JSON.parse(JSON.stringify(filteredCourses)) as Course[];
      setCourses(coursesToSet);
      
      const paginationData = coursesData.pagination || {
        page: 1,
        limit: 10,
        total: 0,
        totalPages: 0,
      };
      setPagination(paginationData);
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

  const handleEditCourse = (course: Course) => {
    // Save scroll position before navigating
    // Try multiple ways to get scroll position
    const scrollPosition = 
      window.scrollY || 
      window.pageYOffset || 
      document.documentElement.scrollTop || 
      document.body.scrollTop || 
      0;
    
    sessionStorage.setItem('instructorDashboardScroll', scrollPosition.toString());
    
    // Navigate to edit page
    navigate(`/instructor/courses/${course.id}/edit`);
  };

  const handleDeleteCourse = async () => {
    if (!selectedCourse) return;
    
    try {
      setActionLoading(true);
      await instructorCoursesApi.deleteInstructorCourse(String(selectedCourse.id));
      toast.success('Xóa khóa học thành công');
      
      // Cập nhật state cục bộ để tránh reload toàn trang
      setCourses((prev) => prev.filter((c) => c.id !== selectedCourse.id));
      setPagination((prev) => {
        const newTotal = Math.max((prev.total || 0) - 1, 0);
        const totalPages = Math.max(1, Math.ceil(newTotal / prev.limit));
        const newPage = Math.min(prev.page, totalPages);
        // Nếu trang hiện tại vượt quá totalPages, điều chỉnh page (trigger load nếu cần)
        if (newPage !== prev.page) {
          setFilters((f) => ({ ...f, page: newPage }));
        }
        return { ...prev, total: newTotal, totalPages, page: newPage };
      });

      setIsDeleteDialogOpen(false);
      setSelectedCourse(null);
    } catch (error: any) {
      console.error('Error deleting course:', error);
      // Error toast is already shown by API client interceptor, no need to show again
      // Only log for debugging
    } finally {
      setActionLoading(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!selectedCourse) return;
    
    try {
      setActionLoading(true);
      console.log('Changing status:', { courseId: selectedCourse.id, status: newStatus });
      const statusLower = newStatus.toLowerCase() as 'draft' | 'published' | 'archived';
      await instructorCoursesApi.changeCourseStatus(String(selectedCourse.id), statusLower);
      toast.success('Thay đổi trạng thái thành công');

      // Cập nhật state cục bộ, tránh reload toàn trang
      setCourses((prev) =>
        prev.map((c) =>
          c.id === selectedCourse.id ? { ...c, status: newStatus.toUpperCase() as Course['status'] } : c
        )
      );

      setIsStatusDialogOpen(false);
      setSelectedCourse(null);
    } catch (error: any) {
      console.error('Error changing status:', error);
      // Error toast is already shown by API client interceptor, no need to show again
      // Only log for debugging
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearchInputChange = (value: string) => {
    setLocalSearchInput(value);
  };

  const handleClearSearch = () => {
    setLocalSearchInput('');
    setSearchInput('');
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters((prevFilters) => ({ ...prevFilters, search: '', page: 1 }));
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

  const handlePriceTypeChange = (value: 'all' | 'free' | 'paid') => {
    setPriceType(value);
    const mainContainer = document.querySelector('main');
    if (mainContainer) {
      scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
    } else {
      scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
    }
    isPageChangingRef.current = true;
    setFilters({ ...filters, page: 1 });
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


  return (
    <div className="space-y-4">
      <CourseFilters
        filters={filters}
        categories={categories}
        priceType={priceType}
        categorySearch={categorySearch}
        searchInput={searchInput}
        onFilterChange={handleFilterChange}
        onPriceTypeChange={handlePriceTypeChange}
        onCategorySearchChange={setCategorySearch}
        onSearchInputChange={setSearchInput}
        onClearFilters={() => {
                  setSearchInput('');
                  setPriceType('all');
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
      />

      <CourseTable
        courses={memoizedCourses}
        pagination={pagination}
        loading={loading}
        searchInput={localSearchInput}
        onSearchChange={handleSearchInputChange}
        onSearchExecute={handleSearchExecute}
        onClearSearch={handleClearSearch}
        onCreateCourse={() => {
                // Save scroll position before navigating
                const scrollPosition = 
                  window.scrollY || 
                  window.pageYOffset || 
                  document.documentElement.scrollTop || 
                  document.body.scrollTop || 
                  0;
                
                sessionStorage.setItem('instructorDashboardScroll', scrollPosition.toString());
                navigate('/instructor/courses/create');
              }}
        onEditCourse={handleEditCourse}
        onDeleteCourse={(c) => {
                        setSelectedCourse(c);
                        setIsDeleteDialogOpen(true);
                      }}
                      onChangeStatus={(c) => {
                        setSelectedCourse(c);
                        const statusLower = (c.status || 'draft').toLowerCase() as 'draft' | 'published' | 'archived';
                        setNewStatus(statusLower);
                        setIsStatusDialogOpen(true);
                      }}
                      onViewAnalytics={(c) => {
                        setSelectedCourse(c);
                        setIsAnalyticsDialogOpen(true);
                      }}
        selectedRowId={selectedRowId}
        onSelectRow={setSelectedRowId}
        onPageChange={handlePageChange}
      />

      <CourseDialogs
        isDeleteDialogOpen={isDeleteDialogOpen}
        setIsDeleteDialogOpen={setIsDeleteDialogOpen}
        selectedCourse={selectedCourse}
        onDeleteCourse={handleDeleteCourse}
        isAnalyticsDialogOpen={isAnalyticsDialogOpen}
        setIsAnalyticsDialogOpen={setIsAnalyticsDialogOpen}
        isStatusDialogOpen={isStatusDialogOpen}
        setIsStatusDialogOpen={setIsStatusDialogOpen}
        newStatus={newStatus}
        setNewStatus={setNewStatus}
        onChangeStatus={handleChangeStatus}
        actionLoading={actionLoading}
      />
    </div>
  );
}

