import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { createPortal } from 'react-dom';
import { Badge } from '@/components/ui/badge';
import { DarkOutlineTableRow, DarkOutlineTableCell } from '@/components/ui/dark-outline-table';
import { BookOpen, Users, Star, MoreVertical, Eye, TrendingUp, Edit, Trash2, BarChart3 } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { formatPrice, formatDuration } from './courseFormatters';
import type { Course } from '@/lib/api/types';

interface CourseRowProps {
  course: Course;
  onEdit: (course: Course) => void;
  onDelete: (course: Course) => void;
  onChangeStatus: (course: Course) => void;
  onViewAnalytics: (course: Course) => void;
  isSelected: boolean;
  onSelect: (courseId: number | null) => void;
}

export function CourseRow({
  course,
  onEdit,
  onDelete,
  onChangeStatus,
  onViewAnalytics,
  isSelected,
  onSelect
}: CourseRowProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [adjustedPosition, setAdjustedPosition] = useState({ x: 0, y: 0, transform: 'translate(-100%, 0)' });
  const menuRef = useRef<HTMLDivElement>(null);

  const coursePrice = course.discountPrice || course.price || 0;
  const revenue = coursePrice * (course.enrolledCount || 0);
  // Backend durationHours is stored in minutes (naming legacy). Do not multiply.
  const durationMinutes = Math.round(course.durationHours || 0);
  const lessonsCount = course.totalLessons || 0;

  const handleToggle = (isCurrentlySelected: boolean, e: React.MouseEvent<HTMLTableRowElement>) => {
    e.preventDefault();
    // Toggle selection: nếu đã được chọn thì bỏ chọn, nếu chưa thì chọn
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
        <DarkOutlineTableCell className="min-w-[250px] max-w-[400px]">
          <div className="flex items-start gap-3">
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
            <div className="min-w-0 flex-1">
              <p className="font-medium text-gray-900 dark:text-white break-words whitespace-normal">{course.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">{lessonsCount} bài • {formatDuration(durationMinutes)}</p>
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
        <DarkOutlineTableCell className="w-[120px]">
          {(() => {
            const finalPrice = course.discountPrice ?? course.price;
            if (finalPrice === 0 || finalPrice === null || finalPrice === undefined) {
              return <span className="text-green-600 dark:text-green-400 font-semibold">Miễn phí</span>;
            }
            return (
              <div className="flex flex-col">
                {course.discountPrice && course.discountPrice !== course.price ? (
                  <>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatPrice(course.discountPrice)}</span>
                    <span className="text-gray-500 dark:text-gray-500 text-xs line-through">{formatPrice(course.price)}</span>
                  </>
                ) : (
                  <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatPrice(course.price)}</span>
                )}
              </div>
            );
          })()}
        </DarkOutlineTableCell>
        <DarkOutlineTableCell>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">{formatPrice(revenue)}</span>
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
          <button className="p-2 text-gray-400 hover:text-white hover:bg-[#1F1F1F] rounded" onClick={(e) => {
            e.stopPropagation();
            // Nếu chưa được chọn thì chọn và mở menu, nếu đã được chọn thì chỉ mở menu
            if (!isSelected) {
              onSelect(course.id);
            }
            setMenuPosition({ x: e.clientX, y: e.clientY });
            setMenuOpen(true);
          }}>
            <MoreVertical className="h-4 w-4" />
          </button>
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
            to={`/courses/${course.slug}`}
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => setMenuOpen(false)}
          >
            <Eye className="h-4 w-4" />
            Xem
          </Link>
          <div
            className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm text-white hover:bg-[#1F1F1F] cursor-pointer"
            onClick={() => {
              onViewAnalytics(course);
              setMenuOpen(false);
            }}
          >
            <TrendingUp className="h-4 w-4" />
            Phân tích
          </div>
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
        </div>,
        document.body
      )}
    </>
  );
}