import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DarkOutlineInput } from '@/components/ui/dark-outline-input';
import {
  Select,
  SelectValue,
} from '@/components/ui/select';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '@/components/ui/dark-outline-select-trigger';
import { Filter, Search, X } from 'lucide-react';
import type { GetUsersParams } from '../../../lib/api/users';

interface UserFiltersProps {
  filters: GetUsersParams;
  searchInput: string;
  onFilterChange: (key: keyof GetUsersParams, value: any) => void;
  onSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

export function UserFilters({
  filters,
  searchInput,
  onFilterChange,
  onSearchChange,
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
          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <DarkOutlineInput
              type="text"
              placeholder="Tìm kiếm theo tên, email..."
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
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả vai trò" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả vai trò</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="ADMIN">Quản trị viên</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="INSTRUCTOR">Giảng viên</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="STUDENT">Học viên</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
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
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Tất cả trạng thái" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="all">Tất cả trạng thái</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="ACTIVE">Hoạt động</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="INACTIVE">Không hoạt động</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="BANNED">Đã khóa</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
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
                  // Handle sort change by calling filter change twice
                  onFilterChange('sortBy', sortBy);
                  onFilterChange('sortOrder', sortOrder);
                }}
              >
                <DarkOutlineSelectTrigger>
                  <SelectValue placeholder="Mới nhất" />
                </DarkOutlineSelectTrigger>
                <DarkOutlineSelectContent>
                  <DarkOutlineSelectItem value="createdAt-desc">Mới nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="createdAt-asc">Cũ nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="updatedAt-desc">Cập nhật: mới nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="updatedAt-asc">Cập nhật: cũ nhất</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="fullName-asc">Tên A-Z</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="fullName-desc">Tên Z-A</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="email-asc">Email A-Z</DarkOutlineSelectItem>
                  <DarkOutlineSelectItem value="email-desc">Email Z-A</DarkOutlineSelectItem>
                </DarkOutlineSelectContent>
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
