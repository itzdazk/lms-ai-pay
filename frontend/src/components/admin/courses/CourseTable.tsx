import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DarkOutlineTable, DarkOutlineTableHeader, DarkOutlineTableBody, DarkOutlineTableRow, DarkOutlineTableHead, DarkOutlineTableCell } from '@/components/ui/dark-outline-table';
import { DarkOutlineInput } from '@/components/ui/dark-outline-input';
import { BookOpen, Loader2, Search, X } from 'lucide-react';
import { CourseRow } from './CourseRow';
import type { AdminCourse } from '@/lib/api/admin-courses';

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface CourseTableProps {
  courses: AdminCourse[];
  loading: boolean;
  pagination: Pagination;
  searchInput: string;
  selectedRowId: number | null;
  onSearchChange: (value: string) => void;
  onToggleFeatured: (course: AdminCourse) => void;
  onRowSelect: (courseId: number | null) => void;
  onPageChange: (newPage: number) => void;
  renderPagination: () => JSX.Element;
}

export function CourseTable({
  courses,
  loading,
  pagination,
  searchInput,
  selectedRowId,
  onSearchChange,
  onToggleFeatured,
  onRowSelect,
  onPageChange,
  renderPagination,
}: CourseTableProps) {
  return (
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
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchInput && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
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
                    onToggleFeatured={onToggleFeatured}
                    isSelected={selectedRowId === course.id}
                    onSelect={onRowSelect}
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
  );
}
