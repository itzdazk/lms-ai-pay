// ============================================
// FILE: src/components/Courses/CourseFilters.tsx (TẠO MỚI)
// Filters sidebar component
// ============================================

import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Separator } from '../ui/separator'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { X } from 'lucide-react'
import type { Category, Tag } from '../../lib/api/types'

export interface CourseFiltersState {
    categoryId?: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    minPrice?: number
    maxPrice?: number
    priceType?: 'all' | 'free' | 'paid'
    tagId?: number
}

interface CourseFiltersProps {
    filters: CourseFiltersState
    onChange: (filters: CourseFiltersState) => void
    categories: Category[]
    tags: Tag[]
    isLoading?: boolean
    className?: string
}

export function CourseFilters({
    filters,
    onChange,
    categories,
    tags = [],
    isLoading = false,
    className = '',
}: CourseFiltersProps) {
    const handleCategoryChange = (categoryId: number | undefined) => {
        onChange({ ...filters, categoryId })
    }

    const handleLevelChange = (
        level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined
    ) => {
        onChange({ ...filters, level })
    }

    const handleTagChange = (tagId: number | undefined) => {
        onChange({ ...filters, tagId })
    }

    const handlePriceTypeChange = (priceType: 'all' | 'free' | 'paid') => {
        const updates: Partial<CourseFiltersState> = { priceType }

        if (priceType === 'free') {
            updates.minPrice = 0
            updates.maxPrice = 0
        } else if (priceType === 'paid') {
            updates.minPrice = 1
            updates.maxPrice = undefined
        } else {
            updates.minPrice = undefined
            updates.maxPrice = undefined
        }

        onChange({ ...filters, ...updates })
    }

    const handleClearFilters = () => {
        onChange({})
    }

    const hasActiveFilters =
        filters.categoryId ||
        filters.level ||
        filters.priceType ||
        filters.tagId

    if (isLoading) {
        return (
            <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
                <CardHeader>
                    <CardTitle className='text-white'>Đang tải...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className='space-y-4'>
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className='h-6 bg-[#2D2D2D] rounded animate-pulse'
                            />
                        ))}
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card className={`bg-[#1A1A1A] border-[#2D2D2D] ${className}`}>
            <CardHeader>
                <div className='flex items-center justify-between'>
                    <CardTitle className='text-white'>Bộ lọc</CardTitle>
                    {hasActiveFilters && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleClearFilters}
                            className='text-blue-600 hover:text-blue-700 hover:bg-[#2D2D2D] h-8 px-2'
                        >
                            <X className='h-4 w-4 mr-1' />
                            Xóa bộ lọc
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent className='space-y-6'>
                {/* Category Filter */}
                <div className='space-y-3'>
                    <Label className='text-white font-semibold'>Danh mục</Label>
                    <div className='space-y-2 max-h-64 overflow-y-auto'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='cat-all'
                                checked={!filters.categoryId}
                                onCheckedChange={() =>
                                    handleCategoryChange(undefined)
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='cat-all'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Tất cả
                            </label>
                        </div>
                        {categories.map((category) => (
                            <div
                                key={category.id}
                                className='flex items-center space-x-2'
                            >
                                <Checkbox
                                    id={`cat-${category.id}`}
                                    checked={filters.categoryId === category.id}
                                    onCheckedChange={() =>
                                        handleCategoryChange(category.id)
                                    }
                                    className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                                />
                                <label
                                    htmlFor={`cat-${category.id}`}
                                    className='text-sm cursor-pointer text-gray-300 hover:text-white'
                                >
                                    {category.name}
                                </label>
                            </div>
                        ))}
                    </div>
                </div>

                <Separator className='bg-[#2D2D2D]' />

                {/* Level Filter */}
                <div className='space-y-3'>
                    <Label className='text-white font-semibold'>Trình độ</Label>
                    <div className='space-y-2'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='level-all'
                                checked={!filters.level}
                                onCheckedChange={() =>
                                    handleLevelChange(undefined)
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='level-all'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Tất cả
                            </label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='level-beginner'
                                checked={filters.level === 'BEGINNER'}
                                onCheckedChange={() =>
                                    handleLevelChange('BEGINNER')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='level-beginner'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Cơ bản
                            </label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='level-intermediate'
                                checked={filters.level === 'INTERMEDIATE'}
                                onCheckedChange={() =>
                                    handleLevelChange('INTERMEDIATE')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='level-intermediate'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Trung cấp
                            </label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='level-advanced'
                                checked={filters.level === 'ADVANCED'}
                                onCheckedChange={() =>
                                    handleLevelChange('ADVANCED')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='level-advanced'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Nâng cao
                            </label>
                        </div>
                    </div>
                </div>

                <Separator className='bg-[#2D2D2D]' />

                {/* Price Filter */}
                <div className='space-y-3'>
                    <Label className='text-white font-semibold'>Giá</Label>
                    <div className='space-y-2'>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='price-all'
                                checked={
                                    !filters.priceType ||
                                    filters.priceType === 'all'
                                }
                                onCheckedChange={() =>
                                    handlePriceTypeChange('all')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='price-all'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Tất cả
                            </label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='price-free'
                                checked={filters.priceType === 'free'}
                                onCheckedChange={() =>
                                    handlePriceTypeChange('free')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='price-free'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Miễn phí
                            </label>
                        </div>
                        <div className='flex items-center space-x-2'>
                            <Checkbox
                                id='price-paid'
                                checked={filters.priceType === 'paid'}
                                onCheckedChange={() =>
                                    handlePriceTypeChange('paid')
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600'
                            />
                            <label
                                htmlFor='price-paid'
                                className='text-sm cursor-pointer text-gray-300 hover:text-white'
                            >
                                Có phí
                            </label>
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <>
                        <Separator className='bg-[#2D2D2D]' />
                        <div className='space-y-3'>
                            <Label className='text-white font-semibold'>
                                Tags phổ biến
                            </Label>
                            <div className='flex flex-wrap gap-2'>
                                {/* Tag "Tất cả" để bỏ chọn */}
                                <Badge
                                    variant={
                                        filters.tagId === undefined
                                            ? 'default'
                                            : 'outline'
                                    }
                                    className={`
                                    cursor-pointer transition-all
                                    ${
                                        filters.tagId === undefined
                                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                                            : 'border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D] hover:text-white'
                                    }
                                `}
                                    onClick={() => handleTagChange(undefined)}
                                >
                                    Tất cả
                                </Badge>

                                {tags.map((tag) => {
                                    const isActive = filters.tagId === tag.id

                                    return (
                                        <Badge
                                            key={tag.id}
                                            variant={
                                                isActive ? 'default' : 'outline'
                                            }
                                            className={`
                                            cursor-pointer transition-all
                                            ${
                                                isActive
                                                    ? 'bg-blue-600 text-white hover:bg-blue-700'
                                                    : 'border-[#2D2D2D] text-gray-300 hover:bg-[#2D2D2D] hover:text-white'
                                            }
                                        `}
                                            onClick={() =>
                                                handleTagChange(tag.id)
                                            }
                                        >
                                            {tag.name}
                                            {tag._count &&
                                                tag._count.courses > 0 && (
                                                    <span className='ml-1.5 text-xs opacity-80'>
                                                        ({tag._count.courses})
                                                    </span>
                                                )}
                                        </Badge>
                                    )
                                })}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    )
}
