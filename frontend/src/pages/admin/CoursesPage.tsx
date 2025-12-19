import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../../components/ui/avatar';
import { Button } from '../../components/ui/button';
import { DarkOutlineButton } from '../../components/ui/buttons';
import { Badge } from '../../components/ui/badge';
import { Label } from '../../components/ui/label';
import { Select, SelectValue } from '../../components/ui/select';
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
  X,
  FileText,
  Archive,
  TrendingUp,
} from 'lucide-react';
import { adminCoursesApi, type AdminCourse, type AdminCourseFilters, type PlatformAnalytics } from '../../lib/api/admin-courses';
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

// Format number to currency string without VND suffix (for input display)
// Currently unused - reserved for advanced filters feature
// function formatPriceInput(price: number | undefined): string {
//   if (!price) return '';
//   return new Intl.NumberFormat('vi-VN', {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(price);
// }

// Parse currency string to number (remove dots and spaces)
// Currently unused - reserved for advanced filters feature
// function parsePriceInput(value: string): number | undefined {
//   if (!value || value.trim() === '') return undefined;
//   // Remove all dots, spaces, and non-numeric characters except digits
//   const cleaned = value.replace(/[^\d]/g, '');
//   if (cleaned === '') return undefined;
//   return parseFloat(cleaned);
// }

// Format number to string with thousand separators (for enrollment display)
// Currently unused - reserved for advanced filters feature
// function formatNumberInput(value: number | undefined): string {
//   if (!value) return '';
//   return new Intl.NumberFormat('vi-VN', {
//     minimumFractionDigits: 0,
//     maximumFractionDigits: 0,
//   }).format(value);
// }

// Parse number string to number (remove dots and spaces)
// Currently unused - reserved for advanced filters feature
// function parseNumberInput(value: string): number | undefined {
//   if (!value || value.trim() === '') return undefined;
//   // Remove all dots, spaces, and non-numeric characters except digits
//   const cleaned = value.replace(/[^\d]/g, '');
//   if (cleaned === '') return undefined;
//   return parseInt(cleaned, 10);
// }

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
        <DarkOutlineTableCell className="min-w-[250px] max-w-[400px]">
          <div className="flex items-center gap-3 min-w-0">
            {course.thumbnailUrl ? (
              <img
                src={course.thumbnailUrl}
                alt={course.title}
                className="w-16 h-10 object-cover rounded flex-shrink-0"
              />
            ) : (
              <div className="w-16 h-10 bg-gray-200 dark:bg-[#2D2D2D] rounded flex items-center justify-center flex-shrink-0">
                <BookOpen className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex items-start gap-2 min-w-0">
                <p className="font-medium text-gray-900 dark:text-white break-words whitespace-normal">{course.title}</p>
                {course.isFeatured && (
                  <StarIcon className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0 mt-0.5" />
                )}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 break-words whitespace-normal">
                {course.totalLessons} bài • {formatDuration(course.durationHours)}
              </p>
            </div>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[120px]">
          {course.status === 'PUBLISHED' ? (
            <Badge className="bg-green-600">Đã xuất bản</Badge>
          ) : course.status === 'DRAFT' ? (
            <Badge variant="outline" className="border-gray-300 dark:border-[#2D2D2D] text-gray-700 dark:text-gray-300">Bản nháp</Badge>
          ) : (
            <Badge variant="secondary" className="bg-gray-600 text-white">Đã lưu trữ</Badge>
          )}
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[150px]">
          <span className="text-gray-900 dark:text-gray-300 truncate block" title={course.instructor.fullName}>{course.instructor.fullName}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[130px]">
          <span className="text-gray-900 dark:text-gray-300 truncate block" title={course.category.name}>{course.category.name}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[100px]">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4 text-gray-500 dark:text-gray-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-gray-300">{(course.enrolledCount || 0).toLocaleString()}</span>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[100px]">
          <div className="flex items-center gap-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 flex-shrink-0" />
            <span className="text-gray-900 dark:text-gray-300">
              {course.ratingCount > 0 && course.ratingAvg 
                ? (typeof course.ratingAvg === 'number' ? course.ratingAvg : parseFloat(String(course.ratingAvg)) || 0).toFixed(1) 
                : '-'} ({(course.ratingCount || 0)})
            </span>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[120px]">
          {(() => {
            // Convert to number if needed (handle Decimal from Prisma)
            const priceNum = typeof course.price === 'string' ? parseFloat(course.price) : course.price;
            const discountPriceNum = course.discountPrice !== null && course.discountPrice !== undefined
              ? (typeof course.discountPrice === 'string' ? parseFloat(course.discountPrice) : course.discountPrice)
              : null;
            
            const finalPrice = discountPriceNum !== null ? discountPriceNum : priceNum;
            
            // Check if final price is 0
            if (finalPrice === 0 || finalPrice === null || finalPrice === undefined || isNaN(finalPrice)) {
              return <span className="text-green-600 dark:text-green-400 font-semibold">Miễn phí</span>;
            }
            
            return (
              <div className="flex flex-col">
                {discountPriceNum !== null && discountPriceNum !== priceNum ? (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatPrice(discountPriceNum)}</span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs line-through">{formatPrice(priceNum)}</span>
                  </>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatPrice(priceNum)}</span>
                )}
              </div>
            );
          })()}
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[110px]">
          <span className="text-gray-900 dark:text-gray-300">{formatDate(course.createdAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="w-[110px]">
          <span className="text-gray-900 dark:text-gray-300">{formatDate(course.updatedAt)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell className="text-right w-[100px]">
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
      loadCategories();
      loadInstructors();
      loadAnalytics();
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
      }, 500); // 500ms debounce
    }

    return () => {
      if (enrollmentsDebounceTimerRef.current) {
        clearTimeout(enrollmentsDebounceTimerRef.current);
      }
    };
  }, [tempMinEnrollments, tempMaxEnrollments]);

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
      setCategories(categoriesData);
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

  const handlePriceTypeChange = (value: 'all' | 'free' | 'paid') => {
    setPriceType(value);
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
          {/* Stats Grid */}
          {!loadingAnalytics && analytics && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Tổng khóa học</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.courses.total.toLocaleString()}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-blue-500" />
                  </div>
                  {(() => {
                    // Calculate free and paid courses from current courses data
                    const freeCount = courses.filter((course) => {
                      const finalPrice = course.discountPrice ?? course.price;
                      return finalPrice === 0 || finalPrice === null || finalPrice === undefined;
                    }).length;
                    const paidCount = courses.filter((course) => {
                      const finalPrice = course.discountPrice ?? course.price;
                      return finalPrice !== 0 && finalPrice !== null && finalPrice !== undefined;
                    }).length;
                    
                    // If we have pagination data, estimate based on current page ratio
                    const totalCourses = pagination.total || courses.length;
                    const currentPageRatio = totalCourses > 0 && courses.length > 0 ? courses.length / totalCourses : 1;
                    const estimatedFree = totalCourses > 0 && currentPageRatio > 0 ? Math.round(freeCount / currentPageRatio) : freeCount;
                    const estimatedPaid = totalCourses > 0 && currentPageRatio > 0 ? Math.round(paidCount / currentPageRatio) : paidCount;
                    
                    return (
                      <div className="mt-3 pt-3 border-t border-[#2D2D2D]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Miễn phí:</span>
                          <span className="text-green-400 font-semibold">{estimatedFree.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between text-xs mt-1">
                          <span className="text-gray-400">Có phí:</span>
                          <span className="text-blue-400 font-semibold">{estimatedPaid.toLocaleString()}</span>
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Đã xuất bản</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.courses.published.toLocaleString()}</p>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Bản nháp</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.courses.draft.toLocaleString()}</p>
                    </div>
                    <FileText className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Đã lưu trữ</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.courses.archived.toLocaleString()}</p>
                    </div>
                    <Archive className="h-8 w-8 text-gray-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Nổi bật</p>
                      <p className="text-2xl font-bold text-white">{analytics.overview.courses.featured.toLocaleString()}</p>
                    </div>
                    <StarIcon className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Filters */}
          <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">Bộ lọc</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Instructor Filter - Full Width Row */}
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Giảng viên</Label>
            <Select
              value={filters.instructorId ? String(filters.instructorId) : 'all'}
              onValueChange={(value) => {
                handleFilterChange('instructorId', value === 'all' ? undefined : parseInt(value));
                setInstructorSearch(''); // Reset search when selecting
              }}
            >
              <DarkOutlineSelectTrigger className="w-full min-h-[48px]">
                <SelectValue placeholder="Tất cả giảng viên" />
              </DarkOutlineSelectTrigger>
              <DarkOutlineSelectContent className="min-w-[500px]">
                <div className="p-3 border-b border-[#2D2D2D]">
                  <DarkOutlineInput
                    placeholder="Tìm kiếm giảng viên theo tên, email, số điện thoại..."
                    value={instructorSearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      setInstructorSearch(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full h-10"
                  />
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                  <DarkOutlineSelectItem value="all" onSelect={() => setInstructorSearch('')}>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-gray-400" />
                      <span>Tất cả giảng viên</span>
                    </div>
                  </DarkOutlineSelectItem>
                  {instructors
                    .filter((instructor) => {
                      const searchLower = instructorSearch.toLowerCase();
                      return (
                        instructor.fullName.toLowerCase().includes(searchLower) ||
                        instructor.email.toLowerCase().includes(searchLower) ||
                        instructor.userName.toLowerCase().includes(searchLower) ||
                        (instructor.phone && instructor.phone.toLowerCase().includes(searchLower))
                      );
                    })
                    .map((instructor) => {
                      return (
                        <DarkOutlineSelectItem
                          key={instructor.id}
                          value={String(instructor.id)}
                          onSelect={() => setInstructorSearch('')}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <Avatar className="h-8 w-8 flex-shrink-0">
                              <AvatarImage src={instructor.avatarUrl || undefined} alt={instructor.fullName} />
                              <AvatarFallback className="bg-blue-600 text-white text-xs">
                                {instructor.fullName.charAt(0).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-0.5">
                                <div className="font-medium text-white truncate">{instructor.fullName}</div>
                                <Badge 
                                  variant="outline" 
                                  className={`text-xs px-1.5 py-0 h-4 ${
                                    instructor.status === 'ACTIVE' 
                                      ? 'border-green-500 text-green-400 bg-green-500/10' 
                                      : instructor.status === 'INACTIVE'
                                      ? 'border-gray-500 text-gray-400 bg-gray-500/10'
                                      : 'border-red-500 text-red-400 bg-red-500/10'
                                  }`}
                                >
                                  {instructor.status === 'ACTIVE' ? 'Hoạt động' : instructor.status === 'INACTIVE' ? 'Tạm ngưng' : 'Bị cấm'}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-xs flex-wrap">
                                <span className="text-gray-400 truncate">{instructor.email}</span>
                                {instructor.phone && (
                                  <>
                                    <span className="text-gray-500">•</span>
                                    <span className="text-gray-400 truncate">{instructor.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </DarkOutlineSelectItem>
                      );
                    })}
                  {instructors.filter((instructor) => {
                    const searchLower = instructorSearch.toLowerCase();
                    return (
                      instructor.fullName.toLowerCase().includes(searchLower) ||
                      instructor.email.toLowerCase().includes(searchLower) ||
                      instructor.userName.toLowerCase().includes(searchLower) ||
                      (instructor.phone && instructor.phone.toLowerCase().includes(searchLower))
                    );
                  }).length === 0 && instructorSearch && (
                    <div className="px-2 py-1.5 text-sm text-gray-400 text-center">
                      Không tìm thấy giảng viên
                    </div>
                  )}
                </div>
              </DarkOutlineSelectContent>
            </Select>
          </div>

          {/* Main Filters Row - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Danh mục</Label>
              <Select
                value={filters.categoryId ? String(filters.categoryId) : 'all'}
                onValueChange={(value) => {
                  handleFilterChange('categoryId', value === 'all' ? undefined : parseInt(value));
                  setCategorySearch(''); // Reset search when selecting
                }}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả danh mục" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <div className="p-2 border-b border-[#2D2D2D]">
                    <DarkOutlineInput
                      placeholder="Tìm kiếm danh mục..."
                      value={categorySearch}
                      onChange={(e) => {
                        e.stopPropagation();
                        setCategorySearch(e.target.value);
                      }}
                      onClick={(e) => e.stopPropagation()}
                      onKeyDown={(e) => e.stopPropagation()}
                      className="w-full"
                    />
                  </div>
                  <div className="max-h-[200px] overflow-y-auto">
                    <DarkOutlineSelectItem value="all" onSelect={() => setCategorySearch('')}>
                      Tất cả danh mục
                    </DarkOutlineSelectItem>
                    {categories
                      .filter((category) =>
                        category.name.toLowerCase().includes(categorySearch.toLowerCase())
                      )
                      .map((category) => {
                        const categoryIdStr = String(category.id);
                        return (
                          <DarkOutlineSelectItem
                            key={category.id}
                            value={categoryIdStr}
                            onSelect={() => setCategorySearch('')}
                          >
                            {category.name}
                          </DarkOutlineSelectItem>
                        );
                      })}
                    {categories.filter((category) =>
                      category.name.toLowerCase().includes(categorySearch.toLowerCase())
                    ).length === 0 && categorySearch && (
                      <div className="px-2 py-1.5 text-sm text-gray-400 text-center">
                        Không tìm thấy danh mục
                      </div>
                    )}
                  </div>
                </DarkOutlineSelectContent>
              </Select>
            </div>

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
          </div>

          {/* Pagination and Sort Row - 4 columns */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Giá</Label>
              <Select
                value={priceType}
                onValueChange={(value) => handlePriceTypeChange(value as 'all' | 'free' | 'paid')}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="free">Miễn phí</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="paid">Có phí</DarkOutlineSelectItem>
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
                  <DarkOutlineSelectItem value="updated">Cập nhật: mới nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="updated-oldest">Cập nhật: cũ nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="popular">Phổ biến: Cao đến thấp</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="enrollments">Phổ biến: Thấp đến cao</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="rating">Đánh giá</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="price_asc">Giá: Thấp đến cao</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="price_desc">Giá: Cao đến thấp</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="views">Lượt xem</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="title">Tên A-Z</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Số lượng / trang</Label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) => {
                  const mainContainer = document.querySelector('main');
                  if (mainContainer) {
                    scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                  } else {
                    scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                  }
                  isPageChangingRef.current = true;
                  handleFilterChange('limit', parseInt(value));
                }}
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
              <Label className="text-gray-400 text-sm opacity-0">Xóa bộ lọc</Label>
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
                variant="blue"
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>

          {/* Advanced Filters Row - Commented out */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {/* <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Khoảng giá (VND)</Label>
              <div className="flex items-center gap-2">
                <DarkOutlineInput
                  type="text"
                  placeholder="Tối thiểu"
                  value={formatPriceInput(tempMinPrice !== undefined ? tempMinPrice : filters.minPrice)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input
                    if (inputValue === '' || inputValue.trim() === '') {
                      setTempMinPrice(undefined);
                      return;
                    }
                    const parsedValue = parsePriceInput(inputValue);
                    const maxValue = tempMaxPrice !== undefined ? tempMaxPrice : (filters.maxPrice || 10000000);
                    if (parsedValue === undefined || parsedValue <= maxValue) {
                      setTempMinPrice(parsedValue);
                    }
                  }}
                  className="flex-1"
                />
                <span className="text-gray-400">-</span>
                <DarkOutlineInput
                  type="text"
                  placeholder="Tối đa"
                  value={formatPriceInput(tempMaxPrice !== undefined ? tempMaxPrice : filters.maxPrice)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input
                    if (inputValue === '' || inputValue.trim() === '') {
                      setTempMaxPrice(undefined);
                      return;
                    }
                    const parsedValue = parsePriceInput(inputValue);
                    const minValue = tempMinPrice !== undefined ? tempMinPrice : (filters.minPrice || 0);
                    if (parsedValue === undefined || parsedValue >= minValue) {
                      setTempMaxPrice(parsedValue);
                    }
                  }}
                  className="flex-1"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label className="text-gray-400 text-sm">Số lượng học viên</Label>
              <div className="flex items-center gap-2">
                <DarkOutlineInput
                  type="text"
                  placeholder="Tối thiểu"
                  value={formatNumberInput(tempMinEnrollments !== undefined ? tempMinEnrollments : filters.minEnrollments)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input
                    if (inputValue === '' || inputValue.trim() === '') {
                      setTempMinEnrollments(undefined);
                      return;
                    }
                    const parsedValue = parseNumberInput(inputValue);
                    const maxValue = tempMaxEnrollments !== undefined ? tempMaxEnrollments : (filters.maxEnrollments || 999999999);
                    if (parsedValue === undefined || parsedValue <= maxValue) {
                      setTempMinEnrollments(parsedValue);
                    }
                  }}
                  className="flex-1"
                />
                <span className="text-gray-400">-</span>
                <DarkOutlineInput
                  type="text"
                  placeholder="Tối đa"
                  value={formatNumberInput(tempMaxEnrollments !== undefined ? tempMaxEnrollments : filters.maxEnrollments)}
                  onChange={(e) => {
                    const inputValue = e.target.value;
                    // Allow empty input
                    if (inputValue === '' || inputValue.trim() === '') {
                      setTempMaxEnrollments(undefined);
                      return;
                    }
                    const parsedValue = parseNumberInput(inputValue);
                    const minValue = tempMinEnrollments !== undefined ? tempMinEnrollments : (filters.minEnrollments || 0);
                    if (parsedValue === undefined || parsedValue >= minValue) {
                      setTempMaxEnrollments(parsedValue);
                    }
                  }}
                  className="flex-1"
                />
              </div>
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
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Courses Table */}
      <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
        <CardHeader>
          <CardTitle className="text-white">
            Danh sách khóa học ({pagination.total})
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
              placeholder="Tìm kiếm theo tên khóa học, mô tả, giảng viên..."
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
              disabled={actionLoading || (selectedCourse ? ((selectedCourse.isFeatured !== true) && selectedCourse.status !== 'PUBLISHED') : false)}
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

