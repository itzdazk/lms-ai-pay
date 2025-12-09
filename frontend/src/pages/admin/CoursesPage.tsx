import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { DarkOutlineInput } from '../../components/ui/dark-outline-input';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '../../components/ui/dark-outline-select-trigger';
import {
  DarkOutlineTable,
  DarkOutlineTableHeader,
  DarkOutlineTableBody,
  DarkOutlineTableRow,
  DarkOutlineTableHead,
  DarkOutlineTableCell,
} from '../../components/ui/dark-outline-table';
import {
  BookOpen,
  Users,
  MoreVertical,
  Eye,
  Star,
  Loader2,
  Search,
  Star as StarIcon,
  TrendingUp,
} from 'lucide-react';
import { adminCoursesApi, type AdminCourse, type AdminCourseFilters } from '../../lib/api/admin-courses';
import { coursesApi } from '../../lib/api/courses';
import { usersApi } from '../../lib/api/users';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import type { Category } from '../../lib/api/types';
import type { User } from '../../lib/api/types';

function formatPrice(price: number): string {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(price);
}

function formatDuration(hours: number): string {
  if (!hours) return '0 giờ';
  const h = Math.floor(hours);
  const mins = Math.floor((hours - h) * 60);
  if (h > 0) {
    return mins > 0 ? `${h}h ${mins}p` : `${h}h`;
  }
  return `${mins}p`;
}

// Component for each course row with dropdown menu
function CourseRow({ 
  course, 
  onToggleFeatured,
  isSelected,
  onSelect
}: { 
  course: AdminCourse; 
  onToggleFeatured: (course: AdminCourse) => void;
  isSelected: boolean;
  onSelect: (courseId: number | null) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0, transform: 'translate(-100%, 0)' });
  const menuRef = useRef<HTMLDivElement>(null);
  
  const handleToggle = (isCurrentlySelected: boolean, e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    if (isCurrentlySelected) {
      onSelect(null);
    } else {
      onSelect(course.id);
      setMenuPosition({ x: e.clientX, y: e.clientY });
      setMenuOpen(true);
    }
  };

  // Adjust menu position to stay within viewport
  useEffect(() => {
    if (!menuOpen || !menuRef.current) return;

    const menu = menuRef.current;
    const menuRect = menu.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    
    let left = menuPosition.x;
    let top = menuPosition.y;
    let transform = 'translate(-100%, 0)';
    
    if (left - menuRect.width < 0) {
      transform = 'translate(0, 0)';
      left = menuPosition.x;
    }
    
    if (left + menuRect.width > viewportWidth) {
      transform = 'translate(-100%, 0)';
      left = menuPosition.x;
      if (left - menuRect.width < 0) {
        left = viewportWidth - menuRect.width - 8;
      }
    }
    
    if (top + menuRect.height > viewportHeight) {
      top = menuPosition.y - menuRect.height;
      if (top < 0) {
        top = viewportHeight - menuRect.height - 8;
      }
    }
    
    if (top < 0) {
      top = 8;
    }
    
    setAdjustedPosition({ x: left, y: top, transform });
  }, [menuOpen, menuPosition]);

  // Close menu when clicking outside and disable scroll when menu is open
  useEffect(() => {
    if (!menuOpen) return;

    const scrollContainer = document.querySelector('main') || window;
    const savedScrollPosition = scrollContainer === window 
      ? window.scrollY || document.documentElement.scrollTop
      : (scrollContainer as HTMLElement).scrollTop;

    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpen(false);
      }
    };

    const handleScroll = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      if (scrollContainer === window) {
        window.scrollTo(0, savedScrollPosition);
      } else {
        (scrollContainer as HTMLElement).scrollTop = savedScrollPosition;
      }
    };

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowUp' || e.key === 'ArrowDown' || e.key === 'PageUp' || e.key === 'PageDown' || e.key === 'Home' || e.key === 'End' || e.key === ' ') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('scroll', handleScroll, { passive: false, capture: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    
    if (scrollContainer !== window) {
      (scrollContainer as HTMLElement).addEventListener('scroll', handleScroll, { passive: false, capture: true });
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('wheel', handleWheel);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('scroll', handleScroll, { capture: true });
      document.removeEventListener('keydown', handleKeyDown);
      if (scrollContainer !== window) {
        (scrollContainer as HTMLElement).removeEventListener('scroll', handleScroll, { capture: true });
      }
    };
  }, [menuOpen]);

  return (
    <>
      <DarkOutlineTableRow 
        className="cursor-pointer"
        selected={isSelected}
        onRowToggle={handleToggle}
      >
        <DarkOutlineTableCell>
          <div className="flex items-center gap-3">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-16 h-10 object-cover rounded"
              />
            ) : (
              <div className="w-16 h-10 bg-gray-200 dark:bg-[#2D2D2D] rounded flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium line-clamp-1 text-gray-900 dark:text-white">{course.title}</p>
                {course.isFeatured && (
                  <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {course.totalLessons} bài • {formatDuration(course.durationHours)}
              </p>
            </div>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          {course.status === 'PUBLISHED' ? (
            <Badge className="bg-green-600">Đã xuất bản</Badge>
          ) : course.status === 'DRAFT' ? (
            <Badge variant="outline" className="border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300">Bản nháp</Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-600 text-white">Đã lưu trữ</Badge>
          )}
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{course.instructor.fullName}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{course.category.name}</span>
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
            <span className="text-gray-900 dark:text-gray-300">
              {course.ratingCount > 0 && course.ratingAvg 
                ? (typeof course.ratingAvg === 'number' ? course.ratingAvg : parseFloat(String(course.ratingAvg)) || 0).toFixed(1) 
                : '-'} ({(course.ratingCount || 0)})
            </span>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">
            {course.discountPrice ? (
              <>
                <span className="line-through text-gray-500 text-sm">{formatPrice(course.price)}</span>
                <span className="ml-2 text-red-500">{formatPrice(course.discountPrice)}</span>
              </>
            ) : (
              formatPrice(course.price)
            )}
          </span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{formatDate(course.createdAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{formatDate(course.updatedAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="text-right">
          <Button variant="ghost" size="icon" className="text-gray-400 hover:text-white hover:bg-[#1F1F1F]" onClick={(e) => {
            e.stopPropagation();
            if (!isSelected) {
              onSelect(course.id);
            }
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setMenuOpen(true);
          }}>
            <MoreVertical className="h-4 w-4" />
          </Button>
        </DarkOutlineTableCell>
      </DarkOutlineTableRow>
      
      {menuOpen && createPortal(
        <div
          ref={menuRef}
          className="fixed z-50 min-w-[8rem] rounded-md border bg-[#1A1A1A] border-[#2D2D2D] p-1 shadow-md"
          style={{
            left: `${adjustedPosition.x}px`,
            top: `${adjustedPosition.y}px`,
            transform: adjustedPosition.transform,
          }}
        >
          <Link 
            to={`/courses/${course.id}`}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <Eye className="h-4 w-4" />
            Xem
          </Link>
          <div 
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onToggleFeatured(course);
              setMenuOpen(false);
            }}
          >
            <StarIcon className="h-4 w-4" />
            {course.isFeatured ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
          </div>
        </div>,
        document.body
      )}
    </>
  );
}

export function CoursesPage() {
  const { user: currentUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<AdminCourse[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [instructors, setInstructors] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });
  const [filters, setFilters] = useState<AdminCourseFilters>({
    page: 1,
    limit: 20,
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
  const [isFeaturedDialogOpen, setIsFeaturedDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<AdminCourse | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [selectedRowId, setSelectedRowId] = useState<number | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
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

  // Load categories and instructors
  useEffect(() => {
    if (currentUser) {
      loadCategories();
      loadInstructors();
    }
  }, [currentUser]);

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

  // Load courses when filters change
  useEffect(() => {
    if (currentUser) {
      loadCourses();
    }
  }, [filters.page, filters.limit, filters.search, filters.status, filters.categoryId, filters.level, filters.instructorId, filters.isFeatured, filters.sort, filters.minPrice, filters.maxPrice, filters.minEnrollments, filters.maxEnrollments, filters.minRating, currentUser]);

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
      const result = await adminCoursesApi.getAllCourses(filters);
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
      const transformedCategories = categoriesData.map(cat => ({
        ...cat,
        id: typeof cat.id === 'number' ? String(cat.id) : cat.id,
      }));
      setCategories(transformedCategories);
    } catch (error: any) {
      console.error('Error loading categories:', error);
    }
  };

  const loadInstructors = async () => {
    try {
      const result = await usersApi.getUsers({ role: 'INSTRUCTOR', limit: 100 });
      setInstructors(result.data);
    } catch (error: any) {
      console.error('Error loading instructors:', error);
    }
  };

  const handleToggleFeatured = (course: AdminCourse) => {
    setSelectedCourse(course);
    setIsFeaturedDialogOpen(true);
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
      loadCourses();
    } catch (error: any) {
      console.error('Error toggling featured:', error);
      // Error toast is already shown by API client interceptor
      setIsFeaturedDialogOpen(false);
      setSelectedCourse(null);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
  };

  const handleFilterChange = (key: keyof AdminCourseFilters, value: any) => {
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if not admin (handled by useEffect, but show nothing while redirecting)
  if (!currentUser || currentUser.role !== 'ADMIN') {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-4 bg-background text-foreground min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl md:text-4xl font-bold mb-2 text-foreground flex items-center gap-3">
            <BookOpen className="h-8 w-8" />
            Quản lý khóa học
          </h1>
          <p className="text-muted-foreground">Quản lý và theo dõi tất cả khóa học trên nền tảng</p>
        </div>
        <div className="space-y-4">
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
                  handleFilterChange('categoryId', value === 'all' ? undefined : parseInt(value));
                }}
              >
                <DarkOutlineSelectTrigger>
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
                  <DarkOutlineSelectItem value="BEGINNER">Cơ bản</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="INTERMEDIATE">Trung bình</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="ADVANCED">Nâng cao</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Giảng viên</Label>
              <Select
                value={filters.instructorId ? String(filters.instructorId) : 'all'}
                onValueChange={(value) => {
                  handleFilterChange('instructorId', value === 'all' ? undefined : parseInt(value));
                }}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả giảng viên" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả giảng viên</DarkOutlineSelectItem>
                  {instructors.map((instructor) => (
                    <DarkOutlineSelectItem key={instructor.id} value={instructor.id}>
                      {instructor.fullName}
                    </DarkOutlineSelectItem>
                  ))}
                </DarkOutlineSelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Nổi bật</Label>
              <Select
                value={filters.isFeatured === undefined ? 'all' : filters.isFeatured ? 'true' : 'false'}
                onValueChange={(value) => {
                  handleFilterChange('isFeatured', value === 'all' ? undefined : value === 'true');
                }}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="true">Có</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="false">Không</DarkOutlineSelectItem>
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
                  <DarkOutlineSelectItem value="updated">Cập nhật gần nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="popular">Phổ biến</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="rating">Đánh giá</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="price_asc">Giá: Thấp đến cao</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="price_desc">Giá: Cao đến thấp</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="views">Lượt xem</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="title">Tên A-Z</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>
          </div>

          {/* Advanced Filters Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Giá tối thiểu (VND)</Label>
              <DarkOutlineInput
                type="number"
                placeholder="0"
                value={filters.minPrice || ''}
                onChange={(e) => handleFilterChange('minPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Giá tối đa (VND)</Label>
              <DarkOutlineInput
                type="number"
                placeholder="Không giới hạn"
                value={filters.maxPrice || ''}
                onChange={(e) => handleFilterChange('maxPrice', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Số học viên tối thiểu</Label>
              <DarkOutlineInput
                type="number"
                placeholder="0"
                value={filters.minEnrollments || ''}
                onChange={(e) => handleFilterChange('minEnrollments', e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Số học viên tối đa</Label>
              <DarkOutlineInput
                type="number"
                placeholder="Không giới hạn"
                value={filters.maxEnrollments || ''}
                onChange={(e) => handleFilterChange('maxEnrollments', e.target.value ? parseInt(e.target.value) : undefined)}
                min="0"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Đánh giá tối thiểu</Label>
              <DarkOutlineInput
                type="number"
                placeholder="0"
                value={filters.minRating || ''}
                onChange={(e) => handleFilterChange('minRating', e.target.value ? parseFloat(e.target.value) : undefined)}
                min="0"
                max="5"
                step="0.1"
              />
            </div>
          </div>

          {/* Search and Clear Filters */}
          <div className="flex gap-4">
            <div className="flex-1 space-y-2">
              <Label className="text-gray-400 text-sm">Tìm kiếm</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <DarkOutlineInput
                  type="text"
                  placeholder="Tìm kiếm theo tên khóa học, mô tả, giảng viên..."
                  value={searchInput}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-end">
              <Button
                onClick={() => {
                  setSearchInput('');
                  const mainContainer = document.querySelector('main');
                  if (mainContainer) {
                    scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                  } else {
                    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                  }
                  isPageChangingRef.current = true;
                  setFilters({
                    page: 1,
                    limit: 20,
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
                variant="blue"
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
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
                Danh sách tất cả khóa học trên hệ thống
              </CardDescription>
            </div>
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
              <p className="text-gray-400">Không tìm thấy khóa học nào</p>
            </div>
          ) : (
            <>
              <DarkOutlineTable>
                <DarkOutlineTableHeader>
                  <DarkOutlineTableRow>
                    <DarkOutlineTableHead>Khóa học</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Trạng thái</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Giảng viên</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Danh mục</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Học viên</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Đánh giá</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Giá</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Ngày tạo</DarkOutlineTableHead>
                    <DarkOutlineTableHead>Cập nhật</DarkOutlineTableHead>
                    <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
                  </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                  {courses.map(course => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onToggleFeatured={handleToggleFeatured}
                      isSelected={selectedRowId === course.id}
                      onSelect={setSelectedRowId}
                    />
                  ))}
                </DarkOutlineTableBody>
              </DarkOutlineTable>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <div className="flex justify-center mt-6">
                  {renderPagination()}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Featured Toggle Dialog */}
      <Dialog open={isFeaturedDialogOpen} onOpenChange={setIsFeaturedDialogOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#2D2D2D] text-white">
          <DialogHeader>
            <DialogTitle>
              {selectedCourse?.isFeatured ? 'Bỏ đánh dấu nổi bật' : 'Đánh dấu nổi bật'}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedCourse?.isFeatured ? (
                <>Bạn có chắc muốn bỏ đánh dấu nổi bật cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>?</>
              ) : (
                <>
                  Bạn có chắc muốn đánh dấu nổi bật cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>?
                  {selectedCourse?.status !== 'PUBLISHED' && (
                    <div className="mt-2 p-2 bg-yellow-600/20 border border-yellow-600/50 rounded text-yellow-300 text-sm">
                      ⚠️ Chỉ có thể đánh dấu nổi bật cho khóa học đã xuất bản.
                    </div>
                  )}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DarkOutlineButton
              onClick={() => {
                setIsFeaturedDialogOpen(false);
                setSelectedCourse(null);
              }}
              disabled={actionLoading}
            >
              Hủy
            </DarkOutlineButton>
            <Button
              onClick={confirmToggleFeatured}
              disabled={actionLoading || (selectedCourse && !selectedCourse.isFeatured && selectedCourse.status !== 'PUBLISHED')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Đang xử lý...
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
    </div>
  );
}

