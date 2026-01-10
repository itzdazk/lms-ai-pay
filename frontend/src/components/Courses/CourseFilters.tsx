// ============================================
// FILE: src/components/Courses/CourseFilters.tsx (TẠO MỚI)
// Filters sidebar component
// ============================================

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Checkbox } from '../ui/checkbox'
import { Label } from '../ui/label'
import { Button } from '../ui/button'
import { DarkOutlineButton } from '../ui/buttons'
import { DarkOutlineInput } from '../ui/dark-outline-input'
import {
    X,
    Search,
    GraduationCap,
    DollarSign,
    Filter,
    Tag as TagIcon,
    FolderOpen,
    ChevronDown,
    ChevronUp,
} from 'lucide-react'
import type { Category, Tag } from '../../lib/api/types'
import { coursesApi } from '../../lib/api/courses'

export interface CourseFiltersState {
    categoryId?: number
    level?: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
    minPrice?: number
    maxPrice?: number
    priceType?: 'all' | 'free' | 'paid'
    tagIds?: number[]
    instructorId?: number
}

interface CourseFiltersProps {
    filters: CourseFiltersState
    onChange: (filters: CourseFiltersState) => void
    categories: Category[]
    tags: Tag[]
    isLoading?: boolean
    className?: string
    onToggle?: () => void
    showFilters?: boolean
}

export function CourseFilters({
    filters,
    onChange,
    categories,
    tags = [],
    isLoading = false,
    className = '',
    onToggle,
    showFilters = true,
}: CourseFiltersProps) {
    const [categorySearch, setCategorySearch] = useState('')
    const [tagSearch, setTagSearch] = useState('')
    const [levelCounts, setLevelCounts] = useState<{
        BEGINNER: number
        INTERMEDIATE: number
        ADVANCED: number
    }>({
        BEGINNER: 0,
        INTERMEDIATE: 0,
        ADVANCED: 0,
    })
    const [priceCounts, setPriceCounts] = useState<{
        free: number
        paid: number
    }>({
        free: 0,
        paid: 0,
    })

    // Fetch level counts
    useEffect(() => {
        const fetchLevelCounts = async () => {
            try {
                const counts = await coursesApi.getCourseCountsByLevel()
                setLevelCounts(counts)
            } catch (error) {
                console.error('Error fetching level counts:', error)
            }
        }

        fetchLevelCounts()
    }, [])

    // Fetch price counts
    useEffect(() => {
        const fetchPriceCounts = async () => {
            try {
                const counts = await coursesApi.getCourseCountsByPrice()
                setPriceCounts(counts)
            } catch (error) {
                console.error('Error fetching price counts:', error)
            }
        }

        fetchPriceCounts()
    }, [])

    // Filter categories based on search and sort by coursesCount (descending)
    const filteredCategories = categories
        .filter((category) =>
            category.name.toLowerCase().includes(categorySearch.toLowerCase())
        )
        .sort((a, b) => {
            const countA = a.coursesCount || 0
            const countB = b.coursesCount || 0
            return countB - countA // Descending order
        })

    // Filter tags based on search and sort by coursesCount (descending)
    const filteredTags = tags
        .filter((tag) =>
            tag.name.toLowerCase().includes(tagSearch.toLowerCase())
        )
        .sort((a, b) => {
            const countA = a._count?.courses || 0
            const countB = b._count?.courses || 0
            return countB - countA // Descending order
        })

    // Create sorted level options by coursesCount (descending)
    const levelOptions = [
        {
            value: 'BEGINNER' as const,
            label: 'Cơ bản',
            count: levelCounts.BEGINNER,
        },
        {
            value: 'INTERMEDIATE' as const,
            label: 'Trung cấp',
            count: levelCounts.INTERMEDIATE,
        },
        {
            value: 'ADVANCED' as const,
            label: 'Nâng cao',
            count: levelCounts.ADVANCED,
        },
    ].sort((a, b) => b.count - a.count) // Descending order

    // Create sorted price options by coursesCount (descending)
    const priceOptions = [
        { value: 'free' as const, label: 'Miễn phí', count: priceCounts.free },
        { value: 'paid' as const, label: 'Có phí', count: priceCounts.paid },
    ].sort((a, b) => b.count - a.count) // Descending order

    const handleCategoryChange = (categoryId: number | undefined) => {
        onChange({ ...filters, categoryId })
    }

    const handleLevelChange = (
        level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | undefined
    ) => {
        onChange({ ...filters, level })
    }

    const handleTagChange = (tagId: number, checked: boolean) => {
        const currentTagIds = filters.tagIds || []
        if (checked) {
            // Add tag if not already in array
            if (!currentTagIds.includes(tagId)) {
                onChange({ ...filters, tagIds: [...currentTagIds, tagId] })
            }
        } else {
            // Remove tag from array
            onChange({
                ...filters,
                tagIds: currentTagIds.filter((id) => id !== tagId),
            })
        }
    }

    const handleClearAllTags = () => {
        onChange({ ...filters, tagIds: undefined })
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
        (filters.tagIds && filters.tagIds.length > 0)

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
        <Card
            className={`bg-gradient-to-br from-[#1A1A1A] to-[#151515] border-2 border-[#2D2D2D]/50 shadow-2xl hover:border-[#3D3D3D]/50 transition-all duration-300 ${className}`}
        >
            <CardHeader className='bg-gradient-to-r from-[#1F1F1F] to-[#1A1A1A] border-b border-[#2D2D2D]/50 !py-4'>
                <div className='flex items-center justify-between'>
                    <div className='flex items-center gap-2 flex-1'>
                        {onToggle ? (
                            <>
                                <DarkOutlineButton
                                    onClick={onToggle}
                                    className='h-auto p-2 rounded-lg transition-all duration-200 group flex items-center gap-2 lg:hidden'
                                >
                                    <Filter className='h-5 w-5 text-blue-400 dark:text-blue-400 group-hover:text-blue-500 dark:group-hover:text-blue-300 transition-colors' />
                                    <span className='font-semibold text-lg md:text-base'>
                                        Bộ lọc
                                    </span>
                                    <div className='flex items-center gap-1 text-gray-400 dark:text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors'>
                                        {showFilters ? (
                                            <>
                                                <span className='text-xs hidden sm:inline'>
                                                    Ẩn
                                                </span>
                                                <ChevronUp className='h-4 w-4 transition-transform group-hover:scale-110' />
                                            </>
                                        ) : (
                                            <>
                                                <span className='text-xs hidden sm:inline'>
                                                    Hiện
                                                </span>
                                                <ChevronDown className='h-4 w-4 transition-transform group-hover:scale-110' />
                                            </>
                                        )}
                                    </div>
                                </DarkOutlineButton>
                                <div className='hidden lg:flex items-center gap-2'>
                                    <Filter className='h-5 w-5 text-blue-400' />
                                    <CardTitle className='text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                                        Bộ lọc
                                    </CardTitle>
                                </div>
                            </>
                        ) : (
                            <>
                                <Filter className='h-5 w-5 text-blue-400' />
                                <CardTitle className='text-white bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent'>
                                    Bộ lọc
                                </CardTitle>
                            </>
                        )}
                    </div>
                    {hasActiveFilters && (
                        <Button
                            variant='ghost'
                            size='sm'
                            onClick={handleClearFilters}
                            className='text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/30 hover:border-red-500/50 h-8 px-3 transition-all duration-200'
                        >
                            <X className='h-4 w-4 mr-1.5' />
                            <span className='hidden md:inline'>Xóa bộ lọc</span>
                            <span className='md:hidden'>Xóa</span>
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent
                className={`space-y-6 ${
                    !showFilters && onToggle ? 'hidden lg:block' : ''
                }`}
            >
                {/* Category Filter */}
                <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-4 space-y-3 shadow-lg transition-all duration-200'>
                    <div className='flex items-center justify-between gap-2'>
                        <div className='flex items-center gap-2'>
                            <FolderOpen className='h-4 w-4 text-blue-400' />
                            <Label className='text-white font-semibold text-sm'>
                                Danh mục
                            </Label>
                        </div>
                        {filters.categoryId && (
                            <button
                                type='button'
                                onClick={() => handleCategoryChange(undefined)}
                                className='text-gray-400 transition-colors p-1 rounded hover:bg-blue-500/10'
                                title='Xóa lọc danh mục'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>
                    <div className='relative'>
                        <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400 z-10' />
                        <DarkOutlineInput
                            type='text'
                            placeholder='Tìm kiếm danh mục...'
                            value={categorySearch}
                            onChange={(e) => setCategorySearch(e.target.value)}
                            className='pl-9 pr-9 h-9'
                        />
                        {categorySearch && (
                            <button
                                type='button'
                                onClick={() => setCategorySearch('')}
                                className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10'
                            >
                                <X className='h-4 w-4' />
                            </button>
                        )}
                    </div>
                    <div className='space-y-2 max-h-64 overflow-y-auto custom-scrollbar'>
                        <div className='flex items-center space-x-2 group'>
                            <Checkbox
                                id='cat-all'
                                checked={!filters.categoryId}
                                onCheckedChange={() =>
                                    handleCategoryChange(undefined)
                                }
                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors'
                            />
                            <label
                                htmlFor='cat-all'
                                className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors'
                            >
                                Tất cả
                            </label>
                        </div>
                        {filteredCategories.length > 0 ? (
                            filteredCategories.map((category) => (
                                <div
                                    key={category.id}
                                    className='flex items-start space-x-2 group'
                                >
                                    <Checkbox
                                        id={`cat-${category.id}`}
                                        checked={
                                            filters.categoryId === category.id
                                        }
                                        onCheckedChange={() =>
                                            handleCategoryChange(category.id)
                                        }
                                        className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors mt-0.5'
                                    />
                                    <label
                                        htmlFor={`cat-${category.id}`}
                                        className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors flex-1'
                                    >
                                        <div className='flex items-center justify-between gap-2'>
                                            <span>{category.name}</span>
                                            {category.coursesCount !==
                                                undefined &&
                                                category.coursesCount > 0 && (
                                                    <span className='text-xs text-gray-400 whitespace-nowrap'>
                                                        ({category.coursesCount}
                                                        )
                                                    </span>
                                                )}
                                        </div>
                                    </label>
                                </div>
                            ))
                        ) : (
                            <p className='text-sm text-gray-400 text-center py-2'>
                                Không tìm thấy danh mục
                            </p>
                        )}
                    </div>
                </div>

                {/* Level and Price Filters - Side by Side */}
                <div className='grid grid-cols-2 gap-4'>
                    {/* Level Filter */}
                    <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-4 space-y-3 shadow-lg transition-all duration-200'>
                        <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2'>
                                <GraduationCap className='h-4 w-4 text-blue-400' />
                                <Label className='text-white font-semibold text-sm'>
                                    Trình độ
                                </Label>
                            </div>
                            {filters.level && (
                                <button
                                    type='button'
                                    onClick={() => handleLevelChange(undefined)}
                                    className='text-gray-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10'
                                    title='Xóa lọc trình độ'
                                >
                                    <X className='h-4 w-4' />
                                </button>
                            )}
                        </div>
                        <div className='space-y-2'>
                            <div className='flex items-center space-x-2 group'>
                                <Checkbox
                                    id='level-all'
                                    checked={!filters.level}
                                    onCheckedChange={() =>
                                        handleLevelChange(undefined)
                                    }
                                    className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors'
                                />
                                <label
                                    htmlFor='level-all'
                                    className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors'
                                >
                                    Tất cả
                                </label>
                            </div>
                            {levelOptions.map((level) => (
                                <div
                                    key={level.value}
                                    className='flex items-start space-x-2 group'
                                >
                                    <Checkbox
                                        id={`level-${level.value.toLowerCase()}`}
                                        checked={filters.level === level.value}
                                        onCheckedChange={() =>
                                            handleLevelChange(level.value)
                                        }
                                        className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors mt-0.5'
                                    />
                                    <label
                                        htmlFor={`level-${level.value.toLowerCase()}`}
                                        className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors flex-1'
                                    >
                                        <div className='flex items-center justify-between gap-2'>
                                            <span>{level.label}</span>
                                            {level.count > 0 && (
                                                <span className='text-xs text-gray-400 whitespace-nowrap'>
                                                    ({level.count})
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Price Filter */}
                    <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-4 space-y-3 shadow-lg transition-all duration-200'>
                        <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2'>
                                <DollarSign className='h-4 w-4 text-blue-400' />
                                <Label className='text-white font-semibold text-sm'>
                                    Giá
                                </Label>
                            </div>
                            {filters.priceType &&
                                filters.priceType !== 'all' && (
                                    <button
                                        type='button'
                                        onClick={() =>
                                            handlePriceTypeChange('all')
                                        }
                                        className='text-gray-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10'
                                        title='Xóa lọc giá'
                                    >
                                        <X className='h-4 w-4' />
                                    </button>
                                )}
                        </div>
                        <div className='space-y-2'>
                            <div className='flex items-center space-x-2 group'>
                                <Checkbox
                                    id='price-all'
                                    checked={
                                        !filters.priceType ||
                                        filters.priceType === 'all'
                                    }
                                    onCheckedChange={() =>
                                        handlePriceTypeChange('all')
                                    }
                                    className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors'
                                />
                                <label
                                    htmlFor='price-all'
                                    className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors'
                                >
                                    Tất cả
                                </label>
                            </div>
                            {priceOptions.map((price) => (
                                <div
                                    key={price.value}
                                    className='flex items-start space-x-2 group'
                                >
                                    <Checkbox
                                        id={`price-${price.value}`}
                                        checked={
                                            filters.priceType === price.value
                                        }
                                        onCheckedChange={() =>
                                            handlePriceTypeChange(price.value)
                                        }
                                        className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors mt-0.5'
                                    />
                                    <label
                                        htmlFor={`price-${price.value}`}
                                        className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors flex-1'
                                    >
                                        <div className='flex items-center justify-between gap-2'>
                                            <span>{price.label}</span>
                                            {price.count > 0 && (
                                                <span className='text-xs text-gray-400 whitespace-nowrap'>
                                                    ({price.count})
                                                </span>
                                            )}
                                        </div>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                    <div className='bg-gradient-to-br from-[#1F1F1F] to-[#1A1A1A] border border-[#2D2D2D]/50 rounded-xl p-4 space-y-3 shadow-lg transition-all duration-200'>
                        <div className='flex items-center justify-between gap-2'>
                            <div className='flex items-center gap-2'>
                                <TagIcon className='h-4 w-4 text-blue-400' />
                                <Label className='text-white font-semibold text-sm'>
                                    Tags phổ biến
                                </Label>
                            </div>
                            {filters.tagIds && filters.tagIds.length > 0 && (
                                <button
                                    type='button'
                                    onClick={handleClearAllTags}
                                    className='text-gray-400 hover:text-blue-400 transition-colors p-1 rounded hover:bg-blue-500/10'
                                    title='Xóa lọc tags'
                                >
                                    <X className='h-4 w-4' />
                                </button>
                            )}
                        </div>
                        <div className='relative'>
                            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-400 z-10' />
                            <DarkOutlineInput
                                type='text'
                                placeholder='Tìm kiếm tags...'
                                value={tagSearch}
                                onChange={(e) => setTagSearch(e.target.value)}
                                className='pl-9 pr-9 h-9'
                            />
                            {tagSearch && (
                                <button
                                    type='button'
                                    onClick={() => setTagSearch('')}
                                    className='absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 hover:text-white transition-colors z-10'
                                >
                                    <X className='h-4 w-4' />
                                </button>
                            )}
                        </div>
                        <div className='space-y-2 max-h-64 overflow-y-auto custom-scrollbar'>
                            <div className='flex items-center space-x-2 group'>
                                <Checkbox
                                    id='tags-all'
                                    checked={
                                        !filters.tagIds ||
                                        filters.tagIds.length === 0
                                    }
                                    onCheckedChange={(checked) => {
                                        if (checked) {
                                            handleClearAllTags()
                                        }
                                    }}
                                    className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors'
                                />
                                <label
                                    htmlFor='tags-all'
                                    className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors'
                                >
                                    Tất cả
                                </label>
                            </div>
                            {filteredTags.length > 0 ? (
                                filteredTags.map((tag) => {
                                    const isActive =
                                        filters.tagIds?.includes(tag.id) ||
                                        false

                                    return (
                                        <div
                                            key={tag.id}
                                            className='flex items-start space-x-2 group'
                                        >
                                            <Checkbox
                                                id={`tag-${tag.id}`}
                                                checked={isActive}
                                                onCheckedChange={(checked) =>
                                                    handleTagChange(
                                                        tag.id,
                                                        checked as boolean
                                                    )
                                                }
                                                className='border-[#2D2D2D] data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 group-hover:border-blue-500/50 transition-colors mt-0.5'
                                            />
                                            <label
                                                htmlFor={`tag-${tag.id}`}
                                                className='text-sm cursor-pointer text-gray-300 group-hover:text-white transition-colors flex-1'
                                            >
                                                <div className='flex items-center justify-between gap-2'>
                                                    <span>{tag.name}</span>
                                                    {tag._count &&
                                                        tag._count.courses >
                                                            0 && (
                                                            <span className='text-xs text-gray-400 whitespace-nowrap'>
                                                                (
                                                                {
                                                                    tag._count
                                                                        .courses
                                                                }
                                                                )
                                                            </span>
                                                        )}
                                                </div>
                                            </label>
                                        </div>
                                    )
                                })
                            ) : (
                                <p className='text-sm text-gray-400 text-center py-2'>
                                    Không tìm thấy tag
                                </p>
                            )}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
