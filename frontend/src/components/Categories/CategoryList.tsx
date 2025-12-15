import { useState } from 'react'
import { Filter, Grid, List, Search } from 'lucide-react'
import type { Category } from '../../lib/api/types'
import { CategoryCard } from './CategoryCard'
import { Button } from '../ui/button'

interface CategoryListProps {
    categories: Category[]
    onCategoryClick?: (category: Category) => void
    title?: string
    showFilters?: boolean
    className?: string
}

export function CategoryList({
    categories,
    onCategoryClick,
    title = 'Danh mục khóa học',
    showFilters = true,
}: CategoryListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
    const [filterType, setFilterType] = useState<'all' | 'parent' | 'child'>(
        'all'
    )
    const [currentPage, setCurrentPage] = useState(1)
    const itemsPerPage = 12

    // Filter categories
    const filteredCategories = categories.filter((category) => {
        const matchesSearch =
            category.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            category.description
                ?.toLowerCase()
                .includes(searchQuery.toLowerCase())

        const matchesFilter =
            filterType === 'all' ||
            (filterType === 'parent' && !category.parent) ||
            (filterType === 'child' && category.parent)

        return matchesSearch && matchesFilter
    })

    const totalPages = Math.max(
        1,
        Math.ceil(filteredCategories.length / itemsPerPage)
    )

    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedCategories = filteredCategories.slice(startIndex, endIndex)

    // Separate parent and child categories (sau khi phân trang)
    const parentCategories = paginatedCategories.filter((c) => !c.parent)
    const childCategories = paginatedCategories.filter((c) => c.parent)

    const handlePageChange = (page: number) => {
        if (page < 1 || page > totalPages) return
        setCurrentPage(page)
        window.scrollTo({ top: 0, behavior: 'smooth' })
    }

    return (
        <div className='space-y-6'>
            <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
                <div>
                    <h2 className='mb-1 text-gray-900 dark:text-white'>
                        {title}
                    </h2>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Khám phá {filteredCategories.length} danh mục khóa học
                    </p>
                </div>

                {showFilters && (
                    <div className='flex items-center gap-3'>
                        {/* View Mode Toggle */}
                        <div className='flex items-center gap-1 bg-gray-100 dark:bg-[#2D2D2D] rounded-lg p-1'>
                            <button
                                onClick={() => setViewMode('grid')}
                                className={`p-2 rounded transition-colors ${
                                    viewMode === 'grid'
                                        ? 'bg-white dark:bg-[#1A1A1A] text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <Grid className='w-4 h-4' />
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 rounded transition-colors ${
                                    viewMode === 'list'
                                        ? 'bg-white dark:bg-[#1A1A1A] text-blue-600 dark:text-blue-400 shadow-sm'
                                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                }`}
                            >
                                <List className='w-4 h-4' />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Search and Filters */}
            {showFilters && (
                <div className='flex flex-col gap-3 md:flex-row'>
                    {/* Search */}
                    <div className='relative flex-1'>
                        <Search className='absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 dark:text-gray-500' />
                        <input
                            type='text'
                            placeholder='Tìm kiếm danh mục...'
                            value={searchQuery}
                            onChange={(e) => {
                                setSearchQuery(e.target.value)
                                setCurrentPage(1)
                            }}
                            className='w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-[#2D2D2D] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400'
                        />
                    </div>

                    {/* Filter Type */}
                    <div className='flex items-center gap-2'>
                        <Filter className='w-5 h-5 text-gray-400 dark:text-gray-500' />
                        <select
                            value={filterType}
                            onChange={(e) => {
                                setFilterType(e.target.value as any)
                                setCurrentPage(1)
                            }}
                            className='px-4 py-2.5 border border-gray-300 dark:border-[#2D2D2D] rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent bg-white dark:bg-[#1A1A1A] text-gray-900 dark:text-white'
                        >
                            <option value='all'>Tất cả danh mục</option>
                            <option value='parent'>Danh mục chính</option>
                            <option value='child'>Danh mục con</option>
                        </select>
                    </div>
                </div>
            )}

            {/* Categories Grid */}
            {filteredCategories.length > 0 ? (
                <div className='space-y-8'>
                    {/* Parent Categories */}
                    {parentCategories.length > 0 && (
                        <div>
                            {filterType === 'all' && (
                                <h3 className='mb-4 text-gray-900 dark:text-white'>
                                    Danh mục chính
                                </h3>
                            )}
                            <div
                                className={`
                ${
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                }
              `}
                            >
                                {parentCategories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onClick={onCategoryClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Child Categories */}
                    {childCategories.length > 0 && filterType === 'all' && (
                        <div>
                            <h3 className='mb-4 text-gray-900 dark:text-white'>
                                Danh mục con
                            </h3>
                            <div
                                className={`
                ${
                    viewMode === 'grid'
                        ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                        : 'space-y-4'
                }
              `}
                            >
                                {childCategories.map((category) => (
                                    <CategoryCard
                                        key={category.id}
                                        category={category}
                                        onClick={onCategoryClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )}

                    {/* All children when filtered */}
                    {childCategories.length > 0 && filterType === 'child' && (
                        <div
                            className={`
              ${
                  viewMode === 'grid'
                      ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                      : 'space-y-4'
              }
            `}
                        >
                            {childCategories.map((category) => (
                                <CategoryCard
                                    key={category.id}
                                    category={category}
                                    onClick={onCategoryClick}
                                />
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className='text-center py-16'>
                    <div className='w-16 h-16 bg-gray-100 dark:bg-[#2D2D2D] rounded-full flex items-center justify-center mx-auto mb-4'>
                        <Search className='w-8 h-8 text-gray-400 dark:text-gray-500' />
                    </div>
                    <h3 className='text-gray-900 dark:text-white mb-2'>
                        Không tìm thấy danh mục
                    </h3>
                    <p className='text-gray-600 dark:text-gray-400'>
                        Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc
                    </p>
                </div>
            )}
        </div>
    )
}
