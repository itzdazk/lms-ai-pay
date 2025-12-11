import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Badge } from '../ui/badge'
import type { Category } from '../../lib/api/types'

interface CategoryCardProps {
    category: Category
    showCourseCount?: boolean
    isClickable?: boolean
}

// Mapping category slug to colors
const CATEGORY_COLORS: Record<string, string> = {
    'web-development': 'from-blue-500 to-blue-600',
    'frontend-development': 'from-cyan-500 to-cyan-600',
    'backend-development': 'from-indigo-500 to-indigo-600',
    'mobile-development': 'from-green-500 to-green-600',
    'data-science': 'from-purple-500 to-purple-600',
    'artificial-intelligence': 'from-violet-500 to-violet-600',
    'ui-ux-design': 'from-pink-500 to-pink-600',
    devops: 'from-amber-500 to-amber-600',
    'programming-languages': 'from-orange-500 to-orange-600',
    'game-development': 'from-rose-500 to-rose-600',
    cybersecurity: 'from-red-500 to-red-600',
    'blockchain-web3': 'from-yellow-500 to-yellow-600',
    'cloud-computing': 'from-sky-500 to-sky-600',
}

const CATEGORY_ICONS: Record<string, string> = {
    'web-development': '🌐',
    'frontend-development': '🎨',
    'backend-development': '⚙️',
    'mobile-development': '📱',
    'data-science': '📊',
    'artificial-intelligence': '🤖',
    'ui-ux-design': '✨',
    devops: '🚀',
    'programming-languages': '💻',
    'game-development': '🎮',
    cybersecurity: '🔒',
    'blockchain-web3': '⛓️',
    'cloud-computing': '☁️',
}

export function CategoryCard({
    category,
    showCourseCount = true,
    isClickable = true,
}: CategoryCardProps) {
    const gradientClass =
        CATEGORY_COLORS[category.slug] || 'from-blue-500 to-blue-600'
    const icon = CATEGORY_ICONS[category.slug] || '📚'

    const cardContent = (
        <Card className='bg-[#1A1A1A] border-[#2D2D2D] hover:border-blue-500 transition-all hover:shadow-lg hover:shadow-blue-500/20 h-full'>
            <CardContent className='pt-6 text-center'>
                {/* Icon Background */}
                <div
                    className={`flex justify-center mb-4 bg-gradient-to-br ${gradientClass} rounded-full p-6 w-16 h-16 mx-auto`}
                >
                    <div className='text-4xl leading-none'>{icon}</div>
                </div>

                {/* Category Name */}
                <h3 className='font-semibold text-white text-sm md:text-base leading-tight mb-2'>
                    {category.name}
                </h3>

                {/* Course Count */}
                {showCourseCount && (
                    <Badge
                        variant='secondary'
                        className='bg-[#2D2D2D] text-gray-300 text-xs'
                    >
                        {category.coursesCount || 0} khóa học
                    </Badge>
                )}

                {/* Subcategories Indicator */}
                {category.children && category.children.length > 0 && (
                    <div className='mt-2 text-xs text-gray-400'>
                        {category.children.length} danh mục con
                    </div>
                )}
            </CardContent>
        </Card>
    )

    if (!isClickable) {
        return cardContent
    }

    return (
        <Link
            to={`/categories/${category.id}`}
            className='group block hover:no-underline'
        >
            {cardContent}
        </Link>
    )
}
