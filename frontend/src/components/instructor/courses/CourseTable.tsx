import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DarkOutlineButton } from '@/components/ui/buttons';
import { DarkOutlineInput } from '@/components/ui/dark-outline-input';
import { DarkOutlineTable } from '@/components/ui/dark-outline-table';
import { BookOpen, Loader2, Plus, Search, X } from 'lucide-react';
import { CourseRow } from './CourseRow';
import type { Course } from '@/lib/api/types';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CourseTableProps {
  courses: Course[];
  pagination: Pagination;
  loading: boolean;
  searchInput: string;
  onSearchChange: (value: string) => void;
  onSearchExecute: () => void;
  onClearSearch: () => void;
  onSearchKeyPress?: (e: React.KeyboardEvent) => void;
  onCreateCourse: () => void;
  onEditCourse: (course: Course) => void;
  onDeleteCourse: (course: Course) => void;
  onChangeStatus: (course: Course) => void;
  onViewStudents: (course: Course) => void;
  selectedRowId: number | null;
  onSelectRow: (courseId: number | null) => void;
  onPageChange: (page: number) => void;
}

export function CourseTable({
  courses,
  pagination,
  loading,
  searchInput,
  onSearchChange,
  onSearchExecute,
  onClearSearch,
  onSearchKeyPress,
  onCreateCourse,
  onEditCourse,
  onDeleteCourse,
  onChangeStatus,
  onViewStudents,
  selectedRowId,
  onSelectRow,
  onPageChange,
}: CourseTableProps) {
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
          onClick={() => onPageChange(1)}
          disabled={currentPage === 1 || loading}
          size="sm"
        >
          &lt;&lt;
        </DarkOutlineButton>
        <DarkOutlineButton
          onClick={() => onPageChange(currentPage - 1)}
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
              onClick={() => onPageChange(pageNum)}
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
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || loading}
          size="sm"
        >
          &gt;
        </DarkOutlineButton>
        <DarkOutlineButton
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage === totalPages || loading}
          size="sm"
        >
          &gt;&gt;
        </DarkOutlineButton>
      </div>
    );
  };

  return (
    <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-white">
              Danh sách khóa học ({pagination.total})
            </CardTitle>
          </div>
          <Button
            size="lg"
            onClick={onCreateCourse}
            variant="blue"
          >
            <Plus className="h-4 w-4 mr-2" />
            Tạo khóa học mới
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Search Bar */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <DarkOutlineInput
            type="text"
            placeholder="Tìm kiếm theo tên khóa học..."
            value={searchInput}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onSearchChange(e.target.value)}
            onKeyPress={onSearchKeyPress}
            className="pl-10 pr-10"
          />
            {searchInput && (
              <button
                type="button"
                onClick={onClearSearch}
                className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          <Button
            onClick={onSearchExecute}
            className="px-6 bg-blue-600 hover:bg-blue-700 text-white"
            disabled={!searchInput.trim()}
          >
            Tìm kiếm
          </Button>
        </div>

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
              <thead className="bg-[#1F1F1F]">
                <tr>
                  <th className="text-left p-3 text-gray-300 font-medium">Khóa học</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Trạng thái</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Học viên</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Đánh giá</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Giá</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Doanh thu</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Hoàn thành</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Ngày tạo</th>
                  <th className="text-left p-3 text-gray-300 font-medium">Cập nhật</th>
                  <th className="text-right p-3 text-gray-300 font-medium">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {courses.map(course => (
                  <CourseRow
                    key={course.id}
                    course={course}
                    onEdit={onEditCourse}
                    onDelete={onDeleteCourse}
                    onChangeStatus={onChangeStatus}
                    onViewStudents={onViewStudents}
                    isSelected={selectedRowId === course.id}
                    onSelect={onSelectRow}
                  />
                ))}
              </tbody>
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
  );
}
