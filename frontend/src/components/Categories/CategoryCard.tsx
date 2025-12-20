import { Link } from 'react-router-dom'
import { Card, CardContent } from '../ui/card'
import { Layers, ChevronRight } from 'lucide-react'
import type { Category } from '../../lib/api/types'
import { cn } from '../ui/utils'

interface CategoryCardProps {
    category: Category
    className?: string
    showChildrenCount?: boolean
    href?: string
    onClick?: (category: Category) => void
}

export function CategoryCard({
    category,
    className = '',
    href,
    onClick,
}: CategoryCardProps) {
    const hasImage = !!category.imageUrl
    const children = category.children ?? []
    const hasChildren = children.length > 0
    const linkTo = href || `/categories/${category.id}`

    const Wrapper: any = onClick ? 'button' : Link

    return (
        <Wrapper
            {...(onClick
                ? {
                      type: 'button',
                      onClick: () => onClick(category),
                  }
                : { to: linkTo })}
            className={cn(
                'group block text-left',
                onClick && 'w-full',
                className
            )}
        >
            <Card
                className={cn(
                    'bg-white dark:bg-gradient-to-br dark:from-[#1A1A1A] dark:to-[#151515] border-2 border-gray-200 dark:border-[#2D2D2D]/50 hover:border-blue-500 dark:hover:border-primary/50 transition-all duration-300 cursor-pointer overflow-hidden hover:shadow-lg hover:shadow-blue-500/10 dark:hover:shadow-primary/10',
                    'flex flex-col',
                    className?.includes('list') && 'flex-row h-[160px]'
                )}
            >
                <CardContent className='p-0 [&:last-child]:pb-0'>
                    {/* Image */}
                    <div
                        className={cn(
                            'relative overflow-hidden bg-gray-100 dark:bg-gradient-to-br dark:from-[#1F1F1F] dark:to-[#151515]',
                            className?.includes('list')
                                ? 'w-60 h-full flex-shrink-0'
                                : 'aspect-video'
                        )}
                    >
                        {hasImage ? (
                            <img
                                src={category.imageUrl}
                                alt={category.name}
                                className='w-full h-full object-cover group-hover:scale-110 transition-transform duration-300'
                            />
                        ) : (
                            <div className='w-full h-full flex items-center justify-center'>
                                <Layers className='w-14 h-14 text-gray-400 dark:text-muted-foreground/40' />
                            </div>
                        )}

                        {/* Children Count */}
                        <div className='absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300' />
                        {hasChildren && (
                            <div className='absolute top-3 right-3'>
                                <span className='px-3 py-1 bg-blue-500/90 dark:bg-blue-500/90 backdrop-blur-sm text-white rounded-full text-xs'>
                                    {category.children?.length} subcategories
                                </span>
                            </div>
                        )}

                        {/* Category Badge */}
                        {category.parent && (
                            <div className='absolute top-3 left-3'>
                                <span className='px-3 py-1 bg-white/90 dark:bg-[#2D2D2D]/90 backdrop-blur-sm text-gray-900 dark:text-white rounded-full text-xs'>
                                    {category.parent.name}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div
                        className={cn(
                            'p-4 flex flex-col justify-between',
                            className?.includes('list') && 'flex-1 p-5'
                        )}
                    >
                        <div className='flex items-start justify-between gap-3 mb-2'>
                            <h3 className='flex-1 text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors'>
                                {category.name}
                            </h3>
                            <ChevronRight className='w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-blue-600 dark:group-hover:text-blue-400 group-hover:translate-x-1 transition-all flex-shrink-0' />
                        </div>
                        {category.description && (
                            <p
                                className={cn(
                                    'text-sm text-gray-600 dark:text-gray-400 mb-2',
                                    className?.includes('list')
                                        ? 'line-clamp-1'
                                        : 'line-clamp-2 min-h-[2.5rem]'
                                )}
                            >
                                {category.description}
                            </p>
                        )}

                        {/* Stats */}
                        <div className='flex items-center gap-4 pt-3 border-t border-gray-200 dark:border-[#2D2D2D]'>
                            <div className='flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400'>
                                <Layers className='w-4 h-4' />
                                <span>{category.coursesCount} khóa học</span>
                            </div>

                            {hasChildren && (
                                <div className='flex -space-x-1'>
                                    {children.slice(0, 3).map((child) => (
                                        <div
                                            key={child.id}
                                            className='w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 flex items-center justify-center text-white text-xs border-2 border-white dark:border-[#1A1A1A]'
                                            title={child.name}
                                        >
                                            {child.name.charAt(0)}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>
        </Wrapper>
    )
}
