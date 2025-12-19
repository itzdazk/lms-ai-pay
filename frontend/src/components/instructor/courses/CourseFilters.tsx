import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DarkOutlineInput } from '@/components/ui/dark-outline-input';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '@/components/ui/dark-outline-select-trigger';
import { X } from 'lucide-react';
import type { Category } from '@/lib/api/types';

interface Filters {
  page: number;
  limit: number;
  search: string;
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  categoryId?: string;
  level?: 'beginner' | 'intermediate' | 'advanced';
  sort: string;
}

interface CourseFiltersProps {
  filters: Filters;
  categories: Category[];
  priceType: 'all' | 'free' | 'paid';
  categorySearch: string;
  searchInput: string;
  onFilterChange: (key: string, value: any) => void;
  onPriceTypeChange: (value: 'all' | 'free' | 'paid') => void;
  onCategorySearchChange: (value: string) => void;
  onSearchInputChange: (value: string) => void;
  onClearFilters: () => void;
}

export function CourseFilters({
  filters,
  categories,
  priceType,
  categorySearch,
  searchInput,
  onFilterChange,
  onPriceTypeChange,
  onCategorySearchChange,
  onSearchInputChange,
  onClearFilters,
}: CourseFiltersProps) {
  return (
    <Card className="bg-[#1A1A1A] border-[#2D2D2D]">
      <CardHeader>
        <CardTitle className="text-white">Bộ lọc</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Danh mục</Label>
            <Select
              value={filters.categoryId ? String(filters.categoryId) : 'all'}
              onValueChange={(value) => {
                onFilterChange('categoryId', value === 'all' ? undefined : value);
                onCategorySearchChange(''); // Reset search when selecting
              }}
            >
              <DarkOutlineSelectTrigger className="w-full !data-[placeholder]:text-gray-500 dark:!data-[placeholder]:text-gray-400 [&_*[data-slot=select-value]]:!text-black [&_*[data-slot=select-value]]:opacity-100 [&_*[data-slot=select-value][data-placeholder]]:!text-gray-500 dark:[&_*[data-slot=select-value]]:!text-white dark:[&_*[data-slot=select-value]]:opacity-100 dark:[&_*[data-slot=select-value][data-placeholder]]:!text-gray-400">
                <SelectValue placeholder="Tất cả danh mục" />
              </DarkOutlineSelectTrigger>
              <DarkOutlineSelectContent>
                <div className="p-2 border-b border-[#2D2D2D]">
                  <DarkOutlineInput
                    placeholder="Tìm kiếm danh mục..."
                    value={categorySearch}
                    onChange={(e) => {
                      e.stopPropagation();
                      onCategorySearchChange(e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    onKeyDown={(e) => e.stopPropagation()}
                    className="w-full"
                  />
                </div>
                <div className="max-h-[200px] overflow-y-auto">
                  <DarkOutlineSelectItem value="all" onSelect={() => onCategorySearchChange('')}>
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
                          onSelect={() => onCategorySearchChange('')}
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
              onValueChange={(value) => onFilterChange('status', value)}
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
              onValueChange={(value) => onFilterChange('level', value)}
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
              onValueChange={(value) => onFilterChange('sort', value)}
            >
              <DarkOutlineSelectTrigger>
                <SelectValue placeholder="Mới nhất" />
              </DarkOutlineSelectTrigger>
              <DarkOutlineSelectContent>
                <DarkOutlineSelectItem value="newest">Mới nhất</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="oldest">Cũ nhất</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="updated">Cập nhật mới nhất</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="updated-oldest">Cập nhật cũ nhất</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="popular">Phổ biến</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="rating">Đánh giá</DarkOutlineSelectItem>
              </DarkOutlineSelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Giá</Label>
            <Select
              value={priceType}
              onValueChange={(value) => onPriceTypeChange(value as 'all' | 'free' | 'paid')}
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
            <Label className="text-gray-400 text-sm">Số lượng/trang</Label>
            <Select
              value={filters.limit?.toString() || '10'}
              onValueChange={(value) => onFilterChange('limit', parseInt(value))}
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
              onClick={onClearFilters}
              variant="blue"
              className="w-full"
            >
              Xóa bộ lọc
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
