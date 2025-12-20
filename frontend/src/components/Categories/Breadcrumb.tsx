import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '../ui/utils'

export interface BreadcrumbItem {
    label: string
    href?: string
    onClick?: () => void
}

interface BreadcrumbProps {
    items: BreadcrumbItem[]
    className?: string
    showHome?: boolean
}

export function Breadcrumb({
    items,
    className = '',
    showHome = true,
}: BreadcrumbProps) {
    return (
        <nav
            className={cn(
                'flex flex-wrap items-center gap-2 text-sm',
                className
            )}
            aria-label='Breadcrumb'
        >
            {showHome && (
                <>
                    <Link
                        to='/'
                        className='flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-foreground transition-colors'
                    >
                        <Home className='h-4 w-4' />
                        <span>Trang chủ</span>
                    </Link>
                    <ChevronRight className='h-4 w-4 text-muted-foreground' />
                </>
            )}

            {items.map((item, index) => {
                const isLast = index === items.length - 1
                const content = item.onClick ? (
                    <button
                        type='button'
                        onClick={item.onClick}
                        className={cn(
                            'transition-colors',
                            isLast
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {item.label}
                    </button>
                ) : item.href ? (
                    <Link
                        to={item.href}
                        className={cn(
                            'transition-colors',
                            isLast
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground hover:text-foreground'
                        )}
                    >
                        {item.label}
                    </Link>
                ) : (
                    <span
                        className={cn(
                            isLast
                                ? 'text-foreground font-medium'
                                : 'text-muted-foreground'
                        )}
                    >
                        {item.label}
                    </span>
                )

                return (
                    <div
                        key={`${item.label}-${index}`}
                        className='flex items-center gap-2'
                    >
                        {index > 0 && (
                            <ChevronRight className='h-4 w-4 text-muted-foreground' />
                        )}
                        {content}
                    </div>
                )
            })}
        </nav>
    )
}
