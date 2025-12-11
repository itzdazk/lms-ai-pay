import { CategoryCard } from './CategoryCard'
import type { Category } from '../../lib/api/types'

interface CategoryListProps {
    categories: Category[]
    hierarchical?: boolean
    isLoading?: boolean
    className?: string
}

export function CategoryList({
    categories,
    hierarchical = false,
    isLoading = false,
    className = '',
}: CategoryListProps) {
    if (isLoading) {
        return (
            <div
                className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${className}`}
            >
                {Array.from({ length: 6 }).map((_, i) => (
                    <div
                        key={i}
                        className='bg-[#1A1A1A] border border-[#2D2D2D] rounded-lg h-32 animate-pulse'
                    />
                ))}
            </div>
        )
    }

    if (categories.length === 0) {
        return (
            <div className='text-center py-12'>
                <p className='text-gray-400'>Không tìm thấy danh mục nào</p>
            </div>
        )
    }

    if (!hierarchical) {
        // Flat grid view
        return (
            <div
                className={`grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4 ${className}`}
            >
                {categories.map((category) => (
                    <CategoryCard
                        key={category.id}
                        category={category}
                        showCourseCount={true}
                        isClickable={true}
                    />
                ))}
            </div>
        )
    }

    // Hierarchical view - separate parent and children
    const parentCategories = categories.filter((cat) => !cat.parentId)
    const childCategories = categories.filter((cat) => cat.parentId)

    return (
        <div className={`space-y-8 ${className}`}>
            {parentCategories.map((parent) => {
                const children = childCategories.filter(
                    (cat) => cat.parentId === parent.id
                )

                return (
                    <div key={parent.id} className='space-y-4'>
                        {/* Parent Category */}
                        <div className='space-y-2'>
                            <h3 className='text-lg font-semibold text-white'>
                                {parent.name}
                            </h3>
                            <p className='text-sm text-gray-400'>
                                {parent.description}
                            </p>
                        </div>

                        {/* Children Grid */}
                        <div className='grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'>
                            <CategoryCard
                                key={parent.id}
                                category={parent}
                                showCourseCount={true}
                                isClickable={true}
                            />
                            {children.map((child) => (
                                <CategoryCard
                                    key={child.id}
                                    category={child}
                                    showCourseCount={true}
                                    isClickable={true}
                                />
                            ))}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}
