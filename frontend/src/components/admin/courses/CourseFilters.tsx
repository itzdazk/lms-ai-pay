import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Select, SelectValue } from '@/components/ui/select';
import { DarkOutlineInput } from '@/components/ui/dark-outline-input';
import { DarkOutlineSelectTrigger, DarkOutlineSelectContent, DarkOutlineSelectItem } from '@/components/ui/dark-outline-select-trigger';
import { Users } from 'lucide-react';
import type { AdminCourseFilters } from '@/lib/api/admin-courses';
import type { Category } from '@/lib/api/types';
import type { User } from '@/lib/api/types';

interface CourseFiltersProps {
  filters: AdminCourseFilters;
  priceType: 'all' | 'free' | 'paid';
  categorySearch: string;
  instructorSearch: string;
  categories: Category[];
  instructors: User[];
  onFilterChange: (key: keyof AdminCourseFilters, value: any) => void;
  onPriceTypeChange: (value: 'all' | 'free' | 'paid') => void;
  onCategorySearchChange: (value: string) => void;
  onInstructorSearchChange: (value: string) => void;
  onClearFilters: () => void;
}

function flattenCategories(categories: Category[], level = 0): Category[] {
  const result: Category[] = [];

  categories.forEach(category => {
    // Add the category itself
    result.push({
      ...category,
      name: '  '.repeat(level) + category.name // Add indentation
    });

    // Add children if they exist
    if (category.children && category.children.length > 0) {
      result.push(...flattenCategories(category.children, level + 1));
    }
  });

  return result;
}

export function CourseFilters({
  filters,
  priceType,
  categorySearch,
  instructorSearch,
  categories,
  instructors,
  onFilterChange,
  onPriceTypeChange,
  onCategorySearchChange,
  onInstructorSearchChange,
  onClearFilters,
}: CourseFiltersProps) {
  return (
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
              onFilterChange('instructorId', value === 'all' ? undefined : parseInt(value));
              onInstructorSearchChange(''); // Reset search when selecting
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
                    onInstructorSearchChange(e.target.value);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  onKeyDown={(e) => e.stopPropagation()}
                  className="w-full h-10"
                />
              </div>
              <div className="max-h-[400px] overflow-y-auto">
                <DarkOutlineSelectItem value="all" onSelect={() => onInstructorSearchChange('')}>
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
                        onSelect={() => onInstructorSearchChange('')}
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
                onFilterChange('categoryId', value === 'all' ? undefined : parseInt(value));
                onCategorySearchChange(''); // Reset search when selecting
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
                  {flattenCategories(
                    categories.filter(category => !category.parentId) // Only root categories
                  )
                    .filter((category) =>
                      category.name.trim().toLowerCase().includes(categorySearch.toLowerCase())
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
                  {flattenCategories(
                    categories.filter(category => !category.parentId)
                  ).filter((category) =>
                    category.name.trim().toLowerCase().includes(categorySearch.toLowerCase())
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
                <DarkOutlineSelectItem value="BEGINNER">Sơ cấp</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="INTERMEDIATE">Trung cấp</DarkOutlineSelectItem>
                <DarkOutlineSelectItem value="ADVANCED">Cao cấp</DarkOutlineSelectItem>
              </DarkOutlineSelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-gray-400 text-sm">Nổi bật</Label>
            <Select
              value={filters.isFeatured === undefined ? 'all' : filters.isFeatured ? 'true' : 'false'}
              onValueChange={(value) => {
                onFilterChange('isFeatured', value === 'all' ? undefined : value === 'true');
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
              onValueChange={(value: 'all' | 'free' | 'paid') => onPriceTypeChange(value)}
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
                  // scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                } else {
                  // scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                }
                // isPageChangingRef.current = true;
                onFilterChange('sort', value);
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
                  // scrollPositionRef.current = (mainContainer as HTMLElement).scrollTop;
                } else {
                  // scrollPositionRef.current = window.scrollY || document.documentElement.scrollTop;
                }
                // isPageChangingRef.current = true;
                onFilterChange('limit', parseInt(value));
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
            <button
              onClick={onClearFilters}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors"
            >
              Xóa bộ lọc
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
