import { Card, CardContent, CardHeader, CardTitle } from '../../../ui/card';
import { Button } from '../../../ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../../ui/select';
import { Filter } from 'lucide-react';
import type { GetUsersParams } from '../../../lib/api/users';

interface UserFiltersProps {
  filters: GetUsersParams;
  searchInput: string;
  onFilterChange: (key: keyof GetUsersParams, value: any) => void;
  onSearchInputChange: (value: string) => void;
  onClearFilters: () => void;
}

export function UserFilters({
  filters,
  searchInput,
  onFilterChange,
  onSearchInputChange,
  onClearFilters,
}: UserFiltersProps) {
  return (
    <Card className="bg-[#1A1A1A] border-[#2D2D2D] mb-6">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Bộ lọc
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Filter Buttons Row */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                Vai trò
              </label>
              <Select
                value={filters.role || 'all'}
                onValueChange={(value) =>
                  onFilterChange('role', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="Tất cả vai trò" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="all" className="hover:bg-gray-700 focus:bg-gray-700">Tất cả vai trò</SelectItem>
                  <SelectItem value="ADMIN" className="hover:bg-gray-700 focus:bg-gray-700">Quản trị viên</SelectItem>
                  <SelectItem value="INSTRUCTOR" className="hover:bg-gray-700 focus:bg-gray-700">Giảng viên</SelectItem>
                  <SelectItem value="STUDENT" className="hover:bg-gray-700 focus:bg-gray-700">Học viên</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                Trạng thái
              </label>
              <Select
                value={filters.status || 'all'}
                onValueChange={(value) =>
                  onFilterChange('status', value === 'all' ? undefined : value)
                }
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="Tất cả trạng thái" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="all" className="hover:bg-gray-700 focus:bg-gray-700">Tất cả trạng thái</SelectItem>
                  <SelectItem value="ACTIVE" className="hover:bg-gray-700 focus:bg-gray-700">Hoạt động</SelectItem>
                  <SelectItem value="INACTIVE" className="hover:bg-gray-700 focus:bg-gray-700">Không hoạt động</SelectItem>
                  <SelectItem value="BANNED" className="hover:bg-gray-700 focus:bg-gray-700">Đã khóa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                Sắp xếp
              </label>
              <Select
                value={`${filters.sortBy || 'createdAt'}-${filters.sortOrder || 'desc'}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-');
                  onFilterChange('sort', { sortBy, sortOrder });
                }}
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="Mới nhất" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="createdAt-desc" className="hover:bg-gray-700 focus:bg-gray-700">Mới nhất</SelectItem>
                  <SelectItem value="createdAt-asc" className="hover:bg-gray-700 focus:bg-gray-700">Cũ nhất</SelectItem>
                  <SelectItem value="updatedAt-desc" className="hover:bg-gray-700 focus:bg-gray-700">Cập nhật: mới nhất</SelectItem>
                  <SelectItem value="updatedAt-asc" className="hover:bg-gray-700 focus:bg-gray-700">Cập nhật: cũ nhất</SelectItem>
                  <SelectItem value="fullName-asc" className="hover:bg-gray-700 focus:bg-gray-700">Tên A-Z</SelectItem>
                  <SelectItem value="fullName-desc" className="hover:bg-gray-700 focus:bg-gray-700">Tên Z-A</SelectItem>
                  <SelectItem value="email-asc" className="hover:bg-gray-700 focus:bg-gray-700">Email A-Z</SelectItem>
                  <SelectItem value="email-desc" className="hover:bg-gray-700 focus:bg-gray-700">Email Z-A</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                Số lượng / trang
              </label>
              <Select
                value={filters.limit?.toString() || '10'}
                onValueChange={(value) =>
                  onFilterChange('limit', parseInt(value))
                }
              >
                <SelectTrigger className="bg-[#1F1F1F] border-[#2D2D2D] text-white">
                  <SelectValue placeholder="10 / trang" />
                </SelectTrigger>
                <SelectContent className="bg-[#1A1A1A] border-[#2D2D2D]">
                  <SelectItem value="5" className="hover:bg-gray-700 focus:bg-gray-700">5 / trang</SelectItem>
                  <SelectItem value="10" className="hover:bg-gray-700 focus:bg-gray-700">10 / trang</SelectItem>
                  <SelectItem value="20" className="hover:bg-gray-700 focus:bg-gray-700">20 / trang</SelectItem>
                  <SelectItem value="50" className="hover:bg-gray-700 focus:bg-gray-700">50 / trang</SelectItem>
                  <SelectItem value="100" className="hover:bg-gray-700 focus:bg-gray-700">100 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-400 dark:text-gray-400">
                Thao tác
              </label>
              <Button
                onClick={onClearFilters}
                variant="blue"
                className="w-full"
              >
                Xóa bộ lọc
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
