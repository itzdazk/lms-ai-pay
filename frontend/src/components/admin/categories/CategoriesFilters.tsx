import { Label } from '../../../components/ui/label'
import { Select, SelectValue } from '../../../components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Button } from '../../../components/ui/button'
import { DarkOutlineButton } from '../../../components/ui/buttons'
import {
    DarkOutlineSelectTrigger,
    DarkOutlineSelectContent,
    DarkOutlineSelectItem,
} from '../../../components/ui/dark-outline-select-trigger'
import {
    DarkOutlineInput,
} from '../../../components/ui/dark-outline-input'
import type { AdminCategoryFilters } from '../../../lib/api/admin-categories'
import type { Category } from '../../../lib/api/types'

interface CategoriesFiltersProps {
    filters: AdminCategoryFilters
    allCategories: Category[]
    categorySearch: string
    onCategorySearchChange: (value: string) => void
    onFilterChange: (key: keyof AdminCategoryFilters, value: any) => void
    onClearFilters: () => void
}

export function CategoriesFilters({
    filters,
    allCategories,
    categorySearch,
    onCategorySearchChange,
    onFilterChange,
    onClearFilters,
}: CategoriesFiltersProps) {
    return (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] mb-6'>
            <CardHeader>
                <CardTitle className='text-white'>Bộ lọc</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
                <div className='grid grid-cols-1 md:grid-cols-5 gap-4'>
                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Danh mục
                        </Label>
                        <Select
                            value={
                                filters.categoryId
                                    ? String(filters.categoryId)
                                    : 'all'
                            }
                            onValueChange={(value) => {
                                onFilterChange(
                                    'categoryId',
                                    value === 'all'
                                        ? undefined
                                        : parseInt(value)
                                )
                                onCategorySearchChange('') // Reset search when selecting
                            }}
                        >
                            <DarkOutlineSelectTrigger>
                                <SelectValue placeholder='Tất cả danh mục' />
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent>
                                <div className='p-2 border-b border-[#2D2D2D]'>
                                    <DarkOutlineInput
                                        placeholder='Tìm kiếm danh mục...'
                                        value={categorySearch}
                                        onChange={(e) => {
                                            e.stopPropagation()
                                            onCategorySearchChange(e.target.value)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        onKeyDown={(e) => e.stopPropagation()}
                                        className='w-full'
                                    />
                                </div>
                                <div className='max-h-[200px] overflow-y-auto'>
                                    <DarkOutlineSelectItem
                                        value='all'
                                        onSelect={() => onCategorySearchChange('')}
                                    >
                                        Tất cả danh mục
                                    </DarkOutlineSelectItem>
                                    {(() => {
                                        const searchLower = categorySearch.toLowerCase()

                                        // Separate parent and child categories
                                        const parentCategories = allCategories.filter((cat) => !cat.parentId)
                                        const childCategories = allCategories.filter((cat) => cat.parentId)

                                        // Build display list maintaining hierarchical order
                                        const displayList: Category[] = []

                                        // Process parent categories first
                                        parentCategories.forEach((parent) => {
                                            const parentMatches = !categorySearch ||
                                                parent.name.toLowerCase().includes(searchLower)

                                            // Get all children of this parent
                                            const children = childCategories.filter(
                                                (child) => child.parentId === parent.id
                                            )

                                            // Check if any child matches search
                                            const hasMatchingChild = !categorySearch ||
                                                children.some((child) =>
                                                    child.name.toLowerCase().includes(searchLower)
                                                )

                                            // Include parent if it matches or has matching children or no search
                                            if (parentMatches || hasMatchingChild || !categorySearch) {
                                                displayList.push(parent)

                                                // Add all children of this parent
                                                children.forEach((child) => {
                                                    const childMatches = !categorySearch ||
                                                        child.name.toLowerCase().includes(searchLower) ||
                                                        parentMatches

                                                    if (childMatches) {
                                                        displayList.push(child)
                                                    }
                                                })
                                            }
                                        })

                                        return displayList.map((category) => {
                                            const isChild = !!category.parentId
                                            const parentCategory = allCategories.find(
                                                (cat) => cat.id === category.parentId
                                            )
                                            // If searching and child's parent doesn't match, show parent name
                                            const shouldShowParent =
                                                categorySearch &&
                                                isChild &&
                                                parentCategory &&
                                                !parentCategory.name
                                                    .toLowerCase()
                                                    .includes(searchLower)

                                            return (
                                                <DarkOutlineSelectItem
                                                    key={category.id}
                                                    value={String(category.id)}
                                                    onSelect={() =>
                                                        onCategorySearchChange('')
                                                    }
                                                >
                                                    <div
                                                        className={`flex items-center ${
                                                            isChild ? 'pl-4' : ''
                                                        }`}
                                                    >
                                                        {isChild && (
                                                            <span className='text-gray-500 mr-1'>
                                                                └
                                                            </span>
                                                        )}
                                                        <span>
                                                            {shouldShowParent
                                                                ? `${parentCategory.name} > ${category.name}`
                                                                : category.name}
                                                        </span>
                                                    </div>
                                                </DarkOutlineSelectItem>
                                            )
                                        })
                                    })()}
                                    {allCategories.length === 0 && (
                                        <div className='px-2 py-1.5 text-sm text-gray-400 text-center'>
                                            Không có danh mục
                                        </div>
                                    )}
                                </div>
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Trạng thái
                        </Label>
                        <Select
                            value={
                                filters.isActive === undefined
                                    ? 'all'
                                    : filters.isActive
                                    ? 'true'
                                    : 'false'
                            }
                            onValueChange={(value) => {
                                onFilterChange(
                                    'isActive',
                                    value === 'all'
                                        ? undefined
                                        : value === 'true'
                                )
                            }}
                        >
                            <DarkOutlineSelectTrigger>
                                <SelectValue placeholder='Tất cả' />
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent>
                                <DarkOutlineSelectItem value='all'>
                                    Tất cả
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='true'>
                                    Hoạt động
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='false'>
                                    Không hoạt động
                                </DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Sắp xếp
                        </Label>
                        <Select
                            value={
                                filters.sort === 'createdAt' && filters.sortOrder === 'desc'
                                    ? 'newest'
                                    : filters.sort === 'createdAt' && filters.sortOrder === 'asc'
                                      ? 'oldest'
                                      : filters.sort === 'updatedAt' && filters.sortOrder === 'desc'
                                        ? 'updated'
                                        : filters.sort === 'updatedAt' && filters.sortOrder === 'asc'
                                          ? 'updated-oldest'
                                          : filters.sort === 'sortOrder' && filters.sortOrder === 'asc'
                                            ? 'sortOrder-asc'
                                            : filters.sort === 'sortOrder' && filters.sortOrder === 'desc'
                                              ? 'sortOrder-desc'
                                              : 'newest'
                            }
                            onValueChange={(value) => {
                                const mainContainer = document.querySelector('main')
                                if (mainContainer) {
                                    // This would need to be passed as prop instead
                                    // For now, we'll keep it simple
                                }

                                let newSort: 'name' | 'createdAt' | 'updatedAt' | 'sortOrder' = 'sortOrder'
                                let newSortOrder: 'asc' | 'desc' = 'asc'

                                if (value === 'newest') {
                                    newSort = 'createdAt'
                                    newSortOrder = 'desc'
                                } else if (value === 'oldest') {
                                    newSort = 'createdAt'
                                    newSortOrder = 'asc'
                                } else if (value === 'updated') {
                                    newSort = 'updatedAt'
                                    newSortOrder = 'desc'
                                } else if (value === 'updated-oldest') {
                                    newSort = 'updatedAt'
                                    newSortOrder = 'asc'
                                } else if (value === 'sortOrder-asc') {
                                    newSort = 'sortOrder'
                                    newSortOrder = 'asc'
                                } else if (value === 'sortOrder-desc') {
                                    newSort = 'sortOrder'
                                    newSortOrder = 'desc'
                                }

                                onFilterChange('sort', newSort)
                                onFilterChange('sortOrder', newSortOrder)
                            }}
                        >
                            <DarkOutlineSelectTrigger>
                                <SelectValue placeholder='Sắp xếp' />
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent>
                                <DarkOutlineSelectItem value='newest'>
                                    Mới nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='oldest'>
                                    Cũ nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='updated'>
                                    Cập nhật: Mới nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='updated-oldest'>
                                    Cập nhật: Cũ nhất
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='sortOrder-asc'>
                                    Thứ tự: Tăng dần
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='sortOrder-desc'>
                                    Thứ tự: Giảm dần
                                </DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm'>
                            Số lượng / trang
                        </Label>
                        <Select
                            value={filters.limit?.toString() || '10'}
                            onValueChange={(value) => {
                                onFilterChange(
                                    'limit',
                                    parseInt(value)
                                )
                            }}
                        >
                            <DarkOutlineSelectTrigger>
                                <SelectValue placeholder='10 / trang' />
                            </DarkOutlineSelectTrigger>
                            <DarkOutlineSelectContent>
                                <DarkOutlineSelectItem value='5'>
                                    5 / trang
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='10'>
                                    10 / trang
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='20'>
                                    20 / trang
                                </DarkOutlineSelectItem>
                                <DarkOutlineSelectItem value='50'>
                                    50 / trang
                                </DarkOutlineSelectItem>
                            </DarkOutlineSelectContent>
                        </Select>
                    </div>

                    <div className='space-y-2'>
                        <Label className='text-gray-400 text-sm opacity-0'>
                            Xóa bộ lọc
                        </Label>
                        <Button
                            onClick={onClearFilters}
                            variant='blue'
                            className='w-full'
                        >
                            Xóa bộ lọc
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
