import { useState, useEffect, useRef, useMemo } from 'react';
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
import { coursesApi } from '../../lib/api/courses';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { toast } from 'sonner';
import { formatDate } from '../../lib/utils';
import type { Course, Category } from '../../lib/api/types';

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

// Component for each course row with dropdown menu
function CourseRow({ 
  course, 
  onEdit, 
  onDelete, 
  onChangeStatus,
  isSelected,
  onSelect
}: { 
  course: Course; 
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onChangeStatus: (course: Course) => void;
  isSelected: boolean;
  onSelect: (courseId: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0, transform: 'translate(-100%, 0)' });
  const menuRef = useRef<HTMLDivElement>(null);
  
  const price = course.discountPrice || course.originalPrice || 0;
  const revenue = price * (course.enrolledCount || 0);
  const durationMinutes = (course.durationMinutes || 0);
  const lessonsCount = course.lessonsCount || 0;

  const handleToggle = (isCurrentlySelected: boolean, e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    // Toggle selection: nếu đã được chọn thì bỏ chọn, nếu chưa thì chọn
    if (isCurrentlySelected) {
      onSelect('');
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
    let transform = 'translate(-100%, 0)'; // Default: menu to the left of cursor
    
    // Check if menu goes off the right edge (when positioned to the left)
    if (left - menuRect.width < 0) {
      // Position menu to the right of cursor instead
      transform = 'translate(0, 0)';
      left = menuPosition.x;
    }
    
    // Check if menu goes off the right edge (when positioned to the right)
    if (left + menuRect.width > viewportWidth) {
      // Position menu to the left of cursor
      transform = 'translate(-100%, 0)';
      left = menuPosition.x;
      // If still goes off left edge, align to right edge
      if (left - menuRect.width < 0) {
        left = viewportWidth - menuRect.width - 8; // 8px padding
      }
    }
    
    // Check if menu goes off the bottom edge
    if (top + menuRect.height > viewportHeight) {
      // Position menu above cursor
      top = menuPosition.y - menuRect.height;
      // If still goes off top edge, align to bottom edge
      if (top < 0) {
        top = viewportHeight - menuRect.height - 8; // 8px padding
      }
    }
    
    // Check if menu goes off the top edge
    if (top < 0) {
      top = 8; // 8px padding from top
    }
    
    setAdjustedPosition({ x: left, y: top, transform });
  }, [menuOpen, menuPosition]);

  // Close menu when clicking outside and disable scroll when menu is open
  useEffect(() => {
    if (!menuOpen) return;

    // Save current scroll position
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
      // Restore scroll position immediately to prevent any scrolling
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

    // Prevent scroll events but keep scrollbar visible (don't use overflow: hidden)
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('wheel', handleWheel, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('scroll', handleScroll, { passive: false, capture: true });
    document.addEventListener('keydown', handleKeyDown, { passive: false });
    
    if (scrollContainer !== window) {
      (scrollContainer as HTMLElement).addEventListener('scroll', handleScroll, { passive: false, capture: true });
    }
    
    return () => {
      // Re-enable scroll
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
            <span className="text-gray-900 dark:text-gray-300">
              {course.ratingCount > 0 && course.ratingAvg ? course.ratingAvg.toFixed(1) : '-'} ({(course.ratingCount || 0)})
            </span>
          </div>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">{formatPrice(revenue)}</span>
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-gray-900 dark:text-gray-300">
            {course.completionRate !== undefined ? `${course.completionRate.toFixed(1)}%` : '0%'}
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
            // Nếu chưa được chọn thì chọn và mở menu, nếu đã được chọn thì chỉ mở menu
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
      
      {menuOpen && (
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
              onEdit(course);
              setMenuOpen(false);
            }}
          >
            <Edit className="h-4 w-4" />
            Chỉnh sửa
          </div>
          <div 
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onChangeStatus(course);
              setMenuOpen(false);
            }}
          >
            <BarChart3 className="h-4 w-4" />
            Đổi trạng thái
          </div>
          <div
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-red-400 hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onDelete(course);
              setMenuOpen(false);
            }}
          >
            <Trash2 className="h-4 w-4" />
            Xóa
          </div>
        </div>
      )}
    </>
  );
}

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
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [newStatus, setNewStatus] = useState<'draft' | 'published' | 'archived'>('draft');
  const [selectedRowId, setSelectedRowId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState<string>(filters.search || '');
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

  // Load data
  useEffect(() => {
    if (currentUser) {
      loadCategories();
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
    }, 500); // 500ms delay

    return () => clearTimeout(timer);
  }, [searchInput]);

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
      completionRate: course.completionRate ? parseFloat(String(course.completionRate)) : 0,
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
      await coursesApi.changeCourseStatus(selectedCourse.id, newStatus);
      toast.success('Thay đổi trạng thái thành công');
      setIsStatusDialogOpen(false);
      setSelectedCourse(null);
      loadCourses();
    } catch (error: any) {
      console.error('Error changing status:', error);
      // Error toast is already shown by API client interceptor, no need to show again
      // Only log for debugging
    } finally {
      setActionLoading(false);
    }
  };

  const handleSearch = (value: string) => {
    setSearchInput(value);
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
                  <DarkOutlineSelectItem value="updated">Cập nhật gần nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="updated-oldest">Cập nhật cũ nhất</DarkOutlineSelectItem>
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
                    limit: 10,
                    search: '',
                    status: undefined,
                    categoryId: undefined,
                    level: undefined,
                    sort: 'newest',
                  });
                }}
                variant="blue"
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
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
                value={searchInput}
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
            <Button 
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
              variant="blue"
            >
              <Plus className="h-4 w-4 mr-2" />
              Tạo khóa học mới
            </Button>
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
                    <DarkOutlineTableHead>Cập nhật</DarkOutlineTableHead>
                    <DarkOutlineTableHead className="text-right">Thao tác</DarkOutlineTableHead>
                  </DarkOutlineTableRow>
                </DarkOutlineTableHeader>
                <DarkOutlineTableBody>
                  {memoizedCourses.map(course => (
                    <CourseRow
                      key={course.id}
                      course={course}
                      onEdit={handleEditCourse}
                      onDelete={(c) => {
                        setSelectedCourse(c);
                        setIsDeleteDialogOpen(true);
                      }}
                      onChangeStatus={(c) => {
                        setSelectedCourse(c);
                        const statusLower = (c.status || 'draft').toLowerCase() as 'draft' | 'published' | 'archived';
                        setNewStatus(statusLower);
                        setIsStatusDialogOpen(true);
                      }}
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
              Chọn trạng thái mới cho khóa học <strong className="text-white">{selectedCourse?.title}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Select value={newStatus} onValueChange={(value: any) => setNewStatus(value)}>
              <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                <SelectItem value="draft" className="text-white focus:bg-[#2D2D2D]">
                  <div className="flex flex-col">
                    <span>Bản nháp</span>
                    <span className="text-xs text-gray-400 mt-0.5">Khóa học chưa được công khai, chỉ bạn có thể xem</span>
                  </div>
                </SelectItem>
                <SelectItem value="published" className="text-white focus:bg-[#2D2D2D]">
                  <div className="flex flex-col">
                    <span>Xuất bản</span>
                    <span className="text-xs text-gray-400 mt-0.5">Khóa học đã được công khai, học viên có thể đăng ký</span>
                  </div>
                </SelectItem>
                <SelectItem value="archived" className="text-white focus:bg-[#2D2D2D]">
                  <div className="flex flex-col">
                    <span>Lưu trữ</span>
                    <span className="text-xs text-gray-400 mt-0.5">Khóa học đã được lưu trữ, không còn hiển thị công khai</span>
                  </div>
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

