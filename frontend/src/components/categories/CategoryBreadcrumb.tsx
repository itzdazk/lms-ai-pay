import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import type { Category } from '../../lib/api/types'

interface CategoryBreadcrumbProps {
    categories: Category[]
    className?: string
}

export function CategoryBreadcrumb({
    categories,
    className = '',
}: CategoryBreadcrumbProps) {
    if (categories.length === 0) return null

    return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
            <Link
                to='/categories'
                className='text-blue-500 hover:text-blue-600'
            >
                Danh mục
            </Link>

            {categories.map((category, index) => (
                <div key={category.id} className='flex items-center gap-2'>
                    <ChevronRight className='w-4 h-4 text-gray-400' />
                    {index === categories.length - 1 ? (
                        <span className='text-white font-medium'>
                            {category.name}
                        </span>
                    ) : (
                        <Link
                            to={`/categories/${category.id}`}
                            className='text-blue-500 hover:text-blue-600'
                        >
                            {category.name}
                        </Link>
                    )}
                </div>
            ))}
        </div>
    )
}
